import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lightweight, isolated trial status for the countdown badge.
// Intentionally defensive: if the trial_ends_at column doesn't exist yet
// (migration 033 not applied), it returns trialing:false instead of erroring —
// the badge must never break the page.
export async function GET(request: Request) {
  const user = await getAuthedUser(request);
  if (!user?.email) {
    return NextResponse.json({ trialing: false });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("subscribers")
      .select("subscription_status, subscription_source, trial_ends_at")
      .eq("email", user.email)
      .maybeSingle();

    if (error || !data) return NextResponse.json({ trialing: false });

    const isTrial =
      data.subscription_status === "trialing" &&
      data.subscription_source === "trial" &&
      !!data.trial_ends_at;
    if (!isTrial) return NextResponse.json({ trialing: false });

    const ms = new Date(data.trial_ends_at as string).getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    return NextResponse.json({ trialing: true, daysLeft });
  } catch {
    return NextResponse.json({ trialing: false });
  }
}
