import { NextResponse } from "next/server";
import { transactions } from "@/data/stocks";
import { getPortfolioSummary } from "@/lib/api-data";
import { MIN_TOPUP_USDC } from "@/lib/api-credit-packs";

export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await getPortfolioSummary();

  return NextResponse.json({
    name: "Vectorial Data",
    description: "AI-native stock picking service with verifiable track record",
    version: "1.0",
    website: "https://vectorialdata.com",
    api_base: "https://vectorialdata.com/api/v1",
    openapi_spec: "https://vectorialdata.com/openapi.yaml",
    mcp_server: "npx @vectorialdata/mcp-server",
    llms_txt: "https://vectorialdata.com/llms.txt",
    track_record: {
      total_return_pct: summary.total_return_pct,
      total_positions: summary.total_positions,
      since: summary.since,
    },
    pricing: {
      model: "prepaid_balance",
      description:
        "One prepaid USDC balance per API key. Each request debits the per-endpoint price below; no tiers, no daily limits. Top up at https://vectorialdata.com/api-keys (minimum 5 USDC). New keys start with a $0.20 USDC trial.",
      unit: "USDC",
      min_deposit_usdc: MIN_TOPUP_USDC,
      per_request_usdc: {
        picks: 0.005,
        latest_pick: 0.001,
        research: 0.01,
        portfolio: 0.002,
        positions: 0.003,
        history: 0.005,
        sectors: 0.001,
        regions: 0.001,
        stocks: 0.005,
        events: 0.002,
        digest_latest: 0.003,
      },
    },
    payment_methods: [
      "Prepaid USDC balance per API key (Stripe top-up)",
      "x402 pay-per-request (USDC on Base) — no API key needed",
    ],
    x402: {
      description: "Pay-per-request access — no API key needed. The payment IS the authentication.",
      info: "/api/v1/x402/info",
      endpoints: {
        picks: "GET /api/v1/x402/picks ($0.005)",
        latest_pick: "GET /api/v1/x402/picks/latest ($0.001)",
        research: "GET /api/v1/x402/research/{ticker} ($0.01)",
        portfolio: "GET /api/v1/x402/portfolio ($0.002)",
        positions: "GET /api/v1/x402/portfolio/positions ($0.003)",
        history: "GET /api/v1/x402/portfolio/history ($0.005)",
        sectors: "GET /api/v1/x402/sectors ($0.001)",
        regions: "GET /api/v1/x402/regions ($0.001)",
        stocks: "GET /api/v1/x402/stocks ($0.005)",
        events: "GET /api/v1/x402/events ($0.002)",
        digest_latest: "GET /api/v1/x402/digest/latest ($0.003)",
      },
    },
    capabilities: [
      "stock_picks",
      "fundamental_research",
      "portfolio_tracking",
      "sector_analysis",
      "region_analysis",
      "verifiable_track_record",
      "portfolio_events",
      "ai_event_explanations",
      "weekly_digest",
    ],
    auth: {
      type: "bearer",
      prefix: "vd_live_",
      register: "/api/v1/auth/register",
    },
    endpoints: {
      info: "GET /api/v1/info",
      picks: "GET /api/v1/picks",
      latest_pick: "GET /api/v1/picks/latest",
      research: "GET /api/v1/research/{ticker}",
      portfolio: "GET /api/v1/portfolio",
      positions: "GET /api/v1/portfolio/positions",
      history: "GET /api/v1/portfolio/history",
      sectors: "GET /api/v1/sectors",
      regions: "GET /api/v1/regions",
      stocks: "GET /api/v1/stocks",
      events: "GET /api/v1/events",
      digest_latest: "GET /api/v1/digest/latest",
      verify_picks: "GET /api/v1/verify/picks",
      verify_pick: "GET /api/v1/verify/pick/{ticker}",
    },
  });
}
