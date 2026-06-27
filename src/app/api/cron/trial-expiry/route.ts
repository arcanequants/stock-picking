import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTrialReminderEmail } from "@/lib/trial-emails";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily cron. For WEB free trials only (subscription_source='trial'):
//   1. Downgrade trials whose trial_ends_at has passed (trialing -> canceled).
//   2. Send reminder emails at halfway (<=7 days left) and ending (<=1 day left).
// trial_reminder_stage makes both idempotent: 0=none, 1=halfway, 2=ending, 3=expired.
// Apple/Stripe subscriptions are never touched here — their billers own renewal.

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  let expired = 0;
  let halfway = 0;
  let ending = 0;

  // 1) Expire overdue trials; send the "expired" email once (stage -> 3).
  const { data: overdue, error: overdueErr } = await admin
    .from("subscribers")
    .select("email, trial_reminder_stage")
    .eq("subscription_source", "trial")
    .eq("subscription_status", "trialing")
    .lt("trial_ends_at", nowIso)
    .limit(500);

  if (overdueErr) {
    return NextResponse.json({ error: overdueErr.message }, { status: 500 });
  }

  for (const sub of overdue ?? []) {
    try {
      await admin
        .from("subscribers")
        .update({ subscription_status: "canceled", trial_reminder_stage: 3 })
        .eq("email", sub.email);
      expired++;
      if ((sub.trial_reminder_stage ?? 0) < 3) {
        await sendTrialReminderEmail(sub.email, "expired");
      }
    } catch (e) {
      console.error("Trial expire failed:", sub.email, (e as Error).message);
    }
  }

  // 2) Reminders for still-active trials.
  const { data: actives, error: activesErr } = await admin
    .from("subscribers")
    .select("email, trial_ends_at, trial_reminder_stage")
    .eq("subscription_source", "trial")
    .eq("subscription_status", "trialing")
    .not("trial_ends_at", "is", null)
    .limit(500);

  if (activesErr) {
    return NextResponse.json({ error: activesErr.message }, { status: 500 });
  }

  for (const sub of actives ?? []) {
    const stage = sub.trial_reminder_stage ?? 0;
    const daysLeft = Math.ceil(
      (new Date(sub.trial_ends_at as string).getTime() - now) / DAY
    );
    try {
      if (daysLeft <= 1 && stage < 2) {
        await sendTrialReminderEmail(sub.email, "ending");
        await admin
          .from("subscribers")
          .update({ trial_reminder_stage: 2 })
          .eq("email", sub.email);
        ending++;
      } else if (daysLeft <= 7 && stage < 1) {
        await sendTrialReminderEmail(sub.email, "halfway");
        await admin
          .from("subscribers")
          .update({ trial_reminder_stage: 1 })
          .eq("email", sub.email);
        halfway++;
      }
    } catch (e) {
      console.error("Trial reminder failed:", sub.email, (e as Error).message);
    }
  }

  return NextResponse.json({ success: true, expired, halfway, ending });
}
