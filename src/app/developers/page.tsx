import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd, getBreadcrumbSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Developers");
  return {
    title: t("heroTitle") + " | Vectorial Data API",
    description: t("heroDesc"),
    openGraph: {
      title: t("heroTitle") + " | Vectorial Data API",
      description: t("heroDesc"),
      images: [{ url: "/api/og/portfolio", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" as const },
    alternates: { canonical: "https://www.vectorialdata.com/developers" },
  };
}

export default async function DevelopersPage() {
  const t = await getTranslations("Developers");

  return (
    <div className="max-w-4xl mx-auto">
      <JsonLd data={getBreadcrumbSchema([
        { name: "Home", url: "https://www.vectorialdata.com" },
        { name: "Developers", url: "https://www.vectorialdata.com/developers" },
      ])} />
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("heroTitle")}</h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-6">
          {t("heroDesc")}
        </p>
        <Link
          href="/api-docs"
          className="inline-flex items-center gap-2 bg-foreground text-background font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          {t("tryLiveCta")}
        </Link>
        <p className="text-sm text-text-muted mt-3">{t("tryLiveSub")}</p>
      </div>

      {/* Quick Start */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t("quickStartTitle")}</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-1">{t("step1Label")}</p>
            <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`curl -X POST https://vectorialdata.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Agent"}'`}
            </pre>
          </div>

          <div>
            <p className="text-sm text-text-muted mb-1">{t("step2Label")}</p>
            <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer vd_live_YOUR_KEY" \\
  https://vectorialdata.com/api/v1/picks`}
            </pre>
          </div>

          <div>
            <p className="text-sm text-text-muted mb-1">{t("step3Label")}</p>
            <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer vd_live_YOUR_KEY" \\
  https://vectorialdata.com/api/v1/research/UBS`}
            </pre>
          </div>
        </div>
      </div>

      {/* Python Example */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t("pythonTitle")}</h2>
        <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`import requests

API_KEY = "vd_live_YOUR_KEY"
BASE = "https://vectorialdata.com/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Get all picks
picks = requests.get(f"{BASE}/picks", headers=headers).json()
for pick in picks["data"]:
    print(f"{pick['ticker']}: {pick['return_pct']:+.1f}%")

# Get research
research = requests.get(f"{BASE}/research/AVGO", headers=headers).json()
print(research["data"]["summary_why"])

# Verify track record
ledger = requests.get(f"{BASE}/verify/picks").json()
print(f"Chain valid: {ledger['valid']}, {ledger['chain_length']} picks")`}
        </pre>
      </div>

      {/* Endpoints */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t("endpointsTitle")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4">{t("thEndpoint")}</th>
                <th className="text-left py-2 pr-4">{t("thAuth")}</th>
                <th className="text-left py-2">{t("thDesc")}</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /info</td>
                <td className="py-2 pr-4 text-emerald-500">{t("authPublic")}</td>
                <td className="py-2">{t("descInfo")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">POST /auth/register</td>
                <td className="py-2 pr-4 text-emerald-500">{t("authPublic")}</td>
                <td className="py-2">{t("descRegister")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /picks</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descPicks")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /picks/latest</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descPicksLatest")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /research/{"{ticker}"}</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descResearch")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /portfolio</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descPortfolio")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /portfolio/positions</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descPositions")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /portfolio/history</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descHistory")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /sectors</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descSectors")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /regions</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descRegions")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /stocks</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descStocks")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /verify/picks</td>
                <td className="py-2 pr-4 text-emerald-500">{t("authPublic")}</td>
                <td className="py-2">{t("descVerify")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">POST /payments/verify</td>
                <td className="py-2 pr-4">{t("authApiKey")}</td>
                <td className="py-2">{t("descPayment")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-faint mt-3">
          {t("endpointsNote")} <code className="text-text-muted">/api/v1</code>
        </p>
        <Link
          href="/api-docs"
          className="inline-block mt-4 text-brand text-sm font-semibold hover:underline"
        >
          {t("endpointsTryInPlayground")}
        </Link>
      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border border-border rounded-xl p-6">
          <h3 className="font-bold mb-2">{t("freeTitle")}</h3>
          <p className="text-2xl font-mono font-bold mb-3">$0</p>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>{t("freeFeat1")}</li>
            <li>{t("freeFeat2")}</li>
            <li>{t("freeFeat3")}</li>
            <li>{t("freeFeat4")}</li>
            <li>{t("freeFeat5")}</li>
          </ul>
        </div>
        <div className="border border-brand/30 rounded-xl p-6 bg-brand/5">
          <h3 className="font-bold mb-2 text-brand">{t("proTitle")}</h3>
          <p className="text-2xl font-mono font-bold mb-3">5 USDC<span className="text-sm font-normal text-text-muted">{t("proPeriod")}</span></p>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>{t("proFeat1")}</li>
            <li>{t("proFeat2")}</li>
            <li>{t("proFeat3")}</li>
            <li>{t("proFeat4")}</li>
            <li>{t("proFeat5")}</li>
          </ul>
          <p className="text-xs text-text-faint mt-3">{t("proPayNote")}</p>
        </div>
      </div>

      {/* x402 Pay-Per-Request */}
      <div className="border border-emerald-500/30 rounded-xl p-6 mb-8 bg-emerald-500/5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">{t("x402Title")}</h2>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{t("x402Badge")}</span>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          {t("x402Desc")}
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-xs bg-tag-bg rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">1</span>
            <p className="text-sm text-text-secondary"><code className="bg-tag-bg px-1 rounded">GET /api/v1/x402/picks</code> — {t("x402Step1")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs bg-tag-bg rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">2</span>
            <p className="text-sm text-text-secondary">{t("x402Step2")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs bg-tag-bg rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">3</span>
            <p className="text-sm text-text-secondary">{t("x402Step3")} <code className="bg-tag-bg px-1 rounded">X-PAYMENT</code> header</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs bg-tag-bg rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">4</span>
            <p className="text-sm text-text-secondary">{t("x402Step4")}</p>
          </div>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4">{t("thEndpoint")}</th>
                <th className="text-left py-2 pr-4">{t("thPrice")}</th>
                <th className="text-left py-2">{t("thDesc")}</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/picks</td>
                <td className="py-1.5 pr-4">$0.005</td>
                <td className="py-1.5">{t("x402DescPicks")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/picks/latest</td>
                <td className="py-1.5 pr-4">$0.001</td>
                <td className="py-1.5">{t("x402DescPicksLatest")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/research/{"{ticker}"}</td>
                <td className="py-1.5 pr-4">$0.01</td>
                <td className="py-1.5">{t("x402DescResearch")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/portfolio</td>
                <td className="py-1.5 pr-4">$0.002</td>
                <td className="py-1.5">{t("x402DescPortfolio")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/portfolio/positions</td>
                <td className="py-1.5 pr-4">$0.003</td>
                <td className="py-1.5">{t("x402DescPositions")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/portfolio/history</td>
                <td className="py-1.5 pr-4">$0.005</td>
                <td className="py-1.5">{t("x402DescHistory")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/sectors</td>
                <td className="py-1.5 pr-4">$0.001</td>
                <td className="py-1.5">{t("x402DescSectors")}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/regions</td>
                <td className="py-1.5 pr-4">$0.001</td>
                <td className="py-1.5">{t("x402DescRegions")}</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-mono text-xs">GET /x402/stocks</td>
                <td className="py-1.5 pr-4">$0.005</td>
                <td className="py-1.5">{t("x402DescStocks")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-faint">
          {t("x402Note")} <code className="text-text-muted">/api/v1</code>. Discovery: <code className="text-text-muted">GET /api/v1/x402/info</code>. Powered by{" "}
          <a href="https://github.com/coinbase/x402" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">x402 protocol</a> (Coinbase).
        </p>
      </div>

      {/* Payment Instructions */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t("paymentTitle")}</h2>
        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li dangerouslySetInnerHTML={{ __html: t("paymentStep1") }} />
          <li>{t("paymentStep2")}</li>
          <li dangerouslySetInnerHTML={{ __html: t("paymentStep3") }} />
          <li>{t("paymentStep4")}</li>
        </ol>
        <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto mt-3">
{`curl -X POST https://vectorialdata.com/api/v1/payments/verify \\
  -H "Authorization: Bearer vd_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"tx_hash": "0x..."}'`}
        </pre>
      </div>

      {/* Integration Methods */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t("integrationTitle")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-1">{t("intRestTitle")}</h3>
            <p className="text-sm text-text-secondary">{t("intRestDesc")}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">{t("intMcpTitle")}</h3>
            <p className="text-sm text-text-secondary">{t("intMcpDesc")}</p>
            <pre className="bg-tag-bg rounded-lg p-2 text-xs mt-1">npx @vectorialdata/mcp-server</pre>
          </div>
          <div>
            <h3 className="font-semibold mb-1">{t("intOpenApiTitle")}</h3>
            <p className="text-sm text-text-secondary">{t("intOpenApiDesc")}</p>
            <Link href="/openapi.yaml" className="text-brand text-sm hover:underline">{t("intOpenApiLink")}</Link>
          </div>
          <div>
            <h3 className="font-semibold mb-1">{t("intLlmsTitle")}</h3>
            <p className="text-sm text-text-secondary">{t("intLlmsDesc")}</p>
            <Link href="/llms.txt" className="text-brand text-sm hover:underline">{t("intLlmsLink")}</Link>
          </div>
        </div>
      </div>

      {/* Verifiable Track Record */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{t("verifyTitle")}</h2>
        <p className="text-sm text-text-secondary mb-3">
          {t("verifyDesc")}
        </p>
        <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`# Verify the entire pick history
curl https://vectorialdata.com/api/v1/verify/picks

# Verify a specific pick
curl https://vectorialdata.com/api/v1/verify/pick/UBS`}
        </pre>
        <p className="text-xs text-text-faint mt-2">
          {t("verifyAlgorithm")}
        </p>
      </div>

      <p className="text-xs text-text-faint text-center">
        <a
          href="mailto:Hello@vectorialdata.com"
          className="hover:text-foreground transition-colors"
        >
          {t("contact")}
        </a>
      </p>
    </div>
  );
}
