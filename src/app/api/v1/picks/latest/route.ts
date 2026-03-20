import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getPicksData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const picks = await getPicksData(1, result.auth.tier);
  return apiResponse(picks[0] ?? null, result.auth);
}
