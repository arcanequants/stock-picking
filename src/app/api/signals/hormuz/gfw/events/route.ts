import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Reads from hormuz_events — populated nightly by /api/cron/hormuz-
// events-sync. The previous implementation walked GFW pagination on
// each request, which timed out (~35s per page, 4 datasets × N pages).
//
// This route returns the cached slice in milliseconds. Staleness is
// bounded by the cron cadence (nightly 04:00 UTC) plus GFW's own T-96h
// data lag for AIS events.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HORMUZ_BBOX = { lonMin: 54, lonMax: 59, latMin: 24, latMax: 28.5 } as const;

const ALLOWED_TYPES = ["gaps", "encounters", "port-visits", "loitering"] as const;
type EventType = (typeof ALLOWED_TYPES)[number];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const typeKey = (url.searchParams.get("type") || "gaps").toLowerCase();
  if (!ALLOWED_TYPES.includes(typeKey as EventType)) {
    return NextResponse.json(
      { error: "unknown type", allowed: ALLOWED_TYPES },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const startMs = Date.now() - 30 * 86_400_000;
  const startIso = new Date(startMs).toISOString();

  const { data, error } = await supabase
    .from("hormuz_events")
    .select(
      "id, type, start_ts, end_ts, lat, lon, vessel_name, vessel_flag, vessel_type, counterparty_name, counterparty_flag, port_name, port_flag"
    )
    .eq("type", typeKey)
    .gte("start_ts", startIso)
    .order("start_ts", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json(
      { error: "db error", detail: error.message },
      { status: 500 }
    );
  }

  const { data: freshness } = await supabase
    .from("hormuz_events")
    .select("ingested_at")
    .eq("type", typeKey)
    .order("ingested_at", { ascending: false })
    .limit(1);

  const compact = (data ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    start: e.start_ts,
    end: e.end_ts,
    position: { lat: e.lat, lon: e.lon },
    vessel: e.vessel_name || e.vessel_flag
      ? { name: e.vessel_name, flag: e.vessel_flag, type: e.vessel_type }
      : null,
    counterparty: e.counterparty_name
      ? { name: e.counterparty_name, flag: e.counterparty_flag }
      : null,
    port: e.port_name
      ? { name: e.port_name, flag: e.port_flag }
      : null,
  }));

  return NextResponse.json(
    {
      type: typeKey,
      window: { start: startIso, end: new Date().toISOString() },
      bbox: HORMUZ_BBOX,
      total_hormuz: compact.length,
      last_ingested_at: freshness?.[0]?.ingested_at ?? null,
      events: compact,
      attribution: "Global Fishing Watch (CC BY-SA 4.0, non-commercial research)",
      fetched_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
      },
    }
  );
}
