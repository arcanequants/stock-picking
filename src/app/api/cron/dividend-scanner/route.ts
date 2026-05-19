/**
 * Daily scan: detect dividends paid to the Vectorial Data model portfolio
 * since the last scan, upsert into dividend_events, and emit a portfolio_event
 * (severity 3+) so the notification feed surfaces it.
 *
 * Transparency framing: "El portafolio Vectorial recibió un dividendo de X",
 * NOT "te pagaron". We can't know when each subscriber bought.
 */
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getSupabaseAdmin } from "@/lib/supabase";
import { transactions } from "@/data/stocks";
import { fetchSplitMap } from "@/lib/split-detection";
import { fetchDividendMap } from "@/lib/dividend-detection";
import { walkShares } from "@/lib/shares-walk";
import { createEventWithExplanations } from "@/lib/notifications";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const POSITION_USD = 50;
// Look back 14 days each run — covers weekends, missed crons, and pay-date lag.
const LOOKBACK_DAYS = 14;

interface HistoricalRow {
  date: Date;
  close: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const tickers = [...new Set(transactions.map((t) => t.ticker))];

  const firstDates: Record<string, string> = {};
  for (const t of transactions) {
    if (!firstDates[t.ticker] || t.date < firstDates[t.ticker]) {
      firstDates[t.ticker] = t.date;
    }
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);

  const errors: string[] = [];
  const inserted: string[] = [];
  const eventsEmitted: string[] = [];

  // 1. Pull dividends + splits in the lookback window.
  const [dividendMap, splitMap] = await Promise.all([
    fetchDividendMap(tickers, yahooFinance, since),
    fetchSplitMap(tickers, yahooFinance, since),
  ]);

  // 2. Per ticker: figure out which divs are new, compute shares held, insert.
  for (const ticker of tickers) {
    const divs = dividendMap[ticker] ?? [];
    if (divs.length === 0) continue;

    // Need full split + dividend history (since first transaction) for accurate
    // walkShares — splits/DRIP that happened BEFORE the lookback window still
    // affect today's share count.
    const fullSince = new Date(firstDates[ticker]);
    let fullDividends = divs;
    let fullSplits = splitMap[ticker] ?? [];
    if (fullSince.getTime() < since.getTime()) {
      try {
        const [fullDivMap, fullSplitMap] = await Promise.all([
          fetchDividendMap([ticker], yahooFinance, fullSince),
          fetchSplitMap([ticker], yahooFinance, fullSince),
        ]);
        fullDividends = fullDivMap[ticker] ?? divs;
        fullSplits = fullSplitMap[ticker] ?? fullSplits;
      } catch (e) {
        errors.push(`${ticker} full history: ${e}`);
      }
    }

    // Historical prices for DRIP math (since first transaction).
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const priceHistory: Record<string, number> = {};
    try {
      const rows = (await yahooFinance.historical(ticker, {
        period1: firstDates[ticker],
        period2: tomorrow.toISOString().split("T")[0],
        interval: "1d",
      })) as HistoricalRow[];
      for (const row of rows) {
        const dateStr = new Date(row.date).toISOString().split("T")[0];
        priceHistory[dateStr] = row.close;
      }
    } catch (e) {
      errors.push(`${ticker} prices: ${e}`);
      continue;
    }

    const txs = transactions.filter((t) => t.ticker === ticker);

    for (const div of divs) {
      const exDateStr = div.date.toISOString().split("T")[0];

      // Eligible only if we held shares at this ex-date.
      const eligibleTxs = txs.filter((t) => t.date <= exDateStr);
      if (eligibleTxs.length === 0) continue;

      // Dedup: skip if already in dividend_events.
      const { data: existing } = await supabase
        .from("dividend_events")
        .select("id")
        .eq("ticker", ticker)
        .eq("ex_date", exDateStr)
        .maybeSingle();
      if (existing) continue;

      let totalShares = 0;
      for (const tx of eligibleTxs) {
        const buyPrice = tx.open_price ?? tx.price;
        const { shares } = walkShares({
          investment: POSITION_USD,
          buyPrice,
          buyDate: tx.date,
          asOfDate: exDateStr,
          splits: fullSplits,
          dividends: fullDividends,
          priceHistory,
        });
        totalShares += shares;
      }

      const totalAmount = totalShares * div.amount;
      const amountPerShare = Number(div.amount.toFixed(4));

      const { error: insertErr } = await supabase
        .from("dividend_events")
        .insert({
          ticker,
          ex_date: exDateStr,
          pay_date: null,
          amount_per_share: amountPerShare,
          shares_held: Number(totalShares.toFixed(8)),
          total_amount: Number(totalAmount.toFixed(4)),
        });

      if (insertErr) {
        // Race with another run that inserted the same (ticker, ex_date).
        if (insertErr.code === "23505") continue;
        errors.push(`${ticker} insert ${exDateStr}: ${insertErr.message}`);
        continue;
      }

      inserted.push(`${ticker} ${exDateStr} $${totalAmount.toFixed(2)}`);

      // Emit a notification — only for dividends paid in the last 14d so
      // backfill replays don't spam the feed if this cron is re-run.
      try {
        await createEventWithExplanations({
          ticker,
          event_type: "dividend",
          title_key: "notifications.dividendPaid",
          params: {
            ticker,
            amount: amountPerShare.toFixed(4),
            total: totalAmount.toFixed(2),
            ex_date: exDateStr,
          },
        });
        eventsEmitted.push(`${ticker} ${exDateStr}`);
      } catch (e) {
        errors.push(`${ticker} event ${exDateStr}: ${e}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    scanned_tickers: tickers.length,
    dividends_inserted: inserted.length,
    events_emitted: eventsEmitted.length,
    inserted,
    errors: errors.length > 0 ? errors : undefined,
  });
}
