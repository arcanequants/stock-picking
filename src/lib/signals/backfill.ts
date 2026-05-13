/**
 * One-shot historical backfill for the 3 EIA-backed Phase 1 signals.
 *
 * Re-uses the same EIA series the live ingestors use, but writes every point
 * (not just the latest) plus a rolling baseline computed point-in-time for
 * each row — so the chart and the IC computation see exactly what a real-time
 * subscriber would have seen on that day.
 */

import { getSupabaseAdmin } from "@/lib/supabase";

const EIA_BASE = "https://api.eia.gov/v2";

type EiaPoint = { period: string; value: number };

async function fetchEiaSeries(
  path: string,
  params: Record<string, string>,
  apiKey: string
): Promise<EiaPoint[]> {
  const url = new URL(`${EIA_BASE}/${path}/data/`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`EIA ${path} ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    response?: { data?: Array<{ period: string; value: string | number }> };
  };
  return (json.response?.data ?? [])
    .map((r) => ({
      period: r.period,
      value: typeof r.value === "string" ? parseFloat(r.value) : Number(r.value),
    }))
    .filter((r) => Number.isFinite(r.value))
    .sort((a, b) => (a.period < b.period ? -1 : 1));
}

type Row = {
  signal_id: string;
  observed_at: string;
  value: number;
  baseline_value: number | null;
  metadata: Record<string, unknown>;
};

async function bulkUpsert(rows: Row[]): Promise<number> {
  if (rows.length === 0) return 0;
  const sb = getSupabaseAdmin();
  // Supabase rejects gigantic payloads; chunk into 500-row batches.
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await sb
      .from("signal_observations")
      .upsert(slice, { onConflict: "signal_id,observed_at" });
    if (error) throw new Error(error.message);
    inserted += slice.length;
  }
  return inserted;
}

// ─── EIA Weekly Petroleum (PET.WCESTUS1.W) ─────────────────────
export async function backfillEiaWeeklyPetroleum(apiKey: string): Promise<number> {
  const points = await fetchEiaSeries(
    "petroleum/stoc/wstk",
    {
      frequency: "weekly",
      "data[0]": "value",
      "facets[series][]": "WCESTUS1",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      offset: "0",
      length: "5000",
    },
    apiKey
  );
  if (points.length === 0) return 0;
  // Build 5-year same-week baseline per row.
  const rows: Row[] = points.map((p, i) => {
    const baselineSamples: number[] = [];
    for (let yr = 1; yr <= 5; yr++) {
      const idx = i - 52 * yr;
      if (idx >= 0) baselineSamples.push(points[idx].value);
    }
    const baseline =
      baselineSamples.length > 0
        ? baselineSamples.reduce((a, b) => a + b, 0) / baselineSamples.length
        : null;
    return {
      signal_id: "eia-weekly-petroleum",
      observed_at: new Date(p.period + "T16:30:00Z").toISOString(),
      value: p.value / 1000, // kbbl → Mbbl
      baseline_value: baseline !== null ? baseline / 1000 : null,
      metadata: {
        series: "PET.WCESTUS1.W",
        period_raw: p.period,
        baseline_window_years: baselineSamples.length,
        backfilled: true,
      },
    };
  });
  return bulkUpsert(rows);
}

// ─── Crack spread 3-2-1 (per-barrel margin) ─────────────────────
export async function backfillCrackSpread321(apiKey: string): Promise<number> {
  const [wti, gasoline, ulsd] = await Promise.all([
    fetchEiaSeries(
      "petroleum/pri/spt",
      {
        frequency: "daily",
        "data[0]": "value",
        "facets[series][]": "RWTC",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        offset: "0",
        length: "1000",
      },
      apiKey
    ),
    fetchEiaSeries(
      "petroleum/pri/spt",
      {
        frequency: "daily",
        "data[0]": "value",
        "facets[series][]": "EER_EPMRU_PF4_Y35NY_DPG",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        offset: "0",
        length: "1000",
      },
      apiKey
    ),
    fetchEiaSeries(
      "petroleum/pri/spt",
      {
        frequency: "daily",
        "data[0]": "value",
        "facets[series][]": "EER_EPD2DXL0_PF4_Y35NY_DPG",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        offset: "0",
        length: "1000",
      },
      apiKey
    ),
  ]);

  const map = new Map<
    string,
    { wti?: number; gasoline?: number; ulsd?: number }
  >();
  for (const p of wti) {
    map.set(p.period, { ...(map.get(p.period) ?? {}), wti: p.value });
  }
  for (const p of gasoline) {
    map.set(p.period, { ...(map.get(p.period) ?? {}), gasoline: p.value });
  }
  for (const p of ulsd) {
    map.set(p.period, { ...(map.get(p.period) ?? {}), ulsd: p.value });
  }
  const cracks = [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .filter(
      ([, v]) => v.wti != null && v.gasoline != null && v.ulsd != null
    )
    .map(([period, v]) => ({
      period,
      spread: (2 * v.gasoline! * 42 + v.ulsd! * 42 - 3 * v.wti!) / 3,
    }));

  const rows: Row[] = cracks.map((p, i) => {
    const window = cracks.slice(Math.max(0, i - 90), i);
    const baseline =
      window.length > 0
        ? window.reduce((a, b) => a + b.spread, 0) / window.length
        : null;
    return {
      signal_id: "crack-spread-321",
      observed_at: new Date(p.period + "T20:30:00Z").toISOString(),
      value: p.spread,
      baseline_value: baseline,
      metadata: {
        formula: "(2·Gasoline·42 + 1·HO·42 − 3·WTI) / 3 [USD/bbl]",
        period_raw: p.period,
        baseline_window_days: window.length,
        backfilled: true,
      },
    };
  });
  return bulkUpsert(rows);
}

// ─── LNG arbitrage — Henry Hub leg ─────────────────────
export async function backfillLngArbitrage(apiKey: string): Promise<number> {
  const hh = await fetchEiaSeries(
    "natural-gas/pri/fut",
    {
      frequency: "daily",
      "data[0]": "value",
      "facets[series][]": "RNGWHHD",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      offset: "0",
      length: "1000",
    },
    apiKey
  );
  const rows: Row[] = hh.map((p, i) => {
    const window = hh.slice(Math.max(0, i - 90), i);
    const baseline =
      window.length > 0
        ? window.reduce((a, b) => a + b.value, 0) / window.length
        : null;
    return {
      signal_id: "lng-arbitrage",
      observed_at: new Date(p.period + "T20:30:00Z").toISOString(),
      value: p.value,
      baseline_value: baseline,
      metadata: {
        legs_present: ["HH"],
        legs_pending: ["TTF", "JKM"],
        period_raw: p.period,
        baseline_window_days: window.length,
        backfilled: true,
      },
    };
  });
  return bulkUpsert(rows);
}
