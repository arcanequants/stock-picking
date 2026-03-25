import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getEventsWithReadStatus, getUnreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const [{ events, total }, unreadCount] = await Promise.all([
      getEventsWithReadStatus(user.id, 20, 0),
      getUnreadCount(user.id),
    ]);

    return NextResponse.json({ events, total, unreadCount });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
