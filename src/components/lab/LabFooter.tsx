import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getLabData } from "@/lib/lab-data";

const TERMINAL = "https://terminal.vectorialdata.com";

/**
 * The lab footer, shared by every lab-chromed surface (home, /copy-trading,
 * /outcomes). Ledger counts come from getLabData — request-cached, so pages
 * that already loaded it pay nothing extra.
 */
export default async function LabFooter() {
  const t = await getTranslations("Lab");
  const data = await getLabData();

  return (
    <footer className="vl-footer">
      <div className="vl-container">
        <div className="vl-fgrid">
          <div className="vl-fbrand">
            <div className="b"><Image src="/logo.png" alt="" width={38} height={38} />Vectorial Data</div>
            <p>{t("fTag")}</p>
            <div className="ldg">{t("fLedger", { verified: data.attestSamplePool.length, total: data.picksCount })}</div>
          </div>
          <div className="vl-fcol">
            <h4>{t("fStrategies")}</h4>
            <Link href="/estrategias/stocks">Vectorial Stocks</Link>
            <Link href="/copy-trading">Dr X</Link>
            <a href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("openBookCta")}</a>
          </div>
          <div className="vl-fcol">
            <h4>{t("fPlatforms")}</h4>
            <a href={TERMINAL} target="_blank" rel="noopener">Terminal</a>
            <Link href="/stocks">Stocks</Link>
            <Link href="/copy-trading">Copy Trading</Link>
            <Link href="/outcomes">Copy Outcomes<span className="vl-beta" style={{ marginLeft: 6 }}>BETA</span></Link>
            <Link href="/outcomes">Outcomes</Link>
          </div>
          <div className="vl-fcol">
            <h4>{t("fDevs")}</h4>
            <a href={`${TERMINAL}/api/agent/v1/docs`} target="_blank" rel="noopener">Agent API</a>
            <a href={`${TERMINAL}/api/agent/v1/openapi.json`} target="_blank" rel="noopener">OpenAPI 3.1</a>
            <a href={`${TERMINAL}/api/mcp`} target="_blank" rel="noopener">MCP server</a>
            <Link href="/developers">{t("fDataApi")}</Link>
            <Link href="/verify">{t("fVerify")}</Link>
          </div>
          <div className="vl-fcol">
            <h4>{t("fCompany")}</h4>
            <Link href="/metodologia">{t("fMethodology")}</Link>
            <Link href="/risk-disclosure">{t("fRisks")}</Link>
            <Link href="/disclosures">Disclosures</Link>
            <Link href="/terms">{t("fTerms")}</Link>
            <Link href="/privacy">{t("fPrivacy")}</Link>
          </div>
        </div>
        <div className="vl-fbottom">
          <p className="legal">{t("fLegal")}</p>
          <span className="cp">© 2026 VECTORIAL DATA</span>
        </div>
      </div>
    </footer>
  );
}
