import { NextResponse } from "next/server";

// GFW 4Wings MVT tile proxy. PNG path was abandoned because GFW requires a
// base64-encoded JSON style config — too brittle for a thin proxy. MVT keeps
// the rendering decisions in MapLibre where we control the palette and can
// match it to the rest of the chokepoint console (cyan AIS, magenta SAR).
//
// The MVT layer is always called `main`. Each feature is a cell with `cell`,
// `id`, and one numeric property per day in the window (key = days-since-epoch,
// value = vessel presence count). The component renders cells uniformly —
// density of cells is the heat signal, individual cell counts aren't surfaced.
//
// Datasets (whitelist — never forward arbitrary ids):
//   ais   → public-global-presence:latest      (all AIS broadcasters, T-96h)
//   sar   → public-global-sar-presence:latest  (Sentinel-1 detections, T-5d)
//   iran  → public-global-presence:latest with flag in ('IRN')

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GFW_BASE = "https://gateway.api.globalfishingwatch.org/v3";

type Variant = {
  dataset: string;
  lagDays: number;
  filter?: string;
};

const VARIANTS: Record<string, Variant> = {
  ais: { dataset: "public-global-presence:latest", lagDays: 4 },
  sar: { dataset: "public-global-sar-presence:latest", lagDays: 5 },
  iran: {
    dataset: "public-global-presence:latest",
    lagDays: 4,
    filter: "flag in ('IRN')",
  },
};

function dateRange(lagDays: number): string {
  const end = new Date(Date.now() - lagDays * 86_400_000);
  const start = new Date(end.getTime() - 30 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return `${iso(start)},${iso(end)}`;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const token = process.env.GFW_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "GFW_API_TOKEN missing" }, { status: 503 });
  }

  const { z, x, y } = await ctx.params;
  const zNum = Number(z);
  const xNum = Number(x);
  const yNum = Number(y);
  if (!Number.isInteger(zNum) || !Number.isInteger(xNum) || !Number.isInteger(yNum)) {
    return NextResponse.json({ error: "invalid tile coords" }, { status: 400 });
  }
  if (zNum < 0 || zNum > 12) {
    return NextResponse.json({ error: "zoom out of range" }, { status: 400 });
  }

  const url = new URL(req.url);
  const variantKey = (url.searchParams.get("v") || "ais").toLowerCase();
  const variant = VARIANTS[variantKey];
  if (!variant) {
    return NextResponse.json({ error: "unknown variant" }, { status: 400 });
  }

  const upstream = new URL(`${GFW_BASE}/4wings/tile/heatmap/${zNum}/${xNum}/${yNum}`);
  upstream.searchParams.set("datasets[0]", variant.dataset);
  upstream.searchParams.set("date-range", dateRange(variant.lagDays));
  upstream.searchParams.set("format", "MVT");
  upstream.searchParams.set("interval", "DAY");
  if (variant.filter) upstream.searchParams.set("filters[0]", variant.filter);

  const res = await fetch(upstream.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "upstream failed", status: res.status },
      { status: res.status === 401 ? 502 : res.status }
    );
  }

  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.mapbox-vector-tile",
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
