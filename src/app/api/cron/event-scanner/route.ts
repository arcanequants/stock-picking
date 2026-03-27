import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { createEventWithExplanations } from "@/lib/notifications";
import type { PortfolioEvent } from "@/lib/types";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Dedup: check if a similar event already exists in last N days
async function eventExists(
  ticker: string,
  eventType: string,
  daysBack = 7
): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data } = await getSupabaseAdmin()
    .from("portfolio_events")
    .select("id")
    .eq("ticker", ticker)
    .eq("event_type", eventType)
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

      // --- 1. Upcoming Earnings (within next 7 days) ---
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

          // Upcoming: within 7 days and not past
          if (daysUntil >= 0 && daysUntil <= 7) {
            const exists = await eventExists(ticker, "earnings", 14);
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

      // --- 2. Dividend Ex-Date (within next 7 days or just passed in last 3 days) ---
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

          // Upcoming ex-dividend: within 7 days ahead or 3 days past
          if (daysUntil >= -3 && daysUntil <= 7) {
            const exists = await eventExists(ticker, "dividend", 30);
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
              results.push(
                `${ticker}: ex-dividend ${dateStr} (yield ${yieldStr}%)`
              );
            }
          }
        }
      } catch (e) {
        errors.push(`${ticker} dividend: ${e}`);
      }

      // --- 3. Analyst Consensus Change ---
      try {
        const trend = recommendationTrend?.trend;
        if (trend && trend.length >= 2) {
          const current = trend[0]; // "0m" — this month
          const previous = trend[1]; // "-1m" — last month

          const totalCurr =
            current.strongBuy +
            current.buy +
            current.hold +
            current.sell +
            current.strongSell;
          const totalPrev =
            previous.strongBuy +
            previous.buy +
            previous.hold +
            previous.sell +
            previous.strongSell;

          if (totalCurr > 0 && totalPrev > 0) {
            const buyPctCurr =
              ((current.strongBuy + current.buy) / totalCurr) * 100;
            const buyPctPrev =
              ((previous.strongBuy + previous.buy) / totalPrev) * 100;
            const shift = buyPctCurr - buyPctPrev;

            // Significant shift: >15 percentage points change in buy %
            if (Math.abs(shift) >= 15) {
              const exists = await eventExists(ticker, "analyst", 30);
              if (!exists) {
                const isUpgrade = shift > 0;
                const rating = buyPctCurr >= 70 ? "Buy" : buyPctCurr >= 40 ? "Hold" : "Sell";
                await createEventWithExplanations({
                  ticker,
                  event_type: "analyst",
                  title_key: isUpgrade
                    ? "notifications.analystConsensusUp"
                    : "notifications.analystConsensusDown",
                  params: {
                    ticker,
                    rating,
                    buyPct: buyPctCurr.toFixed(0),
                    analysts: String(totalCurr),
                  },
                });
                results.push(
                  `${ticker}: analyst consensus ${isUpgrade ? "up" : "down"} (${buyPctCurr.toFixed(0)}% buy)`
                );
              }
            }
          }
        }
      } catch (e) {
        errors.push(`${ticker} analyst: ${e}`);
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
