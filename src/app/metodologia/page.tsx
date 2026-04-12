import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metodologia");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://www.vectorialdata.com/metodologia",
    },
  };
}

export default async function MetodologiaPage() {
  const t = await getTranslations("Metodologia");
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
          <h2>{t("introTitle")}</h2>
          <p>{t("introBody")}</p>
        </section>

        <section>
          <h2>{t("positionSizeTitle")}</h2>
          <p>{t("positionSizeBody")}</p>
        </section>

        <section>
          <h2>{t("returnCalcTitle")}</h2>
          <p>{t("returnCalcBody")}</p>
        </section>

        <section>
          <h2>{t("weightedAvgTitle")}</h2>
          <p>{t("weightedAvgBody")}</p>
          <p className="text-text-muted italic">{t("weightedAvgExample")}</p>
        </section>

        <section>
          <h2>{t("selectionTitle")}</h2>
          <p>{t("selectionBody")}</p>
          <ul>
            <li>{t("selectionStep1")}</li>
            <li>{t("selectionStep2")}</li>
            <li>{t("selectionStep3")}</li>
            <li>{t("selectionStep4")}</li>
            <li>{t("selectionStep5")}</li>
            <li>{t("selectionStep6")}</li>
          </ul>
        </section>

        <section>
          <h2>{t("splitsTitle")}</h2>
          <p>{t("splitsBody")}</p>
        </section>

        <section>
          <h2>{t("cacheTitle")}</h2>
          <p>{t("cacheBody")}</p>
        </section>

        <section>
          <h2>{t("assumptionsTitle")}</h2>
          <p>{t("assumptionsBody")}</p>
        </section>

        <section>
          <h2>{t("limitsTitle")}</h2>
          <p>{t("limitsBody")}</p>
        </section>

        <section>
          <h2>{t("auditTitle")}</h2>
          <p>{t("auditBody")}</p>
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
