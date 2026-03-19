import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return {
    title: `${t("privacyTitle")} | Vectorial Data`,
    description: t("privacyIntro"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{t("privacyTitle")}</h1>
      <p className="text-sm text-text-faint mb-8">{t("lastUpdated", { date: "2026-03-04" })}</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">{t("privacyIntro")}</p>

        <section>
          <h2>{t("privacyCollectTitle")}</h2>
          <p>{t("privacyCollectContent")}</p>
        </section>

        <section>
          <h2>{t("privacyUseTitle")}</h2>
          <p>{t("privacyUseContent")}</p>
        </section>

        <section>
          <h2>{t("privacyThirdTitle")}</h2>
          <p>{t("privacyThirdContent")}</p>
        </section>

        <section>
          <h2>{t("privacyRetentionTitle")}</h2>
          <p>{t("privacyRetentionContent")}</p>
        </section>

        <section>
          <h2>{t("privacyRightsTitle")}</h2>
          <p>{t("privacyRightsContent")}</p>
        </section>

        <section>
          <h2>{t("privacyCookiesTitle")}</h2>
          <p>{t("privacyCookiesContent")}</p>
        </section>

        <section>
          <h2>{t("privacyChildrenTitle")}</h2>
          <p>{t("privacyChildrenContent")}</p>
        </section>

        <section>
          <h2>{t("privacyContactTitle")}</h2>
          <p>{t("privacyContactContent")}</p>
        </section>
      </div>
    </div>
  );
}
