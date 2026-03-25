import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { markAsRead, markAllAsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("subscription_status")
      .eq("email", user.email?.toLowerCase() ?? "")
      .single();

    const status = subscriber?.subscription_status ?? null;
    if (status !== "active" && status !== "trialing") {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const body = await request.json();
    const { eventIds, all } = body;

    if (all) {
      await markAllAsRead(user.id);
    } else if (Array.isArray(eventIds) && eventIds.length > 0) {
      await markAsRead(user.id, eventIds);
    } else {
      return NextResponse.json(
        { error: "Provide eventIds array or { all: true }" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
