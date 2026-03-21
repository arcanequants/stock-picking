import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { getTranslations } from "next-intl/server";
import StocksView from "@/components/StocksView";

export default async function StocksPage() {
  const t = await getTranslations("Stocks");

  // Fetch current prices from latest snapshot
  const { data: snapshots } = await getSupabase()
    .from("portfolio_snapshots")
    .select("prices")
    .order("date", { ascending: false })
    .limit(1);

  const currentPrices: Record<string, number> =
    (snapshots?.[0]?.prices as Record<string, number>) ?? {};

  // Build picks array from transactions
  const tickerCounts: Record<string, number> = {};
  transactions.forEach((tx) => {
    tickerCounts[tx.ticker] = (tickerCounts[tx.ticker] || 0) + 1;
  });

  const picks = transactions.map((tx) => ({
    ticker: tx.ticker,
    pick_number: tx.id,
    buy_price: tx.price,
    date: tx.date,
    type: tx.type,
    picks_count: tickerCounts[tx.ticker],
  }));

  // Latest pick = last transaction
  const lastTx = transactions[transactions.length - 1];
  const latestPick = lastTx
    ? {
        ticker: lastTx.ticker,
        pick_number: lastTx.id,
        buy_price: lastTx.price,
        date: lastTx.date,
        type: lastTx.type,
        picks_count: tickerCounts[lastTx.ticker],
      }
    : null;

  // Unique sectors, regions, countries from active stocks
  const activeStocks = stocks.filter((s) => s.status === "active");
  const sectors = [...new Set(activeStocks.map((s) => s.sector))];
  const regions = [...new Set(activeStocks.map((s) => s.region))];
  const countries = new Set(activeStocks.map((s) => s.country)).size;

  // Map stocks to the StockData shape expected by client component
  const stockData = stocks.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    sector: s.sector,
    region: s.region,
    country: s.country,
    price: s.price,
    pe_forward: s.pe_forward,
    dividend_yield: s.dividend_yield,
    market_cap_b: s.market_cap_b,
    analyst_consensus: s.analyst_consensus,
    analyst_upside: s.analyst_upside,
    summary_short: s.summary_short,
    status: s.status,
  }));

  const labels = {
    title: t("title"),
    subtitle: t("subtitle", { total: stocks.length, active: activeStocks.length }),
    inPortfolio: t("inPortfolio"),
    watchlist: t("watchlist"),
    avoid: t("avoid"),
    positions: t("positions"),
    countriesLabel: t("countriesLabel"),
    lastPick: t("lastPick"),
    daysAgo: t("daysAgo"),
    allLabel: t("allLabel"),
    viewResearch: t("viewResearch"),
    newPick: t("newPick"),
    rebuy: t("rebuy"),
    highConviction: t("highConviction"),
    pe: t("pe"),
    divYield: t("divYield"),
    mktCap: t("mktCap"),
    rating: t("rating"),
    potential: t("potential"),
    statusActive: t("statusActive"),
    statusWatchlist: t("statusWatchlist"),
    statusAvoid: t("statusAvoid"),
    ctaText: t("ctaText"),
    ctaButton: t("ctaButton"),
    apiText: t("apiText"),
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold mb-2">{labels.title}</h1>
        <p className="text-text-muted">{labels.subtitle}</p>
      </section>

      <StocksView
        stocks={stockData}
        picks={picks}
        latestPick={latestPick}
        currentPrices={currentPrices}
        sectors={sectors}
        regions={regions}
        countries={countries}
        labels={labels}
      />
    </div>
  );
}
