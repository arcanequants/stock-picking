import { NextResponse } from "next/server";
import { sendBriefingEmail, type BriefingPayload } from "@/lib/briefing-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.BRIEFING_FORWARD_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BriefingPayload;
  try {
    body = (await request.json()) as BriefingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.date || !Array.isArray(body.drafts) || body.drafts.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields: date, drafts[]" },
      { status: 400 },
    );
  }

  try {
    const result = await sendBriefingEmail(body);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Forward briefing failed:", msg);
    return NextResponse.json({ error: "send_failed", message: msg }, { status: 500 });
  }
}
