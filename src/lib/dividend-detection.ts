export interface DividendEvent {
  date: Date;
  amount: number;
}

export type DividendMap = Record<string, DividendEvent[]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YahooLike = { chart: (symbol: string, opts: any) => Promise<any> };

/**
 * Fetch ex-dividend events per ticker. Amounts are reported as-paid (in the
 * share class current at the dividend date), so chronological walks that
 * interleave with splits give the correct cash + reinvestment math without
 * extra normalization.
 */
export async function fetchDividendMap(
  tickers: string[],
  yf: YahooLike,
  since: Date,
): Promise<DividendMap> {
  const map: DividendMap = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const result = (await yf.chart(ticker, {
          period1: since,
          period2: new Date(),
          events: "div",
          interval: "1d",
        })) as {
          events?: {
            dividends?: Record<
              string,
              { date: Date | number; amount: number }
            >;
          };
        };

        const divs = result?.events?.dividends ?? {};
        const events: DividendEvent[] = Object.values(divs)
          .map((d) => ({
            date:
              d.date instanceof Date
                ? d.date
                : new Date(Number(d.date) * 1000),
            amount: d.amount,
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
