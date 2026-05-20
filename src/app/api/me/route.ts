import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/me — authenticated user profile.
 * Accepts both web session cookie and `Authorization: Bearer <jwt>` (iOS).
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: subscriber, error: subErr } = await getSupabaseAdmin()
    .from("subscribers")
    .select(
      "email, subscription_status, delivery_channel, locale, created_at, current_period_end"
    )
    .eq("email", authed.email)
    .single();

  const status = subscriber?.subscription_status ?? null;
  const isSubscribed = status === "active" || status === "trialing";

  console.log("[/api/me]", {
    authed_email: authed.email,
    sub_found: !!subscriber,
    sub_err: subErr?.message,
    sub_status: status,
    is_subscribed: isSubscribed,
  });

  return NextResponse.json({
    email: authed.email,
    is_subscribed: isSubscribed,
    subscription_status: status,
    delivery_channel: subscriber?.delivery_channel ?? null,
    locale: subscriber?.locale ?? null,
    created_at: subscriber?.created_at ?? null,
    current_period_end: subscriber?.current_period_end ?? null,
  });
}
