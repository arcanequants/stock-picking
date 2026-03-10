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

  // Fetch historical prices for each ticker
  const historicalPrices: Record<string, Record<string, number>> = {};

  for (const ticker of tickers) {
    console.log(`Fetching historical prices for ${ticker}...`);
    try {
      const result = (await yahooFinance.historical(ticker, {
        period1: firstDate,
        period2: new Date().toISOString().split("T")[0],
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

  // Generate daily snapshots
  const start = new Date(firstDate);
  const end = new Date();
  const snapshots: {
    date: string;
    total_invested: number;
    total_value: number;
    return_pct: number;
    prices: Record<string, number>;
  }[] = [];

  // Track last known prices for filling gaps (weekends, holidays)
  const lastKnownPrice: Record<string, number> = {};

  for (
    let d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Get transactions active on this date
    const activeTxs = sorted.filter((t) => t.date <= dateStr);
    if (activeTxs.length === 0) continue;

    // Update last known prices
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
      const shares = INVESTMENT_PER_POSITION / tx.price;
      totalInvested += INVESTMENT_PER_POSITION;
      const currentPrice = lastKnownPrice[tx.ticker] ?? tx.price;
      totalValue += shares * currentPrice;
      prices[tx.ticker] = currentPrice;
    }

    const returnPct =
      totalInvested > 0
        ? ((totalValue - totalInvested) / totalInvested) * 100
        : 0;

    snapshots.push({
      date: dateStr,
      total_invested: Math.round(totalInvested * 100) / 100,
      total_value: Math.round(totalValue * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
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
