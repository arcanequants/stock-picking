import PortfolioDashboard from "@/components/PortfolioDashboard";
import CycleTracker from "@/components/CycleTracker";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import PerformanceChart from "@/components/PerformanceChart";
import PositionReturns from "@/components/PositionReturns";
import PremiumGate from "@/components/PremiumGate";
import { stocks, transactions, cycles } from "@/data/stocks";
import { getTranslations } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
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
  const t = await getTranslations("Portfolio");
  const tPremium = await getTranslations("Premium");
  const activeStocks = stocks.filter((s) => s.status === "active");
  // Fix: use active cycle, not cycles[0]
  const currentCycle =
    cycles.find((c) => c.status === "active") ?? cycles[cycles.length - 1] ?? null;

  // Urgency: last pick date and next pick hint
  const lastTx = transactions[transactions.length - 1];
  const lastPickDate = lastTx ? lastTx.date : null;
  const today = new Date().toISOString().split("T")[0];
  const isLastPickToday = lastPickDate === today;

  const freeTransactions = transactions.slice(0, 3);
  const hasPremiumTransactions = transactions.length > 3;

  return (
    <div className="space-y-10">
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
                  {t("lastPickToday")} — {lastTx.ticker}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-brand" />
                <span className="text-text-muted">
                  {t("lastPick")}: {lastPickDate} — {lastTx.ticker}
                </span>
              </>
            )}
          </div>
        )}
      </section>

      {/* 1. Return total hero — the emotional hook */}
      <PerformanceMetrics positionCount={transactions.length} />

      {/* 2. Position returns with sharing — the conversion driver */}
      <PositionReturns isSubscribed={isSubscribed} />

      {/* 3. Performance chart (premium — blur) */}
      <PremiumGate
        title={tPremium("unlockChart")}
        description={tPremium("unlockChartDesc")}
        icon="chart"
        variant="blur"
        showBadge
        isSubscribed={isSubscribed}
      >
        <PerformanceChart />
      </PremiumGate>

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

      {activeStocks.length > 0 && (
        <PortfolioDashboard stocks={stocks} cycle={currentCycle} />
      )}
    </div>
  );
}
