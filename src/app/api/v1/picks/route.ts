import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getPicksData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const picks = await getPicksData(
    limit ? parseInt(limit) : undefined,
    result.auth.tier
  );

  return apiResponse(picks, result.auth);
}
