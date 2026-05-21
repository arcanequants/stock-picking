import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/dividends — per-user dividend ledger.
 *
 * Returns:
 *   - ytd_total: USD cobrado este año
 *   - all_time_total: USD cobrado en total
 *   - count: número de pagos all-time
 *   - companies: número de empresas únicas que han pagado
 *   - by_ticker: {ticker: total} map for fast Pick Detail lookup
 *   - events: cronological list of every payment (newest first)
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("user_dividend_events")
    .select(
      "id, ticker, pick_number, ex_date, pay_date, amount_per_share, shares_held, total_amount, created_at",
    )
    .eq("email", authed.email)
    .order("ex_date", { ascending: false });

  if (error) {
    console.error("[/api/portfolio/dividends] fetch failed:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const events = data ?? [];
  const yearStart = `${new Date().getUTCFullYear()}-01-01`;
  let ytd = 0;
  let allTime = 0;
  const byTicker: Record<string, number> = {};
  const tickers = new Set<string>();

  for (const e of events) {
    const total = Number(e.total_amount);
    allTime += total;
    if (e.ex_date >= yearStart) ytd += total;
    byTicker[e.ticker] = (byTicker[e.ticker] ?? 0) + total;
    tickers.add(e.ticker);
  }

  return NextResponse.json({
    ytd_total: Number(ytd.toFixed(2)),
    all_time_total: Number(allTime.toFixed(2)),
    count: events.length,
    companies: tickers.size,
    by_ticker: Object.fromEntries(
      Object.entries(byTicker).map(([t, v]) => [t, Number(v.toFixed(2))]),
    ),
    events: events.map((e) => ({
      id: e.id,
      ticker: e.ticker,
      pick_number: e.pick_number,
      ex_date: e.ex_date,
      pay_date: e.pay_date,
      amount_per_share: Number(e.amount_per_share),
      shares_held: Number(e.shares_held),
      total_amount: Number(e.total_amount),
    })),
  });
}
