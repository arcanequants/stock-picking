import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getEventsForDigest } from "@/lib/notifications";
import { sendDigestEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get events from the past 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const events = await getEventsForDigest(since);

    if (events.length === 0) {
      return NextResponse.json({ message: "No events this week, skipping digest" });
    }

    // Get week key for dedup
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

    // Get all active subscribers
    const { data: subscribers } = await getSupabaseAdmin()
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"]);

    if (!subscribers?.length) {
      return NextResponse.json({ message: "No active subscribers" });
    }

    // Check digest log for already-sent
    const { data: alreadySent } = await getSupabaseAdmin()
      .from("email_digest_log")
      .select("user_email")
      .eq("week_key", weekKey);

    const sentEmails = new Set((alreadySent ?? []).map((r) => r.user_email));
    const toSend = subscribers.filter((s) => !sentEmails.has(s.email));

    if (toSend.length === 0) {
      return NextResponse.json({ message: "All digests already sent this week" });
    }

    // Send digests
    let sent = 0;
    let failed = 0;

    for (const sub of toSend) {
      try {
        // Default to Spanish locale (most users), could be made per-user later
        await sendDigestEmail(sub.email, events, "es");

        // Log sent
        await getSupabaseAdmin()
          .from("email_digest_log")
          .insert({ user_email: sub.email, week_key: weekKey });

        sent++;
      } catch (e) {
        console.error(`Failed to send digest to ${sub.email}:`, e);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      week_key: weekKey,
      events_count: events.length,
      sent,
      failed,
      skipped: sentEmails.size,
    });
  } catch (error) {
    console.error("Email digest cron error:", error);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}
