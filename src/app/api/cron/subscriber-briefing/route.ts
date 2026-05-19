import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { sendWeeklySubscriberBriefingToAdmin } from "@/lib/resend";
import { ADMIN_EMAIL } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function weekKey(now: Date): string {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

async function listAllActiveStripeSubs(stripe: Stripe): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.subscriptions.list({
      limit: 100,
      status: "active",
      starting_after,
      expand: ["data.items.data.price"],
    });
    out.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return out;
}

function monthlyAmountUsd(sub: Stripe.Subscription): number {
  const item = sub.items.data[0];
  const price = item?.price;
  if (!price || typeof price.unit_amount !== "number") return 0;
  const amountUsd = price.unit_amount / 100;
  const interval = price.recurring?.interval;
  const intervalCount = price.recurring?.interval_count ?? 1;
  if (interval === "month") return amountUsd / intervalCount;
  if (interval === "year") return amountUsd / 12 / intervalCount;
  if (interval === "week") return (amountUsd * 4.33) / intervalCount;
  if (interval === "day") return (amountUsd * 30) / intervalCount;
  return amountUsd;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();
    const sevenDaysAgoUnix = Math.floor(sevenDaysAgo.getTime() / 1000);

    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    // --- New paid subs (last 7 days) ---
    const { data: newPaidRows } = await supabase
      .from("subscribers")
      .select("email, created_at, delivery_channel, stripe_subscription_id, subscription_status")
      .gte("created_at", sevenDaysAgoIso)
      .in("subscription_status", ["active", "trialing"])
      .order("created_at", { ascending: false });

    // Enrich with Stripe price (one bulk call rather than N)
    const stripeSubsRecent = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
      created: { gte: sevenDaysAgoUnix },
      expand: ["data.items.data.price"],
    });
    const subPriceMap = new Map<string, { amountCents: number | null; currency: string | null }>();
    for (const s of stripeSubsRecent.data) {
      const price = s.items.data[0]?.price;
      subPriceMap.set(s.id, {
        amountCents: typeof price?.unit_amount === "number" ? price.unit_amount : null,
        currency: price?.currency ?? null,
      });
    }

    const newPaidSubs = (newPaidRows ?? []).map((s) => {
      const priceInfo = subPriceMap.get(s.stripe_subscription_id) ?? {
        amountCents: null,
        currency: null,
      };
      return {
        email: s.email,
        createdAt: s.created_at,
        amountCents: priceInfo.amountCents,
        currency: priceInfo.currency,
        deliveryChannel: s.delivery_channel ?? "—",
      };
    });

    // --- Churned (canceled in last 7d) ---
    const { data: churnedRows } = await supabase
      .from("subscribers")
      .select("email, current_period_end, subscription_status")
      .in("subscription_status", ["canceled"])
      .gte("current_period_end", sevenDaysAgoIso)
      .order("current_period_end", { ascending: false });

    const churned = (churnedRows ?? []).map((s) => ({
      email: s.email,
      canceledAt: s.current_period_end,
    }));

    // --- New free signups (auth.users last 7d, NOT in subscribers) ---
    const paidEmails = new Set<string>();
    const { data: allSubs } = await supabase.from("subscribers").select("email");
    for (const s of allSubs ?? []) {
      if (s.email) paidEmails.add(s.email.toLowerCase());
    }

    const newFreeSubs: Array<{ email: string; createdAt: string }> = [];
    let totalAuthUsers = 0;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const {
        data: { users },
        error,
      } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error || !users?.length) break;
      totalAuthUsers += users.length;
      for (const u of users) {
        if (!u.email) continue;
        const lower = u.email.toLowerCase();
        if (paidEmails.has(lower)) continue;
        if (u.created_at && new Date(u.created_at) >= sevenDaysAgo) {
          newFreeSubs.push({ email: u.email, createdAt: u.created_at });
        }
      }
      if (users.length < perPage) break;
      page++;
    }
    newFreeSubs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // --- Crypto payers (last 7d, first payment) ---
    const { data: cryptoRows } = await supabase
      .from("x402_payers")
      .select("wallet, first_payment_at, total_paid_usd, request_count")
      .gte("first_payment_at", sevenDaysAgoIso)
      .order("first_payment_at", { ascending: false });

    const cryptoPayers = (cryptoRows ?? []).map((p) => ({
      wallet: p.wallet,
      firstPaymentAt: p.first_payment_at,
      totalPaidUsd: Number(p.total_paid_usd ?? 0),
      requestCount: p.request_count ?? 0,
    }));

    // --- Totals ---
    const activeStripeSubs = await listAllActiveStripeSubs(stripe);
    const mrrUsd = activeStripeSubs.reduce((sum, s) => sum + monthlyAmountUsd(s), 0);

    const cryptoRevenueWeekUsd = cryptoPayers.reduce((sum, p) => sum + p.totalPaidUsd, 0);

    const briefing = {
      weekKey: weekKey(now),
      newPaidSubs,
      churned,
      newFreeSubs,
      cryptoPayers,
      totals: {
        paidActive: activeStripeSubs.length,
        freeUsers: Math.max(0, totalAuthUsers - paidEmails.size),
        mrrUsd: Math.round(mrrUsd * 100) / 100,
        cryptoRevenueWeekUsd,
      },
    };

    await sendWeeklySubscriberBriefingToAdmin(ADMIN_EMAIL, briefing);

    return NextResponse.json({
      success: true,
      sent_to: ADMIN_EMAIL,
      ...briefing,
    });
  } catch (error) {
    console.error("Subscriber briefing cron error:", error);
    return NextResponse.json(
      { error: "Failed to send subscriber briefing" },
      { status: 500 }
    );
  }
}
