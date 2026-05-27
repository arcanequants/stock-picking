import { getSupabaseAdmin } from "@/lib/supabase";
import { sendAPNsMany } from "@/lib/apns";

/**
 * Audience-aware push fan-out for a single app_news row.
 *
 * - `'all'`   → every active iOS device token
 * - `'premium'` → only devices whose user has an active/trialing subscription
 *
 * Marks 410 BadDeviceToken / Unregistered responses as inactive so the
 * next push doesn't retry them. Returns delivery counts so the caller
 * can update `app_news.push_sent_at` + `push_sent_count`.
 */
export async function sendNewsPush(news: {
  id: string;
  headline: string;
  body: string;
  audience: "all" | "premium";
}): Promise<{ sent: number; failed: number; deactivated: number }> {
  const admin = getSupabaseAdmin();

  let emails: string[] | null = null;
  if (news.audience === "premium") {
    const { data: subs } = await admin
      .from("subscribers")
      .select("email")
      .in("subscription_status", ["active", "trialing"]);
    emails = (subs ?? []).map((s) => s.email);
    if (emails.length === 0) return { sent: 0, failed: 0, deactivated: 0 };
  }

  let query = admin
    .from("device_tokens")
    .select("token")
    .eq("platform", "ios")
    .eq("is_active", true);
  if (emails) query = query.in("email", emails);

  const { data: tokenRows } = await query;
  const tokens = (tokenRows ?? []).map((r) => r.token);
  if (tokens.length === 0) return { sent: 0, failed: 0, deactivated: 0 };

  // First line of body becomes the push subtitle (lockscreen-friendly).
  const subtitle = news.body.split("\n")[0]?.trim().slice(0, 140);

  const results = await sendAPNsMany(tokens, {
    aps: {
      alert: {
        title: news.headline,
        body: subtitle,
      },
      sound: "default",
      "thread-id": "news",
    },
    kind: "news",
    news_id: news.id,
  });

  const dead: string[] = [];
  let sent = 0;
  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      sent++;
    } else {
      failed++;
      if (r.status === 410 || r.reason === "BadDeviceToken" || r.reason === "Unregistered") {
        dead.push(r.token);
      }
    }
  }

  if (dead.length > 0) {
    await admin
      .from("device_tokens")
      .update({ is_active: false })
      .in("token", dead);
  }

  return { sent, failed, deactivated: dead.length };
}
