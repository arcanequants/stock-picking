import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendAnalyticsDigest, sendDailyBrief, type AnalyticsDigestData, type DailyBriefData, type DayMetric } from "@/lib/resend";
import { fetchGA4Data, fetchGA4DailyTraffic, fetchGSCData } from "@/lib/google-analytics";

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

  // ?mode=weekly forces full report; otherwise daily brief
  const url = new URL(request.url);
  const isWeekly = url.searchParams.get("mode") === "weekly";

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // --- 1. Portfolio Performance ---
    const { data: latestSnapshot } = await supabase
      .from("portfolio_snapshots")
      .select("return_pct, prices")
      .order("date", { ascending: false })
      .limit(1);

    const currentReturn = (latestSnapshot?.[0]?.return_pct as number) ?? 0;

    // Yesterday's snapshot for daily change
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: yesterdaySnapshot } = await supabase
      .from("portfolio_snapshots")
      .select("return_pct")
      .lte("date", yesterday.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(1);
    const yesterdayReturn = (yesterdaySnapshot?.[0]?.return_pct as number) ?? 0;

    // --- 2. Today's bot visits ---
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayBotVisits } = await supabase
      .from("ai_crawler_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    // --- 3. New subscribers today ---
    let totalSubscribers = 0;
    let newSubscribersToday = 0;
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
        if (u.created_at && new Date(u.created_at) >= todayStart) {
          newSubscribersToday++;
        }
      }
      if (users.length < perPage) break;
      page++;
    }

    // --- 4. API requests today ---
    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("id, requests_today, is_active")
      .eq("is_active", true);

    const totalApiKeys = apiKeys?.length ?? 0;
    const totalRequestsToday = (apiKeys ?? []).reduce(
      (sum: number, k: { requests_today?: number }) => sum + (k.requests_today ?? 0),
      0
    );

    // ─── DAILY BRIEF ───
    if (!isWeekly) {
      // Fetch 7-day history for sparklines
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Portfolio history (last 7 snapshots)
      const { data: portfolioHistory } = await supabase
        .from("portfolio_snapshots")
        .select("date, return_pct")
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      const portfolioSparkline: DayMetric[] = (portfolioHistory ?? []).map(
        (s: { date: string; return_pct: number }) => ({
          label: s.date.slice(5), // "04-03"
          value: s.return_pct,
        })
      );

      // Bot visits per day (last 7 days)
      const botSparkline: DayMetric[] = [];
      let yesterdayBots = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        const { count } = await supabase
          .from("ai_crawler_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString())
          .lte("created_at", dayEnd.toISOString());
        const val = count ?? 0;
        botSparkline.push({
          label: d.toISOString().split("T")[0].slice(5),
          value: val,
        });
        if (i === 1) yesterdayBots = val;
      }

      // GA4 yesterday's traffic (graceful)
      const ga4Traffic = await fetchGA4DailyTraffic();

      const briefData: DailyBriefData = {
        date: today,
        portfolioReturnPct: Math.round(currentReturn * 100) / 100,
        dailyChangePct: Math.round((currentReturn - yesterdayReturn) * 100) / 100,
        totalBotVisits: todayBotVisits ?? 0,
        yesterdayBotVisits: yesterdayBots,
        totalSubscribers,
        newSubscribersToday,
        totalApiKeys,
        totalRequestsToday,
        portfolioSparkline,
        botSparkline,
        traffic: ga4Traffic,
      };

      await sendDailyBrief(ADMIN_EMAIL, briefData);

      return NextResponse.json({
        success: true,
        mode: "daily",
        date: today,
        sent_to: ADMIN_EMAIL,
        summary: briefData,
      });
    }

    // ─── WEEKLY CONSOLIDATED (Wednesdays) ───
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split("T")[0];
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: weekAgoSnapshot } = await supabase
      .from("portfolio_snapshots")
      .select("return_pct, prices")
      .lte("date", weekStart)
      .order("date", { ascending: false })
      .limit(1);

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

    // Full week crawler logs
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

    // Subscribers for the week
    const { data: premiumSubs } = await supabase
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"]);
    const premiumCount = premiumSubs?.length ?? 0;

    let newSubscribersThisWeek = 0;
    // Re-count for the full week
    let page2 = 1;
    while (true) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page: page2,
        perPage,
      });
      if (error || !users?.length) break;
      for (const u of users) {
        if (u.created_at && new Date(u.created_at) >= weekAgo) {
          newSubscribersThisWeek++;
        }
      }
      if (users.length < perPage) break;
      page2++;
    }

    const freeCount = totalSubscribers - premiumCount;
    const activeApiKeysThisWeek = (apiKeys ?? []).filter(
      (k: { requests_today?: number }) => (k.requests_today ?? 0) > 0
    ).length;

    // GA4 + GSC (only for weekly)
    const [ga4Data, gscData] = await Promise.all([
      fetchGA4Data(7),
      fetchGSCData(7),
    ]);

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
      weekEnd: today,
      ga4: ga4Data,
      gsc: gscData,
    };

    await sendAnalyticsDigest(ADMIN_EMAIL, digestData);

    return NextResponse.json({
      success: true,
      mode: "weekly",
      week: `${weekStart} to ${today}`,
      sent_to: ADMIN_EMAIL,
      summary: {
        portfolio: { returnPct: currentReturn, weeklyChange: currentReturn - previousReturn },
        crawlers: { total: totalBotVisits, prevWeek: prevWeekBotVisits },
        subscribers: { total: totalSubscribers, new: newSubscribersThisWeek, premium: premiumCount },
        api: { keys: totalApiKeys, requestsToday: totalRequestsToday },
        ga4: ga4Data ? "included" : "not configured",
        gsc: gscData ? "included" : "not configured",
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
