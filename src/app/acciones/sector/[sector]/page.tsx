import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getMessages, getLocale } from "next-intl/server";
import {
  getSectorGroups,
  findSectorGroup,
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

export function generateStaticParams() {
  return getSectorGroups().map((g) => ({ sector: g.slug }));
}

async function sectorLabel(value: string) {
  const messages = (await getMessages()) as Record<string, unknown>;
  const labels = (messages.Labels ?? {}) as Record<
    string,
    Record<string, string>
  >;
  return labels.sector?.[value] ?? value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;
  const group = findSectorGroup(sector);
  const t = await getTranslations("StockLists");
  if (!group) return { title: t("notFoundTitle") };

  const name = await sectorLabel(group.value);
  // An ETF is a basket, not a stock — that page gets its own wording.
  const isEtf = group.value === "ETF";
  const title = isEtf
    ? t("etfMetaTitle", { count: group.stocks.length })
    : t("sectorMetaTitle", { sector: name, count: group.stocks.length });
  const description = isEtf
    ? t("etfMetaDescription", { count: group.stocks.length })
    : t("sectorMetaDescription", { sector: name, count: group.stocks.length });
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/acciones/sector/${group.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function SectorListPage({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await params;
  const group = findSectorGroup(sector);
  if (!group) return notFound();

  const t = await getTranslations("StockLists");
  const locale = await getLocale();
  const name = await sectorLabel(group.value);
  const url = `${SITE_URL}/acciones/sector/${group.slug}`;

  const isEtf = group.value === "ETF";
  const heading = isEtf ? t("etfTitle") : t("sectorTitle", { sector: name });
  const description = isEtf
    ? t("etfMetaDescription", { count: group.stocks.length })
    : t("sectorMetaDescription", { sector: name, count: group.stocks.length });

  const payers = group.stocks.filter((s) => (s.dividend_yield ?? 0) > 0);
  const avg = averageYield(group.stocks);
  const since = new Date(group.stocks[0].firstPickDate).toLocaleDateString(
    ({ es: "es-MX", en: "en-US", pt: "pt-BR", hi: "hi-IN" } as Record<string, string>)[
      locale
    ] || "es-MX",
    { year: "numeric", month: "long" },
  );

  return (
    <div className="max-w-3xl mx-auto">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: t("breadcrumbHome"), url: SITE_URL },
          { name: t("breadcrumbHub"), url: `${SITE_URL}/acciones` },
          { name, url },
        ])}
      />
      <JsonLd
        data={getCollectionSchema({
          name: heading,
          description,
          url,
          items: group.stocks,
        })}
      />

      <h1 className="text-3xl sm:text-4xl font-bold mb-3">{heading}</h1>
      <p className="text-text-muted mb-4">
        {isEtf
          ? t("etfIntro", { count: group.stocks.length, since })
          : t("sectorIntro", {
              sector: name,
              count: group.stocks.length,
              since,
            })}
      </p>
      <p className="text-text-muted mb-8">
        {avg !== null
          ? t("groupYieldNote", { payers: payers.length, avg: formatYield(avg, locale) })
          : t("groupNoYieldNote")}
      </p>

      <div className="mb-10">
        <StockListTable items={group.stocks} secondColumn="country" />
      </div>

      <SiblingLinks kind="sector" currentSlug={group.slug} />
      <ListPageExtras showHubLink />
    </div>
  );
}
