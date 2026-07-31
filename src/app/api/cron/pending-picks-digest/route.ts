import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { configuredPlatforms, sendPushMany, type PushDevice } from "@/lib/push";
import { transactions } from "@/data/stocks";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/pending-picks-digest — Friday 18:00.
 *
 * Per Alberto's "Version A — logros" spec:
 *   1. Count picks released this week (Mon–Fri).
 *   2. For every iOS-active subscriber count how many they bought this week
 *      and how many TOTAL picks they still have pending (never auto-expires).
 *   3. Push the recap.
 *
 * Empty pushes are skipped: if a user has zero pending AND zero bought this
 * week, they get nothing — no point in waking the phone.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.APNS_TEAM_ID) {
    return NextResponse.json({
      message: "APNs not configured, skipping",
    });
  }

  const admin = getSupabaseAdmin();

  // Sunday-anchored Mon–Fri window. The cron fires Friday 18:00 local TZ but
  // Vercel crons run in UTC; the 7-day rolling window is robust either way.
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000)
    .toISOString()
    .slice(0, 10);

  const thisWeekPicks = transactions
    .map((tx, idx) => ({ pick_number: idx + 1, ticker: tx.ticker, date: tx.date }))
    .filter((p) => p.date >= sevenDaysAgo);

  // All active devices (iOS + Android) that could receive a digest.
  const { data: tokens, error: tokensErr } = await admin
    .from("device_tokens")
    .select("email, token, platform")
    .in("platform", configuredPlatforms())
    .eq("is_active", true);

  if (tokensErr) {
    console.error("[pending-picks-digest] token fetch failed:", tokensErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Group devices by email so each user can receive on every device.
  const tokensByEmail = new Map<string, PushDevice[]>();
  for (const t of tokens ?? []) {
    const email = t.email.toLowerCase();
    const list = tokensByEmail.get(email) ?? [];
    list.push({ token: t.token, platform: t.platform });
    tokensByEmail.set(email, list);
  }

  if (tokensByEmail.size === 0) {
    return NextResponse.json({ message: "No active device tokens" });
  }

  // Pull every decision row for these users in one query.
  const emails = Array.from(tokensByEmail.keys());
  const { data: decisions } = await admin
    .from("user_pick_status")
    .select("email, pick_number, status, decided_at")
    .in("email", emails);

  // Per-user access cutoff — same rule as the picks feed: picks published
  // before the account gained access are context, NOT the user's homework.
  // Without this, a brand-new user got "Tienes 137 picks pendientes".
  const { data: subRows } = await admin
    .from("subscribers")
    .select("email, access_started_at")
    .in("email", emails);
  const accessByEmail = new Map<string, string>();
  for (const s of subRows ?? []) {
    if (s.email && s.access_started_at) {
      accessByEmail.set(s.email.toLowerCase(), s.access_started_at.slice(0, 10));
    }
  }

  type Decision = {
    email: string;
    pick_number: number;
    status: "bought" | "skipped";
    decided_at: string;
  };
  const byEmail = new Map<string, Decision[]>();
  for (const d of (decisions ?? []) as Decision[]) {
    const arr = byEmail.get(d.email) ?? [];
    arr.push(d);
    byEmail.set(d.email, arr);
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const deadTokens: string[] = [];

  for (const [email, deviceTokens] of tokensByEmail) {
    const decided = byEmail.get(email) ?? [];
    const decidedPickNumbers = new Set(decided.map((d) => d.pick_number));

    const boughtThisWeek = decided.filter(
      (d) =>
        d.status === "bought" &&
        thisWeekPicks.some((p) => p.pick_number === d.pick_number),
    ).length;

    // Only picks published since this account's access started count as
    // pending. No access date (legacy web subscribers, pre-tracking) keeps
    // the full count — those accounts really did have access all along.
    const accessDate = accessByEmail.get(email);
    const totalPending = transactions.filter(
      (tx, idx) =>
        !decidedPickNumbers.has(idx + 1) &&
        (!accessDate || tx.date >= accessDate),
    ).length;

    // Skip users with nothing actionable to surface.
    if (boughtThisWeek === 0 && totalPending === 0) {
      skipped++;
      continue;
    }

    const body = buildBody(boughtThisWeek, totalPending);

    const results = await sendPushMany(deviceTokens, {
      title: "Recap semanal",
      body,
      threadId: "weekly-digest",
      data: { kind: "weekly_digest" },
    });

    for (const r of results) {
      if (r.ok) sent++;
      else {
        failed++;
        if (r.dead) deadTokens.push(r.token);
      }
    }
  }

  if (deadTokens.length > 0) {
    await admin
      .from("device_tokens")
      .update({ is_active: false })
      .in("token", deadTokens);
  }

  return NextResponse.json({
    sent,
    skipped_users: skipped,
    failed,
    dead_tokens: deadTokens.length,
  });
}

function buildBody(boughtThisWeek: number, totalPending: number): string {
  // Logros first, pendientes after — Version A framing.
  if (boughtThisWeek > 0 && totalPending > 0) {
    return `${boughtThisWeek} ${plural(boughtThisWeek, "comprado", "comprados")} esta semana · ${totalPending} ${plural(totalPending, "pendiente", "pendientes")}`;
  }
  if (boughtThisWeek > 0) {
    return `${boughtThisWeek} ${plural(boughtThisWeek, "comprado", "comprados")} esta semana · al día con los picks`;
  }
  return `Tienes ${totalPending} ${plural(totalPending, "pick pendiente", "picks pendientes")}`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
