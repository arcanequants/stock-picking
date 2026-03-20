import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getPositions } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const positions = await getPositions();
  return apiResponse(positions, result.auth);
}
