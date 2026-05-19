import { getSupabaseAdmin } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";

export default async function PortfolioDividendsSummary() {
  const t = await getTranslations("Portfolio");
  const year = new Date().getUTCFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data } = await getSupabaseAdmin()
    .from("dividend_events")
    .select("total_amount")
    .gte("ex_date", yearStart)
    .lte("ex_date", yearEnd);

  const rows = (data ?? []) as { total_amount: number }[];
  const count = rows.length;
  const total = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  return (
    <section className="border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
        {t("dividendsSummaryTitle")}
      </h3>
      {count === 0 ? (
        <p className="text-sm text-text-faint">{t("dividendsSummaryEmpty")}</p>
      ) : (
        <p className="text-base text-foreground">
          {t("dividendsSummary", {
            count,
            year,
            total: total.toFixed(2),
          })}
        </p>
      )}
      <p className="mt-2 text-xs text-text-faint italic">
        {t("dividendsSummaryDisclaimer")}
      </p>
    </section>
  );
}
