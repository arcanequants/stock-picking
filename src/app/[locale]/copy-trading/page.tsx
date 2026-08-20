import "../lab.css";
import { localizedAlternates } from "@/lib/hreflang";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getCopyLeaders } from "@/lib/lab-data";
import { JsonLd, getBreadcrumbSchema } from "@/lib/seo";
import LabShell from "@/components/lab/LabShell";
import MiniSpark from "@/components/lab/MiniSpark";

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
 * /copy-trading — the copy platform landing, full lab surface (LabShell).
 * Flow the founder asked for: understand what it is → see WHO you can copy
 * (live leader directory, open platform) → enter: copy a leader or open
 * your own book. All numbers live from the Terminal's public endpoint;
 * if the Terminal is unreachable the page renders without the directory.
 */
export default async function CopyTradingLanding() {
  const t = await getTranslations("CopyLanding");
  const leaders = await getCopyLeaders();

  return (
    <LabShell>
      <JsonLd data={getBreadcrumbSchema([
        { name: "Vectorial Data", url: SITE },
        { name: "Copy Trading", url: `${SITE}/copy-trading` },
      ])} />
      <div className="vl-container">
        <div className="vl-sect" style={{ paddingTop: 52 }}>
          <div className="vl-label">{t("label")}</div>
          <h2 style={{ maxWidth: "22ch" }}>{t("title")}</h2>
          <p className="vl-lead">{t("lead")}</p>

          {/* Leader directory — the open platform, live */}
          {leaders.length > 0 && (
            <div className="vl-sect" style={{ padding: "60px 0 0" }}>
              <div className="vl-label">{t("dirLabel")}</div>
              <h2 style={{ fontSize: 26 }}>{t("dirTitle")}</h2>
              <p className="vl-chart-note" style={{ marginTop: 12 }}>{t("dirNote")}</p>
              <div className="vl-leaders">
                {leaders.map((l) => (
                  <a key={l.name} className="vl-lcard" href={`${TERMINAL}/copy`} target="_blank" rel="noopener">
                    <div className="top">
                      <span className="n">{l.name}</span>
                      <span className={`r ${l.rocPct >= 0 ? "vl-up" : "vl-dn"}`}>
                        {l.rocPct >= 0 ? "+" : ""}{l.rocPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="stats">
                      <span>{t("drxTrades", { count: l.trades })}</span>
                      {l.sharpe != null && <span>SHARPE {l.sharpe.toFixed(2)}</span>}
                      {l.maxDrawdown != null && <span>MAX DD {l.maxDrawdown.toFixed(1)}%</span>}
                      <span>{t("cardFollowers", { count: l.followers })}</span>
                      <span>{t("drxMin", { amount: l.minCapitalUsd })}</span>
                      {l.successFeePct != null && <span>{t("cardSuccess", { pct: l.successFeePct })}</span>}
                    </div>
                    {l.equityVals.length >= 2 && (
                      <div className="spark"><MiniSpark vals={l.equityVals} /></div>
                    )}
                    <span className="go">{t("cardCta")}</span>
                  </a>
                ))}
                <a className="vl-lcard slot" href={`${TERMINAL}/copy`} target="_blank" rel="noopener">
                  <span className="n2">{t("slotTitle")}</span>
                  <p>{t("leadersText")}</p>
                  <span className="go">{t("ctaOpenBook")}</span>
                </a>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="vl-sect" style={{ padding: "60px 0 0" }}>
            <div className="vl-steps" style={{ marginTop: 0 }}>
              <div className="vl-step"><div className="sn">01</div><h4>{t("how1T")}</h4><p>{t("how1D")}</p></div>
              <div className="vl-step"><div className="sn">02</div><h4>{t("how2T")}</h4><p>{t("how2D")}</p></div>
              <div className="vl-step"><div className="sn">03</div><h4>{t("how3T")}</h4><p>{t("how3D")}</p></div>
              <div className="vl-step"><div className="sn">04</div><h4>{t("how4T")}</h4><p>{t("how4D")}</p></div>
            </div>
          </div>

          {/* Fees — one honest number */}
          <div className="vl-openbook" style={{ marginTop: 44 }}>
            <b>{t("feesTitle")}</b> {t("feesText")}
          </div>

          {/* Two ways in */}
          <div className="vl-sect" style={{ padding: "60px 0 0" }}>
            <div className="vl-label">{t("pathsLabel")}</div>
            <h2 style={{ fontSize: 26 }}>{t("pathsTitle")}</h2>
            <div className="vl-paths">
              <div className="vl-path">
                <h3>{t("pathCopyT")}</h3>
                <p>{t("pathCopyD")}</p>
                <a className="vl-primary" href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("ctaFollow")}</a>
              </div>
              <div className="vl-path">
                <h3>{t("leadersTitle")}</h3>
                <p>{t("leadersText")}</p>
                <a className="vl-plain" href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("ctaOpenBook")}</a>
              </div>
            </div>
          </div>

          <p className="vl-fine" style={{ marginTop: 52, borderTop: "1px solid var(--vl-line)", paddingTop: 20, maxWidth: "88ch" }}>{t("legal")}</p>
        </div>
      </div>
    </LabShell>
  );
}
