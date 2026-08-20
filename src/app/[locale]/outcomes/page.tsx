import "../lab.css";
import { localizedAlternates } from "@/lib/hreflang";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { JsonLd, getBreadcrumbSchema } from "@/lib/seo";
import LabShell from "@/components/lab/LabShell";

const TERMINAL = "https://terminal.vectorialdata.com";
const SITE = "https://vectorialdata.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("OutcomesLanding");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(locale, "/outcomes"),
  };
}

/**
 * /outcomes — prediction markets via Polymarket + Copy Outcomes (beta).
 * Honest framing: direct trading is live through the Terminal; portfolio
 * copying of Polymarket traders is announced as beta, not as shipped.
 */
export default async function OutcomesLanding() {
  const t = await getTranslations("OutcomesLanding");

  return (
    <LabShell>
      <JsonLd data={getBreadcrumbSchema([
        { name: "Vectorial Data", url: SITE },
        { name: "Outcomes", url: `${SITE}/outcomes` },
      ])} />
      <div className="vl-container">
      <div className="vl-sect" style={{ paddingTop: 52 }}>
        <div className="vl-label">{t("label")}</div>
        <h2 style={{ maxWidth: "22ch" }}>{t("title")}</h2>
        <p className="vl-lead">{t("lead")}</p>

        <div className="vl-steps" style={{ marginTop: 44, gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="vl-step"><div className="sn">01</div><h4>{t("s1T")}</h4><p>{t("s1D")}</p></div>
          <div className="vl-step"><div className="sn">02</div><h4>{t("s2T")}</h4><p>{t("s2D")}</p></div>
          <div className="vl-step"><div className="sn">03</div><h4>{t("s3T")}</h4><p>{t("s3D")}</p></div>
        </div>

        <div className="vl-ctarow" style={{ marginTop: 36 }}>
          <a className="vl-primary" href={TERMINAL} target="_blank" rel="noopener">{t("cta")}</a>
        </div>

        {/* Copy Outcomes — beta */}
        <div className="vl-sect" id="copy" style={{ padding: "60px 0 0", scrollMarginTop: 80 }}>
          <div className="vl-label">Copy Outcomes <span className="vl-beta" style={{ marginLeft: 8 }}>BETA</span></div>
          <h2 style={{ fontSize: 26 }}>{t("betaTitle")}</h2>
          <p className="vl-lead">{t("betaLead")}</p>
          <div className="vl-openbook" style={{ marginTop: 26 }}>
            <b>{t("betaHowTitle")}</b> {t("betaHowText")}{" "}
            <a href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("betaCta")} →</a>
          </div>
        </div>

        <p className="vl-fine" style={{ marginTop: 48, borderTop: "1px solid var(--vl-line)", paddingTop: 20, maxWidth: "88ch" }}>{t("legal")}</p>
      </div>
      </div>
    </LabShell>
  );
}
