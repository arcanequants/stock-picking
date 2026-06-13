import { NextResponse } from "next/server";
import { listEvents, renderMachineJson } from "@/lib/economic-events";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const DISCLAIMER =
  "Vectorial Economía is descriptive educational information about macro data. Not investment advice.";

export async function GET() {
  const events = await listEvents(50);

  return NextResponse.json(
    {
      product: "Vectorial Economía",
      description:
        "One daily analysis of the single most relevant macro event — human-readable and machine-readable.",
      docs: "https://vectorialdata.com/economia",
      feeds: {
        json_feed: "https://vectorialdata.com/economia/feed.json",
        rss: "https://vectorialdata.com/economia/feed.xml",
      },
      disclaimer: DISCLAIMER,
      count: events.length,
      latest: events[0] ? renderMachineJson(events[0]) : null,
      events: events.map(renderMachineJson),
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
