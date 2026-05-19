/**
 * Audit: find Stripe-paying customers missing/wrong in Supabase `subscribers`.
 *
 * Built after the 2026-05-14 → 2026-05-17 webhook 404 incident (Stripe Dashboard
 * had the endpoint URL misconfigured to /api/billing/webhook instead of
 * /api/webhooks/stripe). During that window any subscription events may have
 * been dropped, leaving paid customers without an active row in Supabase.
 *
 * Usage:
 *   pnpm tsx scripts/audit-subscribers.ts [since=YYYY-MM-DD]
 *
 * Default since: 2026-05-14 (the day Stripe started reporting 404s).
 *
 * Required env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SINCE = process.argv[2] ?? "2026-05-14";
const sinceTs = Math.floor(new Date(`${SINCE}T00:00:00Z`).getTime() / 1000);

const stripeKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing env: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const supabase = createClient(supabaseUrl, supabaseKey);

type Mismatch = {
  kind: "missing" | "wrong_status";
  customerId: string;
  email: string | null;
  subscriptionId: string;
  stripeStatus: string;
  dbStatus: string | null;
  createdAt: string;
  amountCents: number | null;
  currency: string | null;
};

async function listActiveSubsSince(since: number): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
      created: { gte: since },
      starting_after,
      expand: ["data.customer", "data.items.data.price"],
    });
    out.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return out;
}

async function main() {
  console.log(`Auditing Stripe subscriptions created since ${SINCE} (unix ${sinceTs})…\n`);

  const subs = await listActiveSubsSince(sinceTs);
  console.log(`Found ${subs.length} Stripe subscriptions in window.\n`);

  if (subs.length === 0) {
    console.log("No subscriptions in window — nothing to audit.");
    return;
  }

  const mismatches: Mismatch[] = [];

  for (const sub of subs) {
    const customer =
      typeof sub.customer === "string"
        ? null
        : (sub.customer as Stripe.Customer);
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const email = customer?.email ?? null;

    const price = sub.items.data[0]?.price;
    const amountCents = typeof price?.unit_amount === "number" ? price.unit_amount : null;
    const currency = price?.currency ?? null;

    const { data: row, error } = await supabase
      .from("subscribers")
      .select("subscription_status, email, stripe_subscription_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();

    if (error) {
      console.error(`  ⚠ Supabase error for sub ${sub.id}: ${error.message}`);
      continue;
    }

    const createdAt = new Date(sub.created * 1000).toISOString();

    if (!row) {
      mismatches.push({
        kind: "missing",
        customerId,
        email,
        subscriptionId: sub.id,
        stripeStatus: sub.status,
        dbStatus: null,
        createdAt,
        amountCents,
        currency,
      });
    } else if (row.subscription_status !== sub.status) {
      mismatches.push({
        kind: "wrong_status",
        customerId,
        email: email ?? row.email,
        subscriptionId: sub.id,
        stripeStatus: sub.status,
        dbStatus: row.subscription_status,
        createdAt,
        amountCents,
        currency,
      });
    }
  }

  console.log(`\n=== AUDIT RESULTS (since ${SINCE}) ===`);
  console.log(`Stripe subscriptions in window: ${subs.length}`);
  console.log(`Mismatches found: ${mismatches.length}`);

  if (mismatches.length === 0) {
    console.log("\n✅ All clean — every Stripe subscription has a matching subscribers row with the correct status.\n");
    return;
  }

  const missing = mismatches.filter((m) => m.kind === "missing");
  const wrong = mismatches.filter((m) => m.kind === "wrong_status");

  if (missing.length > 0) {
    console.log(`\n--- MISSING (paid in Stripe but no row in subscribers) — ${missing.length} ---`);
    for (const m of missing) {
      const amount = m.amountCents != null && m.currency
        ? `${(m.amountCents / 100).toFixed(2)} ${m.currency.toUpperCase()}`
        : "—";
      console.log(
        `  • ${m.email ?? "(no email)"} | sub=${m.subscriptionId} | customer=${m.customerId} | status=${m.stripeStatus} | created=${m.createdAt} | ${amount}`
      );
    }
  }

  if (wrong.length > 0) {
    console.log(`\n--- WRONG STATUS (Stripe ≠ subscribers.subscription_status) — ${wrong.length} ---`);
    for (const m of wrong) {
      console.log(
        `  • ${m.email ?? "(no email)"} | sub=${m.subscriptionId} | stripe=${m.stripeStatus} ≠ db=${m.dbStatus}`
      );
    }
  }

  console.log("\nNext steps:");
  console.log("  1. Stripe Dashboard → Developers → Events → filter by endpoint to find missed events.");
  console.log("  2. For each affected event, click 'Resend' to retry against the now-corrected URL.");
  console.log("  3. Re-run this audit; should be 0 mismatches when done.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  });
