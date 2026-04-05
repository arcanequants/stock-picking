import { getSupabase } from "@/lib/supabase";
import { stocks, transactions, cycles } from "@/data/stocks";
import { aggregatePositions } from "@/lib/position-utils";

const INVESTMENT_PER_POSITION = 50;

async function getLatestPrices(): Promise<Record<string, number>> {
  const { data: snapshots } = await getSupabase()
    .from("portfolio_snapshots")
    .select("prices")
    .order("date", { ascending: false })
    .limit(1);

  return (snapshots?.[0]?.prices as Record<string, number>) ?? {};
}

export async function getPicksData(limit?: number, tier = "free") {
  const prices = await getLatestPrices();
  const maxPicks = tier === "free" ? 3 : undefined;
  const txs = limit || maxPicks
    ? transactions.slice(-(limit || maxPicks!))
    : transactions;

  return txs.map((tx, idx) => {
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    const currentPrice = prices[tx.ticker] ?? stock?.price ?? tx.price;
    const returnPct = ((currentPrice - tx.price) / tx.price) * 100;

    return {
      pick_number: transactions.indexOf(tx) + 1,
      ticker: tx.ticker,
      name: stock?.name ?? tx.ticker,
      sector: stock?.sector ?? "",
      region: stock?.region ?? "",
      country: stock?.country ?? "",
      price_at_pick: tx.price,
      current_price: Math.round(currentPrice * 100) / 100,
      return_pct: Math.round(returnPct * 100) / 100,
      date: tx.date,
      type: tx.type,
      cycle_number: tx.cycle_number,
      research_url: `/api/v1/research/${tx.ticker}`,
    };
  }).reverse(); // newest first
}

export function getResearchData(ticker: string, tier = "free") {
  const stock = stocks.find(
    (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
  );
  if (!stock) return null;

  // Free tier: basic identification + summary_short only
  const base = {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    industry: stock.industry,
    country: stock.country,
    region: stock.region,
    currency: stock.currency,
    price: stock.price,
    summary_short: stock.summary_short,
    status: stock.status,
    first_researched_at: stock.first_researched_at,
    last_updated_at: stock.last_updated_at,
  };

  if (tier === "free") return base;

  // Pro: add financials + detailed summaries
  const pro = {
    ...base,
    pe_ratio: stock.pe_ratio,
    pe_forward: stock.pe_forward,
    dividend_yield: stock.dividend_yield,
    market_cap_b: stock.market_cap_b,
    eps: stock.eps,
    analyst_consensus: stock.analyst_consensus,
    analyst_target: stock.analyst_target,
    analyst_upside: stock.analyst_upside,
    summary_what: stock.summary_what,
    summary_why: stock.summary_why,
    summary_risk: stock.summary_risk,
  };

  // Enterprise: add full research
  if (tier === "enterprise") {
    return { ...pro, research_full: stock.research_full };
  }

  return pro;
}

export async function getPortfolioSummary() {
  const prices = await getLatestPrices();
  const { totalInvested, totalValue, positions } = aggregatePositions(transactions, prices);

  const totalReturnPct = totalInvested > 0
    ? Math.round((((totalValue - totalInvested) / totalInvested) * 100) * 100) / 100
    : 0;

  return {
    total_return_pct: totalReturnPct,
    total_positions: positions.length,
    total_transactions: transactions.length,
    since: transactions.length > 0 ? transactions[0].date : null,
    current_cycle: cycles.find((c) => c.status === "active") ?? null,
  };
}

export async function getPositions(tier = "free") {
  const prices = await getLatestPrices();
  const { positions, totalInvested, totalValue } = aggregatePositions(transactions, prices);

  positions.sort((a, b) => b.return_pct - a.return_pct);

  // Free tier: top 3 performers only, strip transaction details
  const finalPositions = tier === "free"
    ? positions.slice(0, 3).map(({ transactions: _txs, ...rest }) => rest)
    : positions;

  const totalReturnPct = totalInvested > 0
    ? Math.round((((totalValue - totalInvested) / totalInvested) * 100) * 100) / 100
    : 0;

  return {
    positions: finalPositions,
    total_return_pct: totalReturnPct,
    total_positions: positions.length,
    since: transactions.length > 0 ? transactions[0].date : null,
  };
}

export async function getPortfolioHistory(tier = "free") {
  const { data } = await getSupabase()
    .from("portfolio_snapshots")
    .select("*")
    .order("date", { ascending: true });

  if (!data) return [];

  // Free tier: last 7 days only
  if (tier === "free") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return data.filter((d) => new Date(d.date) >= cutoff);
  }

  return data;
}

export function getSectorAllocation() {
  const sectorMap = new Map<string, number>();
  const tickersSeen = new Set<string>();

  transactions.forEach((tx) => {
    if (tickersSeen.has(tx.ticker)) return;
    tickersSeen.add(tx.ticker);
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    if (!stock) return;
    sectorMap.set(stock.sector, (sectorMap.get(stock.sector) ?? 0) + 1);
  });

  const total = tickersSeen.size;
  return Array.from(sectorMap.entries()).map(([sector, count]) => ({
    sector,
    num_stocks: count,
    pct_of_portfolio: Math.round((count / total) * 10000) / 100,
  })).sort((a, b) => b.num_stocks - a.num_stocks);
}

export function getRegionAllocation() {
  const regionMap = new Map<string, number>();
  const tickersSeen = new Set<string>();

  transactions.forEach((tx) => {
    if (tickersSeen.has(tx.ticker)) return;
    tickersSeen.add(tx.ticker);
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    if (!stock) return;
    regionMap.set(stock.region, (regionMap.get(stock.region) ?? 0) + 1);
  });

  const total = tickersSeen.size;
  return Array.from(regionMap.entries()).map(([region, count]) => ({
    region,
    num_stocks: count,
    pct_of_portfolio: Math.round((count / total) * 10000) / 100,
  })).sort((a, b) => b.num_stocks - a.num_stocks);
}

export function getStocksList(tier = "free") {
  return stocks.map((s) => {
    // Free tier: identification only — no financials
    if (tier === "free") {
      return {
        ticker: s.ticker,
        name: s.name,
        sector: s.sector,
        country: s.country,
        region: s.region,
        status: s.status,
      };
    }

    // Pro/Enterprise: full data
    return {
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      industry: s.industry,
      country: s.country,
      region: s.region,
      currency: s.currency,
      price: s.price,
      pe_ratio: s.pe_ratio,
      pe_forward: s.pe_forward,
      dividend_yield: s.dividend_yield,
      market_cap_b: s.market_cap_b,
      analyst_consensus: s.analyst_consensus,
      analyst_target: s.analyst_target,
      analyst_upside: s.analyst_upside,
      status: s.status,
      summary_short: s.summary_short,
      summary_what: s.summary_what,
      summary_why: s.summary_why,
      summary_risk: s.summary_risk,
    };
  });
}

// --- Events data for API ---

export async function getEventsData(tier = "free", limit?: number) {
  const { getRecentEvents } = await import("@/lib/notifications");
  const maxEvents = tier === "free" ? 3 : (limit || 20);
  const events = await getRecentEvents(maxEvents);

  if (tier === "free") {
    // Strip AI explanations for free tier
    return events.map(({ explanations: _e, ...rest }) => rest);
  }

  return events;
}

// --- Latest digest data for API ---

export async function getDigestLatestData(tier = "free") {
  const { getEventsForDigest } = await import("@/lib/notifications");

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const events = await getEventsForDigest(since);

  // Get weekly performance
  const supabase = getSupabase();
  const { data: latest } = await supabase
    .from("portfolio_snapshots")
    .select("return_pct, date")
    .order("date", { ascending: false })
    .limit(1);

  let portfolio: { weeklyChangePct: number; totalReturnPct: number } | null = null;
  if (latest?.length) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data: weekAgo } = await supabase
      .from("portfolio_snapshots")
      .select("return_pct, date")
      .lte("date", dateStr)
      .order("date", { ascending: false })
      .limit(1);

    const currentReturn = latest[0].return_pct as number;
    const previousReturn = (weekAgo?.[0]?.return_pct as number) ?? 0;

    portfolio = {
      weeklyChangePct: Math.round((currentReturn - previousReturn) * 100) / 100,
      totalReturnPct: Math.round(currentReturn * 100) / 100,
    };
  }

  // Free tier: summary only (counts + portfolio)
  if (tier === "free") {
    return {
      events_count: events.length,
      portfolio,
    };
  }

  // Pro: full events with explanations + portfolio
  return {
    events,
    events_count: events.length,
    portfolio,
  };
}
