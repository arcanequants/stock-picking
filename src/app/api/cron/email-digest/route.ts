import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getEventsForDigest } from "@/lib/notifications";
import { sendDigestApprovalEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMIN_EMAIL = "0138078@up.edu.mx";

export function generateApprovalToken(weekKey: string): string {
  const secret = process.env.RESEND_API_KEY;
  if (!secret) throw new Error("RESEND_API_KEY not configured");
  return crypto.createHmac("sha256", secret).update(weekKey).digest("hex");
}

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

    // Check if already sent this week
    const { data: alreadySent } = await getSupabaseAdmin()
      .from("email_digest_log")
      .select("user_email")
      .eq("week_key", weekKey)
      .limit(1);

    if (alreadySent && alreadySent.length > 0) {
      return NextResponse.json({ message: "Digest already sent this week", week_key: weekKey });
    }

    // Count recipients for the preview
    const { data: subscribers } = await getSupabaseAdmin()
      .from("subscribers")
      .select("email, subscription_status")
      .in("subscription_status", ["active", "trialing"]);

    const premiumCount = (subscribers ?? []).length;

    const supabaseAdmin = getSupabaseAdmin();
    const allUsers: string[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error || !users?.length) break;
      for (const u of users) {
        if (u.email) allUsers.push(u.email.toLowerCase());
      }
      if (users.length < perPage) break;
      page++;
    }
    const recipientCount = new Set(allUsers).size;

    // Generate HMAC approval token
    const token = generateApprovalToken(weekKey);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vectorialdata.com";
    const approveUrl = `${baseUrl}/api/cron/email-digest/approve?week=${encodeURIComponent(weekKey)}&token=${token}`;

    // Send preview to admin only
    await sendDigestApprovalEmail(
      ADMIN_EMAIL,
      events,
      approveUrl,
      weekKey,
      recipientCount,
      premiumCount
    );

    return NextResponse.json({
      success: true,
      preview_sent_to: ADMIN_EMAIL,
      week_key: weekKey,
      events_count: events.length,
      recipients: recipientCount,
      premium: premiumCount,
      free: recipientCount - premiumCount,
    });
  } catch (error) {
    console.error("Email digest cron error:", error);
    return NextResponse.json(
      { error: "Failed to send digest preview" },
      { status: 500 }
    );
  }
}
