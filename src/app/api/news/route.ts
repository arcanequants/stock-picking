import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/news — chronological list of curated app news, newest first.
 *
 * Filters by audience:
 *   - 'all'     → visible to everyone
 *   - 'premium' → visible only to active/trialing subscribers
 *   - 'free'    → visible only to non-subscribers (upsell nudges)
 *
 * The iOS app reads from here; the web site has its own (different,
 * AI/SEO-oriented) news scheme and intentionally does not consume this.
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("subscription_status")
    .eq("email", authed.email)
    .single();

  const status = subscriber?.subscription_status;
  const isSubscribed = status === "active" || status === "trialing";

  const audiences = isSubscribed ? ["all", "premium"] : ["all", "free"];

  const { data: rows, error } = await admin
    .from("app_news")
    .select("id, headline, body, link_url, audience, published_at")
    .in("audience", audiences)
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  return NextResponse.json({ news: rows ?? [] });
}
