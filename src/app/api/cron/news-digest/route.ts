import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredPlatforms, deadTokens, sendPushMany } from "@/lib/push";
import { prefsMatchNews, type NewsPushTargeting } from "@/lib/news-push";
import type { NewsRegion, NewsTopic } from "@/lib/news-classify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily news digest — one bundled push for users who chose delivery='daily'
 * in "Tu mezcla" instead of instant news pushes.
 *
 * Runs at 14:00 UTC (8:00 CDMX). Takes the last 24h of app_news, filters
 * per user (audience tier + topics/regions + always-on bought-pick tickers)
 * and sends a single push: "Tu resumen de hoy · N noticias" with the newest
 * matching headline. Tapping opens that news item in the app.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: dailyUsers } = await admin
    .from("user_news_prefs")
    .select("email, topics, regions")
    .eq("delivery", "daily");
  if (!dailyUsers || dailyUsers.length === 0) {
    return NextResponse.json({ ok: true, users: 0, sent: 0 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: newsRows } = await admin
    .from("app_news")
    .select("id, headline, audience, published_at, topic, regions, tickers")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(50);
  if (!newsRows || newsRows.length === 0) {
    return NextResponse.json({ ok: true, users: dailyUsers.length, sent: 0 });
  }

  const emails = dailyUsers.map((u) => u.email);

  const { data: subs } = await admin
    .from("subscribers")
    .select("email")
    .in("subscription_status", ["active", "trialing"])
    .in("email", emails);
  const premium = new Set((subs ?? []).map((s) => s.email));

  const allTickers = [
    ...new Set(newsRows.flatMap((n) => n.tickers ?? [])),
  ] as string[];
  const holdersByTicker = new Map<string, Set<string>>();
  if (allTickers.length > 0) {
    const { data: pickRows } = await admin
      .from("user_pick_status")
      .select("email, ticker")
      .eq("status", "bought")
      .in("ticker", allTickers)
      .in("email", emails);
    for (const row of pickRows ?? []) {
      if (!holdersByTicker.has(row.ticker)) {
        holdersByTicker.set(row.ticker, new Set());
      }
      holdersByTicker.get(row.ticker)!.add(row.email);
    }
  }

  const platforms = configuredPlatforms();
  if (platforms.length === 0) {
    return NextResponse.json({ ok: true, users: dailyUsers.length, sent: 0 });
  }
  const { data: tokenRows } = await admin
    .from("device_tokens")
    .select("token, email, platform")
    .in("platform", platforms)
    .eq("is_active", true)
    .in("email", emails);
  const tokensByEmail = new Map<string, { token: string; platform: string }[]>();
  for (const t of tokenRows ?? []) {
    if (!t.email) continue;
    if (!tokensByEmail.has(t.email)) tokensByEmail.set(t.email, []);
    tokensByEmail.get(t.email)!.push({ token: t.token, platform: t.platform });
  }

  let sent = 0;
  let failed = 0;
  const allDead: string[] = [];

  for (const user of dailyUsers) {
    const tokens = tokensByEmail.get(user.email);
    if (!tokens || tokens.length === 0) continue;

    const matching = newsRows.filter((n) => {
      // Audience tier first (same rule as /api/news).
      if (n.audience === "premium" && !premium.has(user.email)) return false;
      if (n.audience === "free" && premium.has(user.email)) return false;
      const targeting: NewsPushTargeting = {
        topic: (n.topic ?? "markets") as NewsTopic,
        regions: (n.regions ?? ["global"]) as NewsRegion[],
        tickers: (n.tickers ?? []) as string[],
      };
      const owns = targeting.tickers.some((tk) =>
        holdersByTicker.get(tk)?.has(user.email),
      );
      return prefsMatchNews(user, targeting, owns);
    });
    if (matching.length === 0) continue;

    const newest = matching[0];
    const title =
      matching.length === 1
        ? "Tu resumen de hoy"
        : `Tu resumen de hoy · ${matching.length} noticias`;
    const results = await sendPushMany(
      tokens.map((t) => ({ ...t, email: user.email })),
      {
        title,
        body: newest.headline,
        threadId: "news",
        data: { kind: "news", news_id: newest.id },
      },
    );
    const okCount = results.filter((r) => r.ok).length;
    sent += okCount;
    failed += results.length - okCount;
    allDead.push(...deadTokens(results));
  }

  if (allDead.length > 0) {
    await admin
      .from("device_tokens")
      .update({ is_active: false })
      .in("token", allDead);
  }

  return NextResponse.json({
    ok: true,
    users: dailyUsers.length,
    news: newsRows.length,
    sent,
    failed,
    deactivated: allDead.length,
  });
}
