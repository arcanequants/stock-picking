import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { x402Server, PAY_TO, NETWORK } from "./x402-server";
import { extractPayerFromHeader, trackX402Payer } from "./x402-payer-tracking";

export function createX402Route<T>(
  price: string,
  description: string,
  dataFn: (request: NextRequest) => Promise<T>
) {
  const handler = async (request: NextRequest) => {
    const data = await dataFn(request);

    // Payment has settled by the time we reach here (withX402 returns 402 otherwise).
    // Fire-and-forget payer tracking: emails Alberto on first payment per wallet,
    // and powers the weekly crypto-payers briefing.
    const payer = extractPayerFromHeader(request.headers.get("X-PAYMENT"));
    if (payer) {
      trackX402Payer({
        wallet: payer.wallet,
        network: payer.network,
        endpoint: request.nextUrl.pathname,
        priceUsd: price,
      }).catch((e) => console.error("x402 payer tracking failed:", e));
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

  return withX402(
    handler,
    {
      accepts: {
        scheme: "exact",
        price,
        network: NETWORK,
        payTo: PAY_TO,
      },
      description,
    },
    x402Server
  );
}
