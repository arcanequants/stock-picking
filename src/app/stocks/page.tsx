import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { getTranslations } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
import { getRotationSeed, selectVisible, selectShowcase, selectFeatured } from "@/lib/rotation";
import StocksView from "@/components/StocksView";
import NotificationsBanner from "@/components/NotificationsBanner";
import FreeSignupForm from "@/components/FreeSignupForm";

export default async function StocksPage() {
  const t = await getTranslations("Stocks");
  const { isSubscribed } = await getAuthState();

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

  // --- Rotation logic (only matters for free users, but compute always for SSR consistency) ---
  const now = new Date();
  const seed48 = getRotationSeed("48h", now);
  const seed72 = getRotationSeed("72h", now);
  const seed7d = getRotationSeed("7d", now);

  // Which active stocks are visible vs hidden for free users
  const activeData = activeStocks.map((s) => ({ ticker: s.ticker }));
  const { visible: visibleItems, hidden: hiddenItems } = selectVisible(activeData, seed48, 0.3);
  const visibleTickers = new Set(visibleItems.map((i) => i.ticker));

  // Showcase stocks (from visible pool) — full data + research preview
  const showcaseItems = selectShowcase(visibleItems, seed7d, 2);
  const showcaseTickers = new Set(showcaseItems.map((i) => i.ticker));

  // Featured pick — random from active, NOT the latest
  const featuredItem = selectFeatured(activeData, seed72, latestPick?.ticker);

  // Picks this week (for FOMO counter)
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const picksThisWeek = transactions.filter(
    (tx) => new Date(tx.date) >= oneWeekAgo
  ).length;

  // Build showcase research data (only for showcase tickers — minimize data sent to client)
  const showcaseResearch: Record<string, { what: string; whyPreview: string }> = {};
  for (const ticker of showcaseTickers) {
    const stock = stocks.find((s) => s.ticker === ticker);
    if (stock) {
      const firstParagraph = stock.summary_why?.split("\n")[0] || stock.summary_why?.substring(0, 200) || "";
      showcaseResearch[ticker] = {
        what: stock.summary_what || "",
        whyPreview: firstParagraph,
      };
    }
  }

  // Map stocks to the StockData shape expected by client component
  // For free users: don't send financial data for hidden stocks (no data leakage)
  const stockData = stocks.map((s) => {
    const isVisible = isSubscribed || visibleTickers.has(s.ticker) || s.status !== "active";
    return {
      ticker: s.ticker,
      name: isVisible ? s.name : "",
      sector: s.sector,
      region: s.region,
      country: s.country,
      price: isVisible ? s.price : 0,
      pe_forward: isVisible ? s.pe_forward : null,
      dividend_yield: isVisible ? s.dividend_yield : null,
      market_cap_b: isVisible ? s.market_cap_b : null,
      analyst_consensus: isVisible ? s.analyst_consensus : "",
      analyst_upside: isVisible ? s.analyst_upside : null,
      summary_short: isVisible ? s.summary_short : "",
      status: s.status,
    };
  });

  // Featured pick stock data (always send full data for this one card)
  const featuredStock = featuredItem
    ? stocks.find((s) => s.ticker === featuredItem.ticker)
    : null;
  const featuredPickData = featuredStock && featuredItem
    ? {
        ticker: featuredStock.ticker,
        name: featuredStock.name,
        sector: featuredStock.sector,
        region: featuredStock.region,
        summary_short: featuredStock.summary_short,
      }
    : null;

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
    gatingCount: t("gatingCount"),
    gatingText: t("gatingText"),
    shareLabel: t("shareLabel"),
    shareCopied: t("shareCopied"),
    hiddenCount: t("hiddenCount", { count: hiddenItems.length }),
    missedPicks: t("missedPicks", { count: picksThisWeek }),
    returnPositive: t("returnPositive"),
    returnNegative: t("returnNegative"),
    featuredLabel: t("featuredLabel"),
    showcaseLabel: t("showcaseLabel"),
    showcaseWhat: t("showcaseWhat"),
    showcaseWhy: t("showcaseWhy"),
    subscribeForData: t("subscribeForData"),
    lockedTicker: t("lockedTicker"),
    unlockAll: t("unlockAll", { count: activeStocks.length }),
    selectionRotates: t("selectionRotates"),
    verified: t("verified"),
  };

  const f = await getTranslations("FreeSignup");

  return (
    <div className="space-y-10">
      {!isSubscribed && <NotificationsBanner />}

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
        isSubscribed={isSubscribed}
        visibleTickers={[...visibleTickers]}
        showcaseTickers={[...showcaseTickers]}
        showcaseResearch={showcaseResearch}
        featuredPick={featuredPickData}
        hiddenCount={hiddenItems.length}
      />

      {!isSubscribed && (
        <section className="max-w-md mx-auto text-center space-y-3 py-4">
          <p className="text-lg font-semibold text-foreground">{f("stocksTitle")}</p>
          <FreeSignupForm />
        </section>
      )}
    </div>
  );
}
