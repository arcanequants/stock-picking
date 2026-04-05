import { stocks } from "@/data/stocks";
import type { Transaction } from "@/lib/types";

const INVESTMENT_PER_POSITION = 50;

export interface AggregatedPosition {
  ticker: string;
  name: string;
  buys: number;
  total_invested: number;
  total_shares: number;
  avg_price: number;
  current_price: number;
  return_pct: number;
  first_bought: string;
  last_bought: string;
  days_held: number;
  transactions: { price: number; date: string; type: "new" | "rebuy" }[];
}

/**
 * Groups transactions by ticker and calculates weighted average cost basis.
 * Portfolio-level totals (totalInvested, totalValue) use per-transaction math
 * so global return_pct stays identical to the cron snapshot formula.
 */
export function aggregatePositions(
  txs: Transaction[],
  prices: Record<string, number>,
): { positions: AggregatedPosition[]; totalInvested: number; totalValue: number } {
  const grouped = new Map<string, Transaction[]>();

  for (const tx of txs) {
    const arr = grouped.get(tx.ticker) ?? [];
    arr.push(tx);
    grouped.set(tx.ticker, arr);
  }

  let totalInvested = 0;
  let totalValue = 0;

  const positions: AggregatedPosition[] = [];

  for (const [ticker, txList] of grouped) {
    const stock = stocks.find((s) => s.ticker === ticker);
    const currentPrice = prices[ticker] ?? stock?.price ?? txList[0].price;

    let posInvested = 0;
    let posShares = 0;
    const txDetails: AggregatedPosition["transactions"] = [];

    for (const tx of txList) {
      const shares = INVESTMENT_PER_POSITION / tx.price;
      posInvested += INVESTMENT_PER_POSITION;
      posShares += shares;
      txDetails.push({ price: tx.price, date: tx.date, type: tx.type });
    }

    const avgPrice = posInvested / posShares;
    const posValue = posShares * currentPrice;
    const returnPct = ((currentPrice - avgPrice) / avgPrice) * 100;

    const dates = txList.map((t) => t.date).sort();
    const firstBought = dates[0];
    const lastBought = dates[dates.length - 1];
    const daysHeld = Math.ceil(
      (Date.now() - new Date(firstBought + "T00:00:00").getTime()) / 86400000,
    );

    totalInvested += posInvested;
    totalValue += posValue;

    positions.push({
      ticker,
      name: stock?.name ?? ticker,
      buys: txList.length,
      total_invested: posInvested,
      total_shares: Math.round(posShares * 10000) / 10000,
      avg_price: Math.round(avgPrice * 100) / 100,
      current_price: Math.round(currentPrice * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      first_bought: firstBought,
      last_bought: lastBought,
      days_held: daysHeld,
      transactions: txDetails,
    });
  }

  return { positions, totalInvested, totalValue };
}
