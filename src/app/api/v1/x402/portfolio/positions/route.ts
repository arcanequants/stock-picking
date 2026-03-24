import { createX402Route } from "@/lib/x402-handler";
import { getPositions } from "@/lib/api-data";

export const GET = createX402Route("0.003", "All portfolio positions", async () => {
  return getPositions();
});
