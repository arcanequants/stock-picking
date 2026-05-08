import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  sendBriefingEmail,
  type BriefingPayload,
} from "@/lib/briefing-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function todayInCDMX(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateOverride = searchParams.get("date");
  const date = dateOverride ?? todayInCDMX();

  const filePath = join(process.cwd(), "briefings", `${date}.json`);

  let payload: BriefingPayload;
  try {
    const raw = await readFile(filePath, "utf-8");
    payload = JSON.parse(raw) as BriefingPayload;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "briefing_not_found", date, message: msg },
      { status: 404 },
    );
  }

  if (!payload.date || !Array.isArray(payload.drafts) || payload.drafts.length === 0) {
    return NextResponse.json(
      { error: "invalid_briefing", date },
      { status: 400 },
    );
  }

  try {
    const result = await sendBriefingEmail(payload);
    return NextResponse.json({ success: true, date, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Daily briefing send failed:", msg);
    return NextResponse.json(
      { error: "send_failed", message: msg },
      { status: 500 },
    );
  }
}
