import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/supabase";
import { getReferralSummary } from "@/lib/referrals";

export const dynamic = "force-dynamic";

// Authenticated: returns the caller's referral code, share link, and rewards.
export async function GET(request: Request) {
  const user = await getAuthedUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await getReferralSummary(user.email);
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://vectorialdata.com";

  return NextResponse.json({
    ...summary,
    link: `${site}/r/${summary.code}`,
  });
}
