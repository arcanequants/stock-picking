"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface StockData {
  ticker: string;
  name: string;
  sector: string;
  region: string;
  country: string;
  price: number;
  pe_forward: number | null;
  dividend_yield: number | null;
  market_cap_b: number | null;
  analyst_consensus: string;
  analyst_upside: number | null;
  summary_short: string;
  status: string;
}

interface PickInfo {
  ticker: string;
  pick_number: number;
  buy_price: number;
  date: string;
  type: string;
  picks_count: number;
}

interface FeaturedPickData {
  ticker: string;
  name: string;
  sector: string;
  region: string;
  summary_short: string;
}

interface Props {
  stocks: StockData[];
  picks: PickInfo[];
  latestPick: PickInfo | null;
  currentPrices: Record<string, number>;
  sectors: string[];
  regions: string[];
  countries: number;
  isSubscribed: boolean;
  visibleTickers: string[];
  showcaseTickers: string[];
  showcaseResearch: Record<string, { what: string; whyPreview: string }>;
  featuredPick: FeaturedPickData | null;
  hiddenCount: number;
  labels: {
    title: string;
    subtitle: string;
    inPortfolio: string;
    watchlist: string;
    avoid: string;
    positions: string;
    countriesLabel: string;
    lastPick: string;
    daysAgo: string;
    allLabel: string;
    viewResearch: string;
    newPick: string;
    rebuy: string;
    highConviction: string;
    pe: string;
    divYield: string;
    mktCap: string;
    rating: string;
    potential: string;
    statusActive: string;
    statusWatchlist: string;
    statusAvoid: string;
    ctaText: string;
    ctaButton: string;
    gatingCount: string;
    gatingText: string;
    shareLabel: string;
    shareCopied: string;
    hiddenCount: string;
    missedPicks: string;
    returnPositive: string;
    returnNegative: string;
    featuredLabel: string;
    showcaseLabel: string;
    showcaseWhat: string;
    showcaseWhy: string;
    subscribeForData: string;
    lockedTicker: string;
    unlockAll: string;
    selectionRotates: string;
  };
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    let frame: number;
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>{displayed}{suffix}</span>;
}

export default function StocksView({
  stocks, picks, latestPick, currentPrices, sectors, regions, countries, labels,
  isSubscribed, visibleTickers, showcaseTickers, showcaseResearch, featuredPick, hiddenCount,
}: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [showCta, setShowCta] = useState(false);
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [shareMsg, setShareMsg] = useState("");

  const visibleSet = new Set(visibleTickers);
  const showcaseSet = new Set(showcaseTickers);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: labels.title, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg(labels.shareCopied);
      setTimeout(() => setShareMsg(""), 2000);
    }
  };

  const daysSinceLastPick = latestPick
    ? Math.ceil((Date.now() - new Date(latestPick.date + "T00:00:00").getTime()) / 86400000)
    : 0;

  const active = stocks.filter((s) => s.status === "active");
  const watchlist = stocks.filter((s) => s.status === "watchlist");
  const avoid = stocks.filter((s) => s.status === "avoid");

  const filterStocks = (list: StockData[]) => {
    if (filter === "all") return list;
    return list.filter((s) => s.sector === filter || s.region === filter);
  };

  const getPickInfo = (ticker: string): PickInfo | undefined =>
    picks.find((p) => p.ticker === ticker);

  const getReturn = (ticker: string): number | null => {
    const pick = picks.find((p) => p.ticker === ticker);
    if (!pick) return null;
    const current = currentPrices[ticker];
    if (!current) return null;
    return Math.round(((current - pick.buy_price) / pick.buy_price) * 10000) / 100;
  };

  const latestStock = latestPick ? stocks.find((s) => s.ticker === latestPick.ticker) : null;
  const latestReturn = latestPick ? getReturn(latestPick.ticker) : null;

  // Scroll detection for sticky CTA (free users only)
  useEffect(() => {
    if (isSubscribed) return;
    const handleScroll = () => {
      if (window.scrollY > 600 && !ctaDismissed) setShowCta(true);
      else if (window.scrollY < 300) setShowCta(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [ctaDismissed, isSubscribed]);

  // Intersection observer for card reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("revealed");
        });
      },
      { threshold: 0.1 }
    );
    const cards = document.querySelectorAll(".stock-card-reveal");
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [filter]);

  const statusLabels: Record<string, string> = {
    active: labels.statusActive,
    watchlist: labels.statusWatchlist,
    avoid: labels.statusAvoid,
  };

  const filterOptions = ["all", ...sectors, ...regions];

  // Categorize active stocks for free users
  const filteredActive = filterStocks(active);
  const showcaseCards = filteredActive.filter((s) => showcaseSet.has(s.ticker));
  const partialCards = filteredActive.filter((s) => visibleSet.has(s.ticker) && !showcaseSet.has(s.ticker));
  const lockedCards = filteredActive.filter((s) => !visibleSet.has(s.ticker));

  // ========== RENDER HELPERS ==========

  /** Full card — all data visible (premium users, or showcase cards) */
  const renderFullCard = (stock: StockData, idx: number, isShowcase = false) => {
    const pickInfo = getPickInfo(stock.ticker);
    const returnPct = getReturn(stock.ticker);
    const isLatest = stock.ticker === latestPick?.ticker;
    const research = isShowcase ? showcaseResearch[stock.ticker] : null;

    return (
      <Link href={`/stocks/${stock.ticker}`} key={stock.ticker}>
        <div
          className={`stock-card-reveal opacity-0 translate-y-5 border rounded-xl p-5 hover:border-border-secondary transition-all hover:bg-card-hover cursor-pointer group card-hover ${
            isShowcase ? "border-brand/30 ring-1 ring-brand/10" : isLatest ? "border-brand/30" : "border-border"
          }`}
          style={{ transitionDelay: `${idx * 50}ms`, transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, background 0.2s" }}
        >
          {isShowcase && (
            <div className="mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand/20 text-brand-text border border-brand-border">
                {labels.showcaseLabel}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground group-hover:text-brand-text transition-colors">
                  {stock.ticker}
                </h3>
                {pickInfo && pickInfo.picks_count > 1 && (
                  <span className="flex items-center gap-0.5" title={`${pickInfo.picks_count} ${labels.highConviction}`}>
                    {Array.from({ length: pickInfo.picks_count }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand" />
                    ))}
                  </span>
                )}
                {pickInfo && daysSinceLastPick <= 7 && isLatest && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand/20 text-brand-text border border-brand-border text-[10px] font-bold">
                    {labels.newPick}
                  </span>
                )}
                {pickInfo && pickInfo.type === "rebuy" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                    {labels.rebuy}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted">{stock.name}</p>
            </div>
            <div className="text-right">
              {returnPct !== null ? (
                <p className={`text-lg font-mono font-bold ${returnPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
                </p>
              ) : (
                <p className="text-lg font-mono font-bold text-foreground">${stock.price?.toFixed(2)}</p>
              )}
              {stock.analyst_upside != null && (
                <p className={`text-xs font-mono ${stock.analyst_upside > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {stock.analyst_upside > 0 ? "+" : ""}{stock.analyst_upside}% {labels.potential}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-4 line-clamp-2">{stock.summary_short}</p>

          {/* Research preview for showcase */}
          {isShowcase && research && (
            <div className="mb-4 space-y-2 border-t border-border pt-3">
              <div>
                <p className="text-xs font-bold text-text-faint uppercase mb-1">{labels.showcaseWhat}</p>
                <p className="text-sm text-text-secondary line-clamp-2">{research.what}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-text-faint uppercase mb-1">{labels.showcaseWhy}</p>
                <p className="text-sm text-text-secondary line-clamp-3">{research.whyPreview}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 text-center">
            <div><p className="text-xs text-text-faint">{labels.pe}</p><p className="text-sm font-mono text-text-secondary">{stock.pe_forward?.toFixed(1) || "—"}</p></div>
            <div><p className="text-xs text-text-faint">{labels.divYield}</p><p className="text-sm font-mono text-text-secondary">{stock.dividend_yield ? `${stock.dividend_yield}%` : "—"}</p></div>
            <div><p className="text-xs text-text-faint">{labels.mktCap}</p><p className="text-sm font-mono text-text-secondary">{stock.market_cap_b ? `$${stock.market_cap_b}B` : "—"}</p></div>
            <div><p className="text-xs text-text-faint">{labels.rating}</p><p className="text-sm font-mono text-text-secondary">{stock.analyst_consensus || "—"}</p></div>
          </div>

          <div className="mt-3 flex gap-2">
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.sector}</span>
            <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.region}</span>
          </div>
        </div>
      </Link>
    );
  };

  /** Partial card — ticker, name, sector, region, return direction only */
  const renderPartialCard = (stock: StockData, idx: number) => {
    const returnPct = getReturn(stock.ticker);
    const isPositive = returnPct !== null ? returnPct >= 0 : true;

    return (
      <div
        key={stock.ticker}
        className="stock-card-reveal opacity-0 translate-y-5 border border-border rounded-xl p-5 transition-all card-hover"
        style={{ transitionDelay: `${idx * 50}ms`, transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, background 0.2s" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">{stock.ticker}</h3>
            <p className="text-sm text-text-muted">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-mono font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {isPositive ? "▲" : "▼"} {isPositive ? labels.returnPositive : labels.returnNegative}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center mb-3">
          <div><p className="text-xs text-text-faint">{labels.pe}</p><p className="text-sm"><span className="data-placeholder w-10" /></p></div>
          <div><p className="text-xs text-text-faint">{labels.divYield}</p><p className="text-sm"><span className="data-placeholder w-8" /></p></div>
          <div><p className="text-xs text-text-faint">{labels.mktCap}</p><p className="text-sm"><span className="data-placeholder w-12" /></p></div>
          <div><p className="text-xs text-text-faint">{labels.rating}</p><p className="text-sm"><span className="data-placeholder w-10" /></p></div>
        </div>

        <p className="text-xs text-text-faint text-center">{labels.subscribeForData}</p>

        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.sector}</span>
          <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.region}</span>
        </div>
      </div>
    );
  };

  /** Locked card — glassmorphism blur, no real data */
  const renderLockedCard = (idx: number) => (
    <div
      key={`locked-${idx}`}
      className="stock-card-reveal opacity-0 translate-y-5 stock-card-locked border border-border rounded-xl p-5"
      style={{ transitionDelay: `${idx * 50}ms`, transition: "opacity 0.5s ease, transform 0.5s ease" }}
    >
      <div className="stock-card-locked-inner">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">ABCD</h3>
            <p className="text-sm text-text-muted">Company Name Holdings</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-foreground">+0.0%</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-4">Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod.</p>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div><p className="text-xs text-text-faint">P/E</p><p className="text-sm font-mono text-text-secondary">15.6</p></div>
          <div><p className="text-xs text-text-faint">Div</p><p className="text-sm font-mono text-text-secondary">2.1%</p></div>
          <div><p className="text-xs text-text-faint">Cap</p><p className="text-sm font-mono text-text-secondary">$50B</p></div>
          <div><p className="text-xs text-text-faint">Rating</p><p className="text-sm font-mono text-text-secondary">Buy</p></div>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">Sector</span>
          <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">Region</span>
        </div>
      </div>
      <div className="stock-card-locked-overlay">
        <div className="flex items-center gap-2 text-text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-sm font-medium">{labels.lockedTicker}</span>
        </div>
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========

  return (
    <div className="space-y-8">
      {/* Stats Strip — ALWAYS visible */}
      <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-text-muted">
            <span className="font-bold text-foreground"><AnimatedNumber value={active.length} /></span> {labels.positions}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-brand rounded-full" />
          <span className="text-text-muted">
            <span className="font-bold text-foreground"><AnimatedNumber value={countries} /></span> {labels.countriesLabel}
          </span>
        </div>
        {latestPick && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-text-muted">
              {labels.lastPick}: {isSubscribed ? (
                <span className="font-bold text-foreground">{latestPick.ticker}</span>
              ) : (
                <span className="font-bold text-foreground">🔒</span>
              )} · {daysSinceLastPick}{labels.daysAgo}
            </span>
          </div>
        )}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-text-muted hover:text-foreground transition-colors ml-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span className="text-xs">{shareMsg || labels.shareLabel}</span>
        </button>
      </div>

      {/* ========== HERO CARD ========== */}
      {isSubscribed ? (
        /* Premium: Latest Pick hero (as before) */
        latestStock && latestPick && (
          <Link href={`/stocks/${latestPick.ticker}`} className="block">
            <div className="relative border-2 border-brand/40 rounded-2xl p-6 md:p-8 hover:border-brand/60 transition-all cursor-pointer group overflow-hidden cta-glow">
              <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-emerald-500/5 pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand/20 text-brand-text border border-brand-border animate-pulse">
                      PICK #{latestPick.pick_number}
                    </span>
                    <span className="text-xs text-text-faint">
                      {new Date(latestPick.date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {latestPick.type === "rebuy" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {labels.rebuy}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold group-hover:text-brand-text transition-colors">
                    {latestPick.ticker} <span className="text-text-muted font-normal text-lg">— {latestStock.name}</span>
                  </h2>
                  <p className="text-sm text-text-secondary mt-1 max-w-xl">{latestStock.summary_short}</p>
                </div>
                <div className="text-left md:text-right flex-shrink-0">
                  {latestReturn !== null && (
                    <p className={`text-3xl font-mono font-bold ${latestReturn >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {latestReturn >= 0 ? "+" : ""}{latestReturn.toFixed(1)}%
                    </p>
                  )}
                  <p className="text-sm text-text-muted mt-1">{labels.viewResearch} →</p>
                </div>
              </div>
            </div>
          </Link>
        )
      ) : (
        /* Free: Featured Pick (random, not latest) */
        featuredPick && (
          <div className="relative border-2 border-brand/40 rounded-2xl p-6 md:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-emerald-500/5 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand/20 text-brand-text border border-brand-border">
                    {labels.featuredLabel}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {featuredPick.ticker} <span className="text-text-muted font-normal text-lg">— {featuredPick.name}</span>
                </h2>
                <p className="text-sm text-text-secondary mt-1 max-w-xl">{featuredPick.summary_short}</p>
              </div>
              <div className="text-left md:text-right flex-shrink-0">
                {(() => {
                  const ret = getReturn(featuredPick.ticker);
                  const positive = ret !== null ? ret >= 0 : true;
                  return (
                    <p className={`text-2xl font-mono font-bold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {positive ? "▲" : "▼"} {positive ? labels.returnPositive : labels.returnNegative}
                    </p>
                  );
                })()}
                <p className="text-xs text-text-faint mt-1">{labels.selectionRotates}</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === opt
                ? "bg-brand text-white border-brand"
                : "bg-transparent text-text-muted border-border hover:border-border-secondary hover:text-foreground"
            }`}
          >
            {opt === "all" ? labels.allLabel : opt}
          </button>
        ))}
      </div>

      {/* ========== ACTIVE POSITIONS ========== */}
      {filteredActive.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
            {labels.inPortfolio} ({filteredActive.length})
          </h2>
          <div ref={cardsRef} className="grid md:grid-cols-2 gap-4">
            {isSubscribed ? (
              /* PREMIUM: all cards, full data */
              filteredActive.map((stock, idx) => renderFullCard(stock, idx))
            ) : (
              <>
                {/* FREE: Showcase cards (full data + research preview) */}
                {showcaseCards.map((stock, idx) => renderFullCard(stock, idx, true))}

                {/* FREE: Partial cards (ticker, name, direction only) */}
                {partialCards.map((stock, idx) => renderPartialCard(stock, showcaseCards.length + idx))}

                {/* FREE: Locked cards (blurred placeholders) */}
                {lockedCards.map((_, idx) => renderLockedCard(showcaseCards.length + partialCards.length + idx))}

                {/* FOMO Counter */}
                {hiddenCount > 0 && (
                  <div className="col-span-full border border-border-secondary rounded-xl p-4 flex items-center justify-between bg-card-hover/50">
                    <div className="flex items-center gap-3 text-sm text-text-muted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>{labels.hiddenCount} · {labels.missedPicks}</span>
                    </div>
                    <Link
                      href="/join"
                      className="bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {labels.unlockAll}
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ========== WATCHLIST & AVOID — Premium only ========== */}
      {isSubscribed && filterStocks(watchlist).length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full" />
            {labels.watchlist} ({filterStocks(watchlist).length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {filterStocks(watchlist).map((stock, idx) => (
              <Link href={`/stocks/${stock.ticker}`} key={stock.ticker}>
                <div
                  className="stock-card-reveal opacity-0 translate-y-5 border border-border rounded-xl p-5 hover:border-border-secondary transition-all hover:bg-card-hover cursor-pointer group card-hover"
                  style={{ transitionDelay: `${idx * 50}ms`, transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, background 0.2s" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-brand-text transition-colors">{stock.ticker}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30`}>{statusLabels[stock.status]}</span>
                      </div>
                      <p className="text-sm text-text-muted">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-bold text-foreground">${stock.price?.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">{stock.summary_short}</p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div><p className="text-xs text-text-faint">{labels.pe}</p><p className="text-sm font-mono text-text-secondary">{stock.pe_forward?.toFixed(1) || "—"}</p></div>
                    <div><p className="text-xs text-text-faint">{labels.divYield}</p><p className="text-sm font-mono text-text-secondary">{stock.dividend_yield ? `${stock.dividend_yield}%` : "—"}</p></div>
                    <div><p className="text-xs text-text-faint">{labels.mktCap}</p><p className="text-sm font-mono text-text-secondary">{stock.market_cap_b ? `$${stock.market_cap_b}B` : "—"}</p></div>
                    <div><p className="text-xs text-text-faint">{labels.rating}</p><p className="text-sm font-mono text-text-secondary">{stock.analyst_consensus || "—"}</p></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.sector}</span>
                    <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.region}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isSubscribed && filterStocks(avoid).length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            {labels.avoid} ({filterStocks(avoid).length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {filterStocks(avoid).map((stock, idx) => (
              <Link href={`/stocks/${stock.ticker}`} key={stock.ticker}>
                <div
                  className="stock-card-reveal opacity-0 translate-y-5 border border-border rounded-xl p-5 hover:border-border-secondary transition-all hover:bg-card-hover cursor-pointer group card-hover"
                  style={{ transitionDelay: `${idx * 50}ms`, transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, background 0.2s" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-brand-text transition-colors">{stock.ticker}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30`}>{statusLabels[stock.status]}</span>
                      </div>
                      <p className="text-sm text-text-muted">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-bold text-foreground">${stock.price?.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">{stock.summary_short}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.sector}</span>
                    <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">{stock.region}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky CTA — Free users only */}
      {!isSubscribed && showCta && !ctaDismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-background border border-brand/30 rounded-xl p-4 shadow-lg flex items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">{labels.ctaText}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/join"
                className="bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                {labels.ctaButton}
              </Link>
              <button
                onClick={() => setCtaDismissed(true)}
                className="text-text-faint hover:text-foreground text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
