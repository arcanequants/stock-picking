import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";

export const dynamic = "force-dynamic";

/**
 * GET /api/picks/research/:ticker — full research for a given ticker.
 * Accepts web session cookie and `Authorization: Bearer <jwt>` (iOS).
 *
 * Gating:
 *   - Subscribed users: summary_short + summary_what + summary_why +
 *     summary_risk + fundamentals + wa_message.
 *   - Unsubscribed: summary_short only (teaser), rest gated.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await context.params;
  const ticker = rawTicker.toUpperCase();

  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: subscriber } = await getSupabaseAdmin()
    .from("subscribers")
    .select("subscription_status")
    .eq("email", authed.email)
    .single();

  const status = subscriber?.subscription_status;
  const isSubscribed = status === "active" || status === "trialing";

  const stock = stocks.find((s) => s.ticker === ticker);
  if (!stock) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Find the matching transaction (most recent for this ticker) to get the pick metadata.
  const tx = [...transactions]
    .reverse()
    .find((t) => t.ticker === ticker);

  const base = {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    industry: stock.industry,
    country: stock.country,
    region: stock.region,
    currency: stock.currency,
    summary_short: stock.summary_short,
    pick_number: tx ? transactions.indexOf(tx) + 1 : null,
    pick_date: tx?.date ?? null,
    is_subscribed: isSubscribed,
  };

  if (!isSubscribed) {
    return NextResponse.json({
      ...base,
      locked: true,
    });
  }

  return NextResponse.json({
    ...base,
    locked: false,
    summary_what: stock.summary_what,
    summary_why: stock.summary_why,
    summary_risk: stock.summary_risk,
    pe_ratio: stock.pe_ratio,
    pe_forward: stock.pe_forward,
    dividend_yield: stock.dividend_yield,
    market_cap_b: stock.market_cap_b,
    analyst_consensus: stock.analyst_consensus,
    analyst_target: stock.analyst_target,
    analyst_upside: stock.analyst_upside,
    wa_message: tx?.wa_message ?? null,
  });
}
