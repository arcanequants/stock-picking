import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { aggregatePositions } from "@/lib/position-utils";
import { getSplitMap } from "@/lib/split-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ data: snapshots }, splitMap] = await Promise.all([
      getSupabase()
        .from("portfolio_snapshots")
        .select("prices, return_pct, date, position_shares")
        .order("date", { ascending: false })
        .limit(1),
      getSplitMap(),
    ]);

    const latestPrices: Record<string, number> =
      (snapshots?.[0]?.prices as Record<string, number>) ?? {};
    const sharesMap: Record<string, number> =
      (snapshots?.[0]?.position_shares as Record<string, number>) ?? {};

    const { positions, totalInvested, totalValue } = aggregatePositions(
      transactions,
      latestPrices,
      splitMap,
      sharesMap,
    );

    const enriched = positions.map((p) => {
      const stock = stocks.find((s) => s.ticker === p.ticker);
      return {
        ...p,
        sector: stock?.sector ?? "",
        region: stock?.region ?? "",
        country: stock?.country ?? "",
        dividend_yield: stock?.dividend_yield ?? null,
      };
    });

    enriched.sort((a, b) => b.return_pct - a.return_pct);

    const totalReturnPct =
      totalInvested > 0
        ? Math.round(
            (((totalValue - totalInvested) / totalInvested) * 100) * 100
          ) / 100
        : 0;

    const yieldsPresent = enriched
      .map((p) => p.dividend_yield)
      .filter((y): y is number => typeof y === "number");
    const avgDividendYield =
      yieldsPresent.length > 0
        ? Math.round(
            (yieldsPresent.reduce((a, b) => a + b, 0) / yieldsPresent.length) *
              100,
          ) / 100
        : 0;

    const sectorMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    for (const p of enriched) {
      if (p.sector)
        sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + 1);
      if (p.region)
        regionMap.set(p.region, (regionMap.get(p.region) ?? 0) + 1);
    }

    const total = enriched.length;
    const sectorAllocation = Array.from(sectorMap.entries())
      .map(([sector, count]) => ({
        name: sector,
        count,
        pct: Math.round((count / total) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count);
    const regionAllocation = Array.from(regionMap.entries())
      .map(([region, count]) => ({
        name: region,
        count,
        pct: Math.round((count / total) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      {
        positions: enriched,
        total_return_pct: totalReturnPct,
        total_positions: enriched.length,
        avg_dividend_yield: avgDividendYield,
        sector_allocation: sectorAllocation,
        region_allocation: regionAllocation,
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
