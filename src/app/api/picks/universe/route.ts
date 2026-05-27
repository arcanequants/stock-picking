import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/supabase";
import { stocks } from "@/data/stocks";

export const dynamic = "force-dynamic";

/**
 * GET /api/picks/universe — every ticker Vectorial has ever picked.
 *
 * Powers the "Posiciones anteriores" picker on iOS. Unlike `/api/picks`,
 * this is NOT filtered by `access_started_at` — a user who joined last
 * week may still have owned a stock Vectorial picked two years ago.
 *
 * Returns a flat, deduped, sorted list. The /api/prior-holdings POST
 * endpoint is the authoritative validator (isVectorialTicker), so this
 * is purely a convenience for the client picker.
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const tickers = stocks
    .map((s) => ({
      ticker: s.ticker,
      name: s.name,
      sector: s.sector ?? null,
      region: s.region ?? null,
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  return NextResponse.json({ tickers });
}
