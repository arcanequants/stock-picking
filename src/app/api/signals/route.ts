import { NextResponse } from "next/server";
import { listLiveSignals } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const SITE_URL = "https://vectorialdata.com";

export async function GET() {
  const signals = await listLiveSignals();
  const catalog = signals.map((s) => ({
    id: s.id,
    domain: s.domain,
    name: s.name,
    unit: s.unit,
    status: s.status,
    page_url: `${SITE_URL}/signals/${s.id}`,
    brief_url: `${SITE_URL}/signals/${s.id}/brief.md`,
    machine_url: `${SITE_URL}/api/signals/${s.id}`,
    source_url: s.source_url,
    license: s.license,
  }));

  return NextResponse.json(
    {
      product: "Vectorial Signals",
      description:
        "Hedge-fund-tier alternative-data signals translated to plain language. Free preview per signal; gated history + alerts + raw API on the $1/mo subscription.",
      docs: `${SITE_URL}/signals`,
      openapi: `${SITE_URL}/api/signals/openapi.json`,
      llms_txt: `${SITE_URL}/llms.txt`,
      disclaimer:
        "Vectorial Signals is descriptive market intelligence. Not investment advice. Past correlations don't predict future performance.",
      count: catalog.length,
      signals: catalog,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
