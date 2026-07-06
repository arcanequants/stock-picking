import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredPlatforms, deadTokens, sendPushMany } from "@/lib/push";

/**
 * Audience-aware push fan-out for a single app_news row.
 *
 * - `'all'`     → every active device token (iOS + Android)
 * - `'premium'` → only devices whose user has an active/trialing subscription
 * - `'free'`    → only devices whose user is NOT an active/trialing subscriber
 *                 (non-subscribers + lapsed/canceled), i.e. "all minus premium"
 *
 * Marks store-rejected tokens (APNs 410 / FCM UNREGISTERED) as inactive so
 * the next push doesn't retry them. Returns delivery counts so the caller
 * can update `app_news.push_sent_at` + `push_sent_count`.
 */
export async function sendNewsPush(news: {
  id: string;
  headline: string;
  body: string;
  audience: "all" | "premium" | "free";
}): Promise<{ sent: number; failed: number; deactivated: number }> {
  const admin = getSupabaseAdmin();

  let premiumEmails: Set<string> | null = null;
  if (news.audience === "premium" || news.audience === "free") {
    const { data: subs } = await admin
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"]);
    premiumEmails = new Set((subs ?? []).map((s) => s.email));
  }

  const platforms = configuredPlatforms();
  if (platforms.length === 0) return { sent: 0, failed: 0, deactivated: 0 };

  const { data: tokenRows } = await admin
    .from("device_tokens")
    .select("token, email, platform")
    .in("platform", platforms)
    .eq("is_active", true);

  let rows = tokenRows ?? [];
  if (news.audience === "premium") {
    rows = rows.filter((r) => r.email && premiumEmails!.has(r.email));
  } else if (news.audience === "free") {
    rows = rows.filter((r) => !r.email || !premiumEmails!.has(r.email));
  }

  if (rows.length === 0) return { sent: 0, failed: 0, deactivated: 0 };

  // First line of body becomes the push subtitle (lockscreen-friendly).
  const subtitle = news.body.split("\n")[0]?.trim().slice(0, 140);

  const results = await sendPushMany(rows, {
    title: news.headline,
    body: subtitle,
    threadId: "news",
    data: { kind: "news", news_id: news.id },
  });

  const dead = deadTokens(results);
  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  if (dead.length > 0) {
    await admin
      .from("device_tokens")
      .update({ is_active: false })
      .in("token", dead);
  }

  return { sent, failed, deactivated: dead.length };
}
