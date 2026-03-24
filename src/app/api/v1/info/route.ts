import { NextResponse } from "next/server";
import { transactions } from "@/data/stocks";
import { getPortfolioSummary } from "@/lib/api-data";

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
      free: {
        price: "0",
        daily_limit: 10,
        features: ["Latest 3 picks", "Portfolio summary", "Basic stock list"],
      },
      pro: {
        price: "5 USDC/month on Base L2",
        daily_limit: 1000,
        features: ["All picks", "Full research", "Historical data", "Verifiable track record"],
      },
    },
    payment_methods: [
      "USDC on Base L2 (subscription)",
      "x402 pay-per-request (USDC on Base)",
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
      },
    },
    capabilities: [
      "stock_picks",
      "fundamental_research",
      "portfolio_tracking",
      "sector_analysis",
      "region_analysis",
      "verifiable_track_record",
    ],
    auth: {
      type: "bearer",
      prefix: "vd_live_",
      register: "/api/v1/auth/register",
      upgrade: "/api/v1/auth/upgrade",
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
      verify_picks: "GET /api/v1/verify/picks",
      verify_pick: "GET /api/v1/verify/pick/{ticker}",
    },
  });
}
