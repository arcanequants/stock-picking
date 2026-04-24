/**
 * Stock split adjustment using Yahoo Finance corporate-action events.
 *
 * The previous heuristic implementation compared buy price to current price
 * and matched against common ratios (2:1, 3:1, etc). That confused real splits
 * with natural 2x-3x stock gains — e.g., ARM doubling was misread as a 1:2
 * reverse split, halving the position's value in our portfolio totals.
 *
 * The new approach fetches actual split events from Yahoo's chart API and
 * applies them deterministically. No heuristic, no false positives.
 */

export interface SplitEvent {
  date: Date;
  factor: number; // numerator / denominator. 2 = 2:1 forward, 0.1 = 1:10 reverse.
  ratio: string; // e.g. "2:1"
}

export type SplitMap = Record<string, SplitEvent[]>;

// We type the yahoo-finance2 client loosely — its real signature is heavily
// overloaded and not worth modelling for a single call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YahooLike = { chart: (symbol: string, opts: any) => Promise<any> };

/**
 * Fetch real split events for a list of tickers from Yahoo Finance.
 * Returns a map ticker → events sorted ascending by date.
 * On failure for any ticker, returns an empty array for that ticker (no adjustment).
 */
export async function fetchSplitMap(
  tickers: string[],
  yf: YahooLike,
  since: Date,
): Promise<SplitMap> {
  const map: SplitMap = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const result = (await yf.chart(ticker, {
          period1: since,
          period2: new Date(),
          events: "split",
          interval: "1d",
        })) as { events?: { splits?: Record<string, { date: Date | number; numerator: number; denominator: number; splitRatio?: string }> } };

        const splits = result?.events?.splits ?? {};
        const events: SplitEvent[] = Object.values(splits)
          .map((s) => ({
            date: s.date instanceof Date ? s.date : new Date(Number(s.date) * 1000),
            factor: s.numerator / s.denominator,
            ratio: s.splitRatio ?? `${s.numerator}:${s.denominator}`,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        map[ticker] = events;
      } catch {
        map[ticker] = [];
      }
    }),
  );

  return map;
}

/**
 * Cumulative split factor for splits that occurred AFTER buyDate.
 * Returns 1 if no splits in window.
 */
export function splitFactorSince(
  splits: SplitEvent[] | undefined,
  buyDate: string | Date,
): number {
  if (!splits || splits.length === 0) return 1;
  const buyTime = (typeof buyDate === "string" ? new Date(buyDate) : buyDate).getTime();
  return splits
    .filter((s) => s.date.getTime() > buyTime)
    .reduce((acc, s) => acc * s.factor, 1);
}

export interface SplitAdjustment {
  detected: boolean;
  factor: number; // cumulative shares-multiplier since buy
  adjustedPrice: number; // buy price normalized to current share class
}

/**
 * Adjusts a buy price to the current post-split share class using real split events.
 * If a 2:1 forward split happened after buy, factor=2, adjustedPrice=buyPrice/2.
 */
export function applySplitAdjustment(
  buyPrice: number,
  buyDate: string | Date,
  splits: SplitEvent[] | undefined,
): SplitAdjustment {
  const factor = splitFactorSince(splits, buyDate);
  return {
    detected: factor !== 1,
    factor,
    adjustedPrice: buyPrice / factor,
  };
}
