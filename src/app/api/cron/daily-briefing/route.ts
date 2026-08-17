import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  sendBriefingEmail,
  type BriefingPayload,
} from "@/lib/briefing-email";

/**
 * Manual backfill only — no longer on a schedule.
 *
 * This ran at 12:30 UTC while the routine that writes briefings/YYYY-MM-DD.json
 * runs at 14:00 UTC, so it always looked for the file ~100 minutes before it
 * existed and 404'd every single day since it was added (2026-05-08). The
 * routine now emails the briefing itself through the `publish_briefing` MCP
 * tool (see src/lib/briefing-ingest.ts), so the schedule was dropped from
 * vercel.json on 2026-07-29.
 *
 * The route stays because it's the only way to re-send one of the 48 legacy
 * briefings archived in briefings/: GET with ?date=YYYY-MM-DD.
 */
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
