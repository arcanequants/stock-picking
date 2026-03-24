import { createX402Route } from "@/lib/x402-handler";
import { getPortfolioHistory } from "@/lib/api-data";

export const GET = createX402Route("0.005", "Portfolio performance history", async () => {
  return getPortfolioHistory("pro");
});
