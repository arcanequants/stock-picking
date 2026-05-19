import { getSupabaseAdmin } from "@/lib/supabase";
import { getTranslations, getLocale } from "next-intl/server";

const localeMap: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

interface DividendRow {
  ex_date: string;
  amount_per_share: number;
  shares_held: number;
  total_amount: number;
}

export default async function StockDividendsReceived({
  ticker,
}: {
  ticker: string;
}) {
  const t = await getTranslations("StockDetail");
  const locale = await getLocale();
  const dateLocale = localeMap[locale] ?? "es-MX";

  const { data } = await getSupabaseAdmin()
    .from("dividend_events")
    .select("ex_date, amount_per_share, shares_held, total_amount")
    .eq("ticker", ticker)
    .order("ex_date", { ascending: false });

  const rows = (data ?? []) as DividendRow[];

  if (rows.length === 0) {
    return (
      <section className="border border-border rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
          {t("dividendsReceivedTitle")}
        </h2>
        <p className="text-sm text-text-faint">
          {t("dividendsNone", { ticker })}
        </p>
      </section>
    );
  }

  const total = rows.reduce((s, r) => s + Number(r.total_amount), 0);

  return (
    <section className="border border-border rounded-xl p-5 mb-8">
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
        {t("dividendsReceivedTitle")}
      </h2>
      <p className="text-xs text-text-faint mb-4">
        {t("dividendsReceivedSubtitle")}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-text-faint font-normal">
                {t("dividendsTableExDate")}
              </th>
              <th className="text-right py-2 px-3 text-text-faint font-normal">
                {t("dividendsTablePerShare")}
              </th>
              <th className="text-right py-2 px-3 text-text-faint font-normal">
                {t("dividendsTableShares")}
              </th>
              <th className="text-right py-2 px-3 text-text-faint font-normal">
                {t("dividendsTableTotal")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ex_date} className="border-b border-border/50">
                <td className="py-2 px-3 font-mono text-text-secondary">
                  {new Date(r.ex_date + "T12:00:00").toLocaleDateString(
                    dateLocale,
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </td>
                <td className="py-2 px-3 text-right font-mono text-text-secondary">
                  ${Number(r.amount_per_share).toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-text-secondary">
                  {Number(r.shares_held).toFixed(4)}
                </td>
                <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">
                  ${Number(r.total_amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-text-muted text-right">
        {t("dividendsTotal", { total: total.toFixed(2) })}
      </p>
    </section>
  );
}
