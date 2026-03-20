import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getSectorAllocation } from "@/lib/api-data";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const sectors = getSectorAllocation();
  return apiResponse(sectors, result.auth);
}
