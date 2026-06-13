import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { listEvents, renderMachineJson } from "@/lib/economic-events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(
    Math.max(limitParam ? parseInt(limitParam) : 30, 1),
    100
  );

  const events = await listEvents(limit);
  return apiResponse(events.map(renderMachineJson), result.auth);
}
