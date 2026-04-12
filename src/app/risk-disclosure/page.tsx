import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("RiskDisclosure");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://www.vectorialdata.com/risk-disclosure",
    },
  };
}

export default async function RiskDisclosurePage() {
  const t = await getTranslations("RiskDisclosure");
  const tLegal = await getTranslations("Legal");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t("pageTitle")}</h1>
      <p className="text-text-muted mb-2">{t("pageSubtitle")}</p>
      <p className="text-sm text-text-faint mb-8">
        {tLegal("lastUpdated", { date: "2026-04-10" })}
      </p>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 mb-8">
        <p className="font-semibold text-amber-700 dark:text-amber-400">
          {t("warningTitle")}
        </p>
        <p className="mt-2 text-sm text-text-muted">{t("warningBody")}</p>
      </div>

      <div className="prose-research space-y-8">
        <section>
          <h2>{t("generalTitle")}</h2>
          <p>{t("generalBody")}</p>
        </section>

        <section>
          <h2>{t("specificTitle")}</h2>
          <p>{t("specificBody")}</p>
        </section>

        <section>
          <h2>{t("currencyTitle")}</h2>
          <p>{t("currencyBody")}</p>
        </section>

        <section>
          <h2>{t("liquidityTitle")}</h2>
          <p>{t("liquidityBody")}</p>
        </section>

        <section>
          <h2>{t("modelTitle")}</h2>
          <p>{t("modelBody")}</p>
        </section>

        <section>
          <h2>{t("concentrationTitle")}</h2>
          <p>{t("concentrationBody")}</p>
        </section>

        <section>
          <h2>{t("pastPerfTitle")}</h2>
          <p>{t("pastPerfBody")}</p>
        </section>

        <section>
          <h2>{t("taxTitle")}</h2>
          <p>{t("taxBody")}</p>
        </section>

        <section>
          <h2>{t("ctaTitle")}</h2>
          <p>{t("ctaBody")}</p>
        </section>

        <div className="pt-4 border-t border-border">
          <Link
            href="/lecciones"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            ← Lecciones
          </Link>
          {" · "}
          <Link
            href="/metodologia"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            Metodología
          </Link>
          {" · "}
          <Link
            href="/disclosures"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            Disclosures
          </Link>
          {" · "}
          <Link
            href="/legal-status"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            Estatus legal
          </Link>
        </div>
      </div>
    </div>
  );
}
