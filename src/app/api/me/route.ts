import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/me — authenticated user profile for the iOS app (and web).
 * Returns subscription status, delivery preferences, locale.
 *
 * Auth: session cookie (Supabase SSR) — same pattern as /api/support/ticket.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = user.email.toLowerCase();

  const { data: subscriber } = await getSupabaseAdmin()
    .from("subscribers")
    .select(
      "email, subscription_status, delivery_channel, locale, created_at, current_period_end"
    )
    .eq("email", email)
    .single();

  const status = subscriber?.subscription_status ?? null;
  const isSubscribed = status === "active" || status === "trialing";

  return NextResponse.json({
    email,
    is_subscribed: isSubscribed,
    subscription_status: status,
    delivery_channel: subscriber?.delivery_channel ?? null,
    locale: subscriber?.locale ?? null,
    created_at: subscriber?.created_at ?? null,
    current_period_end: subscriber?.current_period_end ?? null,
  });
}
