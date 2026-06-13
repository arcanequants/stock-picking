import { NextResponse } from "next/server";
import {
  getEventBySlug,
  renderMachineJson,
  renderJsonLdDataset,
} from "@/lib/economic-events";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ...renderMachineJson(ev),
      json_ld: renderJsonLdDataset(ev, "en"),
      disclaimer:
        "Vectorial Economía is descriptive educational information about macro data. Not investment advice.",
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
