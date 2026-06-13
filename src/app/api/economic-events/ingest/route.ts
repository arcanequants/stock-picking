import { NextResponse } from "next/server";
import { ingestEconomicEvent } from "@/lib/economic-events-ingest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret =
    process.env.ECON_INGEST_SECRET || process.env.CRON_SECRET || "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await ingestEconomicEvent(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    slug: result.slug,
    event_date: result.event_date,
    page_url: result.page_url,
  });
}
