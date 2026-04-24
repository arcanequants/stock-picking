import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWaJoinFollowupEmail } from "@/lib/resend";
import { buildTrackedWaUrl } from "@/lib/wa-track";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily cron. Finds subscribers who:
//   - paid 48h+ ago (subscription is active/trialing)
//   - chose WhatsApp delivery (or both)
//   - never clicked the WA join button
//   - haven't been nudged yet
// Sends a single, empathetic follow-up email and stamps wa_followup_sent_at
// to prevent future double-sends.

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

  if (!process.env.WHATSAPP_GROUP_LINK) {
    return NextResponse.json(
      { error: "WHATSAPP_GROUP_LINK not configured" },
      { status: 500 }
    );
  }

  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await admin
    .from("subscribers")
    .select("email, delivery_channel")
    .lt("created_at", cutoff)
    .is("wa_click_at", null)
    .is("wa_followup_sent_at", null)
    .in("delivery_channel", ["whatsapp", "both"])
    .in("subscription_status", ["active", "trialing"])
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl = getSiteUrl();
  const results: Array<{ email: string; sent: boolean; error?: string }> = [];

  for (const sub of candidates ?? []) {
    try {
      const trackedUrl = buildTrackedWaUrl(sub.email, siteUrl);
      await sendWaJoinFollowupEmail(sub.email, trackedUrl, "es");
      await admin
        .from("subscribers")
        .update({ wa_followup_sent_at: new Date().toISOString() })
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
