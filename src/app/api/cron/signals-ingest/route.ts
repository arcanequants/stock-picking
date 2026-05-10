import { NextResponse } from "next/server";
import {
  ingestEiaWeeklyPetroleum,
  ingestCrackSpread321,
  ingestLngArbitrage,
} from "@/lib/signals/sources/eia";
import { ingestHormuzTransit } from "@/lib/signals/sources/aisstream";
import {
  ingestTropomiNo2,
  ingestIowaCornYield,
} from "@/lib/signals/sources/sentinel-hub";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ingestors = [
    ingestEiaWeeklyPetroleum,
    ingestCrackSpread321,
    ingestLngArbitrage,
    ingestHormuzTransit,
    ingestTropomiNo2,
    ingestIowaCornYield,
  ];

  const results = await Promise.all(ingestors.map((fn) => fn()));

  const summary = {
    ok: results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    missing_keys: results.filter((r) => r.status === "missing_keys").length,
    error: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}
