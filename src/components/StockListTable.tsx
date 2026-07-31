import Link from "next/link";
import { getTranslations, getMessages, getLocale } from "next-intl/server";
import { formatYield, type ListStock } from "@/lib/stock-lists";

/**
 * Shared table for the /acciones/* list pages.
 *
 * Deliberately shows only public facts (ticker, name, geography/sector,
 * dividend yield, first pick date). Per-position returns stay behind the
 * paywall — those live on /portfolio and the app for subscribers.
 */
export default async function StockListTable({
  items,
  secondColumn,
}: {
  items: ListStock[];
  secondColumn: "sector" | "country";
}) {
  const t = await getTranslations("StockLists");
  const locale = await getLocale();
  const messages = (await getMessages()) as Record<string, unknown>;
  const labels = (messages.Labels ?? {}) as Record<
    string,
    Record<string, string>
  >;
  const label = (dict: string, value: string) => labels[dict]?.[value] ?? value;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-background-subtle text-left text-text-faint">
          <tr>
            <th className="px-4 py-3 font-medium">{t("colCompany")}</th>
            <th className="px-4 py-3 font-medium">
              {secondColumn === "sector" ? t("colSector") : t("colCountry")}
            </th>
            <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
              {t("colDividend")}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.ticker} className="border-t border-border">
              <td className="px-4 py-3">
                <Link
                  href={`/stocks/${s.ticker}`}
                  className="text-brand hover:text-brand-hover transition-colors font-medium"
                >
                  {s.name}
                </Link>
                <span className="ml-2 text-text-faint">{s.ticker}</span>
              </td>
              <td className="px-4 py-3 text-text-muted">
                {secondColumn === "sector"
                  ? label("sector", s.sector)
                  : label("country", s.country)}
              </td>
              <td className="px-4 py-3 text-right text-text-muted tabular-nums whitespace-nowrap">
                {s.dividend_yield && s.dividend_yield > 0
                  ? `${formatYield(s.dividend_yield, locale)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
