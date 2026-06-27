import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
import { stocks, transactions } from "@/data/stocks";
import { localized } from "@/data/stock-translations";
import PremiumGate from "@/components/PremiumGate";
import FreeSignupForm from "@/components/FreeSignupForm";
import type { Stock, Transaction } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PicksFeed");
  return {
    title: `${t("title")} | Vectorial Data`,
    description: t("subtitle"),
  };
}

const stockByTicker = new Map<string, Stock>(stocks.map((s) => [s.ticker, s]));

// How many past picks a non-subscriber sees before the premium fade.
const FREE_VISIBLE = 4;

function PicksRows({
  rows,
  labels,
}: {
  rows: Transaction[];
  labels: { newL: string; rebuyL: string };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((tx) => {
            const s = stockByTicker.get(tx.ticker);
            return (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-card-hover">
                <td className="py-2 px-3 font-mono text-text-secondary whitespace-nowrap">{tx.date}</td>
                <td className="py-2 px-3">
                  <Link href={`/stocks/${tx.ticker}`} className="font-bold text-foreground hover:text-brand transition-colors">
                    {tx.ticker}
                  </Link>
                  {s && <span className="ml-2 text-text-faint hidden sm:inline">{s.name}</span>}
                </td>
                <td className="py-2 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === "new" ? "bg-brand-subtle text-brand-text" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"}`}>
                    {tx.type === "new" ? labels.newL : labels.rebuyL}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <Link href={`/stocks/${tx.ticker}`} className="text-brand hover:text-brand-hover text-xs font-medium">
                    {"→"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function PicksPage() {
  const locale = await getLocale();
  const { isSubscribed } = await getAuthState();
  const t = await getTranslations("PicksFeed");
  const tP = await getTranslations("Portfolio");
  const tPremium = await getTranslations("Premium");

  // Newest first.
  const ordered = [...transactions].reverse();
  const latest = ordered[0] ?? null;
  const latestStock = latest ? stockByTicker.get(latest.ticker) : null;
  const today = new Date().toISOString().split("T")[0];
  const isToday = latest?.date === today;

  const teaser = (ticker: string): string => {
    const s = stockByTicker.get(ticker);
    if (!s) return "";
    const full = localized(ticker, "summary_short", locale, s.summary_short);
    return full.length > 240 ? full.slice(0, 237).trimEnd() + "…" : full;
  };

  const rest = ordered.slice(1);
  const freeRows = isSubscribed ? rest : rest.slice(0, FREE_VISIBLE);
  const gatedRows = isSubscribed ? [] : rest.slice(FREE_VISIBLE);
  const labels = { newL: tP("new"), rebuyL: tP("rebuy") };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-text-muted">{t("subtitle")}</p>
      </section>

      {/* Today's / latest pick — the hero (replaces the WhatsApp delivery) */}
      {latest && latestStock && (
        <section className="border border-border rounded-xl p-6 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full ${isToday ? "bg-emerald-500 animate-pulse" : "bg-brand"}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {isToday ? t("todayPick") : t("latestPick")}
            </span>
            <span className="text-xs text-text-faint">{"·"} {latest.date}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
            <h2 className="text-2xl font-bold text-foreground">{latestStock.name}</h2>
            <span className="font-mono text-text-muted">{latest.ticker}</span>
          </div>
          <p className="text-text-secondary mb-4">{teaser(latest.ticker)}</p>
          <Link href={`/stocks/${latest.ticker}`} className="inline-flex items-center gap-2 text-brand hover:text-brand-hover font-medium">
            {t("seeWhy")} {"→"}
          </Link>
        </section>
      )}

      {/* Past picks — full history for subscribers, partial + fade for free */}
      {rest.length > 0 && (
        <section className="border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">{t("pastPicks")}</h3>
          <PicksRows rows={freeRows} labels={labels} />
          {gatedRows.length > 0 && (
            <PremiumGate
              title={tPremium("unlockTransactions")}
              description={tPremium("unlockTransactionsDesc")}
              icon="table"
              variant="fade"
              isSubscribed={isSubscribed}
            >
              <PicksRows rows={gatedRows} labels={labels} />
            </PremiumGate>
          )}
        </section>
      )}

      {/* Non-subscribers: start a trial */}
      {!isSubscribed && (
        <section className="max-w-md mx-auto text-center space-y-3 py-4">
          <p className="text-lg font-semibold text-foreground">{t("ctaTitle")}</p>
          <p className="text-sm text-text-faint">{t("ctaSubtitle")}</p>
          <FreeSignupForm />
        </section>
      )}
    </div>
  );
}
