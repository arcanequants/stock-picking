import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get latest snapshot for current prices
    const { data: snapshots } = await getSupabase()
      .from("portfolio_snapshots")
      .select("prices, return_pct, date")
      .order("date", { ascending: false })
      .limit(1);

    const latestPrices: Record<string, number> =
      (snapshots?.[0]?.prices as Record<string, number>) ?? {};

    const INVESTMENT_PER_POSITION = 50;
    let totalInvested = 0;
    let totalValue = 0;

    const positions = transactions.map((tx) => {
      const stock = stocks.find((s) => s.ticker === tx.ticker);
      const currentPrice =
        latestPrices[tx.ticker] ?? stock?.price ?? tx.price;
      const returnPct = ((currentPrice - tx.price) / tx.price) * 100;
      const daysHeld = Math.ceil(
        (Date.now() - new Date(tx.date + "T00:00:00").getTime()) / 86400000
      );

      const shares = INVESTMENT_PER_POSITION / tx.price;
      totalInvested += INVESTMENT_PER_POSITION;
      totalValue += shares * currentPrice;

      return {
        ticker: tx.ticker,
        name: stock?.name ?? tx.ticker,
        buy_price: tx.price,
        current_price: Math.round(currentPrice * 100) / 100,
        return_pct: Math.round(returnPct * 100) / 100,
        days_held: daysHeld,
        date_bought: tx.date,
      };
    });

    // Sort by return descending (best picks first)
    positions.sort((a, b) => b.return_pct - a.return_pct);

    const totalReturnPct =
      totalInvested > 0
        ? Math.round(
            (((totalValue - totalInvested) / totalInvested) * 100) * 100
          ) / 100
        : 0;

    return NextResponse.json(
      {
        positions,
        total_return_pct: totalReturnPct,
        total_positions: positions.length,
        since: transactions.length > 0 ? transactions[0].date : null,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
