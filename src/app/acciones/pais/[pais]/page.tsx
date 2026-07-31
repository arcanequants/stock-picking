import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getMessages, getLocale } from "next-intl/server";
import {
  getCountryGroups,
  findCountryGroup,
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
  return getCountryGroups().map((g) => ({ pais: g.slug }));
}

async function countryLabel(value: string) {
  const messages = (await getMessages()) as Record<string, unknown>;
  const labels = (messages.Labels ?? {}) as Record<
    string,
    Record<string, string>
  >;
  return labels.country?.[value] ?? value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pais: string }>;
}): Promise<Metadata> {
  const { pais } = await params;
  const group = findCountryGroup(pais);
  const t = await getTranslations("StockLists");
  if (!group) return { title: t("notFoundTitle") };

  const name = await countryLabel(group.value);
  const title = t("countryMetaTitle", {
    country: name,
    count: group.stocks.length,
  });
  const description = t("countryMetaDescription", {
    country: name,
    count: group.stocks.length,
  });
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/acciones/pais/${group.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CountryListPage({
  params,
}: {
  params: Promise<{ pais: string }>;
}) {
  const { pais } = await params;
  const group = findCountryGroup(pais);
  if (!group) return notFound();

  const t = await getTranslations("StockLists");
  const locale = await getLocale();
  const name = await countryLabel(group.value);
  const url = `${SITE_URL}/acciones/pais/${group.slug}`;

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
          name: t("countryTitle", { country: name }),
          description: t("countryMetaDescription", {
            country: name,
            count: group.stocks.length,
          }),
          url,
          items: group.stocks,
        })}
      />

      <h1 className="text-3xl sm:text-4xl font-bold mb-3">
        {t("countryTitle", { country: name })}
      </h1>
      <p className="text-text-muted mb-4">
        {t("countryIntro", {
          country: name,
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
        <StockListTable items={group.stocks} secondColumn="sector" />
      </div>

      <SiblingLinks kind="country" currentSlug={group.slug} />
      <ListPageExtras showHubLink />
    </div>
  );
}
