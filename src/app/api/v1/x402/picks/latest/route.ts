import { createX402Route } from "@/lib/x402-handler";
import { getPicksData } from "@/lib/api-data";

export const GET = createX402Route("0.001", "Latest stock pick", async () => {
  return getPicksData(1, "pro");
});
