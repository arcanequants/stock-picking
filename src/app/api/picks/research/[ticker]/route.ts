import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import {
  buildWhatsImportant,
  compactOneLiner,
  compactShort,
} from "@/lib/mom-shorts";
import momOverrides from "@/data/mom-overrides.json";
import { localized } from "@/data/stock-translations";
import { parseLocale } from "@/lib/locale";

interface MomOverride {
  one_liner: string;
  why_short: string;
  risk_short: string;
}
const OVERRIDES = momOverrides as Record<string, MomOverride>;

export const dynamic = "force-dynamic";

/**
 * GET /api/picks/research/:ticker — full research for a given ticker.
 * Accepts web session cookie and `Authorization: Bearer <jwt>` (iOS).
 *
 * Locale: reads Accept-Language header (en/pt/es). Defaults to es.
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

  const locale = parseLocale(request.headers.get("Accept-Language"));

  // Mom-readable short fields. Prefer the hand-curated LLM override
  // (plain Spanish, no jargon) and fall back to the compactor when no
  // override exists yet. Both paths go through localized() for en/pt.
  const override = OVERRIDES[stock.ticker];
  const one_liner_es = override?.one_liner ?? compactOneLiner(stock.summary_short);
  const why_short_es = override?.why_short ?? compactShort(stock.summary_why);
  const risk_short_es = override?.risk_short ?? compactShort(stock.summary_risk);

  const base = {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    industry: stock.industry,
    country: stock.country,
    region: stock.region,
    currency: stock.currency,
    summary_short: localized(ticker, "summary_short", locale, stock.summary_short),
    one_liner: localized(ticker, "one_liner", locale, one_liner_es),
    pick_number: tx ? transactions.indexOf(tx) + 1 : null,
    pick_date: tx?.date ?? null,
    is_subscribed: isSubscribed,
    locale,
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
    summary_what: localized(ticker, "summary_what", locale, stock.summary_what),
    summary_why: localized(ticker, "summary_why", locale, stock.summary_why),
    summary_risk: localized(ticker, "summary_risk", locale, stock.summary_risk),
    why_short: localized(ticker, "why_short", locale, why_short_es),
    risk_short: localized(ticker, "risk_short", locale, risk_short_es),
    whats_important: buildWhatsImportant({
      dividend_yield: stock.dividend_yield,
      price: stock.price,
      analyst_consensus: stock.analyst_consensus,
      market_cap_b: stock.market_cap_b,
    }),
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
