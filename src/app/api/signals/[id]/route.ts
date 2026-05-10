import { NextResponse } from "next/server";
import { getSignalSnapshot, renderMachineJson, renderJsonLdDataset } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snapshot = await getSignalSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "signal not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ...renderMachineJson(snapshot),
      json_ld: renderJsonLdDataset(snapshot, "en"),
      disclaimer:
        "Vectorial Signals is descriptive market intelligence. Not investment advice. Past correlations don't predict future performance.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
