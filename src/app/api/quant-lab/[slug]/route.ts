import { NextResponse } from "next/server";
import { getBotView } from "@/lib/quant-lab";

export const revalidate = 600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const view = await getBotView(slug);
  if (!view) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(view);
}
