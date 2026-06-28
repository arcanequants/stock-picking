import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

// One free month = $1 credit (the monthly price). Stripe wants the smallest
// currency unit; a NEGATIVE balance transaction is a credit toward the next invoice.
const MONTH_CREDIT_CENTS = 100;

// Unambiguous charset (no 0/O, 1/I/L).
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = 7): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return s;
}

/** Get (or lazily create) the caller's referral code. */
export async function getOrCreateReferralCode(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("referral_codes")
    .select("code")
    .eq("user_email", normalized)
    .maybeSingle();
  if (existing?.code) return existing.code;

  // Insert with a few retries to dodge the rare unique collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { error } = await admin
      .from("referral_codes")
      .insert({ user_email: normalized, code });
    if (!error) return code;
    // If the row (by user_email PK) already exists, fetch and return it.
    const { data } = await admin
      .from("referral_codes")
      .select("code")
      .eq("user_email", normalized)
      .maybeSingle();
    if (data?.code) return data.code;
  }
  throw new Error("could_not_generate_referral_code");
}

/**
 * Attribute a new signup to a referral code. Idempotent and defensive:
 * never throws — referral attribution must never block signup.
 */
export async function attachReferral(
  referredEmail: string,
  code: string
): Promise<void> {
  try {
    const referred = referredEmail.toLowerCase().trim();
    const admin = getSupabaseAdmin();

    const { data: owner } = await admin
      .from("referral_codes")
      .select("user_email")
      .eq("code", code.toUpperCase().trim())
      .maybeSingle();
    if (!owner?.user_email) return; // unknown code
    if (owner.user_email === referred) return; // can't refer yourself

    // Only the FIRST referral for this person sticks (referred_email is UNIQUE).
    await admin.from("referrals").insert({
      referrer_email: owner.user_email,
      referred_email: referred,
      code: code.toUpperCase().trim(),
      status: "pending",
    });
  } catch (e) {
    console.error("attachReferral failed:", (e as Error).message);
  }
}

/**
 * Mark a referred user's pending referral as converted (they paid) and reward
 * the referrer with +1 free month. Stripe referrers get an automatic balance
 * credit; Apple/other referrers accrue an unapplied credit (Offer Code later).
 * Never throws — must never break payment processing.
 */
export async function convertReferral(referredEmail: string): Promise<void> {
  try {
    const referred = referredEmail.toLowerCase().trim();
    const admin = getSupabaseAdmin();

    const { data: ref } = await admin
      .from("referrals")
      .select("id, referrer_email, status")
      .eq("referred_email", referred)
      .eq("status", "pending")
      .maybeSingle();
    if (!ref) return; // no pending referral for this payer

    await admin
      .from("referrals")
      .update({ status: "converted", converted_at: new Date().toISOString() })
      .eq("id", ref.id);

    // Try to apply the reward immediately via Stripe if the referrer has a
    // Stripe customer; otherwise leave it unapplied for an Apple Offer Code.
    let applied = false;
    let appliedVia: string | null = null;
    try {
      const { data: referrerSub } = await admin
        .from("subscribers")
        .select("stripe_customer_id")
        .eq("email", ref.referrer_email)
        .maybeSingle();
      const customerId = referrerSub?.stripe_customer_id as string | undefined;
      if (customerId) {
        await getStripe().customers.createBalanceTransaction(customerId, {
          amount: -MONTH_CREDIT_CENTS,
          currency: "usd",
          description: "Referral reward: 1 free month",
        });
        applied = true;
        appliedVia = "stripe_balance";
      }
    } catch (e) {
      console.error("Referral Stripe credit failed:", (e as Error).message);
    }

    await admin.from("referral_credits").insert({
      user_email: ref.referrer_email,
      months_granted: 1,
      source_referral_id: ref.id,
      applied,
      applied_via: appliedVia,
    });
  } catch (e) {
    console.error("convertReferral failed:", (e as Error).message);
  }
}

/** Summary for the account UI. */
export async function getReferralSummary(email: string): Promise<{
  code: string;
  referred: number;
  converted: number;
  monthsEarned: number;
}> {
  const normalized = email.toLowerCase().trim();
  const admin = getSupabaseAdmin();
  const code = await getOrCreateReferralCode(normalized);

  const { data: refs } = await admin
    .from("referrals")
    .select("status")
    .eq("referrer_email", normalized);
  const referred = refs?.length ?? 0;
  const converted = (refs ?? []).filter((r) => r.status === "converted").length;

  const { data: credits } = await admin
    .from("referral_credits")
    .select("months_granted")
    .eq("user_email", normalized);
  const monthsEarned = (credits ?? []).reduce(
    (sum, c) => sum + (c.months_granted ?? 0),
    0
  );

  return { code, referred, converted, monthsEarned };
}
