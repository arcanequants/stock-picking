/**
 * Daily audit: walk every active Stripe subscription and compare
 * status + current_period_end against Supabase. Alert admin on drift.
 *
 * Catches dropped webhook events (status mismatch, stale period_end)
 * regardless of root cause (URL misconfig, deploy bug, Vercel outage).
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { sendStripeSyncDriftAlertToAdmin } from "@/lib/resend";
import { ADMIN_EMAIL } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Mismatch = {
  email: string | null;
  subId: string;
  issue: string;
  stripeStatus: string;
  dbStatus: string | null | undefined;
  stripePeriodEnd: string;
  dbPeriodEnd: string | null | undefined;
};

function normalizeIso(s: string | null | undefined): string | null {
  if (!s) return null;
  try {
    return new Date(s).toISOString();
  } catch {
    return s;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  const subs: Stripe.Subscription[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.subscriptions.list({
      status: "all",
      limit: 100,
      starting_after,
      expand: ["data.customer"],
    });
    subs.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1].id;
  }

  const mismatches: Mismatch[] = [];

  for (const sub of subs) {
    const customer =
      typeof sub.customer === "string" ? null : (sub.customer as Stripe.Customer);
    const email = customer?.email?.toLowerCase() ?? null;
    const item = sub.items.data[0];
    const stripePeriodEnd = item
      ? new Date(item.current_period_end * 1000).toISOString()
      : "—";

    if (!email) continue; // no email → can't reconcile

    const { data: row } = await supabase
      .from("subscribers")
      .select("subscription_status, current_period_end")
      .eq("email", email)
      .maybeSingle();

    if (!row) {
      // active sub in Stripe but no row in DB
      if (sub.status === "active" || sub.status === "trialing") {
        mismatches.push({
          email,
          subId: sub.id,
          issue: "MISSING in subscribers",
          stripeStatus: sub.status,
          dbStatus: null,
          stripePeriodEnd,
          dbPeriodEnd: null,
        });
      }
      continue;
    }

    const statusOk = row.subscription_status === sub.status;
    const dbPeriodEndNorm = normalizeIso(row.current_period_end as string | null);
    const stripePeriodEndNorm = normalizeIso(stripePeriodEnd);
    const periodMatches =
      stripePeriodEnd === "—" || dbPeriodEndNorm === stripePeriodEndNorm;

    if (!statusOk || !periodMatches) {
      mismatches.push({
        email,
        subId: sub.id,
        issue: !statusOk ? "status mismatch" : "period_end stale",
        stripeStatus: sub.status,
        dbStatus: row.subscription_status,
        stripePeriodEnd,
        dbPeriodEnd: row.current_period_end as string | null,
      });
    }
  }

  if (mismatches.length > 0) {
    await sendStripeSyncDriftAlertToAdmin(ADMIN_EMAIL, mismatches);
  }

  return NextResponse.json({
    ok: true,
    scanned: subs.length,
    mismatches: mismatches.length,
  });
}
