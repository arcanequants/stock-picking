import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { x402Server, PAY_TO, NETWORK } from "./x402-server";

export function createX402Route<T>(
  price: string,
  description: string,
  dataFn: (request: NextRequest) => Promise<T>
) {
  const handler = async (request: NextRequest) => {
    const data = await dataFn(request);
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
