import { NextResponse } from "next/server";
import { getPublicEvents } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getPublicEvents(20);

    // Check if user is subscribed (optional — may not be logged in)
    let isSubscribed = false;
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("subscription_status")
          .eq("email", user.email.toLowerCase())
          .single();
        const status = subscriber?.subscription_status ?? null;
        isSubscribed = status === "active" || status === "trialing";
      }
    } catch {
      // Not logged in — that's fine
    }

    // Count events with explanations BEFORE sanitizing (for FOMO counter)
    const totalWithExplanations = events.filter(
      (e) => e.explanations && Object.keys(e.explanations).length > 0
    ).length;

    // Free users: limit to 10 events, only latest gets full explanations
    const limitedEvents = isSubscribed ? events : events.slice(0, 10);
    const sanitizedEvents = limitedEvents.map((event, index) => {
      if (isSubscribed || index === 0) {
        return event;
      }
      return { ...event, explanations: {} };
    });

    return NextResponse.json({
      events: sanitizedEvents,
      isSubscribed,
      total: events.length,
      totalWithExplanations,
    });
  } catch (error) {
    console.error("Noticias API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch noticias" },
      { status: 500 }
    );
  }
}
