import type { SplitEvent } from "@/lib/split-detection";
import type { DividendEvent } from "@/lib/dividend-detection";

type WalkEvent =
  | { kind: "split"; date: Date; factor: number }
  | { kind: "div"; date: Date; amount: number };

/**
 * Walk a position's corporate-action events chronologically from buy date
 * through `asOfDate`, applying splits as share multipliers and reinvesting
 * each dividend at the close price on its ex-div date.
 *
 * Returns shares + total cash from dividends reinvested (for reporting).
 */
export function walkShares(params: {
  investment: number;
  buyPrice: number;
  buyDate: string;
  asOfDate: string;
  splits: SplitEvent[];
  dividends: DividendEvent[];
  priceHistory: Record<string, number>;
}): { shares: number; dividendsReinvested: number } {
  const {
    investment,
    buyPrice,
    buyDate,
    asOfDate,
    splits,
    dividends,
    priceHistory,
  } = params;

  let shares = investment / buyPrice;
  let dividendsReinvested = 0;

  const buyTime = new Date(buyDate).getTime();
  const asOfTime = new Date(asOfDate + "T23:59:59Z").getTime();

  const events: WalkEvent[] = [
    ...splits
      .filter((s) => {
        const t = s.date.getTime();
        return t > buyTime && t <= asOfTime;
      })
      .map<WalkEvent>((s) => ({ kind: "split", date: s.date, factor: s.factor })),
    ...dividends
      .filter((d) => {
        const t = d.date.getTime();
        return t > buyTime && t <= asOfTime;
      })
      .map<WalkEvent>((d) => ({ kind: "div", date: d.date, amount: d.amount })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const sortedDates = Object.keys(priceHistory).sort();

  const priceOnOrBefore = (target: string): number | null => {
    if (priceHistory[target] !== undefined) return priceHistory[target];
    let last: number | null = null;
    for (const d of sortedDates) {
      if (d > target) break;
      last = priceHistory[d];
    }
    return last;
  };

  for (const ev of events) {
    if (ev.kind === "split") {
      shares *= ev.factor;
      continue;
    }
    const dateStr = ev.date.toISOString().slice(0, 10);
    const cash = shares * ev.amount;
    const reinvestPrice = priceOnOrBefore(dateStr);
    if (reinvestPrice && reinvestPrice > 0) {
      shares += cash / reinvestPrice;
      dividendsReinvested += cash;
    }
  }

  return { shares, dividendsReinvested };
}
