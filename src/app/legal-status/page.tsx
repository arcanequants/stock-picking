import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LegalStatus");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://www.vectorialdata.com/legal-status",
    },
  };
}

export default async function LegalStatusPage() {
  const t = await getTranslations("LegalStatus");
  const tLegal = await getTranslations("Legal");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t("pageTitle")}</h1>
      <p className="text-text-muted mb-2">{t("pageSubtitle")}</p>
      <p className="text-sm text-text-faint mb-8">
        {tLegal("lastUpdated", { date: "2026-04-10" })}
      </p>

      <div className="prose-research space-y-8">
        <section>
          <h2>{t("summaryTitle")}</h2>
          <p>{t("summaryBody")}</p>
        </section>

        <section>
          <h2>{t("publisherTitle")}</h2>
          <p>{t("publisherBody")}</p>
        </section>

        <section>
          <h2>{t("notWeAreTitle")}</h2>
          <ul>
            <li>{t("notWeAre1")}</li>
            <li>{t("notWeAre2")}</li>
            <li>{t("notWeAre3")}</li>
            <li>{t("notWeAre4")}</li>
            <li>{t("notWeAre5")}</li>
            <li>{t("notWeAre6")}</li>
          </ul>
        </section>

        <section>
          <h2>{t("jurisdictionsTitle")}</h2>
          <p>{t("jurisdictionsBody")}</p>
        </section>

        <section>
          <h2>{t("ukTitle")}</h2>
          <p>{t("ukBody")}</p>
        </section>

        <section>
          <h2>{t("mxTitle")}</h2>
          <p>{t("mxBody")}</p>
        </section>

        <section>
          <h2>{t("brTitle")}</h2>
          <p>{t("brBody")}</p>
        </section>

        <section>
          <h2>{t("inTitle")}</h2>
          <p>{t("inBody")}</p>
        </section>

        <section>
          <h2>{t("changesTitle")}</h2>
          <p>{t("changesBody")}</p>
        </section>

        <section>
          <h2>{t("contactTitle")}</h2>
          <p>{t("contactBody")}</p>
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
            href="/risk-disclosure"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            Riesgos
          </Link>
        </div>
      </div>
    </div>
  );
}
