import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

    // Calculate portfolio value
    let totalInvested = 0;
    let totalValue = 0;

    for (const tx of transactions) {
      totalInvested += tx.price;
      totalValue += prices[tx.ticker] ?? tx.price;
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

    return NextResponse.json({
      success: true,
      date: today,
      total_invested: totalInvested,
      total_value: Math.round(totalValue * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      prices,
    });
  } catch (error) {
    console.error("Cron snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
