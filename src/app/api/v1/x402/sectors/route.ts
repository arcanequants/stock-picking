import { createX402Route } from "@/lib/x402-handler";
import { getSectorAllocation } from "@/lib/api-data";

export const GET = createX402Route("0.001", "Sector allocation breakdown", async () => {
  return getSectorAllocation();
});
