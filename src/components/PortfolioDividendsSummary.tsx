import { getSupabaseAdmin } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import { transactions } from "@/data/stocks";

const POSITION_USD = 50;

export default async function PortfolioDividendsSummary() {
  const t = await getTranslations("Portfolio");
  const year = new Date().getUTCFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data } = await getSupabaseAdmin()
    .from("dividend_events")
    .select("total_amount, ex_date")
    .gte("ex_date", yearStart)
    .lte("ex_date", yearEnd);

  const rows = (data ?? []) as { total_amount: number; ex_date: string }[];
  const count = rows.length;
  const total = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  // Yield-on-cost = dividends received YTD / cost basis of every transaction
  // made before today. Cost basis = $50 per transaction (fractional shares).
  const costBasis = transactions.length * POSITION_USD;
  const ytdYieldPct = costBasis > 0 ? (total / costBasis) * 100 : 0;

  return (
    <section className="border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
        {t("dividendsSummaryTitle")}
      </h3>
      {count === 0 ? (
        <p className="text-sm text-text-faint">{t("dividendsSummaryEmpty")}</p>
      ) : (
        <>
          <p className="text-base text-foreground">
            {t("dividendsSummary", {
              count,
              year,
              total: total.toFixed(2),
            })}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {t("dividendsYieldOnCost", {
              pct: ytdYieldPct.toFixed(2),
              year,
            })}
          </p>
        </>
      )}
      <p className="mt-2 text-xs text-text-faint italic">
        {t("dividendsSummaryDisclaimer")}
      </p>
    </section>
  );
}
