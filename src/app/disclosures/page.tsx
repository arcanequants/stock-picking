import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Disclosures");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://www.vectorialdata.com/disclosures",
    },
  };
}

export default async function DisclosuresPage() {
  const t = await getTranslations("Disclosures");
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
          <h2>{t("conflictTitle")}</h2>
          <p>{t("conflictBody")}</p>
        </section>

        <section>
          <h2>{t("compensationTitle")}</h2>
          <p>{t("compensationBody")}</p>
        </section>

        <section>
          <h2>{t("positionsTitle")}</h2>
          <p>{t("positionsBody")}</p>
        </section>

        <section>
          <h2>{t("riskTitle")}</h2>
          <p>{t("riskBody")}</p>
        </section>

        <section>
          <h2>{t("methodologyTitle")}</h2>
          <p>{t("methodologyBody")}</p>
        </section>

        <section>
          <h2>{t("perfTitle")}</h2>
          <p>{t("perfBody")}</p>
        </section>

        <section>
          <h2>{t("hypoTitle")}</h2>
          <p>{t("hypoBody")}</p>
        </section>

        <section>
          <h2>{t("thirdPartyTitle")}</h2>
          <p>{t("thirdPartyBody")}</p>
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
