import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getEventsData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const severityMin = url.searchParams.get("severity_min");
  const since = url.searchParams.get("since");

  const events = await getEventsData(
    result.auth.tier,
    limit ? parseInt(limit) : undefined,
    {
      severityMin: severityMin ? parseInt(severityMin) : undefined,
      since: since ?? undefined,
    }
  );
  return apiResponse(events, result.auth);
}
