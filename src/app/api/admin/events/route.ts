import { NextResponse } from "next/server";
import { createEventWithExplanations } from "@/lib/notifications";
import type { EventType } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_TYPES: EventType[] = ["price_move", "dividend", "earnings", "analyst", "news"];

export async function POST(request: Request) {
  // Auth: require CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticker, event_type, title_key, params } = body;

    if (!ticker || !event_type || !title_key) {
      return NextResponse.json(
        { error: "Missing required fields: ticker, event_type, title_key" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    await createEventWithExplanations({
      ticker,
      event_type,
      title_key,
      params: params ?? {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin events error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
