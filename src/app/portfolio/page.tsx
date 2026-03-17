import PortfolioDashboard from "@/components/PortfolioDashboard";
import CycleTracker from "@/components/CycleTracker";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import PerformanceChart from "@/components/PerformanceChart";
import PremiumGate from "@/components/PremiumGate";
import { stocks, transactions, cycles } from "@/data/stocks";
import { getTranslations } from "next-intl/server";
import { getAuthState } from "@/lib/auth";

export default async function PortfolioPage() {
  const { isSubscribed } = await getAuthState();
  const t = await getTranslations("Portfolio");
  const tPremium = await getTranslations("Premium");
  const activeStocks = stocks.filter((s) => s.status === "active");
  const currentCycle = cycles[0] ?? null;

  const freeTransactions = transactions.slice(0, 3);
  const hasPremiumTransactions = transactions.length > 3;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-text-muted">{t("subtitle")}</p>
      </section>

      {/* FREE: Performance Metrics */}
      <PerformanceMetrics />

      {/* PREMIUM: Performance Chart (blurred) */}
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

      {/* FREE: Cycle Tracker */}
      {currentCycle && <CycleTracker cycle={currentCycle} />}

      {/* FREE: Dashboard (sector/region allocation) */}
      {activeStocks.length > 0 && (
        <PortfolioDashboard stocks={stocks} cycle={currentCycle} />
      )}

      {/* PARTIAL FREE + PREMIUM: Transaction History */}
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

          {/* Premium: remaining transactions (blurred with fade) */}
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

      {/* PREMIUM: Active Positions (ticker pills free, table blurred) */}
      {activeStocks.length > 0 && (
        <section className="border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              {t("activePositions")}
            </h3>
            <span className="pro-badge">{tPremium("badge")}</span>
          </div>

          {/* Free: ticker pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activeStocks.map((s) => (
              <span key={s.ticker} className="text-xs font-mono px-3 py-1.5 rounded-full bg-tag-bg text-text-muted border border-border">
                {s.ticker}
              </span>
            ))}
          </div>

          {/* Premium: full table (blurred) */}
          <PremiumGate
            title={tPremium("unlockPositions")}
            description={tPremium("unlockPositionsDesc")}
            icon="table"
            variant="blur"
            isSubscribed={isSubscribed}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-text-faint">{t("ticker")}</th>
                    <th className="text-left py-2 px-3 text-text-faint">{t("name")}</th>
                    <th className="text-left py-2 px-3 text-text-faint">{t("sector")}</th>
                    <th className="text-right py-2 px-3 text-text-faint">{t("price")}</th>
                    <th className="text-right py-2 px-3 text-text-faint">{t("dividend")}</th>
                    <th className="text-right py-2 px-3 text-text-faint">{t("potential")}</th>
                    <th className="text-right py-2 px-3 text-text-faint">{t("consensus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStocks.map((s) => (
                    <tr key={s.ticker} className="border-b border-border/50 hover:bg-card-hover">
                      <td className="py-2 px-3 font-bold text-foreground">{s.ticker}</td>
                      <td className="py-2 px-3 text-text-secondary">{s.name}</td>
                      <td className="py-2 px-3 text-text-muted">{s.sector}</td>
                      <td className="py-2 px-3 text-right font-mono text-foreground">${s.price?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono text-text-secondary">{s.dividend_yield}%</td>
                      <td className={`py-2 px-3 text-right font-mono ${(s.analyst_upside || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {s.analyst_upside && s.analyst_upside > 0 ? "+" : ""}{s.analyst_upside}%
                      </td>
                      <td className="py-2 px-3 text-right text-text-secondary">{s.analyst_consensus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PremiumGate>
        </section>
      )}
    </div>
  );
}
