import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { createEventWithExplanations } from "@/lib/notifications";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Dedup: check if a similar event already exists in last N days
async function eventExists(
  ticker: string,
  eventType: string,
  titleKey: string,
  daysBack = 7
): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id")
    .eq("ticker", ticker)
    .eq("event_type", eventType)
    .eq("title_key", titleKey)
    .gte("created_at", since.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
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

  for (const ticker of activeTickers) {
    try {
      const summary = (await yahooFinance.quoteSummary(ticker, {
        modules: ["calendarEvents", "summaryDetail", "recommendationTrend"],
      })) as Record<string, unknown>;

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
          const now = new Date();
          const daysUntil = Math.ceil(
            (earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Within 30 days and not past
          if (daysUntil >= 0 && daysUntil <= 30) {
            const exists = await eventExists(ticker, "earnings", "notifications.earningsUpcoming", 30);
            if (!exists) {
              const dateStr = earningsDate.toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              });
              await createEventWithExplanations({
                ticker,
                event_type: "earnings",
                title_key: "notifications.earningsUpcoming",
                params: {
                  ticker,
                  date: dateStr,
                  days: String(daysUntil),
                },
              });
              results.push(`${ticker}: earnings in ${daysUntil}d (${dateStr})`);
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
          const now = new Date();
          const daysUntil = Math.ceil(
            (exDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntil >= -7 && daysUntil <= 30) {
            const exists = await eventExists(ticker, "dividend", "notifications.dividendExDate", 60);
            if (!exists) {
              const dateStr = exDate.toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              });
              const yieldStr = dividendYield
                ? (dividendYield * 100).toFixed(1)
                : "?";
              const amountStr = dividendRate
                ? `$${dividendRate.toFixed(2)}/yr`
                : "";

              await createEventWithExplanations({
                ticker,
                event_type: "dividend",
                title_key: "notifications.dividendExDate",
                params: {
                  ticker,
                  date: dateStr,
                  yield: yieldStr,
                  amount: amountStr,
                },
              });
              results.push(`${ticker}: ex-dividend ${dateStr} (yield ${yieldStr}%)`);
            }
          }
        }
      } catch (e) {
        errors.push(`${ticker} dividend: ${e}`);
      }

      // --- 3. Analyst Consensus (report current state, not just changes) ---
      try {
        const trend = recommendationTrend?.trend;
        if (trend && trend.length >= 1) {
          const current = trend[0];
          const totalCurr =
            current.strongBuy + current.buy + current.hold + current.sell + current.strongSell;

          if (totalCurr > 0) {
            const buyPctCurr = ((current.strongBuy + current.buy) / totalCurr) * 100;

            // Strong consensus: >80% buy or <30% buy — noteworthy
            const isStrong = buyPctCurr >= 80;
            const isWeak = buyPctCurr < 30;

            if (isStrong || isWeak) {
              const titleKey = isStrong
                ? "notifications.analystConsensusUp"
                : "notifications.analystConsensusDown";
              const exists = await eventExists(ticker, "analyst", titleKey, 60);
              if (!exists) {
                const rating = buyPctCurr >= 70 ? "Buy" : buyPctCurr >= 40 ? "Hold" : "Sell";
                await createEventWithExplanations({
                  ticker,
                  event_type: "analyst",
                  title_key: titleKey,
                  params: {
                    ticker,
                    rating,
                    buyPct: buyPctCurr.toFixed(0),
                    analysts: String(totalCurr),
                  },
                });
                results.push(`${ticker}: analyst consensus ${buyPctCurr.toFixed(0)}% buy (${totalCurr} analysts)`);
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
          const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
          if (range > 0) {
            const pctFromHigh = ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100;
            const pctFromLow = ((currentPrice - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;

            // Within 5% of 52-week high
            if (pctFromHigh <= 5) {
              const exists = await eventExists(ticker, "price_move", "notifications.near52High", 30);
              if (!exists) {
                await createEventWithExplanations({
                  ticker,
                  event_type: "price_move",
                  title_key: "notifications.near52High",
                  params: {
                    ticker,
                    pct: pctFromHigh.toFixed(1),
                    high: fiftyTwoWeekHigh.toFixed(2),
                  },
                });
                results.push(`${ticker}: near 52w high (${pctFromHigh.toFixed(1)}% away)`);
              }
            }

            // Within 5% of 52-week low
            if (pctFromLow <= 5) {
              const exists = await eventExists(ticker, "price_move", "notifications.near52Low", 30);
              if (!exists) {
                await createEventWithExplanations({
                  ticker,
                  event_type: "price_move",
                  title_key: "notifications.near52Low",
                  params: {
                    ticker,
                    pct: pctFromLow.toFixed(1),
                    low: fiftyTwoWeekLow.toFixed(2),
                  },
                });
                results.push(`${ticker}: near 52w low (${pctFromLow.toFixed(1)}% above)`);
              }
            }
          }
        }
      } catch (e) {
        errors.push(`${ticker} 52week: ${e}`);
      }
    } catch (e) {
      errors.push(`${ticker} quoteSummary: ${e}`);
    }
  }

  return NextResponse.json({
    success: true,
    scanned: activeTickers.length,
    events_created: results.length,
    events: results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
