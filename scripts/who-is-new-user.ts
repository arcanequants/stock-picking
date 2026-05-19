/**
 * Quick: who signed up since May 14 and what status?
 *   - auth.users created since SINCE
 *   - cross-reference subscribers table (paid?)
 *   - for paid, fetch the Stripe price
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SINCE = process.argv[2] ?? "2026-05-14";
const sinceMs = new Date(`${SINCE}T00:00:00Z`).getTime();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. All auth.users (paginated)
  const allUsers: Array<{ id: string; email: string | null; created_at: string }> = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    allUsers.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at })));
    if (data.users.length < 1000) break;
    page++;
  }

  const recent = allUsers
    .filter((u) => new Date(u.created_at).getTime() >= sinceMs)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  console.log(`\n=== auth.users since ${SINCE} ===`);
  console.log(`Total auth.users: ${allUsers.length}`);
  console.log(`New since ${SINCE}: ${recent.length}\n`);

  // 2. subscribers table
  const { data: subRows } = await supabase
    .from("subscribers")
    .select("email, subscription_status, delivery_channel, stripe_customer_id, stripe_subscription_id, created_at");
  type SubRow = NonNullable<typeof subRows>[number];
  const subByEmail = new Map<string, SubRow>();
  for (const s of subRows ?? []) {
    if (s.email) subByEmail.set(s.email.toLowerCase(), s);
  }

  for (const u of recent) {
    const sub = u.email ? subByEmail.get(u.email.toLowerCase()) : undefined;
    const status = sub ? `PAID: ${sub.subscription_status} (${sub.delivery_channel ?? "—"})` : "FREE (auth only)";
    let priceLine = "";
    if (sub?.stripe_subscription_id) {
      try {
        const s = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
          expand: ["items.data.price"],
        });
        const p = s.items.data[0]?.price;
        if (p?.unit_amount != null && p.currency) {
          priceLine = `   $${(p.unit_amount / 100).toFixed(2)} ${p.currency.toUpperCase()} / ${p.recurring?.interval ?? "—"}`;
        }
      } catch (e) {
        priceLine = `   (stripe lookup failed: ${(e as Error).message})`;
      }
    }
    console.log(`• ${u.email ?? "(no email)"} | created ${u.created_at} | ${status}`);
    if (priceLine) console.log(priceLine);
  }
  console.log();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
