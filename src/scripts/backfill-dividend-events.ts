/**
 * Backfill dividend_events with every dividend the Vectorial Data model
 * portfolio has received since its first transaction in each ticker.
 *
 * Idempotent: ON CONFLICT (ticker, ex_date) DO NOTHING.
 *
 * Run: npx tsx src/scripts/backfill-dividend-events.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";

import { transactions } from "../data/stocks.js";
import { fetchSplitMap } from "../lib/split-detection.js";
import { fetchDividendMap } from "../lib/dividend-detection.js";
import { walkShares } from "../lib/shares-walk.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface HistoricalRow {
  date: Date;
  close: number;
}

const POSITION_USD = 50;

async function main() {
  if (transactions.length === 0) {
    console.log("No transactions — nothing to backfill.");
    return;
  }

  const tickers = [...new Set(transactions.map((t) => t.ticker))];
  const firstDates: Record<string, string> = {};
  for (const t of transactions) {
    if (!firstDates[t.ticker] || t.date < firstDates[t.ticker]) {
      firstDates[t.ticker] = t.date;
    }
  }
  const portfolioFirstDate = Object.values(firstDates).sort()[0];

  console.log(
    `Backfilling dividends for ${tickers.length} tickers since ${portfolioFirstDate}`,
  );

  // period2 exclusive in yahoo-finance2 historical — push to tomorrow.
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const period2Str = tomorrow.toISOString().split("T")[0];

  const historicalPrices: Record<string, Record<string, number>> = {};
  for (const ticker of tickers) {
    try {
      const rows = (await yahooFinance.historical(ticker, {
        period1: firstDates[ticker],
        period2: period2Str,
        interval: "1d",
      })) as HistoricalRow[];
      historicalPrices[ticker] = {};
      for (const row of rows) {
        const dateStr = new Date(row.date).toISOString().split("T")[0];
        historicalPrices[ticker][dateStr] = row.close;
      }
    } catch (err) {
      console.error(`  Failed to fetch prices for ${ticker}:`, err);
      historicalPrices[ticker] = {};
    }
  }

  const sinceDate = new Date(portfolioFirstDate);
  const [splitMap, dividendMap] = await Promise.all([
    fetchSplitMap(tickers, yahooFinance, sinceDate),
    fetchDividendMap(tickers, yahooFinance, sinceDate),
  ]);

  const rows: Array<{
    ticker: string;
    ex_date: string;
    pay_date: string | null;
    amount_per_share: number;
    shares_held: number;
    total_amount: number;
  }> = [];

  for (const ticker of tickers) {
    const dividends = dividendMap[ticker] ?? [];
    const splits = splitMap[ticker] ?? [];
    const txs = transactions.filter((t) => t.ticker === ticker);

    for (const div of dividends) {
      const exDateStr = div.date.toISOString().split("T")[0];

      // Only count dividends that happened AFTER at least one Vectorial
      // transaction in this ticker — that's when we started holding shares.
      const eligibleTxs = txs.filter((t) => t.date <= exDateStr);
      if (eligibleTxs.length === 0) continue;

      // Sum shares across all positions, walking each from buy date to the
      // ex-div date with prior splits + DRIP applied.
      let totalShares = 0;
      for (const tx of eligibleTxs) {
        const buyPrice = tx.open_price ?? tx.price;
        const { shares } = walkShares({
          investment: POSITION_USD,
          buyPrice,
          buyDate: tx.date,
          asOfDate: exDateStr,
          splits,
          dividends,
          priceHistory: historicalPrices[ticker] ?? {},
        });
        totalShares += shares;
      }

      const totalAmount = totalShares * div.amount;

      rows.push({
        ticker,
        ex_date: exDateStr,
        pay_date: null,
        amount_per_share: Number(div.amount.toFixed(4)),
        shares_held: Number(totalShares.toFixed(8)),
        total_amount: Number(totalAmount.toFixed(4)),
      });
    }
  }

  console.log(`Upserting ${rows.length} dividend events…`);

  // Supabase upsert with onConflict for (ticker, ex_date) unique constraint.
  const { error } = await supabase
    .from("dividend_events")
    .upsert(rows, { onConflict: "ticker,ex_date", ignoreDuplicates: true });

  if (error) {
    console.error("Upsert failed:", error);
    process.exit(1);
  }

  const byTicker: Record<string, number> = {};
  let totalCash = 0;
  for (const r of rows) {
    byTicker[r.ticker] = (byTicker[r.ticker] ?? 0) + r.total_amount;
    totalCash += r.total_amount;
  }
  console.log(`\nTotal dividends received: $${totalCash.toFixed(2)}`);
  for (const [ticker, amt] of Object.entries(byTicker).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${ticker}: $${amt.toFixed(2)}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
