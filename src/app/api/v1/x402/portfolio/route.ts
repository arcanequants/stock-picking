import { createX402Route } from "@/lib/x402-handler";
import { getPortfolioSummary } from "@/lib/api-data";

export const GET = createX402Route("0.002", "Portfolio summary", async () => {
  return getPortfolioSummary();
});
