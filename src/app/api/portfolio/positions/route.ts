import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { transactions } from "@/data/stocks";
import { aggregatePositions } from "@/lib/position-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: snapshots } = await getSupabase()
      .from("portfolio_snapshots")
      .select("prices, return_pct, date")
      .order("date", { ascending: false })
      .limit(1);

    const latestPrices: Record<string, number> =
      (snapshots?.[0]?.prices as Record<string, number>) ?? {};

    const { positions, totalInvested, totalValue } = aggregatePositions(
      transactions,
      latestPrices,
    );

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
