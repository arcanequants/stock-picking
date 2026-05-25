import { NextResponse } from "next/server";

// GFW Events API proxy with Hormuz bbox filter.
//
// Two non-obvious things about the GFW Events endpoint:
//
// 1. `start-date` / `end-date` only filter when combined with `sort=-start`
//    AND `offset=0` — quirk of the endpoint, undocumented. We pass all three.
// 2. `region` / bbox filtering is gated behind commercial permissions on the
//    free tier (403 "Not authorized by permissions"). Workaround: pull the
//    global newest-first feed and filter to Hormuz bbox in JS.
//
// Volume per dataset for a 30-day window (measured 2026-05): gaps ≈ 19k,
// encounters ≈ 43k, loitering ≈ 650k, port-visits ≈ 1.9M. We support all four
// for completeness but only gaps + encounters page through cleanly under the
// 60s edge budget; the high-volume types return whatever fits in maxPages.
//
// Per the GFW data lag (T-96h for AIS events), we anchor the window to T-4d
// so the freshest page is populated rather than half-empty.
//
// Cached 6h at the edge; underlying datasets refresh once per day.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// First request walks GFW pages; encounters (~40k/30d) measured at ~55s.
// Subsequent requests hit the 6h CDN cache and return instantly.
export const maxDuration = 90;

const GFW_BASE = "https://gateway.api.globalfishingwatch.org/v3";

// Hormuz bbox — lon [54, 59], lat [24, 28.5]. Wider than the strait narrows
// so Bandar Abbas (27.196N) and Fujairah (25.119N) port-visits are captured.
const HORMUZ_BBOX = { lonMin: 54, lonMax: 59, latMin: 24, latMax: 28.5 } as const;

const TYPES: Record<string, { dataset: string; lookbackDays: number }> = {
  gaps: { dataset: "public-global-gaps-events:latest", lookbackDays: 30 },
  encounters: { dataset: "public-global-encounters-events:latest", lookbackDays: 30 },
  "port-visits": {
    dataset: "public-global-port-visits-events:latest",
    lookbackDays: 30,
  },
  loitering: { dataset: "public-global-loitering-events:latest", lookbackDays: 30 },
};

type GfwEvent = {
  id: string;
  start: string;
  end: string;
  type: string;
  position?: { lat: number; lon: number };
  vessel?: {
    id?: string;
    name?: string;
    flag?: string;
    type?: string;
    ssvid?: string;
  };
  encounter?: { vessel?: { name?: string; flag?: string; type?: string } };
  port_visit?: {
    startAnchorage?: {
      name?: string;
      flag?: string;
      lat?: number;
      lon?: number;
    };
  };
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

export async function GET(req: Request) {
  const token = process.env.GFW_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "GFW_API_TOKEN missing" }, { status: 503 });
  }

  const url = new URL(req.url);
  const typeKey = (url.searchParams.get("type") || "gaps").toLowerCase();
  const cfg = TYPES[typeKey];
  if (!cfg) {
    return NextResponse.json(
      { error: "unknown type", allowed: Object.keys(TYPES) },
      { status: 400 }
    );
  }

  // GFW data lags 96h. Anchor end to T-4d so the freshest page is populated.
  const endMs = Date.now() - 4 * 86_400_000;
  const startMs = endMs - cfg.lookbackDays * 86_400_000;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const pageSize = 1000;
  // 60 pages × 1000 = 60k events scanned. Comfortably covers gaps (19k/30d)
  // and encounters (43k/30d). High-volume types (loitering, port-visits) get
  // partial coverage — flagged in `stop_reason` so the UI can label it.
  const maxPages = 60;
  let offset = 0;
  let totalGlobal = 0;
  let scanned = 0;
  let oldestSeen: string | null = null;
  const filtered: GfwEvent[] = [];

  let stopReason = "exhausted";

  for (let page = 0; page < maxPages; page++) {
    const upstream = new URL(`${GFW_BASE}/events`);
    upstream.searchParams.set("datasets[0]", cfg.dataset);
    upstream.searchParams.set("sort", "-start");
    upstream.searchParams.set("start-date", iso(startMs));
    upstream.searchParams.set("end-date", iso(endMs));
    upstream.searchParams.set("limit", String(pageSize));
    upstream.searchParams.set("offset", String(offset));

    const res = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream failed", status: res.status, page },
        { status: 502 }
      );
    }

    const json = (await res.json()) as GfwPage;
    totalGlobal = json.total ?? totalGlobal;
    scanned += json.entries?.length ?? 0;

    let crossedWindow = false;
    for (const e of json.entries ?? []) {
      const eventMs = Date.parse(e.start);
      if (Number.isFinite(eventMs)) {
        oldestSeen = e.start;
        if (eventMs < startMs) {
          crossedWindow = true;
          break;
        }
        if (eventMs > endMs) continue;
      }
      const pos = e.position;
      if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lon)) continue;
      if (!inHormuz(pos.lat, pos.lon)) continue;
      filtered.push(e);
    }

    if (crossedWindow) {
      stopReason = "window-crossed";
      break;
    }
    if (json.nextOffset === null || json.nextOffset === undefined) {
      stopReason = "no-next-offset";
      break;
    }
    if ((json.entries?.length ?? 0) < pageSize) {
      stopReason = "short-page";
      break;
    }
    offset = json.nextOffset;
  }

  const compact = filtered.map((e) => ({
    id: e.id,
    type: e.type,
    start: e.start,
    end: e.end,
    position: e.position,
    vessel: e.vessel
      ? {
          name: e.vessel.name ?? null,
          flag: e.vessel.flag ?? null,
          type: e.vessel.type ?? null,
        }
      : null,
    counterparty: e.encounter?.vessel
      ? {
          name: e.encounter.vessel.name ?? null,
          flag: e.encounter.vessel.flag ?? null,
        }
      : null,
    port:
      e.port_visit?.startAnchorage?.name && e.port_visit.startAnchorage.flag
        ? {
            name: e.port_visit.startAnchorage.name,
            flag: e.port_visit.startAnchorage.flag,
          }
        : null,
  }));

  return NextResponse.json(
    {
      type: typeKey,
      dataset: cfg.dataset,
      window: { start: iso(startMs), end: iso(endMs) },
      bbox: HORMUZ_BBOX,
      total_global: totalGlobal,
      total_hormuz: compact.length,
      scanned,
      oldest_seen: oldestSeen,
      stop_reason: stopReason,
      events: compact,
      attribution: "Global Fishing Watch (CC BY-SA 4.0, non-commercial research)",
      fetched_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    }
  );
}
