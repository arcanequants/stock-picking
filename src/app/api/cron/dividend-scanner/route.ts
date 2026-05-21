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
import { sendAPNsMany } from "@/lib/apns";

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

  // 3. Fan out new dividend events to per-user ledger.
  // Idempotent: unique(email, ticker, ex_date) prevents dup inserts on re-run.
  const fanoutResult = await fanoutToUsers(supabase, since, errors);

  // 4. Push any pending dividend notifications (notified_at IS NULL).
  const pushResult = await sendPendingDividendPushes(supabase, errors);

  return NextResponse.json({
    success: true,
    scanned_tickers: tickers.length,
    dividends_inserted: inserted.length,
    events_emitted: eventsEmitted.length,
    user_dividends_inserted: fanoutResult.inserted,
    user_pushes_sent: pushResult.sent,
    user_pushes_failed: pushResult.failed,
    inserted,
    errors: errors.length > 0 ? errors : undefined,
  });
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

/**
 * For each dividend_events row inside the lookback window, find every user
 * who held that ticker at ex_date (status='bought' and decided_at on or before
 * the ex_date) and insert a user_dividend_events row keyed by
 * (email, ticker, ex_date). Idempotent — the unique constraint drops dupes.
 */
async function fanoutToUsers(
  supabase: AdminClient,
  since: Date,
  errors: string[],
): Promise<{ inserted: number }> {
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: divEvents, error: divErr } = await supabase
    .from("dividend_events")
    .select("ticker, ex_date, amount_per_share")
    .gte("ex_date", sinceStr);

  if (divErr) {
    errors.push(`fanout fetch dividend_events: ${divErr.message}`);
    return { inserted: 0 };
  }
  if (!divEvents || divEvents.length === 0) return { inserted: 0 };

  let inserted = 0;
  for (const div of divEvents) {
    const { data: holders, error: holdersErr } = await supabase
      .from("user_pick_status")
      .select("email, pick_number, ticker, buy_price, amount_invested, decided_at")
      .eq("ticker", div.ticker)
      .eq("status", "bought")
      .lte("decided_at", `${div.ex_date}T23:59:59Z`);

    if (holdersErr) {
      errors.push(`fanout holders ${div.ticker} ${div.ex_date}: ${holdersErr.message}`);
      continue;
    }
    if (!holders || holders.length === 0) continue;

    for (const h of holders) {
      if (!h.buy_price || !h.amount_invested || h.buy_price <= 0) continue;
      const shares = Number(h.amount_invested) / Number(h.buy_price);
      const total = shares * Number(div.amount_per_share);
      if (total <= 0) continue;

      const { error: insertErr } = await supabase
        .from("user_dividend_events")
        .insert({
          email: h.email,
          ticker: div.ticker,
          pick_number: h.pick_number,
          ex_date: div.ex_date,
          pay_date: null,
          amount_per_share: div.amount_per_share,
          shares_held: Number(shares.toFixed(8)),
          total_amount: Number(total.toFixed(4)),
          buy_price: h.buy_price,
          amount_invested: h.amount_invested,
        });

      if (insertErr) {
        // Dup is expected on re-run.
        if (insertErr.code === "23505") continue;
        errors.push(
          `fanout insert ${h.email} ${div.ticker} ${div.ex_date}: ${insertErr.message}`,
        );
        continue;
      }
      inserted++;
    }
  }

  return { inserted };
}

const MOTIVATION_BODIES = [
  "Sigue invirtiendo. Tus dividendos crecen contigo.",
  "Imagina vivir de tus dividendos.",
  "Tu dinero trabaja mientras duermes.",
  "Cada pick suma. Esto es solo el principio.",
];

function pickMotivationalBody(pickNumber: number): string {
  const day = Math.floor(Date.now() / 86400_000);
  return MOTIVATION_BODIES[(pickNumber + day) % MOTIVATION_BODIES.length];
}

/**
 * Send a push for every user_dividend_events row that hasn't been pushed.
 * One push per dividend — Alberto's call: "no importa el monto, que se vayan
 * emocionando". Dead tokens (410/Unregistered) get is_active=false.
 */
async function sendPendingDividendPushes(
  supabase: AdminClient,
  errors: string[],
): Promise<{ sent: number; failed: number }> {
  if (!process.env.APNS_TEAM_ID) return { sent: 0, failed: 0 };

  const { data: pending, error: pendingErr } = await supabase
    .from("user_dividend_events")
    .select("id, email, ticker, pick_number, total_amount, amount_per_share, shares_held")
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (pendingErr) {
    errors.push(`dividend pushes fetch pending: ${pendingErr.message}`);
    return { sent: 0, failed: 0 };
  }
  if (!pending || pending.length === 0) return { sent: 0, failed: 0 };

  const emails = Array.from(new Set(pending.map((p) => p.email)));
  const { data: tokens } = await supabase
    .from("device_tokens")
    .select("email, token")
    .in("email", emails)
    .eq("platform", "ios")
    .eq("is_active", true);

  const tokensByEmail = new Map<string, string[]>();
  for (const t of tokens ?? []) {
    const list = tokensByEmail.get(t.email) ?? [];
    list.push(t.token);
    tokensByEmail.set(t.email, list);
  }

  const deadTokens: string[] = [];
  let sent = 0;
  let failed = 0;
  const notifiedIds: string[] = [];

  for (const row of pending) {
    const deviceTokens = tokensByEmail.get(row.email) ?? [];
    // Mark notified even if user has no device — otherwise we'd keep retrying
    // forever. The web/iOS app surfaces the dividend regardless of push.
    if (deviceTokens.length === 0) {
      notifiedIds.push(row.id);
      continue;
    }

    const amount = Number(row.total_amount);
    const title = `💸 $${row.ticker} te pagó $${amount.toFixed(2)}`;
    const body = pickMotivationalBody(row.pick_number);

    const results = await sendAPNsMany(deviceTokens, {
      aps: {
        alert: { title, body },
        sound: "default",
        "thread-id": "dividends",
      },
      ticker: row.ticker,
      pick_number: row.pick_number,
      kind: "dividend_paid",
    });

    let anyOk = false;
    for (const r of results) {
      if (r.ok) {
        sent++;
        anyOk = true;
      } else {
        failed++;
        if (r.status === 410 || r.reason === "Unregistered") {
          deadTokens.push(r.token);
        }
      }
    }
    // Even if all devices were dead, flip notified_at so we don't retry forever.
    notifiedIds.push(row.id);
    void anyOk;
  }

  if (notifiedIds.length > 0) {
    const { error: updErr } = await supabase
      .from("user_dividend_events")
      .update({ notified_at: new Date().toISOString() })
      .in("id", notifiedIds);
    if (updErr) errors.push(`mark notified: ${updErr.message}`);
  }

  if (deadTokens.length > 0) {
    await supabase
      .from("device_tokens")
      .update({ is_active: false })
      .in("token", deadTokens);
  }

  return { sent, failed };
}
