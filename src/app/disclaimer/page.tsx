import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return {
    title: `${t("disclaimerTitle")} | Vectorial Data`,
    description: t("disclaimerIntro"),
  };
}

export default async function DisclaimerPage() {
  const t = await getTranslations("Legal");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t("disclaimerTitle")}</h1>
      <p className="text-sm text-text-faint mb-8">{t("lastUpdated", { date: "2026-03-04" })}</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">{t("disclaimerIntro")}</p>

        <section>
          <h2>{t("disclaimerAdviceTitle")}</h2>
          <p>{t("disclaimerAdviceContent")}</p>
        </section>

        <section>
          <h2>{t("disclaimerPerformanceTitle")}</h2>
          <p>{t("disclaimerPerformanceContent")}</p>
        </section>

        <section>
          <h2>{t("disclaimerPositionsTitle")}</h2>
          <p>{t("disclaimerPositionsContent")}</p>
        </section>

        <section>
          <h2>{t("disclaimerAccuracyTitle")}</h2>
          <p>{t("disclaimerAccuracyContent")}</p>
        </section>

        <section>
          <h2>{t("disclaimerRegionalTitle")}</h2>
          <ul>
            <li>{t("disclaimerRegionalMexico")}</li>
            <li>{t("disclaimerRegionalIndia")}</li>
            <li>{t("disclaimerRegionalUK")}</li>
            <li>{t("disclaimerRegionalBrazil")}</li>
          </ul>
        </section>

        <section>
          <h2>{t("disclaimerSourcesTitle")}</h2>
          <p>{t("disclaimerSourcesContent")}</p>
        </section>
      </div>
    </div>
  );
}
