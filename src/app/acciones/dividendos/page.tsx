import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import {
  getPickedStocks,
  getDividendStocks,
  averageYield,
  formatYield,
} from "@/lib/stock-lists";
import {
  JsonLd,
  getBreadcrumbSchema,
  getCollectionSchema,
} from "@/lib/seo";
import StockListTable from "@/components/StockListTable";
import ListPageExtras from "@/components/ListPageExtras";
import SiblingLinks from "@/components/SiblingLinks";

const SITE_URL = "https://vectorialdata.com";
const URL = `${SITE_URL}/acciones/dividendos`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("StockLists");
  const count = getDividendStocks().length;
  const title = t("dividendMetaTitle", { count });
  const description = t("dividendMetaDescription", { count });
  return {
    title,
    description,
    alternates: { canonical: URL },
    openGraph: { title, description, type: "website" },
  };
}

export default async function DividendosPage() {
  const t = await getTranslations("StockLists");
  const locale = await getLocale();
  const picked = getPickedStocks();
  const payers = getDividendStocks(picked);
  const avg = averageYield(picked);
  const top = payers[0];

  return (
    <div className="max-w-3xl mx-auto">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: t("breadcrumbHome"), url: SITE_URL },
          { name: t("breadcrumbHub"), url: `${SITE_URL}/acciones` },
          { name: t("dividendTitle"), url: URL },
        ])}
      />
      <JsonLd
        data={getCollectionSchema({
          name: t("dividendTitle"),
          description: t("dividendMetaDescription", { count: payers.length }),
          url: URL,
          items: payers,
        })}
      />

      <h1 className="text-3xl sm:text-4xl font-bold mb-3">
        {t("dividendTitle")}
      </h1>
      <p className="text-text-muted mb-4">
        {t("dividendIntro", {
          count: payers.length,
          total: picked.length,
          // Formatted here rather than left to ICU: a bare {avg} argument is
          // substituted as-is, so pt-BR was getting "2.26%" instead of "2,26%".
          avg: formatYield(avg ?? 0, locale),
        })}
      </p>
      <p className="text-text-muted mb-4">
        {t("dividendTop", {
          name: top.name,
          ticker: top.ticker,
          yield: formatYield(top.dividend_yield ?? 0, locale),
        })}
      </p>
      <p className="text-sm text-text-faint mb-8">{t("dividendNote")}</p>

      <div className="mb-10">
        <StockListTable items={payers} secondColumn="sector" />
      </div>

      <SiblingLinks kind="sector" currentSlug="" titleKey="exploreSectorsTitle" />
      <ListPageExtras showHubLink />
    </div>
  );
}
