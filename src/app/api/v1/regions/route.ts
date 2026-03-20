import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getRegionAllocation } from "@/lib/api-data";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const regions = getRegionAllocation();
  return apiResponse(regions, result.auth);
}
