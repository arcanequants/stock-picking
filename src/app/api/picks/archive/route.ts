import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { getPicksData } from "@/lib/api-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/picks/archive — picks that pre-date the user's
 * `access_started_at`. Gated to subscribed (active or trialing) users
 * only — the archive is part of the paid product. Unauthed and
 * unsubscribed callers get 403.
 *
 * Format mirrors `/api/picks` minus the per-user decision fields:
 * archive picks are informational, the user cannot mark them as
 * bought from this list (they were not part of their subscription).
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("subscription_status, access_started_at")
    .eq("email", authed.email)
    .single();

  const subStatus = subscriber?.subscription_status;
  const isSubscribed = subStatus === "active" || subStatus === "trialing";
  if (!isSubscribed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const cutoffIso = subscriber?.access_started_at as string | null | undefined;
  const cutoffDate = cutoffIso ? cutoffIso.slice(0, 10) : null;

  const allPicks = await getPicksData(undefined, "pro");
  const archive = cutoffDate
    ? allPicks.filter((p) => p.date < cutoffDate)
    : [];

  return NextResponse.json({
    picks: archive,
    access_started_at: cutoffIso ?? null,
  });
}
