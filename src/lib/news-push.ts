import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredPlatforms, deadTokens, sendPushMany } from "@/lib/push";
import type { NewsRegion, NewsTopic } from "@/lib/news-classify";

/**
 * Audience- and preference-aware push fan-out for a single app_news row.
 *
 * Audience (subscription tier) works exactly as before:
 * - `'all'`     → every active device token (iOS + Android)
 * - `'premium'` → only devices whose user has an active/trialing subscription
 * - `'free'`    → only devices whose user is NOT an active/trialing subscriber
 *
 * On top of that, user_news_prefs filters WHO gets the instant push:
 * - delivery 'none'  → never pushed (they read in-app)
 * - delivery 'daily' → skipped here; the news-digest cron bundles it at 8:00
 * - delivery 'instant' (or no row at all → default everything-on):
 *     · a news whose tickers intersect the user's bought picks ALWAYS goes
 *       through ("Mis picks" is always on)
 *     · otherwise the news topic must be enabled, and the news regions must
 *       intersect the user's regions (a 'global' news passes everyone).
 *
 * Marks store-rejected tokens (APNs 410 / FCM UNREGISTERED) as inactive so
 * the next push doesn't retry them. Returns delivery counts so the caller
 * can update `app_news.push_sent_at` + `push_sent_count`.
 */

export interface NewsPushTargeting {
  topic: NewsTopic;
  regions: NewsRegion[];
  tickers: string[];
}

interface PrefsRow {
  email: string;
  topics: string[];
  regions: string[];
  delivery: "instant" | "daily" | "none";
}

/** Topic/region/ticker match, ignoring delivery (shared with the digest). */
export function prefsMatchNews(
  prefs: Pick<PrefsRow, "topics" | "regions"> | undefined,
  news: NewsPushTargeting,
  ownsMatchingPick: boolean,
): boolean {
  if (!prefs) return true;
  if (ownsMatchingPick) return true;

  // A 'picks' news the user doesn't hold reads like company news.
  const effectiveTopic = news.topic === "picks" ? "companies" : news.topic;
  if (!prefs.topics.includes(effectiveTopic)) return false;

  if (news.regions.includes("global")) return true;
  return news.regions.some((r) => prefs.regions.includes(r));
}

/** Decide whether one user's prefs accept this news as an instant push. */
export function prefsAcceptNews(
  prefs: PrefsRow | undefined,
  news: NewsPushTargeting,
  ownsMatchingPick: boolean,
): boolean {
  // No row → default everything-on, instant (backwards compatible).
  if (!prefs) return true;
  if (prefs.delivery !== "instant") return false;
  return prefsMatchNews(prefs, news, ownsMatchingPick);
}

export async function sendNewsPush(news: {
  id: string;
  headline: string;
  body: string;
  audience: "all" | "premium" | "free";
  targeting?: NewsPushTargeting;
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

  // Preference filtering — only when the news carries targeting metadata;
  // legacy callers without it keep the old everyone-gets-it behavior.
  if (news.targeting && rows.length > 0) {
    const emails = [
      ...new Set(rows.map((r) => r.email).filter(Boolean)),
    ] as string[];

    const { data: prefRows } = await admin
      .from("user_news_prefs")
      .select("email, topics, regions, delivery")
      .in("email", emails);
    const prefsByEmail = new Map<string, PrefsRow>(
      ((prefRows ?? []) as PrefsRow[]).map((p) => [p.email, p]),
    );

    let holders = new Set<string>();
    if (news.targeting.tickers.length > 0) {
      const { data: pickRows } = await admin
        .from("user_pick_status")
        .select("email")
        .eq("status", "bought")
        .in("ticker", news.targeting.tickers)
        .in("email", emails);
      holders = new Set((pickRows ?? []).map((p) => p.email));
    }

    rows = rows.filter((r) => {
      // Tokens without an email can't have prefs — default behavior.
      if (!r.email) return true;
      return prefsAcceptNews(
        prefsByEmail.get(r.email),
        news.targeting!,
        holders.has(r.email),
      );
    });
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
