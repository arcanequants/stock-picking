import { NextRequest } from "next/server";
import { createX402Route } from "@/lib/x402-handler";
import { getEventsData } from "@/lib/api-data";

export const GET = createX402Route("0.002", "Portfolio events with AI explanations", async (request: NextRequest) => {
  const limit = request.nextUrl.searchParams.get("limit");
  const severityMin = request.nextUrl.searchParams.get("severity_min");
  const since = request.nextUrl.searchParams.get("since");
  return getEventsData("pro", limit ? parseInt(limit) : undefined, {
    severityMin: severityMin ? parseInt(severityMin) : undefined,
    since: since ?? undefined,
  });
});
