import { localizedAlternates } from "@/lib/hreflang";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getMessages, getLocale } from "next-intl/server";
import {
  getPickedStocks,
  getSectorGroups,
  getCountryGroups,
  getUngroupedByCountry,
  getDividendStocks,
} from "@/lib/stock-lists";
import { JsonLd, getBreadcrumbSchema } from "@/lib/seo";
import ListPageExtras from "@/components/ListPageExtras";

const SITE_URL = "https://vectorialdata.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("StockLists");
  const total = getPickedStocks().length;
  const title = t("hubMetaTitle");
  const description = t("hubMetaDescription", { total });
  return {
    title,
    description,
    alternates: localizedAlternates(locale, "/acciones"),
    openGraph: { title, description, type: "website" },
  };
}

export default async function AccionesHubPage() {
  const t = await getTranslations("StockLists");
  const locale = await getLocale();
  const messages = (await getMessages()) as Record<string, unknown>;
  const labels = (messages.Labels ?? {}) as Record<
    string,
    Record<string, string>
  >;
  const label = (dict: string, value: string) => labels[dict]?.[value] ?? value;

  const picked = getPickedStocks();
  const sectors = getSectorGroups(picked);
  const countries = getCountryGroups(picked);
  const singles = getUngroupedByCountry(picked);
  const dividends = getDividendStocks(picked);

  const since = new Date(picked[0].firstPickDate).toLocaleDateString(
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
        ])}
      />

      <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("hubTitle")}</h1>
      <p className="text-text-muted mb-10">
        {t("hubIntro", { total: picked.length, since })}
      </p>

      {/* Dividends */}
      <section className="mb-10">
        <Link
          href="/acciones/dividendos"
          className="block rounded-lg border border-border bg-background-subtle p-6 hover:border-brand transition-colors"
        >
          <h2 className="text-xl font-semibold mb-1">
            {t("dividendTitle")}
          </h2>
          <p className="text-sm text-text-muted">
            {t("hubDividendsBody", { count: dividends.length })}
          </p>
        </Link>
      </section>

      {/* Sectors */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">{t("exploreSectorsTitle")}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sectors.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/acciones/sector/${g.slug}`}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:border-brand transition-colors"
              >
                <span>{label("sector", g.value)}</span>
                <span className="text-text-faint text-sm tabular-nums">
                  {g.stocks.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Countries */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          {t("exploreCountriesTitle")}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {countries.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/acciones/pais/${g.slug}`}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:border-brand transition-colors"
              >
                <span>{label("country", g.value)}</span>
                <span className="text-text-faint text-sm tabular-nums">
                  {g.stocks.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Single-pick geographies — linked directly to their ticker page so no
          research page is left without a lateral entry point. */}
      {singles.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-2">{t("hubSinglesTitle")}</h2>
          <p className="text-sm text-text-muted mb-3">{t("hubSinglesBody")}</p>
          <ul className="flex flex-wrap gap-2">
            {singles.map((s) => (
              <li key={s.ticker}>
                <Link
                  href={`/stocks/${s.ticker}`}
                  className="inline-block rounded-full border border-border px-3 py-1 text-sm text-text-muted hover:border-brand hover:text-brand transition-colors"
                >
                  {label("country", s.country)} · {s.ticker}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ListPageExtras />
    </div>
  );
}
