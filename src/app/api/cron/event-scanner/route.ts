import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { transactions } from "@/data/stocks";
import { createEventWithExplanations } from "@/lib/notifications";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Dedup: check if a similar event already exists in last N days
async function eventExists(
  ticker: string,
  titleKey: string,
  daysBack = 7
): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id")
    .eq("ticker", ticker)
    .eq("title_key", titleKey)
    .gte("created_at", since.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}

interface PendingEvent {
  ticker: string;
  event_type: "price_move" | "dividend" | "earnings" | "analyst" | "news";
  title_key: string;
  params: Record<string, string>;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeTickers = [...new Set(transactions.map((t) => t.ticker))];
  const results: string[] = [];
  const errors: string[] = [];
  const pendingEvents: PendingEvent[] = [];

  // Phase 1: Fetch Yahoo data in parallel batches of 5
  const BATCH_SIZE = 5;
  const tickerData: Map<string, Record<string, unknown>> = new Map();

  for (let i = 0; i < activeTickers.length; i += BATCH_SIZE) {
    const batch = activeTickers.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (ticker) => {
      try {
        const summary = (await yahooFinance.quoteSummary(ticker, {
          modules: ["calendarEvents", "summaryDetail", "recommendationTrend"],
        })) as Record<string, unknown>;
        tickerData.set(ticker, summary);
      } catch (e) {
        errors.push(`${ticker} fetch: ${e}`);
      }
    });
    await Promise.all(promises);
  }

  // Phase 2: Analyze data and collect pending events (no AI yet)
  const now = new Date();

  for (const [ticker, summary] of tickerData) {
    const calendarEvents = summary.calendarEvents as Record<string, unknown> | undefined;
    const summaryDetail = summary.summaryDetail as Record<string, unknown> | undefined;
    const recommendationTrend = summary.recommendationTrend as {
      trend?: Array<{
        period: string;
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
      }>;
    } | undefined;

    // --- 1. Upcoming Earnings (within next 30 days) ---
    try {
      const earnings = calendarEvents?.earnings as Record<string, unknown> | undefined;
      const earningsDates = earnings?.earningsDate as Date[] | undefined;
      const nextEarnings = earningsDates?.[0];

      if (nextEarnings) {
        const earningsDate = new Date(nextEarnings);
        const daysUntil = Math.ceil(
          (earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil >= 0 && daysUntil <= 30) {
          const exists = await eventExists(ticker, "notifications.earningsUpcoming", 30);
          if (!exists) {
            const dateStr = earningsDate.toLocaleDateString("en", { month: "short", day: "numeric" });
            pendingEvents.push({
              ticker,
              event_type: "earnings",
              title_key: "notifications.earningsUpcoming",
              params: { ticker, date: dateStr, days: String(daysUntil) },
            });
          }
        }
      }
    } catch (e) {
      errors.push(`${ticker} earnings: ${e}`);
    }

    // --- 2. Dividend Ex-Date (within 30 days ahead or 7 past) ---
    try {
      const exDividendDate = (calendarEvents?.exDividendDate ?? summaryDetail?.exDividendDate) as Date | undefined;
      const dividendRate = summaryDetail?.dividendRate as number | undefined;
      const dividendYield = summaryDetail?.dividendYield as number | undefined;

      if (exDividendDate) {
        const exDate = new Date(exDividendDate);
        const daysUntil = Math.ceil(
          (exDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil >= -7 && daysUntil <= 30) {
          const exists = await eventExists(ticker, "notifications.dividendExDate", 60);
          if (!exists) {
            const dateStr = exDate.toLocaleDateString("en", { month: "short", day: "numeric" });
            const yieldStr = dividendYield ? (dividendYield * 100).toFixed(1) : "?";
            const amountStr = dividendRate ? `$${dividendRate.toFixed(2)}/yr` : "";
            pendingEvents.push({
              ticker,
              event_type: "dividend",
              title_key: "notifications.dividendExDate",
              params: { ticker, date: dateStr, yield: yieldStr, amount: amountStr },
            });
          }
        }
      }
    } catch (e) {
      errors.push(`${ticker} dividend: ${e}`);
    }

    // --- 3. Analyst Consensus (>80% buy or <30% buy, min 5 analysts) ---
    try {
      const trend = recommendationTrend?.trend;
      if (trend && trend.length >= 1) {
        const current = trend[0];
        const totalCurr = current.strongBuy + current.buy + current.hold + current.sell + current.strongSell;

        if (totalCurr >= 5) {
          const buyPctCurr = ((current.strongBuy + current.buy) / totalCurr) * 100;
          const isStrong = buyPctCurr >= 80;
          const isWeak = buyPctCurr < 30;

          if (isStrong || isWeak) {
            const titleKey = isStrong ? "notifications.analystConsensusUp" : "notifications.analystConsensusDown";
            const exists = await eventExists(ticker, titleKey, 60);
            if (!exists) {
              const rating = buyPctCurr >= 70 ? "Buy" : buyPctCurr >= 40 ? "Hold" : "Sell";
              pendingEvents.push({
                ticker,
                event_type: "analyst",
                title_key: titleKey,
                params: { ticker, rating, buyPct: buyPctCurr.toFixed(0), analysts: String(totalCurr) },
              });
            }
          }
        }
      }
    } catch (e) {
      errors.push(`${ticker} analyst: ${e}`);
    }

    // --- 4. Near 52-week high/low ---
    try {
      const sd = summaryDetail as Record<string, unknown> | undefined;
      const fiftyTwoWeekHigh = sd?.fiftyTwoWeekHigh as number | undefined;
      const fiftyTwoWeekLow = sd?.fiftyTwoWeekLow as number | undefined;
      const currentPrice = sd?.previousClose as number | undefined;

      if (fiftyTwoWeekHigh && fiftyTwoWeekLow && currentPrice && currentPrice > 0) {
        const pctFromHigh = ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100;
        const pctFromLow = ((currentPrice - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;

        if (pctFromHigh <= 5) {
          const exists = await eventExists(ticker, "notifications.near52High", 30);
          if (!exists) {
            pendingEvents.push({
              ticker,
              event_type: "price_move",
              title_key: "notifications.near52High",
              params: { ticker, pct: pctFromHigh.toFixed(1), high: fiftyTwoWeekHigh.toFixed(2) },
            });
          }
        }

        if (pctFromLow <= 5) {
          const exists = await eventExists(ticker, "notifications.near52Low", 30);
          if (!exists) {
            pendingEvents.push({
              ticker,
              event_type: "price_move",
              title_key: "notifications.near52Low",
              params: { ticker, pct: pctFromLow.toFixed(1), low: fiftyTwoWeekLow.toFixed(2) },
            });
          }
        }
      }
    } catch (e) {
      errors.push(`${ticker} 52week: ${e}`);
    }
  }

  // Phase 3: Create events with AI explanations (sequential — AI is the bottleneck)
  for (const event of pendingEvents) {
    try {
      await createEventWithExplanations(event);
      results.push(`${event.ticker}: ${event.title_key.replace("notifications.", "")}`);
    } catch (e) {
      errors.push(`${event.ticker} create: ${e}`);
    }
  }

  return NextResponse.json({
    success: true,
    scanned: activeTickers.length,
    yahoo_fetched: tickerData.size,
    events_created: results.length,
    events: results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
