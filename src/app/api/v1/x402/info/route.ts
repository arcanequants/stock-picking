import { NextResponse } from "next/server";
import { NETWORK, PAY_TO } from "@/lib/x402-server";

const endpoints = [
  { path: "/api/v1/x402/picks", price: "0.005", method: "GET", description: "All stock picks with returns" },
  { path: "/api/v1/x402/picks/latest", price: "0.001", method: "GET", description: "Latest stock pick" },
  { path: "/api/v1/x402/research/{ticker}", price: "0.01", method: "GET", description: "Full stock research report" },
  { path: "/api/v1/x402/portfolio", price: "0.002", method: "GET", description: "Portfolio summary" },
  { path: "/api/v1/x402/portfolio/positions", price: "0.003", method: "GET", description: "All portfolio positions" },
  { path: "/api/v1/x402/portfolio/history", price: "0.005", method: "GET", description: "Portfolio performance history" },
  { path: "/api/v1/x402/sectors", price: "0.001", method: "GET", description: "Sector allocation breakdown" },
  { path: "/api/v1/x402/regions", price: "0.001", method: "GET", description: "Region allocation breakdown" },
  { path: "/api/v1/x402/stocks", price: "0.005", method: "GET", description: "Full list of researched stocks" },
];

export async function GET() {
  return NextResponse.json({
    protocol: "x402",
    version: "2.7.0",
    description: "Pay-per-request API access using USDC on Base. No API key needed — the payment IS the authentication.",
    network: NETWORK,
    currency: "USDC",
    payTo: PAY_TO,
    facilitator: "https://x402.org/facilitator",
    flow: [
      "1. GET any endpoint below",
      "2. Receive HTTP 402 with payment instructions in headers",
      "3. Pay USDC on Base to the specified address",
      "4. Retry the request with the payment proof in X-PAYMENT header",
      "5. Receive pro-tier data — agent is only charged if response is successful",
    ],
    endpoints,
    total_cost_all_endpoints: "$0.029",
    docs: "https://vectorialdata.com/developers",
  });
}
