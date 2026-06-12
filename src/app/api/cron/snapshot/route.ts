import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { createEventWithExplanations } from "@/lib/notifications";
import { applySplitAdjustment, fetchSplitMap } from "@/lib/split-detection";
import { fetchDividendMap } from "@/lib/dividend-detection";
import { walkShares } from "@/lib/shares-walk";
import YahooFinance from "yahoo-finance2";

interface HistoricalRow {
  date: Date;
  close: number;
}

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Skip weekends (markets closed) — safety guard even though cron is Mon-Fri
    const utcDay = new Date().getUTCDay();
    if (utcDay === 0 || utcDay === 6) {
      return NextResponse.json({ message: "Skipped: market closed on weekends" });
    }

    // Get unique tickers from active transactions
    const activeTickers = [
      ...new Set(transactions.map((t) => t.ticker)),
    ];

    if (activeTickers.length === 0) {
      return NextResponse.json({ message: "No active positions to track" });
    }

    // Fetch current prices from Yahoo Finance
    const prices: Record<string, number> = {};
    for (const ticker of activeTickers) {
      try {
        const quote = await yahooFinance.quote(ticker) as Record<string, unknown>;
        const price = quote.regularMarketPrice as number | undefined;
        if (price) {
          prices[ticker] = price;
        }
      } catch {
        // If Yahoo fails for a ticker, use the static price from stocks.ts
        const stock = stocks.find((s) => s.ticker === ticker);
        if (stock) prices[ticker] = stock.price;
      }
    }

    // Fetch current SPY (S&P 500 ETF) price for benchmark.
    // SPY is also our market-open signal: if Yahoo reports no recent trade
    // (market holiday like Good Friday), we skip the snapshot entirely instead
    // of fabricating one with stale data.
    let spyCurrentPrice: number | null = null;
    let spyLastTradeTime: number | null = null;
    try {
      const spyQuote = (await yahooFinance.quote("SPY")) as Record<string, unknown>;
      spyCurrentPrice = (spyQuote.regularMarketPrice as number | undefined) ?? null;
      const lastTrade = spyQuote.regularMarketTime;
      if (lastTrade instanceof Date) {
        spyLastTradeTime = lastTrade.getTime();
      } else if (typeof lastTrade === "number") {
        spyLastTradeTime = lastTrade * 1000;
      }
      if (spyCurrentPrice) prices.SPY = spyCurrentPrice;
    } catch (e) {
      console.error("Failed to fetch SPY quote:", e);
    }

    // Market-holiday guard: if SPY's last trade is older than 20 hours, the
    // market did not open today (holiday). Skip snapshot to avoid duplicating
    // yesterday's values. 20h tolerance handles timezone edge cases.
    if (spyLastTradeTime) {
      const hoursSinceLastTrade = (Date.now() - spyLastTradeTime) / (1000 * 60 * 60);
      if (hoursSinceLastTrade > 20) {
        return NextResponse.json({
          message: `Skipped: market closed today (SPY last traded ${hoursSinceLastTrade.toFixed(1)}h ago)`,
        });
      }
    }

    // Fetch real split events from Yahoo for the earliest tx date forward.
    // Single API call per ticker; events are rare so the response is tiny.
    const earliestTxDate = transactions.reduce(
      (min, t) => (t.date < min ? t.date : min),
      transactions[0]?.date ?? new Date().toISOString(),
    );
    // period2 is EXCLUSIVE in yahoo-finance2 historical — use tomorrow to
    // include today's close in the reinvestment price history.
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const period2Str = tomorrow.toISOString().split("T")[0];

    // Splits + dividends + historical closes since the first transaction.
    // walkShares reinvests each dividend at the close on its ex-date, so we
    // need full price history (not just a recent window) for accuracy.
    const [splitMap, dividendMap] = await Promise.all([
      fetchSplitMap(activeTickers, yahooFinance, new Date(earliestTxDate)),
      fetchDividendMap([...activeTickers, "SPY"], yahooFinance, new Date(earliestTxDate)),
    ]);

    const historicalPrices: Record<string, Record<string, number>> = {};
    await Promise.all(
      activeTickers.map(async (ticker) => {
        try {
          const rows = (await yahooFinance.historical(ticker, {
            period1: earliestTxDate,
            period2: period2Str,
            interval: "1d",
          })) as HistoricalRow[];
          const byDate: Record<string, number> = {};
          for (const row of rows) {
            byDate[new Date(row.date).toISOString().split("T")[0]] = row.close;
          }
          historicalPrices[ticker] = byDate;
        } catch {
          historicalPrices[ticker] = {};
        }
      }),
    );

    // SPY historical closes for the DCA-equivalent DRIP benchmark.
    const spyPrices: Record<string, number> = {};
    const spyDateOrder: string[] = [];
    try {
      const spyRows = (await yahooFinance.historical("SPY", {
        period1: earliestTxDate,
        period2: period2Str,
        interval: "1d",
      })) as HistoricalRow[];
      const spySorted = [...spyRows].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      for (const row of spySorted) {
        const dateStr = new Date(row.date).toISOString().split("T")[0];
        spyPrices[dateStr] = row.close;
        spyDateOrder.push(dateStr);
      }
    } catch (e) {
      console.error("Failed to fetch SPY history:", e);
    }
    const spyOnOrAfter = (date: string): number | null => {
      if (spyPrices[date] !== undefined) return spyPrices[date];
      for (const d of spyDateOrder) {
        if (d >= date) return spyPrices[d];
      }
      return null;
    };

    // Calculate portfolio value ($50 per position) with DRIP reinvestment.
    // walkShares applies splits + reinvests dividends chronologically, so a
    // dividend paid in cash is reinvested into shares at the ex-date close and
    // grows the position — reflected in totalValue and position_shares.
    const INVESTMENT_PER_POSITION = 50;
    const today = new Date().toISOString().split("T")[0];
    let totalInvested = 0;
    let totalValue = 0;
    const positionShares: Record<string, number> = {};
    const splitEvents: { ticker: string; ratio: number; original: number; adjusted: number }[] = [];

    for (const tx of transactions) {
      const currentPrice = prices[tx.ticker] ?? tx.price;
      const { detected, factor, adjustedPrice } = applySplitAdjustment(
        tx.price,
        tx.date,
        splitMap[tx.ticker],
      );
      if (detected) {
        splitEvents.push({ ticker: tx.ticker, ratio: factor, original: tx.price, adjusted: adjustedPrice });
      }

      const { shares } = walkShares({
        investment: INVESTMENT_PER_POSITION,
        buyPrice: tx.open_price ?? tx.price,
        buyDate: tx.date,
        asOfDate: today,
        splits: splitMap[tx.ticker] ?? [],
        dividends: dividendMap[tx.ticker] ?? [],
        priceHistory: historicalPrices[tx.ticker] ?? {},
      });
      totalInvested += INVESTMENT_PER_POSITION;
      totalValue += shares * currentPrice;
      positionShares[`${tx.ticker}|${tx.date}|${tx.type}`] = shares;
    }

    const returnPct =
      totalInvested > 0
        ? ((totalValue - totalInvested) / totalInvested) * 100
        : 0;

    // SPY benchmark: DCA-equivalent with DRIP. For each tx, allocate $50 to SPY
    // at that tx's date and reinvest SPY dividends through today — same
    // money-weighted exposure + total-return treatment as the portfolio.
    let spyReturnPct = 0;
    if (spyCurrentPrice) {
      let spyInvested = 0;
      let spyValue = 0;
      for (const tx of transactions) {
        const spyAtBuy = spyOnOrAfter(tx.date);
        if (spyAtBuy == null) continue;
        const { shares: spyShares } = walkShares({
          investment: INVESTMENT_PER_POSITION,
          buyPrice: spyAtBuy,
          buyDate: tx.date,
          asOfDate: today,
          splits: [],
          dividends: dividendMap.SPY ?? [],
          priceHistory: spyPrices,
        });
        spyInvested += INVESTMENT_PER_POSITION;
        spyValue += spyShares * spyCurrentPrice;
      }
      spyReturnPct =
        spyInvested > 0 ? ((spyValue - spyInvested) / spyInvested) * 100 : 0;
    }

    // Upsert snapshot (update if date exists, insert if not)
    const { error } = await getSupabaseAdmin()
      .from("portfolio_snapshots")
      .upsert(
        {
          date: today,
          total_invested: totalInvested,
          total_value: totalValue,
          return_pct: Math.round(returnPct * 100) / 100,
          spy_return_pct: Math.round(spyReturnPct * 100) / 100,
          prices,
          position_shares: positionShares,
        },
        { onConflict: "date" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- Price move detection (>3% daily change) ---
    const priceMoveEvents: string[] = [];
    try {
      const { data: prevSnapshots } = await getSupabaseAdmin()
        .from("portfolio_snapshots")
        .select("prices")
        .order("date", { ascending: false })
        .neq("date", today)
        .limit(1);

      const prevPrices = (prevSnapshots?.[0]?.prices as Record<string, number>) ?? {};

      for (const ticker of activeTickers) {
        const curr = prices[ticker];
        const prev = prevPrices[ticker];
        if (!curr || !prev || prev === 0) continue;

        const changePct = ((curr - prev) / prev) * 100;
        if (Math.abs(changePct) >= 3) {
          const isUp = changePct > 0;
          await createEventWithExplanations({
            ticker,
            event_type: "price_move",
            title_key: isUp ? "notifications.priceUp" : "notifications.priceDown",
            params: {
              ticker,
              pct: Math.abs(changePct).toFixed(1),
            },
          });
          priceMoveEvents.push(`${ticker}: ${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%`);
        }
      }
    } catch (e) {
      console.error("Price move detection error:", e);
    }

    return NextResponse.json({
      success: true,
      date: today,
      total_invested: totalInvested,
      total_value: Math.round(totalValue * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      spy_return_pct: Math.round(spyReturnPct * 100) / 100,
      prices,
      price_move_events: priceMoveEvents,
      split_events: splitEvents,
    });
  } catch (error) {
    console.error("Cron snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
