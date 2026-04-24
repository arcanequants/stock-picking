import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendBudgetReminderEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily cron. Finds subscribers who:
//   - paid 72h+ ago (gives /welcome a fair shot at capturing the budget)
//   - never set monthly_budget
//   - haven't been nudged yet
//   - still have an active/trialing subscription
// Sends a single "set your rule" email and stamps budget_reminder_sent_at.

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://www.vectorialdata.com")
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await admin
    .from("subscribers")
    .select("email")
    .lt("created_at", cutoff)
    .is("monthly_budget", null)
    .is("budget_reminder_sent_at", null)
    .in("subscription_status", ["active", "trialing"])
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl = getSiteUrl();
  const ctaUrl = `${siteUrl}/account`;
  const results: Array<{ email: string; sent: boolean; error?: string }> = [];

  for (const sub of candidates ?? []) {
    try {
      await sendBudgetReminderEmail(sub.email, ctaUrl, "es");
      await admin
        .from("subscribers")
        .update({ budget_reminder_sent_at: new Date().toISOString() })
        .eq("email", sub.email);
      results.push({ email: sub.email, sent: true });
    } catch (e) {
      results.push({
        email: sub.email,
        sent: false,
        error: (e as Error).message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    checked: candidates?.length ?? 0,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
