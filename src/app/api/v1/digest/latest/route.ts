import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getDigestLatestData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const digest = await getDigestLatestData(result.auth.tier);
  return apiResponse(digest, result.auth);
}
