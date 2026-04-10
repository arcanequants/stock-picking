/**
 * Backfill portfolio snapshots from first transaction date to today.
 * Uses yahoo-finance2 historical prices.
 *
 * Run: npx tsx src/scripts/backfill-history.ts
 */

import { createClient } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import data from stocks.ts
import { transactions } from "../data/stocks.js";
import { adjustPriceForSplit } from "../lib/split-detection.js";

interface HistoricalRow {
  date: Date;
  close: number;
}

async function backfill() {
  if (transactions.length === 0) {
    console.log("No transactions to backfill.");
    return;
  }

  // Sort transactions by date
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const firstDate = sorted[0].date;
  const tickers = [...new Set(sorted.map((t) => t.ticker))];

  console.log(`Backfilling from ${firstDate} to today`);
  console.log(`Tickers: ${tickers.join(", ")}`);

  // period2 is EXCLUSIVE in yahoo-finance2 historical — use tomorrow to include today
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const period2Str = tomorrow.toISOString().split("T")[0];

  // Fetch historical prices for each ticker
  const historicalPrices: Record<string, Record<string, number>> = {};

  for (const ticker of tickers) {
    console.log(`Fetching historical prices for ${ticker}...`);
    try {
      const result = (await yahooFinance.historical(ticker, {
        period1: firstDate,
        period2: period2Str,
        interval: "1d",
      })) as HistoricalRow[];

      historicalPrices[ticker] = {};
      for (const row of result) {
        const dateStr = new Date(row.date).toISOString().split("T")[0];
        historicalPrices[ticker][dateStr] = row.close;
      }
      console.log(
        `  Got ${Object.keys(historicalPrices[ticker]).length} data points`
      );
    } catch (err) {
      console.error(`  Failed to fetch ${ticker}:`, err);
    }
  }

  // Fetch SPY (S&P 500 ETF) historical prices for benchmark comparison
  console.log(`Fetching historical prices for SPY (benchmark)...`);
  const spyPrices: Record<string, number> = {};
  let spyBaselineClose: number | null = null;
  try {
    const spyResult = (await yahooFinance.historical("SPY", {
      period1: firstDate,
      period2: period2Str,
      interval: "1d",
    })) as HistoricalRow[];

    const spySorted = [...spyResult].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const row of spySorted) {
      const dateStr = new Date(row.date).toISOString().split("T")[0];
      spyPrices[dateStr] = row.close;
    }
    if (spySorted.length > 0) {
      spyBaselineClose = spySorted[0].close;
    }
    console.log(`  Got ${Object.keys(spyPrices).length} SPY data points`);
  } catch (err) {
    console.error(`  Failed to fetch SPY:`, err);
  }

  // Generate daily snapshots
  const start = new Date(firstDate);
  const end = new Date();
  const snapshots: {
    date: string;
    total_invested: number;
    total_value: number;
    return_pct: number;
    spy_return_pct: number;
    prices: Record<string, number>;
  }[] = [];

  // Track last known prices for intra-day stale tickers (not for market-closed days)
  const lastKnownPrice: Record<string, number> = {};

  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getUTCDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Get transactions active on this date
    const activeTxs = sorted.filter((t) => t.date <= dateStr);
    if (activeTxs.length === 0) continue;

    // Auto-detect market holidays: if SPY has no data for this date, the NYSE
    // was closed (Good Friday, Christmas, etc.). Skip this date entirely —
    // never fabricate snapshots with stale prices for closed-market days.
    if (spyPrices[dateStr] === undefined) {
      console.log(`  Skipping ${dateStr} — market closed (no SPY data)`);
      continue;
    }
    const todaySpyPrice = spyPrices[dateStr];

    // Update last known prices (only for tickers that traded today)
    for (const ticker of tickers) {
      if (historicalPrices[ticker]?.[dateStr]) {
        lastKnownPrice[ticker] = historicalPrices[ticker][dateStr];
      }
    }

    // Calculate portfolio value ($50 per position)
    const INVESTMENT_PER_POSITION = 50;
    let totalInvested = 0;
    let totalValue = 0;
    const prices: Record<string, number> = {};

    for (const tx of activeTxs) {
      const currentPrice = lastKnownPrice[tx.ticker] ?? tx.price;
      const { adjustedPrice } = adjustPriceForSplit(tx.price, currentPrice);
      const shares = INVESTMENT_PER_POSITION / adjustedPrice;
      totalInvested += INVESTMENT_PER_POSITION;
      totalValue += shares * currentPrice;
      prices[tx.ticker] = currentPrice;
    }

    const returnPct =
      totalInvested > 0
        ? ((totalValue - totalInvested) / totalInvested) * 100
        : 0;

    // Calculate SPY benchmark return % vs first portfolio date
    // (todaySpyPrice is guaranteed defined because we skipped closed-market days above)
    let spyReturnPct = 0;
    if (spyBaselineClose) {
      spyReturnPct =
        ((todaySpyPrice - spyBaselineClose) / spyBaselineClose) * 100;
      prices.SPY = todaySpyPrice;
    }

    snapshots.push({
      date: dateStr,
      total_invested: Math.round(totalInvested * 100) / 100,
      total_value: Math.round(totalValue * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      spy_return_pct: Math.round(spyReturnPct * 100) / 100,
      prices,
    });
  }

  console.log(`\nGenerated ${snapshots.length} snapshots`);

  // Upsert all snapshots
  if (snapshots.length > 0) {
    const { error } = await supabase
      .from("portfolio_snapshots")
      .upsert(snapshots, { onConflict: "date" });

    if (error) {
      console.error("Error upserting snapshots:", error);
    } else {
      console.log("Successfully stored all snapshots!");
    }
  }

  // Print summary
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  console.log(`\nSummary:`);
  console.log(`  First: ${first.date} — $${first.total_invested} invested`);
  console.log(
    `  Latest: ${last.date} — $${last.total_value} value (${last.return_pct}%)`
  );
}

backfill().catch(console.error);
