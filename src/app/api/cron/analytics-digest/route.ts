import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendAnalyticsDigest, type AnalyticsDigestData } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMIN_EMAIL = "0138078@up.edu.mx";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const weekEnd = now.toISOString().split("T")[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split("T")[0];
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // --- 1. Portfolio Performance ---
    const { data: latestSnapshot } = await supabase
      .from("portfolio_snapshots")
      .select("return_pct, prices")
      .order("date", { ascending: false })
      .limit(1);

    const { data: weekAgoSnapshot } = await supabase
      .from("portfolio_snapshots")
      .select("return_pct, prices")
      .lte("date", weekStart)
      .order("date", { ascending: false })
      .limit(1);

    const currentReturn = (latestSnapshot?.[0]?.return_pct as number) ?? 0;
    const previousReturn = (weekAgoSnapshot?.[0]?.return_pct as number) ?? 0;
    const currentPrices = (latestSnapshot?.[0]?.prices as Record<string, number>) ?? {};
    const previousPrices = (weekAgoSnapshot?.[0]?.prices as Record<string, number>) ?? {};

    let bestStock: { ticker: string; returnPct: number } | null = null;
    let worstStock: { ticker: string; returnPct: number } | null = null;

    for (const [ticker, currentPrice] of Object.entries(currentPrices)) {
      const prevPrice = previousPrices[ticker];
      if (!prevPrice || prevPrice === 0) continue;
      const changePct = Math.round(((currentPrice - prevPrice) / prevPrice) * 1000) / 10;
      if (!bestStock || changePct > bestStock.returnPct) {
        bestStock = { ticker, returnPct: changePct };
      }
      if (!worstStock || changePct < worstStock.returnPct) {
        worstStock = { ticker, returnPct: changePct };
      }
    }

    // --- 2. AI Crawler Logs ---
    const { data: crawlerLogs } = await supabase
      .from("ai_crawler_logs")
      .select("bot_name, url")
      .gte("created_at", weekAgo.toISOString())
      .lte("created_at", now.toISOString());

    const { count: prevWeekBotVisits } = await supabase
      .from("ai_crawler_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString());

    const totalBotVisits = crawlerLogs?.length ?? 0;

    const botCounts = new Map<string, number>();
    const pageCounts = new Map<string, number>();
    for (const log of crawlerLogs ?? []) {
      botCounts.set(log.bot_name, (botCounts.get(log.bot_name) ?? 0) + 1);
      pageCounts.set(log.url, (pageCounts.get(log.url) ?? 0) + 1);
    }
    const botBreakdown = [...botCounts.entries()]
      .map(([bot_name, count]) => ({ bot_name, count }))
      .sort((a, b) => b.count - a.count);
    const topCrawledPages = [...pageCounts.entries()]
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- 3. Subscribers ---
    const { data: premiumSubs } = await supabase
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"]);

    const premiumCount = premiumSubs?.length ?? 0;

    let totalSubscribers = 0;
    let newSubscribersThisWeek = 0;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error || !users?.length) break;
      totalSubscribers += users.length;
      for (const u of users) {
        if (u.created_at && new Date(u.created_at) >= weekAgo) {
          newSubscribersThisWeek++;
        }
      }
      if (users.length < perPage) break;
      page++;
    }

    const freeCount = totalSubscribers - premiumCount;

    // --- 4. API Usage ---
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("id, requests_today, is_active")
      .eq("is_active", true);

    const totalApiKeys = apiKeys?.length ?? 0;
    const activeApiKeysThisWeek = (apiKeys ?? []).filter(
      (k: { requests_today?: number }) => (k.requests_today ?? 0) > 0
    ).length;
    const totalRequestsToday = (apiKeys ?? []).reduce(
      (sum: number, k: { requests_today?: number }) => sum + (k.requests_today ?? 0),
      0
    );

    // --- 5. Send email ---
    const digestData: AnalyticsDigestData = {
      portfolioReturnPct: Math.round(currentReturn * 100) / 100,
      weeklyChangePct: Math.round((currentReturn - previousReturn) * 100) / 100,
      bestStock,
      worstStock,
      totalBotVisits,
      botBreakdown,
      topCrawledPages,
      prevWeekBotVisits: prevWeekBotVisits ?? 0,
      totalSubscribers,
      newSubscribersThisWeek,
      premiumCount,
      freeCount,
      totalApiKeys,
      activeApiKeysThisWeek,
      totalRequestsToday,
      weekStart,
      weekEnd,
    };

    await sendAnalyticsDigest(ADMIN_EMAIL, digestData);

    return NextResponse.json({
      success: true,
      week: `${weekStart} to ${weekEnd}`,
      sent_to: ADMIN_EMAIL,
      summary: {
        portfolio: { returnPct: currentReturn, weeklyChange: currentReturn - previousReturn },
        crawlers: { total: totalBotVisits, prevWeek: prevWeekBotVisits },
        subscribers: { total: totalSubscribers, new: newSubscribersThisWeek, premium: premiumCount },
        api: { keys: totalApiKeys, requestsToday: totalRequestsToday },
      },
    });
  } catch (error) {
    console.error("Analytics digest cron error:", error);
    return NextResponse.json(
      { error: "Failed to send analytics digest" },
      { status: 500 }
    );
  }
}
