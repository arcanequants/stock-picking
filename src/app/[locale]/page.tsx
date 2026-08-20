import "./lab.css";
import { localizedAlternates } from "@/lib/hreflang";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { labSerif, labMono } from "@/lib/lab-fonts";
import { getLabData } from "@/lib/lab-data";
import { getAuthState } from "@/lib/auth";
import LabHeroChart from "@/components/lab/LabHeroChart";
import LabTape from "@/components/lab/LabTape";
import LabMetrics from "@/components/lab/LabMetrics";
import LabNav from "@/components/lab/LabNav";

const TERMINAL = "https://terminal.vectorialdata.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Lab");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(locale, "/"),
  };
}

/**
 * The Quant Lab homepage — the house's front door.
 *
 * Vectorial Data presents itself as a quantitative laboratory: two live
 * strategies (Stocks + Dr X), the DeFi account (5 asset classes, one
 * wallet), the Agent API for machines, the platforms, and the verifiable
 * registry. The old stocks landing moved intact to /estrategias/stocks.
 */
export default async function LabHome() {
  const t = await getTranslations("Lab");
  const locale = await getLocale();
  const data = await getLabData();
  // Access menu: a subscriber wants their panel; a visitor gets the full
  // stocks story (the old homepage, preserved at /estrategias/stocks).
  const { user } = await getAuthState();
  const stocksHref = user
    ? "/portfolio"
    : locale === "es" ? "/estrategias/stocks" : `/${locale}/estrategias/stocks`;

  const stocksVal = data.stocks.returnPct;
  const drx = data.drx;

  // Chart subtitles: start date (human month + year) and days running.
  const monthYear = new Intl.DateTimeFormat(
    ({ es: "es-MX", en: "en-US", pt: "pt-BR", hi: "hi-IN" } as Record<string, string>)[locale] ?? "es-MX",
    { month: "short", year: "numeric" }
  );
  const fmtStart = (d: Date) =>
    monthYear.format(d).toUpperCase().replace(".", "").replace(/ /g, "\u00A0"); // nbsp: no partir "JUL 2026" en el wrap
  const daysSince = (d: Date) => Math.max(1, Math.floor((Date.now() - d.getTime()) / 86400000));
  const stocksStart = new Date(data.stocks.since);
  const drxStart = drx && drx.equity.length > 0 ? new Date(drx.equity[0].t) : null;

  return (
    <div className={`vlab ${labSerif.variable} ${labMono.variable}`}>
      {/* ---------- NAV ---------- */}
      <LabNav
        links={[
          { href: "#que-hacemos", label: t("navWhat") },
          { href: "#estrategias", label: t("navStrategies") },
          { href: "#cuenta", label: t("navAccount") },
          { href: "#seguridad", label: t("secLabel") },
          { href: "#plataformas", label: t("navPlatforms") },
          { href: "#registro", label: t("navRegistry") },
        ]}
        access={t("navAccess")}
        terminal={TERMINAL}
        accounts={{
          terminal: { title: t("accTerminalT"), desc: t("accTerminalD"), meta: "terminal.vectorialdata.com" },
          stocks: { title: t("accStocksT"), desc: t("accStocksD"), meta: "vectorialdata.com", href: stocksHref },
        }}
      />

      {/* ---------- HERO ---------- */}
      <div className="vl-hero">
        <div className="vl-container">
          <div className="vl-hero-grid">
            <div>
              <h1>{t("heroTitle")}</h1>
              <p className="vl-sub">{t("heroSub")}</p>
              <div className="vl-links">
                <a className="vl-primary" href="#estrategias">{t("heroCta1")}</a>
                <a className="vl-plain" href="#registro">{t("heroCta2")}</a>
              </div>
            </div>
            <LabHeroChart
              stocksSeries={data.stocks.series}
              stocksReturnPct={stocksVal}
              drx={drx}
              locale={locale}
              labels={{
                stocksTitle: t("chartStocksTitle"),
                stocksSub: t("chartStocksSub", { days: daysSince(stocksStart), date: fmtStart(stocksStart) }),
                stocksNote: t("chartStocksNote", { count: data.picksCount }),
                drxTitle: t("chartDrxTitle"),
                drxSub: drxStart
                  ? t("chartDrxSub", { days: daysSince(drxStart), date: fmtStart(drxStart) })
                  : "",
                drxNote: t("chartDrxNote"),
                tabStocks: "STOCKS",
                tabDrx: "DR X",
              }}
            />
          </div>
        </div>

        <LabMetrics
          items={[
            { value: data.marketsCount, suf: "+", label: t("mMarkets") },
            { value: data.assetClasses, label: t("mAssets") },
            { value: 29, label: t("mAgents") },
            { value: 100, suf: "%", label: t("mCustody") },
          ]}
        />
        <LabTape
          data={data}
          locale={locale}
          labels={{
            live: t("tapeLive"),
            opPublished: t.raw("tapeOpPublished"),
            sinceBuy: t.raw("tapeSinceBuy"),
            alsoPublish: t.raw("tapeAlsoPublish"),
            attestVerified: t.raw("tapeAttestVerified"),
            rocLive: t.raw("tapeRocLive"),
            close: "",
            replica: t.raw("tapeReplica"),
            outcomesBeta: t.raw("tapeOutcomesBeta"),
            agentsApi: t.raw("tapeAgentsApi"),
          }}
        />
      </div>

      {/* ---------- QUÉ HACEMOS ---------- */}
      <div className="vl-band alt" id="que-hacemos">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("wLabel")}</div>
          <h2>{t("wTitle")}</h2>
          <div className="vl-cols3">
            <div><span className="no">01</span><h3>{t("w1T")}</h3><p>{t("w1D")}</p></div>
            <div><span className="no">02</span><h3>{t("w2T")}</h3><p>{t("w2D")}</p></div>
            <div><span className="no">03</span><h3>{t("w3T")}</h3><p>{t("w3D")}</p></div>
          </div>
        </div>
      </div>

      {/* ---------- ESTRATEGIAS ---------- */}
      <div className="vl-band" id="estrategias">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("sLabel")}</div>
          <h2>{t("sTitle")}</h2>
          <div className="vl-stlist">
            <div className="vl-stitem">
              <div className="n">Vectorial Stocks<small>{t("sStocksTag")}</small></div>
              <div className="d">
                {t("sStocksDesc", { count: data.picksCount })}{" "}
                <Link href="/estrategias/stocks">{t("sKnowMore")}</Link>
              </div>
              <div className="vl-sp">
                <div className="cap"><span>{t("sVizReturn")}</span><b className="vl-mono">{stocksVal != null ? `${stocksVal >= 0 ? "+" : ""}${stocksVal.toFixed(2)}%` : "—"}</b></div>
                <MiniSpark vals={data.stocks.series.map((p) => p.pct)} />
              </div>
            </div>
            <div className="vl-stitem">
              <div className="n">Dr X<small>{t("sDrxTag")}</small></div>
              <div className="d">
                {t("sDrxDesc")}{" "}
                <Link href="/copy-trading">{t("sKnowMore")}</Link>
              </div>
              <div className="vl-sp">
                <div className="cap"><span>{t("sVizRoc")}</span><b className="vl-mono">{drx ? `${drx.liveRocPct >= 0 ? "+" : ""}${drx.liveRocPct.toFixed(2)}%` : t("sVizLive")}</b></div>
                <MiniSpark vals={drx ? drx.equity.map((p) => p.v) : [0, 1]} />
              </div>
            </div>
          </div>
          <div className="vl-openbook">
            <b>{t("openBookTitle")}</b> {t("openBookText")}{" "}
            <a href={`${TERMINAL}/copy`} target="_blank" rel="noopener">{t("openBookCta")}</a>
          </div>
        </div>
      </div>

      {/* ---------- TU CUENTA ---------- */}
      <div className="vl-band" id="cuenta">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("aLabel")}</div>
          <h2>{t("aTitle")}</h2>
          <p className="vl-lead" dangerouslySetInnerHTML={{ __html: t.raw("aLead") }} />
          <div className="vl-assets">
            <AssetCell title={t("asset1")} sub={t("assetPerps")} icon="line" />
            <AssetCell title={t("asset2")} sub={t("assetPerps")} icon="bars" />
            <AssetCell title={t("asset3")} sub={t("assetPerps")} icon="rings" />
            <AssetCell title={t("asset4")} sub={t("assetSpotPerps")} icon="diamond" />
            <AssetCell title={t("asset5")} sub={t("assetPrediction")} icon="split" cyan />
          </div>
          <div className="vl-steps">
            <div className="vl-step"><div className="sn">{t("stepN", { n: 1 })}</div><h4>{t("step1T")}</h4><p>{t("step1D")}</p></div>
            <div className="vl-step"><div className="sn">{t("stepN", { n: 2 })}</div><h4>{t("step2T")}</h4><p>{t("step2D")}</p></div>
            <div className="vl-step"><div className="sn">{t("stepN", { n: 3 })}</div><h4>{t("step3T")}</h4><p>{t("step3D")}</p></div>
            <div className="vl-step"><div className="sn">{t("stepN", { n: 4 })}</div><h4>{t("step4T")}</h4><p>{t("step4D")}</p></div>
          </div>
          <div className="vl-ctarow">
            <a className="vl-primary" href={TERMINAL} target="_blank" rel="noopener">{t("aCta")}</a>
            <span className="vl-fine">{t("aFine")}</span>
          </div>
        </div>
      </div>

      {/* ---------- SEGURIDAD ---------- */}
      <div className="vl-band alt" id="seguridad">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("secLabel")}</div>
          <h2>{t("secTitle")}</h2>
          <p className="vl-lead">{t("secLead")}</p>
          <div className="vl-speclist" style={{ marginTop: 38, maxWidth: 860 }}>
            <div className="vl-spec2"><span className="m">{t("sec1T")}</span><span>{t("sec1D")}</span></div>
            <div className="vl-spec2"><span className="m">{t("sec2T")}</span><span>{t("sec2D")}</span></div>
            <div className="vl-spec2"><span className="m">{t("sec3T")}</span><span>{t("sec3D")}</span></div>
            <div className="vl-spec2"><span className="m">{t("sec4T")}</span><span>{t("sec4D")}</span></div>
            <div className="vl-spec2"><span className="m">{t("sec5T")}</span><span>{t("sec5D")}</span></div>
            <div className="vl-spec2"><span className="m">{t("sec6T")}</span><span>{t("sec6D")}</span></div>
            <div className="vl-spec2"><span className="m">{t("sec7T")}</span><span>{t("sec7D")}</span></div>
          </div>
        </div>
      </div>

      {/* ---------- AGENTES ---------- */}
      <div className="vl-band" id="agentes">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("agLabel")}</div>
          <h2>{t("agTitle")}</h2>
          <div className="vl-ag-grid">
            <div>
              <p className="vl-lead" dangerouslySetInnerHTML={{ __html: t.raw("agLead") }} />
              <div className="vl-speclist">
                <div className="vl-spec2"><span className="m">{t("agS1T")}</span><span>{t("agS1D")}</span></div>
                <div className="vl-spec2"><span className="m">{t("agS2T")}</span><span>{t("agS2D")}</span></div>
                <div className="vl-spec2"><span className="m">{t("agS3T")}</span><span>{t("agS3D")}</span></div>
                <div className="vl-spec2"><span className="m">{t("agS4T")}</span><span>{t("agS4D")}</span></div>
              </div>
              <div className="vl-verified"><span className="chk">✓ {t("agVerifiedLabel")}</span><span>{t("agVerifiedText")}</span></div>
            </div>
            <div>
              <div className="vl-code">
                <div className="bar"><i /><i /><i /></div>
                <div><span className="c"># 1 · {t("agCode1")}</span></div>
                <div><span className="k">POST</span> /api/agent/v1/challenge <span className="c">{"{ address }"}</span></div>
                <div><span className="k">POST</span> /api/agent/v1/register <span className="c">{"{ signature }"}</span></div>
                <div>→ <span className="s">{"{ \"api_key\": \"vd_agt_…\", \"mode\": \"paper\" }"}</span></div>
                <div style={{ marginTop: 10 }}><span className="c"># 2 · {t("agCode2")}</span></div>
                <div><span className="k">POST</span> /orders/prepare → <span className="s">{"{ typed_data }"}</span></div>
                <div><span className="w">{t("agCodeSign")}</span> → <span className="k">POST</span> /orders/submit</div>
                <div style={{ marginTop: 10 }}><span className="c"># 3 · {t("agCode3")}</span></div>
                <div>claude mcp add vectorialdata <span className="s">terminal.vectorialdata.com/api/mcp</span></div>
              </div>
              <div className="vl-verified" style={{ justifyContent: "flex-end" }}>
                <a href={`${TERMINAL}/api/agent/v1/docs`} target="_blank" rel="noopener" style={{ fontWeight: 500 }}>{t("agDocsCta")} →</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- PLATAFORMAS ---------- */}
      <div className="vl-band alt" id="plataformas">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("pLabel")}</div>
          <h2>{t("pTitle")}</h2>
          <div className="vl-plist">
            <div className="vl-pitem">
              <h3>Stocks <span>— {t("p1S")}</span></h3>
              <p>{t("p1D")}</p>
              <Link href="/stocks">vectorialdata.com/stocks →</Link>
            </div>
            <div className="vl-pitem">
              <h3>Terminal <span>— {t("p2S")}</span></h3>
              <p>{t("p2D")}</p>
              <a href={TERMINAL} target="_blank" rel="noopener">terminal.vectorialdata.com →</a>
            </div>
            <div className="vl-pitem">
              <h3>Copy Trading <span>— Hyperliquid</span></h3>
              <p>{t("p3D")}</p>
              <Link href="/copy-trading">{t("p3Cta")} →</Link>
            </div>
            <div className="vl-pitem">
              <h3>Copy Outcomes <span>— Polymarket</span> <span className="vl-beta">BETA</span></h3>
              <p>{t("p4D")}</p>
              <Link href="/outcomes">{t("p4Cta")} →</Link>
            </div>
            <div className="vl-pitem">
              <h3>Outcomes <span>— {t("p5S")}</span></h3>
              <p>{t("p5D")}</p>
              <Link href="/outcomes">{t("p5Cta")} →</Link>
            </div>
            <div className="vl-pitem">
              <h3>Agent API <span>— {t("p6S")}</span></h3>
              <p>{t("p6D")}</p>
              <a href={`${TERMINAL}/api/agent/v1/docs`} target="_blank" rel="noopener">{t("p6Cta")} →</a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- REGISTRO ---------- */}
      <div className="vl-ledger" id="registro">
        <div className="vl-container vl-sect">
          <div className="vl-label">{t("rLabel")}</div>
          <h2 style={{ maxWidth: "18ch" }}>{t("rTitle")}</h2>
          <p className="vl-lead">{t("rLead")}</p>
          <div className="vl-mech">
            <div>
              <h3>{t("rM1T")}</h3>
              <p>{t("rM1D", { count: data.picksCount })}</p>
              <span className="mono2">{data.attestSamplePool.length}/{data.picksCount} {t("rM1Meta")}</span>
            </div>
            <div>
              <h3>{t("rM2T")}</h3>
              <p>{t("rM2D")}</p>
              <span className="mono2">{t("rM2Meta")}</span>
            </div>
          </div>
          <Link className="vl-more" href="/verify">{t("rCta")}</Link>
        </div>
      </div>

      {/* ---------- FOOTER ---------- */}
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
    </div>
  );
}

/* ---------- small server helpers ---------- */

function MiniSpark({ vals }: { vals: number[] }) {
  if (vals.length < 2) return <svg viewBox="0 0 200 48" />;
  const min = Math.min(...vals, 0), max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => [
    (200 * i) / (vals.length - 1),
    44 - ((v - min) / (max - min || 1)) * 40,
  ] as [number, number]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1],
      p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  const last = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 200 48" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--vl-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.8" fill="#18A8D8" />
    </svg>
  );
}

function AssetCell({ title, sub, icon, cyan }: { title: string; sub: string; icon: string; cyan?: boolean }) {
  const stroke = cyan ? "#18A8D8" : "var(--vl-accent)";
  return (
    <div className="vl-asset">
      <div className="g">
        {icon === "line" && <svg viewBox="0 0 60 34"><polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" points="4,28 16,20 26,24 40,10 56,6" /></svg>}
        {icon === "bars" && <svg viewBox="0 0 60 34"><g stroke={stroke} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="28" x2="8" y2="16" /><line x1="20" y1="28" x2="20" y2="10" /><line x1="32" y1="28" x2="32" y2="20" /><line x1="44" y1="28" x2="44" y2="6" /><line x1="56" y1="28" x2="56" y2="12" /></g></svg>}
        {icon === "rings" && <svg viewBox="0 0 60 34"><g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="17" r="10" /><path d="M34 7 a10 10 0 0 1 0 20" /><path d="M46 7 a10 10 0 0 1 0 20" opacity=".45" /></g></svg>}
        {icon === "diamond" && <svg viewBox="0 0 60 34"><g fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round"><path d="M30 3 L42 17 L30 31 L18 17 Z" /><path d="M30 10 L36 17 L30 24 L24 17 Z" opacity=".45" /></g></svg>}
        {icon === "split" && <svg viewBox="0 0 60 34"><g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"><path d="M6 28 C 20 28, 20 8, 34 8" /><path d="M6 8 C 20 8, 20 28, 34 28" opacity=".45" /><circle cx="48" cy="8" r="4" /><circle cx="48" cy="28" r="4" opacity=".45" /></g></svg>}
      </div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}
