import { NextResponse } from "next/server";
import { withApiKey, apiResponse } from "@/lib/api-v1-middleware";
import { getResearchData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  const { ticker } = await params;
  const research = getResearchData(ticker, result.auth.tier);

  if (!research) {
    return NextResponse.json(
      { error: `Stock ${ticker.toUpperCase()} not found` },
      { status: 404 }
    );
  }

  return apiResponse(research, result.auth);
}
