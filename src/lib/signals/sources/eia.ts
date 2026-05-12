import { upsertObservation, missingKeys, type IngestResult } from "../ingest";

const EIA_BASE = "https://api.eia.gov/v2";

type EiaSeriesPoint = { period: string; value: number };

async function fetchEiaSeries(
  path: string,
  params: Record<string, string>,
  apiKey: string
): Promise<EiaSeriesPoint[]> {
  const url = new URL(`${EIA_BASE}/${path}/data/`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`EIA ${path} ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    response?: { data?: Array<{ period: string; value: string | number }> };
  };
  const rows = json.response?.data ?? [];
  return rows
    .map((r) => ({
      period: r.period,
      value: typeof r.value === "string" ? parseFloat(r.value) : Number(r.value),
    }))
    .filter((r) => Number.isFinite(r.value))
    .sort((a, b) => (a.period < b.period ? -1 : 1));
}

// ─────────────────────────────────────────────────────────
// EIA Weekly Petroleum: US commercial crude oil stocks (excluding SPR).
// Series: PET.WCESTUS1.W (thousand barrels)
// Baseline: trailing 5-year same-week mean.
// ─────────────────────────────────────────────────────────
export async function ingestEiaWeeklyPetroleum(): Promise<IngestResult> {
  const signal_id = "eia-weekly-petroleum";
  const key = process.env.EIA_API_KEY;
  const miss = missingKeys(signal_id, [{ name: "EIA_API_KEY", value: key }]);
  if (miss) return miss;

  try {
    const points = await fetchEiaSeries(
      "petroleum/stoc/wstk",
      {
        frequency: "weekly",
        "data[0]": "value",
        "facets[series][]": "WCESTUS1",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        offset: "0",
        length: "300",
      },
      key!
    );
    if (points.length === 0) {
      return { signal_id, status: "error", error: "EIA returned no points" };
    }
    const latest = points[points.length - 1];

    // 5-year same-week baseline. EIA periods are weekly, ~52 per year.
    const sameWeekIdx = points.length - 1;
    const baselineWindow: number[] = [];
    for (let yr = 1; yr <= 5; yr++) {
      const idx = sameWeekIdx - 52 * yr;
      if (idx >= 0) baselineWindow.push(points[idx].value);
    }
    const baseline =
      baselineWindow.length > 0
        ? baselineWindow.reduce((a, b) => a + b, 0) / baselineWindow.length
        : null;

    return upsertObservation({
      signal_id,
      observed_at: new Date(latest.period + "T16:30:00Z").toISOString(),
      value: latest.value / 1000, // kbbl → Mbbl for display
      baseline_value: baseline !== null ? baseline / 1000 : null,
      metadata: {
        series: "PET.WCESTUS1.W",
        period_raw: latest.period,
        baseline_window_years: baselineWindow.length,
      },
    });
  } catch (err) {
    return {
      signal_id,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────────────────
// Crack spread 3-2-1 = 3·WTI − (2·Gasoline + 1·HO), USD/bbl.
// EIA spot price series (NY Harbor for the product legs):
//  - WTI Cushing: RWTC ($/bbl)
//  - Conventional Gasoline NY Harbor: EER_EPMRU_PF4_Y35NY_DPG ($/gal) → ×42 for $/bbl
//    (RBOB spot was discontinued in EIA v2; Conv NY is the standard EIA replacement.)
//  - ULSD NY Harbor: EER_EPD2DXL0_PF4_Y35NY_DPG ($/gal) → ×42 for $/bbl
// Baseline: trailing 90-day mean.
// ─────────────────────────────────────────────────────────
export async function ingestCrackSpread321(): Promise<IngestResult> {
  const signal_id = "crack-spread-321";
  const key = process.env.EIA_API_KEY;
  const miss = missingKeys(signal_id, [{ name: "EIA_API_KEY", value: key }]);
  if (miss) return miss;

  try {
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
          length: "120",
        },
        key!
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
          length: "120",
        },
        key!
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
          length: "120",
        },
        key!
      ),
    ]);

    if (wti.length === 0 || gasoline.length === 0 || ulsd.length === 0) {
      return { signal_id, status: "error", error: "Missing series data" };
    }

    // Build a map per-period to align dates (EIA daily series have small gaps).
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

    const cracks: { period: string; spread: number }[] = [];
    for (const [period, v] of [...map.entries()].sort(([a], [b]) =>
      a < b ? -1 : 1
    )) {
      if (v.wti != null && v.gasoline != null && v.ulsd != null) {
        const spread = 3 * v.wti - (2 * v.gasoline * 42 + v.ulsd * 42);
        cracks.push({ period, spread });
      }
    }
    if (cracks.length === 0) {
      return { signal_id, status: "error", error: "No aligned crack-spread points" };
    }
    const latest = cracks[cracks.length - 1];
    const window = cracks.slice(-90);
    const baseline =
      window.reduce((a, b) => a + b.spread, 0) / window.length;

    return upsertObservation({
      signal_id,
      observed_at: new Date(latest.period + "T20:30:00Z").toISOString(),
      value: latest.spread,
      baseline_value: baseline,
      metadata: {
        formula: "3·WTI − (2·Gasoline + 1·HO) × 42",
        gasoline_series: "EER_EPMRU_PF4_Y35NY_DPG (Conv NY Harbor — RBOB spot discontinued in EIA v2)",
        baseline_window_days: window.length,
        period_raw: latest.period,
      },
    });
  } catch (err) {
    return {
      signal_id,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────────────────
// LNG arbitrage HH/TTF/JKM
// Phase 1: Henry Hub from EIA fully wired; TTF + JKM require ICE/CME paid feeds
// or scraping public settlements. We leave value=HH for now and surface the
// missing legs in metadata so the UI can show "Partial — TTF/JKM pending".
// When Alberto provisions ICE/CME or we add a free TTF/JKM proxy, this signal
// upgrades to the full spread without changing the Casual copy.
// ─────────────────────────────────────────────────────────
export async function ingestLngArbitrage(): Promise<IngestResult> {
  const signal_id = "lng-arbitrage";
  const key = process.env.EIA_API_KEY;
  const miss = missingKeys(signal_id, [{ name: "EIA_API_KEY", value: key }]);
  if (miss) return miss;

  try {
    const hh = await fetchEiaSeries(
      "natural-gas/pri/fut",
      {
        frequency: "daily",
        "data[0]": "value",
        "facets[series][]": "RNGWHHD",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        offset: "0",
        length: "120",
      },
      key!
    );
    if (hh.length === 0) {
      return { signal_id, status: "error", error: "EIA HH series empty" };
    }
    const latest = hh[hh.length - 1];
    const window = hh.slice(-90);
    const baseline = window.reduce((a, b) => a + b.value, 0) / window.length;

    return upsertObservation({
      signal_id,
      observed_at: new Date(latest.period + "T20:30:00Z").toISOString(),
      value: latest.value, // USD/mmBtu
      baseline_value: baseline,
      metadata: {
        legs_present: ["HH"],
        legs_pending: ["TTF", "JKM"],
        note: "Phase 1: Henry Hub only. TTF + JKM legs pending ICE/CME provisioning.",
        period_raw: latest.period,
      },
    });
  } catch (err) {
    return {
      signal_id,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
