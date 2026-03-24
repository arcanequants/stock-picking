import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { x402Server, PAY_TO, NETWORK } from "@/lib/x402-server";
import { getResearchData } from "@/lib/api-data";

const handler = async (request: NextRequest): Promise<NextResponse> => {
  const segments = request.nextUrl.pathname.split("/");
  const ticker = segments[segments.length - 1];
  const data = getResearchData(ticker, "pro");

  if (!data) {
    return NextResponse.json(
      { error: "Stock not found", ticker },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data,
    meta: {
      payment: "x402",
      tier: "pro",
      timestamp: new Date().toISOString(),
    },
  });
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "0.01",
      network: NETWORK,
      payTo: PAY_TO,
    },
    description: "Full stock research report",
  },
  x402Server
);
