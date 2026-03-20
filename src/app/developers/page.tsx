import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers & AI Agents | Vectorial Data API",
  description:
    "REST API, MCP Server, and OpenAPI spec for AI agents. Access stock picks, research, and verifiable portfolio data programmatically.",
};

export default function DevelopersPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Built for AI Agents</h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          REST API, MCP Server, and verifiable track record.
          Your agent gets daily stock picks, fundamental research, and portfolio
          data — all structured for machine consumption.
        </p>
      </div>

      {/* Quick Start */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Start</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-1">1. Register for a free API key</p>
            <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`curl -X POST https://vectorialdata.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Agent"}'`}
            </pre>
          </div>

          <div>
            <p className="text-sm text-text-muted mb-1">2. Get latest picks</p>
            <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer vd_live_YOUR_KEY" \\
  https://vectorialdata.com/api/v1/picks`}
            </pre>
          </div>

          <div>
            <p className="text-sm text-text-muted mb-1">3. Get research for a stock</p>
            <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer vd_live_YOUR_KEY" \\
  https://vectorialdata.com/api/v1/research/UBS`}
            </pre>
          </div>
        </div>
      </div>

      {/* Python Example */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Python Example</h2>
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
        <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4">Endpoint</th>
                <th className="text-left py-2 pr-4">Auth</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /info</td>
                <td className="py-2 pr-4 text-emerald-500">Public</td>
                <td className="py-2">Service discovery</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">POST /auth/register</td>
                <td className="py-2 pr-4 text-emerald-500">Public</td>
                <td className="py-2">Get free API key</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /picks</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Stock picks with returns</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /picks/latest</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Most recent pick</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /research/{"{ticker}"}</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Full stock research</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /portfolio</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Portfolio summary</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /portfolio/positions</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">All positions</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /portfolio/history</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Daily snapshots</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /sectors</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Sector allocation</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /regions</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Region allocation</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /stocks</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">All researched stocks</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs">GET /verify/picks</td>
                <td className="py-2 pr-4 text-emerald-500">Public</td>
                <td className="py-2">Verifiable hash chain</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">POST /payments/verify</td>
                <td className="py-2 pr-4">API key</td>
                <td className="py-2">Verify USDC payment</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-faint mt-3">
          All endpoints prefixed with <code className="text-text-muted">/api/v1</code>
        </p>
      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border border-border rounded-xl p-6">
          <h3 className="font-bold mb-2">Free</h3>
          <p className="text-2xl font-mono font-bold mb-3">$0</p>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>10 requests/day</li>
            <li>Latest 3 picks</li>
            <li>Portfolio summary</li>
            <li>Basic stock list</li>
            <li>Track record verification</li>
          </ul>
        </div>
        <div className="border border-brand/30 rounded-xl p-6 bg-brand/5">
          <h3 className="font-bold mb-2 text-brand">Pro</h3>
          <p className="text-2xl font-mono font-bold mb-3">5 USDC<span className="text-sm font-normal text-text-muted">/month</span></p>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>1,000 requests/day</li>
            <li>All picks (full history)</li>
            <li>Full research reports</li>
            <li>Complete historical data</li>
            <li>Track record verification</li>
          </ul>
          <p className="text-xs text-text-faint mt-3">Pay with USDC on Base L2</p>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Crypto Payment</h2>
        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
          <li>Send <strong>5 USDC</strong> on <strong>Base L2</strong> to our wallet address</li>
          <li>Copy the transaction hash</li>
          <li>Call <code className="bg-tag-bg px-1 rounded">POST /api/v1/payments/verify</code> with your API key and tx_hash</li>
          <li>Your key is instantly upgraded to Pro for 30 days</li>
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
        <h2 className="text-xl font-bold mb-4">Integration Methods</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-1">REST API</h3>
            <p className="text-sm text-text-secondary">Standard HTTP endpoints with JSON responses. Works with any language.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">MCP Server</h3>
            <p className="text-sm text-text-secondary">Native integration with Claude, GPT, and MCP-compatible agents.</p>
            <pre className="bg-tag-bg rounded-lg p-2 text-xs mt-1">npx @vectorialdata/mcp-server</pre>
          </div>
          <div>
            <h3 className="font-semibold mb-1">OpenAPI Spec</h3>
            <p className="text-sm text-text-secondary">Auto-generate client libraries from our spec.</p>
            <Link href="/openapi.yaml" className="text-brand text-sm hover:underline">Download openapi.yaml</Link>
          </div>
          <div>
            <h3 className="font-semibold mb-1">llms.txt</h3>
            <p className="text-sm text-text-secondary">Machine-readable service description for LLM crawlers.</p>
            <Link href="/llms.txt" className="text-brand text-sm hover:underline">View llms.txt</Link>
          </div>
        </div>
      </div>

      {/* Verifiable Track Record */}
      <div className="border border-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Verifiable Track Record</h2>
        <p className="text-sm text-text-secondary mb-3">
          Every pick is part of a SHA-256 hash chain committed to git. Agents can verify
          that no picks were edited retroactively.
        </p>
        <pre className="bg-tag-bg rounded-lg p-3 text-sm overflow-x-auto">
{`# Verify the entire pick history
curl https://vectorialdata.com/api/v1/verify/picks

# Verify a specific pick
curl https://vectorialdata.com/api/v1/verify/pick/UBS`}
        </pre>
        <p className="text-xs text-text-faint mt-2">
          Algorithm: SHA-256(ticker|price|date|previous_hash) — each pick chains to the previous
        </p>
      </div>

      <p className="text-xs text-text-faint text-center">
        Questions? Reach us at vectorialdata.com
      </p>
    </div>
  );
}
