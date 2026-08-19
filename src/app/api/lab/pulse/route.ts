import { NextResponse } from "next/server";
import { getLabData } from "@/lib/lab-data";

/**
 * Public aggregate powering the Quant Lab homepage (metrics, tape, charts).
 * The homepage consumes getLabData() directly server-side; this endpoint
 * exists for client refreshes and future consumers (apps, widgets).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const data = await getLabData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
