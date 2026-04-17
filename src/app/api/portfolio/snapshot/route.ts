import { NextResponse } from "next/server";
import { transactions, stocks } from "@/data/stocks";
import { getSupabase } from "@/lib/supabase";
import { aggregatePositions } from "@/lib/position-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/snapshot
 *
 * Minimal portfolio + latest pick payload for iOS widgets and Live Activities.
 * Public (no auth) — same visibility as the portfolio page itself.
 *
 * Response shape is stable and small (~300-500 bytes) so widgets can decode fast:
 *   {
 *     total_return_pct, total_positions, since,
 *     best: { ticker, return_pct }, worst: { ticker, return_pct },
 *     latest_pick: { ticker, name, pick_number, return_pct, date },
 *     market_status: "open" | "closed" | "pre" | "post" | "weekend" | "holiday",
 *     as_of
 *   }
 */
export async function GET() {
  try {
    const { data: snapshots } = await getSupabase()
      .from("portfolio_snapshots")
      .select("prices, date")
      .order("date", { ascending: false })
      .limit(1);

    const latestPrices: Record<string, number> =
      (snapshots?.[0]?.prices as Record<string, number>) ?? {};

    const { positions, totalInvested, totalValue } = aggregatePositions(
      transactions,
      latestPrices
    );

    positions.sort((a, b) => b.return_pct - a.return_pct);

    const totalReturnPct =
      totalInvested > 0
        ? Math.round((((totalValue - totalInvested) / totalInvested) * 100) * 100) / 100
        : 0;

    const best = positions[0];
    const worst = positions[positions.length - 1];

    const latestTx = transactions[transactions.length - 1];
    const latestStock = latestTx
      ? stocks.find((s) => s.ticker === latestTx.ticker)
      : null;
    const latestPrice = latestTx
      ? latestPrices[latestTx.ticker] ?? latestStock?.price ?? latestTx.price
      : 0;
    const latestReturnPct =
      latestTx && latestTx.price > 0
        ? Math.round(((latestPrice - latestTx.price) / latestTx.price) * 10000) / 100
        : 0;

    return NextResponse.json(
      {
        total_return_pct: totalReturnPct,
        total_positions: positions.length,
        since: transactions.length > 0 ? transactions[0].date : null,
        best: best
          ? {
              ticker: best.ticker,
              return_pct: Math.round(best.return_pct * 100) / 100,
            }
          : null,
        worst: worst
          ? {
              ticker: worst.ticker,
              return_pct: Math.round(worst.return_pct * 100) / 100,
            }
          : null,
        latest_pick: latestTx
          ? {
              pick_number: transactions.length,
              ticker: latestTx.ticker,
              name: latestStock?.name ?? latestTx.ticker,
              date: latestTx.date,
              return_pct: latestReturnPct,
            }
          : null,
        market_status: computeMarketStatus(),
        as_of: snapshots?.[0]?.date ?? new Date().toISOString().slice(0, 10),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("portfolio snapshot failed:", err);
    return NextResponse.json({ error: "snapshot_failed" }, { status: 500 });
  }
}

/**
 * Returns US equity market status in America/New_York time.
 * Ignores holidays for now — widgets handle "closed" gracefully either way.
 * Matters: weekend, pre (4-9:30), regular (9:30-16:00), post (16-20), closed.
 */
function computeMarketStatus():
  | "open"
  | "pre"
  | "post"
  | "closed"
  | "weekend" {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(now).reduce<Record<string, string>>(
    (acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    },
    {}
  );
  const weekday = parts.weekday;
  if (weekday === "Sat" || weekday === "Sun") return "weekend";

  const h = parseInt(parts.hour, 10);
  const m = parseInt(parts.minute, 10);
  const minutes = h * 60 + m;

  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) return "pre";
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) return "open";
  if (minutes >= 16 * 60 && minutes < 20 * 60) return "post";
  return "closed";
}
