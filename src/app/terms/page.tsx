import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return {
    title: `${t("termsTitle")} | Vectorial Data`,
    description: t("termsIntro"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("Legal");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t("termsTitle")}</h1>
      <p className="text-sm text-text-faint mb-8">{t("lastUpdated", { date: "2026-03-04" })}</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">{t("termsIntro")}</p>

        <section>
          <h2>{t("termsServiceTitle")}</h2>
          <p>{t("termsServiceContent")}</p>
        </section>

        <section>
          <h2>{t("termsEligibilityTitle")}</h2>
          <p>{t("termsEligibilityContent")}</p>
        </section>

        <section>
          <h2>{t("termsSubscriptionTitle")}</h2>
          <p>{t("termsSubscriptionContent")}</p>
        </section>

        <section>
          <h2>{t("termsLiabilityTitle")}</h2>
          <p>{t("termsLiabilityContent")}</p>
        </section>

        <section>
          <h2>{t("termsIpTitle")}</h2>
          <p>{t("termsIpContent")}</p>
        </section>

        <section>
          <h2>{t("termsGoverningTitle")}</h2>
          <p>{t("termsGoverningContent")}</p>
        </section>

        <section>
          <h2>{t("termsContactTitle")}</h2>
          <p>{t("termsContactContent")}</p>
        </section>
      </div>
    </div>
  );
}
