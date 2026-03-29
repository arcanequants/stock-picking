import { createX402Route } from "@/lib/x402-handler";
import { getDigestLatestData } from "@/lib/api-data";

export const GET = createX402Route("0.003", "Latest weekly digest with full events and AI explanations", async () => {
  return getDigestLatestData("pro");
});
