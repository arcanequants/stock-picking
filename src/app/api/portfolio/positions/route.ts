import { NextResponse } from "next/server";
import { getAuthedUser, getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { aggregatePositions } from "@/lib/position-utils";
import { getSplitMap } from "@/lib/split-cache";

export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/positions
 *
 * Two views, controlled by `?view=`:
 *
 *   - `model` (default, unauthed OK) — Vectorial's official $50-per-pick
 *     model portfolio. The track record. Unchanged behavior, cached.
 *
 *   - `personal` — only picks the authed user marked as bought, valued
 *     at the price + amount they actually entered in the mini-sheet.
 *     Requires Bearer auth. Never cached.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") === "personal" ? "personal" : "model";

  if (view === "personal") {
    return personalView(request);
  }
  return modelView(request);
}

async function modelView(request: Request) {
  try {
    // Subscribers get the full portfolio. Everyone else (unauthed or free)
    // gets the same teaser the web shows: the top 3 positions plus the worst
    // one (both already public via /api/portfolio/snapshot) — never the full
    // pick list or the sector/region weights. The track record total stays
    // public: that's the marketing.
    let isSubscribed = false;
    const authed = await getAuthedUser(request);
    if (authed) {
      const { data: sub } = await getSupabaseAdmin()
        .from("subscribers")
        .select("subscription_status")
        .eq("email", authed.email)
        .maybeSingle();
      const st = sub?.subscription_status;
      isSubscribed = st === "active" || st === "trialing";
    }
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

    if (!isSubscribed) {
      const FREE_PREVIEW_COUNT = 3;
      const teaser = enriched.slice(0, FREE_PREVIEW_COUNT);
      const last = enriched[enriched.length - 1];
      const worst =
        last && last.return_pct < 0 && !teaser.some((p) => p.ticker === last.ticker)
          ? { ticker: last.ticker, return_pct: last.return_pct, days_held: last.days_held }
          : null;
      return NextResponse.json(
        {
          view: "model",
          limited: true,
          positions: teaser,
          worst,
          total_return_pct: totalReturnPct,
          total_positions: enriched.length,
          avg_dividend_yield: avgDividendYield,
          since: transactions.length > 0 ? transactions[0].date : null,
        },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    const { sectorAllocation, regionAllocation } = computeAllocations(enriched);

    return NextResponse.json(
      {
        view: "model",
        positions: enriched,
        total_return_pct: totalReturnPct,
        total_positions: enriched.length,
        avg_dividend_yield: avgDividendYield,
        sector_allocation: sectorAllocation,
        region_allocation: regionAllocation,
        since: transactions.length > 0 ? transactions[0].date : null,
      },
      {
        // Full payload varies by auth — never let a CDN serve it to free users.
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

async function personalView(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const [{ data: snapshots }, { data: bought }, { data: priorRaw }] = await Promise.all([
    getSupabase()
      .from("portfolio_snapshots")
      .select("prices, date")
      .order("date", { ascending: false })
      .limit(1),
    admin
      .from("user_pick_status")
      .select("pick_number, ticker, buy_price, amount_invested, decided_at")
      .eq("email", authed.email)
      .eq("status", "bought"),
    admin
      .from("prior_holdings")
      .select("ticker, buy_price, amount_invested, purchase_date")
      .eq("email", authed.email),
  ]);

  const latestPrices: Record<string, number> =
    (snapshots?.[0]?.prices as Record<string, number>) ?? {};

  type Row = {
    pick_number: number;
    ticker: string;
    buy_price: number;
    amount_invested: number;
    decided_at: string;
    /// "vectorial" for picks bought through the app; "prior" for pre-Vectorial
    /// holdings the user entered manually. Used to display position metadata
    /// honestly ("includes prior holdings") without changing how shares are
    /// summed.
    source: "vectorial" | "prior";
  };
  // Prior holdings shape-match user_pick_status rows so the aggregation
  // below treats them uniformly. The synthetic pick_number=0 keeps the
  // type happy; we never key off it for prior rows.
  const priorRows: Row[] = ((priorRaw ?? []) as Array<{
    ticker: string;
    buy_price: number;
    amount_invested: number;
    purchase_date: string;
  }>).map((p) => ({
    pick_number: 0,
    ticker: p.ticker,
    buy_price: Number(p.buy_price),
    amount_invested: Number(p.amount_invested),
    decided_at: `${p.purchase_date}T00:00:00Z`,
    source: "prior",
  }));
  const vectorialRows: Row[] = ((bought ?? []) as Omit<Row, "source">[]).map(
    (r) => ({ ...r, source: "vectorial" })
  );
  const rows: Row[] = [...vectorialRows, ...priorRows];

  // Group user's bought rows by ticker. Each row already carries the price and
  // amount the user told us — no $50 default, no open-price math.
  const byTicker = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byTicker.get(r.ticker) ?? [];
    arr.push(r);
    byTicker.set(r.ticker, arr);
  }

  let totalInvested = 0;
  let totalValue = 0;
  let totalPriorInvested = 0;

  const positions = Array.from(byTicker.entries()).map(([ticker, txs]) => {
    const stock = stocks.find((s) => s.ticker === ticker);
    const currentPrice = latestPrices[ticker] ?? stock?.price ?? txs[0].buy_price;

    let posInvested = 0;
    let posShares = 0;
    let posPriorInvested = 0;
    for (const t of txs) {
      const shares = t.amount_invested / t.buy_price;
      posInvested += t.amount_invested;
      posShares += shares;
      if (t.source === "prior") posPriorInvested += t.amount_invested;
    }
    const posValue = posShares * currentPrice;
    const returnPct =
      posInvested > 0 ? ((posValue - posInvested) / posInvested) * 100 : 0;
    const avgPrice = posShares > 0 ? posInvested / posShares : 0;

    const dates = txs.map((t) => t.decided_at).sort();
    const firstBought = dates[0]?.slice(0, 10) ?? "";
    const lastBought = dates[dates.length - 1]?.slice(0, 10) ?? "";
    const daysHeld = firstBought
      ? Math.ceil(
          (Date.now() - new Date(firstBought + "T00:00:00").getTime()) /
            86400000,
        )
      : 0;

    const priorCount = txs.filter((t) => t.source === "prior").length;
    const vectorialCount = txs.length - priorCount;

    totalInvested += posInvested;
    totalValue += posValue;
    totalPriorInvested += posPriorInvested;

    return {
      ticker,
      name: stock?.name ?? ticker,
      buys: vectorialCount,
      prior_count: priorCount,
      has_prior: priorCount > 0,
      total_invested: Math.round(posInvested * 100) / 100,
      total_prior_invested: Math.round(posPriorInvested * 100) / 100,
      total_shares: Math.round(posShares * 10000) / 10000,
      avg_price: Math.round(avgPrice * 100) / 100,
      current_price: Math.round(currentPrice * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      first_bought: firstBought,
      last_bought: lastBought,
      days_held: daysHeld,
      sector: stock?.sector ?? "",
      region: stock?.region ?? "",
      country: stock?.country ?? "",
      dividend_yield: stock?.dividend_yield ?? null,
    };
  });

  positions.sort((a, b) => b.return_pct - a.return_pct);

  const totalReturnPct =
    totalInvested > 0
      ? Math.round(
          (((totalValue - totalInvested) / totalInvested) * 100) * 100,
        ) / 100
      : 0;

  const yieldsPresent = positions
    .map((p) => p.dividend_yield)
    .filter((y): y is number => typeof y === "number");
  const avgDividendYield =
    yieldsPresent.length > 0
      ? Math.round(
          (yieldsPresent.reduce((a, b) => a + b, 0) / yieldsPresent.length) *
            100,
        ) / 100
      : 0;

  const { sectorAllocation, regionAllocation } = computeAllocations(positions);

  const firstDecidedAt = rows
    .map((r) => r.decided_at)
    .sort()[0]
    ?.slice(0, 10) ?? null;

  return NextResponse.json({
    view: "personal",
    positions,
    total_return_pct: totalReturnPct,
    total_positions: positions.length,
    total_invested: Math.round(totalInvested * 100) / 100,
    total_prior_invested: Math.round(totalPriorInvested * 100) / 100,
    has_prior_holdings: totalPriorInvested > 0,
    avg_dividend_yield: avgDividendYield,
    sector_allocation: sectorAllocation,
    region_allocation: regionAllocation,
    since: firstDecidedAt,
  });
}

function computeAllocations(
  positions: { sector: string; region: string }[],
) {
  const sectorMap = new Map<string, number>();
  const regionMap = new Map<string, number>();
  for (const p of positions) {
    if (p.sector)
      sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + 1);
    if (p.region)
      regionMap.set(p.region, (regionMap.get(p.region) ?? 0) + 1);
  }
  const total = positions.length;
  const sectorAllocation = Array.from(sectorMap.entries())
    .map(([sector, count]) => ({
      name: sector,
      count,
      pct: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
  const regionAllocation = Array.from(regionMap.entries())
    .map(([region, count]) => ({
      name: region,
      count,
      pct: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
  return { sectorAllocation, regionAllocation };
}
