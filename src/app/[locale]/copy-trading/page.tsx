import "../lab.css";
import { localizedAlternates } from "@/lib/hreflang";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { labSerif, labMono } from "@/lib/lab-fonts";
import { getLabData } from "@/lib/lab-data";
import { JsonLd, getBreadcrumbSchema } from "@/lib/seo";

const TERMINAL = "https://terminal.vectorialdata.com";
const SITE = "https://vectorialdata.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("CopyLanding");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(locale, "/copy-trading"),
  };
}

/**
 * /copy-trading — the copy platform landing (Phase 2 of the lab reorg).
 * Dr X's numbers are read live from the Terminal's public leaders endpoint;
 * if the Terminal is unreachable the page renders without the live block.
 */
export default async function CopyTradingLanding() {
  const t = await getTranslations("CopyLanding");
  const data = await getLabData();
  const drx = data.drx;

  return (
    <div className={`vlab ${labSerif.variable} ${labMono.variable}`} style={{ background: "transparent" }}>
      <JsonLd data={getBreadcrumbSchema([
        { name: "Vectorial Data", url: SITE },
        { name: "Copy Trading", url: `${SITE}/copy-trading` },
      ])} />
      <div className="vl-sect" style={{ paddingTop: 28 }}>
        <div className="vl-label">{t("label")}</div>
        <h2 style={{ maxWidth: "22ch" }}>{t("title")}</h2>
        <p className="vl-lead">{t("lead")}</p>

        {/* Dr X — live strategy card */}
        {drx && (
          <div className="vl-sp" style={{ maxWidth: 560, marginTop: 36, padding: "20px 24px 16px" }}>
            <div className="cap" style={{ marginBottom: 12 }}>
              <span>DR X · {t("drxLive")}</span>
              <b className="vl-mono" style={{ fontSize: 19 }}>{drx.liveRocPct >= 0 ? "+" : ""}{drx.liveRocPct.toFixed(2)}%</b>
            </div>
            <div className="vl-mono" style={{ display: "flex", gap: 26, fontSize: 12.5, color: "var(--vl-soft)", flexWrap: "wrap", paddingBottom: 8 }}>
              <span>{t("drxTrades", { count: drx.trades })}</span>
              {drx.sharpe != null && <span>SHARPE {drx.sharpe.toFixed(2)}</span>}
              {drx.maxDrawdown != null && <span>MAX DD {drx.maxDrawdown.toFixed(1)}%</span>}
              <span>{t("drxMin", { amount: drx.minCapitalUsd })}</span>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="vl-steps" style={{ marginTop: 46 }}>
          <div className="vl-step"><div className="sn">01</div><h4>{t("how1T")}</h4><p>{t("how1D")}</p></div>
          <div className="vl-step"><div className="sn">02</div><h4>{t("how2T")}</h4><p>{t("how2D")}</p></div>
          <div className="vl-step"><div className="sn">03</div><h4>{t("how3T")}</h4><p>{t("how3D")}</p></div>
          <div className="vl-step"><div className="sn">04</div><h4>{t("how4T")}</h4><p>{t("how4D")}</p></div>
        </div>

        {/* Fees — one honest number */}
        <div className="vl-openbook" style={{ marginTop: 44 }}>
          <b>{t("feesTitle")}</b> {t("feesText")}
        </div>

        {/* Open your book */}
        <div className="vl-sect" style={{ padding: "56px 0 0" }}>
          <div className="vl-label">{t("leadersLabel")}</div>
          <h2 style={{ fontSize: 26 }}>{t("leadersTitle")}</h2>
          <p className="vl-lead">{t("leadersText")}</p>
          <div className="vl-ctarow" style={{ marginTop: 26 }}>
            <a className="vl-primary" href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("ctaFollow")}</a>
            <a className="vl-plain" href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("ctaOpenBook")}</a>
          </div>
        </div>

        <p className="vl-fine" style={{ marginTop: 48, borderTop: "1px solid var(--vl-line)", paddingTop: 20, maxWidth: "88ch" }}>{t("legal")}</p>
      </div>
    </div>
  );
}
