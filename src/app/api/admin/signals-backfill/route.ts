import { NextResponse } from "next/server";
import {
  backfillEiaWeeklyPetroleum,
  backfillCrackSpread321,
  backfillLngArbitrage,
} from "@/lib/signals/backfill";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * One-shot historical backfill for the 3 EIA-backed signals.
 * Gated by CRON_SECRET (same as the live cron). Run manually with:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://vectorialdata.com/api/admin/signals-backfill
 *
 * Idempotent — re-runs upsert on (signal_id, observed_at) so it's safe to
 * call again if a single signal fails.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.EIA_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "EIA_API_KEY not set" },
      { status: 500 }
    );
  }

  const results: Record<string, number | string> = {};
  for (const [name, fn] of [
    ["eia-weekly-petroleum", () => backfillEiaWeeklyPetroleum(key)],
    ["crack-spread-321", () => backfillCrackSpread321(key)],
    ["lng-arbitrage", () => backfillLngArbitrage(key)],
  ] as const) {
    try {
      results[name] = await fn();
    } catch (err) {
      results[name] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  return NextResponse.json({ ok: true, inserted: results });
}
