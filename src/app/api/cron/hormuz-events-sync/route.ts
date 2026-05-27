import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Nightly walk of GFW Events API for the 4 datasets, filtered to the
// Hormuz bbox, upserted into hormuz_events. The /api/signals/hormuz/gfw/
// events route reads from the table — pagination cost (~35s/page) does
// not belong on the read path.
//
// Page budget per type is bounded so all 4 datasets fit in one 300s
// function. Walking newest-first means each nightly run catches the
// freshest events first; over multiple nights, the 30-day window fills
// in naturally even though no single run scans all 30 days for the high-
// volume types (loitering ~650k/30d, port-visits ~1.9M/30d).
//
// Retention is 60 days; sweep runs at the end of every successful walk.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const GFW_BASE = "https://gateway.api.globalfishingwatch.org/v3";

const HORMUZ_BBOX = { lonMin: 54, lonMax: 59, latMin: 24, latMax: 28.5 } as const;

const TYPES = {
  gaps: { dataset: "public-global-gaps-events:latest", lookbackDays: 30 },
  encounters: { dataset: "public-global-encounters-events:latest", lookbackDays: 30 },
  "port-visits": {
    dataset: "public-global-port-visits-events:latest",
    lookbackDays: 30,
  },
  loitering: { dataset: "public-global-loitering-events:latest", lookbackDays: 30 },
} as const;

type EventType = keyof typeof TYPES;

const PAGE_SIZE = 1000;
// 7 pages × ~35s ≈ 245s; running 4 types in parallel stays under the
// 300s function ceiling. The slowest dataset wall-clocks the run.
const MAX_PAGES = 7;

type GfwEvent = {
  id: string;
  start: string;
  end?: string;
  position?: { lat: number; lon: number };
  vessel?: { name?: string; flag?: string; type?: string };
  encounter?: { vessel?: { name?: string; flag?: string } };
  port_visit?: { startAnchorage?: { name?: string; flag?: string } };
};

type GfwPage = {
  total: number;
  nextOffset: number | null;
  entries: GfwEvent[];
};

function inHormuz(lat: number, lon: number): boolean {
  return (
    lat >= HORMUZ_BBOX.latMin &&
    lat <= HORMUZ_BBOX.latMax &&
    lon >= HORMUZ_BBOX.lonMin &&
    lon <= HORMUZ_BBOX.lonMax
  );
}

type WalkResult = {
  type: EventType;
  total_global: number;
  scanned: number;
  upserted: number;
  pages: number;
  stop_reason: string;
  error?: string;
};

async function walkType(type: EventType, token: string): Promise<WalkResult> {
  const cfg = TYPES[type];
  const endMs = Date.now() - 4 * 86_400_000;
  const startMs = endMs - cfg.lookbackDays * 86_400_000;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const supabase = getSupabaseAdmin();
  let offset = 0;
  let totalGlobal = 0;
  let scanned = 0;
  let upserted = 0;
  let stopReason = "exhausted";

  for (let page = 0; page < MAX_PAGES; page++) {
    const upstream = new URL(`${GFW_BASE}/events`);
    upstream.searchParams.set("datasets[0]", cfg.dataset);
    upstream.searchParams.set("sort", "-start");
    upstream.searchParams.set("start-date", iso(startMs));
    upstream.searchParams.set("end-date", iso(endMs));
    upstream.searchParams.set("limit", String(PAGE_SIZE));
    upstream.searchParams.set("offset", String(offset));

    const res = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        type,
        total_global: totalGlobal,
        scanned,
        upserted,
        pages: page,
        stop_reason: "upstream-failed",
        error: `HTTP ${res.status} on page ${page}`,
      };
    }

    const json = (await res.json()) as GfwPage;
    totalGlobal = json.total ?? totalGlobal;
    const entries = json.entries ?? [];
    scanned += entries.length;

    let crossedWindow = false;
    const rows = [] as Array<Record<string, unknown>>;
    for (const e of entries) {
      const eventMs = Date.parse(e.start);
      if (Number.isFinite(eventMs) && eventMs < startMs) {
        crossedWindow = true;
        break;
      }
      const pos = e.position;
      if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lon)) continue;
      if (!inHormuz(pos.lat, pos.lon)) continue;

      rows.push({
        id: e.id,
        type,
        start_ts: e.start,
        end_ts: e.end ?? null,
        lat: pos.lat,
        lon: pos.lon,
        vessel_name: e.vessel?.name ?? null,
        vessel_flag: e.vessel?.flag ?? null,
        vessel_type: e.vessel?.type ?? null,
        counterparty_name: e.encounter?.vessel?.name ?? null,
        counterparty_flag: e.encounter?.vessel?.flag ?? null,
        port_name: e.port_visit?.startAnchorage?.name ?? null,
        port_flag: e.port_visit?.startAnchorage?.flag ?? null,
        raw: e,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from("hormuz_events")
        .upsert(rows, { onConflict: "id" });
      if (error) {
        return {
          type,
          total_global: totalGlobal,
          scanned,
          upserted,
          pages: page + 1,
          stop_reason: "db-error",
          error: error.message,
        };
      }
      upserted += rows.length;
    }

    if (crossedWindow) {
      stopReason = "window-crossed";
      break;
    }
    if (json.nextOffset === null || json.nextOffset === undefined) {
      stopReason = "no-next-offset";
      break;
    }
    if (entries.length < PAGE_SIZE) {
      stopReason = "short-page";
      break;
    }
    offset = json.nextOffset;

    if (page === MAX_PAGES - 1) {
      stopReason = "max-pages";
    }
  }

  return {
    type,
    total_global: totalGlobal,
    scanned,
    upserted,
    pages: Math.min(MAX_PAGES, scanned > 0 ? Math.ceil(scanned / PAGE_SIZE) : 0),
    stop_reason: stopReason,
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GFW_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "GFW_API_TOKEN missing" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const onlyType = url.searchParams.get("type") as EventType | null;
  const types: EventType[] = onlyType && onlyType in TYPES
    ? [onlyType]
    : (Object.keys(TYPES) as EventType[]);

  const startedAt = Date.now();
  const results = await Promise.all(types.map((t) => walkType(t, token)));
  const elapsedMs = Date.now() - startedAt;

  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const { count: prunedCount, error: pruneError } = await supabase
    .from("hormuz_events")
    .delete({ count: "exact" })
    .lt("ingested_at", cutoff);

  return NextResponse.json({
    elapsed_ms: elapsedMs,
    results,
    pruned: prunedCount ?? 0,
    prune_error: pruneError?.message ?? null,
    bbox: HORMUZ_BBOX,
    completed_at: new Date().toISOString(),
  });
}
