import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendFreeSignupAlertToAdmin } from "@/lib/resend";
import { ADMIN_EMAIL } from "@/lib/admin";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRIAL_DAYS = 14;

// Block the most common disposable-email domains so one person can't farm
// unlimited free trials. Not exhaustive — a proportionate guard for a $1 product.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "yopmail.com", "throwawaymail.com", "getnada.com",
  "trashmail.com", "sharklasers.com", "guerrillamailblock.com", "maildrop.cc",
  "dispostable.com", "fakeinbox.com", "mintemail.com", "mohmal.com",
  "emailondeck.com", "tempr.email",
]);

export async function POST(request: Request) {
  try {
    const { email, source } = (await request.json()) as {
      email?: string;
      source?: string;
    };

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split("@")[1] ?? "";
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ error: "disposable_email" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // One trial per email: if a subscribers row already exists (trial, paid, or
    // expired), don't start another. Idempotent success.
    const { data: existingSub } = await supabase
      .from("subscribers")
      .select("email, subscription_status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json({ success: true, already: true });
    }

    // Ensure a Supabase Auth user exists (auto-confirmed, no password).
    const { data: allUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const userExists = allUsers?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );
    if (!userExists) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });
      if (createError) {
        console.error("Free register error:", createError);
        return NextResponse.json({ error: "creation_failed" }, { status: 500 });
      }
    }

    // Start the 14-day free trial: a subscribers row gated by status='trialing'.
    // No card, no Stripe — the trial-expiry cron downgrades it at day 14.
    const nowIso = new Date().toISOString();
    const trialEndsIso = new Date(
      Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const { error: subError } = await supabase.from("subscribers").insert({
      email: normalizedEmail,
      subscription_status: "trialing",
      subscription_source: "trial",
      delivery_channel: "email",
      access_started_at: nowIso,
      current_period_start: nowIso,
      current_period_end: trialEndsIso,
      trial_ends_at: trialEndsIso,
    });
    if (subError) {
      console.error("Trial subscriber insert error:", subError);
      return NextResponse.json({ error: "trial_failed" }, { status: 500 });
    }

    console.log("Trial started:", normalizedEmail);

    // Fire-and-forget admin alert — never block signup on email failure.
    const totalFreeUsers = (allUsers?.users?.length ?? 0) + (userExists ? 0 : 1);
    sendFreeSignupAlertToAdmin(ADMIN_EMAIL, {
      email: normalizedEmail,
      source: source ?? null,
      totalFreeUsers,
    }).catch((e) => console.error("Free signup admin alert failed:", e));

    return NextResponse.json({
      success: true,
      trial: true,
      trial_ends_at: trialEndsIso,
    });
  } catch (err) {
    console.error("Free register error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
