/**
 * Audit existing-customer sync between Stripe (source of truth) and Supabase.
 *
 * The first audit only checked NEW subs created during the webhook 404 window.
 * Renewals/cancellations for EXISTING customers were also at risk: if the
 * webhook dropped `customer.subscription.updated` or `invoice.payment_*`
 * events, Supabase's `subscription_status` or `current_period_end` could be
 * stale even though Stripe is fine.
 *
 * Walks every active Stripe subscription and reports mismatches.
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
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
  console.log(`Pulled ${subs.length} total Stripe subscriptions (all statuses).\n`);

  const mismatches: Array<{
    email: string | null;
    subId: string;
    stripeStatus: string;
    dbStatus: string | null | undefined;
    stripePeriodEnd: string;
    dbPeriodEnd: string | null | undefined;
    issue: string;
  }> = [];

  for (const sub of subs) {
    const customer = typeof sub.customer === "string" ? null : (sub.customer as Stripe.Customer);
    const email = customer?.email?.toLowerCase() ?? null;
    const item = sub.items.data[0];
    const stripePeriodEnd = item ? new Date(item.current_period_end * 1000).toISOString() : "—";

    if (!email) {
      mismatches.push({
        email: null,
        subId: sub.id,
        stripeStatus: sub.status,
        dbStatus: "n/a",
        stripePeriodEnd,
        dbPeriodEnd: "n/a",
        issue: "no email on Stripe customer",
      });
      continue;
    }

    const { data: row } = await supabase
      .from("subscribers")
      .select("subscription_status, current_period_end, stripe_subscription_id")
      .eq("email", email)
      .maybeSingle();

    if (!row) {
      mismatches.push({
        email,
        subId: sub.id,
        stripeStatus: sub.status,
        dbStatus: null,
        stripePeriodEnd,
        dbPeriodEnd: null,
        issue: "MISSING in subscribers",
      });
      continue;
    }

    const statusOk = row.subscription_status === sub.status;
    const dbPeriodEnd = row.current_period_end ?? null;
    const periodMatches =
      stripePeriodEnd === "—" ||
      (typeof dbPeriodEnd === "string" && dbPeriodEnd === stripePeriodEnd);

    if (!statusOk || !periodMatches) {
      mismatches.push({
        email,
        subId: sub.id,
        stripeStatus: sub.status,
        dbStatus: row.subscription_status,
        stripePeriodEnd,
        dbPeriodEnd,
        issue: !statusOk ? "status mismatch" : "period_end stale",
      });
    }
  }

  if (mismatches.length === 0) {
    console.log("✅ All Stripe subscriptions are in sync with Supabase.");
    return;
  }

  console.log(`⚠ ${mismatches.length} mismatches found:\n`);
  for (const m of mismatches) {
    console.log(`• ${m.email ?? "(no email)"} | sub=${m.subId}`);
    console.log(`    issue: ${m.issue}`);
    console.log(`    stripe: status=${m.stripeStatus} period_end=${m.stripePeriodEnd}`);
    console.log(`    db:     status=${m.dbStatus ?? "(no row)"} period_end=${m.dbPeriodEnd ?? "(none)"}\n`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
