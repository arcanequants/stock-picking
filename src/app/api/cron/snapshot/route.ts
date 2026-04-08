import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { createEventWithExplanations } from "@/lib/notifications";
import { adjustPriceForSplit } from "@/lib/split-detection";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Skip weekends (markets closed) — safety guard even though cron is Mon-Fri
    const utcDay = new Date().getUTCDay();
    if (utcDay === 0 || utcDay === 6) {
      return NextResponse.json({ message: "Skipped: market closed on weekends" });
    }

    // Get unique tickers from active transactions
    const activeTickers = [
      ...new Set(transactions.map((t) => t.ticker)),
    ];

    if (activeTickers.length === 0) {
      return NextResponse.json({ message: "No active positions to track" });
    }

    // Fetch current prices from Yahoo Finance
    const prices: Record<string, number> = {};
    for (const ticker of activeTickers) {
      try {
        const quote = await yahooFinance.quote(ticker) as Record<string, unknown>;
        const price = quote.regularMarketPrice as number | undefined;
        if (price) {
          prices[ticker] = price;
        }
      } catch {
        // If Yahoo fails for a ticker, use the static price from stocks.ts
        const stock = stocks.find((s) => s.ticker === ticker);
        if (stock) prices[ticker] = stock.price;
      }
    }

    // Calculate portfolio value ($50 per position)
    const INVESTMENT_PER_POSITION = 50;
    let totalInvested = 0;
    let totalValue = 0;
    const splitEvents: { ticker: string; ratio: number; original: number; adjusted: number }[] = [];

    for (const tx of transactions) {
      const currentPrice = prices[tx.ticker] ?? tx.price;
      const { detected, splitRatio, adjustedPrice } = adjustPriceForSplit(tx.price, currentPrice);

      if (detected) {
        splitEvents.push({ ticker: tx.ticker, ratio: splitRatio, original: tx.price, adjusted: adjustedPrice });
      }

      const shares = INVESTMENT_PER_POSITION / adjustedPrice;
      totalInvested += INVESTMENT_PER_POSITION;
      totalValue += shares * currentPrice;
    }

    const returnPct =
      totalInvested > 0
        ? ((totalValue - totalInvested) / totalInvested) * 100
        : 0;

    const today = new Date().toISOString().split("T")[0];

    // Upsert snapshot (update if date exists, insert if not)
    const { error } = await getSupabaseAdmin()
      .from("portfolio_snapshots")
      .upsert(
        {
          date: today,
          total_invested: totalInvested,
          total_value: totalValue,
          return_pct: Math.round(returnPct * 100) / 100,
          prices,
        },
        { onConflict: "date" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- Price move detection (>3% daily change) ---
    const priceMoveEvents: string[] = [];
    try {
      const { data: prevSnapshots } = await getSupabaseAdmin()
        .from("portfolio_snapshots")
        .select("prices")
        .order("date", { ascending: false })
        .neq("date", today)
        .limit(1);

      const prevPrices = (prevSnapshots?.[0]?.prices as Record<string, number>) ?? {};

      for (const ticker of activeTickers) {
        const curr = prices[ticker];
        const prev = prevPrices[ticker];
        if (!curr || !prev || prev === 0) continue;

        const changePct = ((curr - prev) / prev) * 100;
        if (Math.abs(changePct) >= 3) {
          const isUp = changePct > 0;
          await createEventWithExplanations({
            ticker,
            event_type: "price_move",
            title_key: isUp ? "notifications.priceUp" : "notifications.priceDown",
            params: {
              ticker,
              pct: Math.abs(changePct).toFixed(1),
            },
          });
          priceMoveEvents.push(`${ticker}: ${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%`);
        }
      }
    } catch (e) {
      console.error("Price move detection error:", e);
    }

    return NextResponse.json({
      success: true,
      date: today,
      total_invested: totalInvested,
      total_value: Math.round(totalValue * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      prices,
      price_move_events: priceMoveEvents,
      split_events: splitEvents,
    });
  } catch (error) {
    console.error("Cron snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
