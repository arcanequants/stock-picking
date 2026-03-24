import { createX402Route } from "@/lib/x402-handler";
import { getStocksList } from "@/lib/api-data";

export const GET = createX402Route("0.005", "Full list of researched stocks", async () => {
  return getStocksList("pro");
});
