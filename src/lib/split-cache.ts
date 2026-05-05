import YahooFinance from "yahoo-finance2";
import { transactions } from "@/data/stocks";
import { fetchSplitMap, type SplitMap } from "@/lib/split-detection";

let cache: { map: SplitMap; expiresAt: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function getSplitMap(): Promise<SplitMap> {
  if (cache && Date.now() < cache.expiresAt) return cache.map;

  const yf = new YahooFinance();
  const tickers = [...new Set(transactions.map((t) => t.ticker))];
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const since = sorted.length > 0 ? new Date(sorted[0].date) : new Date();

  try {
    const map = await fetchSplitMap(tickers, yf, since);
    cache = { map, expiresAt: Date.now() + TTL_MS };
    return map;
  } catch {
    return {};
  }
}
