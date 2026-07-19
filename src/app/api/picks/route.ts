import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { getPicksData } from "@/lib/api-data";
import { stocks } from "@/data/stocks";
import momOverrides from "@/data/mom-overrides.json";
import { localized } from "@/data/stock-translations";
import { compactOneLiner } from "@/lib/mom-shorts";
import { parseLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

/**
 * GET /api/picks — chronological list of every pick, newest first.
 * Accepts web session cookie and `Authorization: Bearer <jwt>` (iOS).
 *
 * Gating:
 *   - Subscribed users: all picks
 *   - Unsubscribed:     most recent 3 (teaser)
 *
 * For authed users we also join `user_pick_status` so the client knows
 * which picks the user already marked as bought/skipped — anything not in
 * the table is implicitly pending. We also return the user's
 * `default_investment` so the buy mini-sheet can pre-fill the amount.
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("subscription_status, default_investment, access_started_at")
    .eq("email", authed.email)
    .single();

  const subStatus = subscriber?.subscription_status;
  const isSubscribed = subStatus === "active" || subStatus === "trialing";

  const allPicks = await getPicksData(undefined, isSubscribed ? "pro" : "free");

  // Newcomer principle: the picks feed shows what's happened since the user
  // gained access — not all 70+ retroactive picks, so they don't feel
  // "behind on 70 things". Older picks are still visible in the model
  // portfolio (Portfolio tab) for anyone curious about history.
  const cutoffIso = subscriber?.access_started_at as string | null | undefined;
  const cutoffDate = cutoffIso ? cutoffIso.slice(0, 10) : null;
  const picks = cutoffDate
    ? allPicks.filter((p) => p.date >= cutoffDate)
    : allPicks;

  const { data: statusRows } = await admin
    .from("user_pick_status")
    .select("pick_number, status, buy_price, amount_invested, decided_at")
    .eq("email", authed.email);

  const byPick = new Map<number, {
    status: "bought" | "skipped";
    buy_price: number | null;
    amount_invested: number | null;
    decided_at: string;
  }>();
  for (const r of statusRows ?? []) {
    byPick.set(r.pick_number, {
      status: r.status,
      buy_price: r.buy_price,
      amount_invested: r.amount_invested,
      decided_at: r.decided_at,
    });
  }

  // Locale for the mom-readable one-liner: site language cookie first
  // (matches next-intl request config), Accept-Language as fallback.
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = ["es", "en", "pt", "hi"].includes(cookieLocale ?? "")
    ? (cookieLocale as string)
    : parseLocale(request.headers.get("Accept-Language"));
  const overrides = momOverrides as Record<string, { one_liner?: string }>;

  const enriched = picks.map((p) => {
    const decision = byPick.get(p.pick_number);
    const stock = stocks.find((s) => s.ticker === p.ticker);
    const oneLinerEs =
      overrides[p.ticker]?.one_liner ?? compactOneLiner(stock?.summary_short);
    return {
      ...p,
      one_liner: localized(p.ticker, "one_liner", locale, oneLinerEs),
      status: decision?.status ?? "pending",
      buy_price: decision?.buy_price ?? null,
      amount_invested: decision?.amount_invested ?? null,
      decided_at: decision?.decided_at ?? null,
    };
  });

  return NextResponse.json({
    picks: enriched,
    is_subscribed: isSubscribed,
    default_investment: subscriber?.default_investment ?? null,
    access_started_at: cutoffIso ?? null,
  });
}
