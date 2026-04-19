import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { getPicksData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/picks — chronological list of every pick, newest first.
 * Accepts web session cookie and `Authorization: Bearer <jwt>` (iOS).
 *
 * Gating:
 *   - Subscribed users: all picks
 *   - Unsubscribed:     most recent 3 (teaser)
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: subscriber } = await getSupabaseAdmin()
    .from("subscribers")
    .select("subscription_status")
    .eq("email", authed.email)
    .single();

  const status = subscriber?.subscription_status;
  const isSubscribed = status === "active" || status === "trialing";

  const picks = await getPicksData(undefined, isSubscribed ? "pro" : "free");

  return NextResponse.json({
    picks,
    is_subscribed: isSubscribed,
  });
}
