import { NextRequest } from "next/server";
import { createX402Route } from "@/lib/x402-handler";
import { getPicksData } from "@/lib/api-data";

export const GET = createX402Route("0.005", "All stock picks with returns", async (request: NextRequest) => {
  const limit = request.nextUrl.searchParams.get("limit");
  return getPicksData(limit ? parseInt(limit) : undefined, "pro");
});
