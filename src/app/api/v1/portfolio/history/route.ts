import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getPortfolioHistory } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const history = await getPortfolioHistory(result.auth.tier);
  return apiResponse(history, result.auth);
}
