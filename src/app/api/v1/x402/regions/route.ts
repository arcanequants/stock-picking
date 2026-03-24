import { createX402Route } from "@/lib/x402-handler";
import { getRegionAllocation } from "@/lib/api-data";

export const GET = createX402Route("0.001", "Region allocation breakdown", async () => {
  return getRegionAllocation();
});
