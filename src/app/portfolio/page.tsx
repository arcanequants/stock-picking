import PortfolioDashboard from "@/components/PortfolioDashboard";
import CycleTracker from "@/components/CycleTracker";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import PerformanceChart from "@/components/PerformanceChart";
import PositionReturns from "@/components/PositionReturns";
import PremiumGate from "@/components/PremiumGate";
import FreeSignupForm from "@/components/FreeSignupForm";
import LoginExpiredBanner from "@/components/LoginExpiredBanner";
import { Suspense } from "react";
import { stocks, transactions, cycles } from "@/data/stocks";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
import { isUkVisitor } from "@/lib/geo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Portfolio");
  return {
    title: `${t("title")} | Vectorial Data`,
    description: t("subtitle"),
    openGraph: {
      title: `${t("title")} | Vectorial Data`,
      description: t("subtitle"),
      images: [{ url: "/api/og/portfolio", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PortfolioPage() {
  const { isSubscribed } = await getAuthState();
  const showUkBanner = await isUkVisitor();
  const t = await getTranslations("Portfolio");
  const tPremium = await getTranslations("Premium");
  const tLegal = await getTranslations("Legal");
  const tFree = await getTranslations("FreeSignup");
  const activeStocks = stocks.filter((s) => s.status === "active");
  // Fix: use active cycle, not cycles[0]
  const currentCycle =
    cycles.find((c) => c.status === "active") ?? cycles[cycles.length - 1] ?? null;

  // Urgency: last pick date (no ticker — that's premium info)
  const lastTx = transactions[transactions.length - 1];
  const lastPickDate = lastTx ? lastTx.date : null;
  const today = new Date().toISOString().split("T")[0];
  const isLastPickToday = lastPickDate === today;
  const daysSinceLastPick = lastPickDate
    ? Math.ceil((Date.now() - new Date(lastPickDate + "T00:00:00").getTime()) / 86400000)
    : 0;

  const freeTransactions = transactions.slice(0, 3);
  const hasPremiumTransactions = transactions.length > 3;

  return (
    <div className="space-y-10">
      {showUkBanner && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
            {tLegal("ukBannerTitle")}
          </p>
          <p className="mt-2 text-xs text-text-muted">{tLegal("ukBannerBody")}</p>
        </div>
      )}

      <Suspense fallback={null}><LoginExpiredBanner /></Suspense>

      {/* Hero: title + urgency indicator */}
      <section>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-text-muted">{t("subtitle")}</p>
        {lastPickDate && (
          <div className="mt-3 inline-flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-1.5">
            {isLastPickToday ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {t("lastPickToday")}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-brand" />
                <span className="text-text-muted">
                  {t("lastPick", { days: daysSinceLastPick })}
                </span>
              </>
            )}
          </div>
        )}
        <Link href="/verify" className="mt-3 inline-flex items-center gap-2 text-sm border border-emerald-500/20 bg-emerald-500/5 rounded-lg px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          {t("verifyBanner")}
          <span className="text-text-muted">{"\u00B7"}</span>
          <span className="hover:underline">{t("verifyBannerCta")} {"\u2192"}</span>
        </Link>
      </section>

      {/* 1. Return total hero — the emotional hook */}
      <PerformanceMetrics positionCount={transactions.length} />

      {/* Past performance disclaimer */}
      <p className="text-xs text-text-faint italic -mt-6">{tLegal("pastPerformance")} {tLegal("notFinancialAdvice")}</p>

      {/* 2. Position returns with sharing — the conversion driver */}
      <PositionReturns isSubscribed={isSubscribed} />

      {/* 3. Performance chart — always free (social proof, not product) */}
      <PerformanceChart />

      {/* Trust signals — methodology + lessons */}
      <p className="text-center text-sm text-text-faint py-2">
        <Link
          href="/metodologia"
          className="text-brand hover:text-brand-hover transition-colors"
        >
          {t("trustMethodology")}
        </Link>
        {" · "}
        <Link
          href="/lecciones"
          className="text-brand hover:text-brand-hover transition-colors"
        >
          {t("trustLessons")}
        </Link>
      </p>

      {/* 4. Transaction history (partial free + premium fade) */}
      {transactions.length > 0 && (
        <section className="border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              {t("transactionHistory")}
            </h3>
            {hasPremiumTransactions && <span className="pro-badge">{tPremium("badge")}</span>}
          </div>

          {/* Free: first 3 transactions */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-faint">{t("date")}</th>
                  <th className="text-left py-2 px-3 text-text-faint">{t("ticker")}</th>
                  <th className="text-left py-2 px-3 text-text-faint">{t("type")}</th>
                  <th className="text-left py-2 px-3 text-text-faint">{t("cycle")}</th>
                  <th className="text-right py-2 px-3 text-text-faint">{t("price")}</th>
                </tr>
              </thead>
              <tbody>
                {freeTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-card-hover">
                    <td className="py-2 px-3 font-mono text-text-secondary">{tx.date}</td>
                    <td className="py-2 px-3 font-bold text-foreground">{tx.ticker}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === "new" ? "bg-brand-subtle text-brand-text" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"}`}>
                        {tx.type === "new" ? t("new") : t("rebuy")}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-text-muted">#{tx.cycle_number}</td>
                    <td className="py-2 px-3 text-right font-mono text-foreground">${tx.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Premium: remaining transactions (fade effect) */}
          {hasPremiumTransactions && (
            <PremiumGate
              title={tPremium("unlockTransactions")}
              description={tPremium("unlockTransactionsDesc")}
              icon="table"
              variant="fade"
              isSubscribed={isSubscribed}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {transactions.slice(3).map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-mono text-text-secondary">{tx.date}</td>
                        <td className="py-2 px-3 font-bold text-foreground">{tx.ticker}</td>
                        <td className="py-2 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === "new" ? "bg-brand-subtle text-brand-text" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"}`}>
                            {tx.type === "new" ? t("new") : t("rebuy")}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-text-muted">#{tx.cycle_number}</td>
                        <td className="py-2 px-3 text-right font-mono text-foreground">${tx.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PremiumGate>
          )}
        </section>
      )}

      {/* 5. Cycle Tracker + Dashboard (less prominent, at the bottom) */}
      {currentCycle && <CycleTracker cycle={currentCycle} />}

      {/* Free digest signup — for non-subscribers */}
      {!isSubscribed && (
        <section className="max-w-md mx-auto text-center space-y-3 py-4">
          <p className="text-lg font-semibold text-foreground">{tFree("portfolioTitle")}</p>
          <p className="text-sm text-text-faint">{tFree("portfolioSubtitle")}</p>
          <FreeSignupForm />
        </section>
      )}

      {activeStocks.length > 0 && (
        <PortfolioDashboard stocks={stocks} cycle={currentCycle} />
      )}
    </div>
  );
}
