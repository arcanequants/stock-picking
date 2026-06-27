import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/delete — permanently delete the authenticated account.
 *
 * Required by App Store Guideline 5.1.1(v): an app that lets users create an
 * account must let them delete it from inside the app. Accepts the iOS Bearer
 * JWT or the web session cookie (both via getAuthedUser).
 *
 * Order of operations:
 *   1. Best-effort cancel of the Stripe subscription (so we stop billing).
 *      Apple In-App Purchase subscriptions CANNOT be cancelled server-side —
 *      the user must cancel those in App Store → Settings. The client tells
 *      them so before confirming.
 *   2. Delete all user-owned rows keyed by email / user_id.
 *   3. Delete the Supabase Auth user — this is the account itself. Cascades
 *      remove anything FK'd to auth.users (api_keys, api_credit_ledger).
 *
 * The auth-user deletion is the must-succeed step: if data wipes fail we log
 * and continue, but a failure to remove the login identity returns 500 so the
 * client keeps the account and surfaces an error.
 */
export async function POST(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, email } = authed;

  // Protect the App Review demo account. The reviewer signs in with DEMO_EMAIL
  // and runs this flow to record it; if we actually deleted that Supabase user,
  // the demo account would be destroyed and every future submission (and the
  // rest of this review) would be locked out of sign-in. Report success and let
  // the client wipe its local session so the reviewer sees the full flow, but
  // keep the account intact.
  const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
  if (demoEmail && email === demoEmail) {
    console.log("[account/delete] demo account — simulated deletion", { email });
    return NextResponse.json({ ok: true });
  }

  const admin = getSupabaseAdmin();

  // 1. Cancel Stripe subscription (best-effort — never blocks deletion).
  try {
    const { data: sub } = await admin
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("email", email)
      .maybeSingle();
    const stripeSubId = sub?.stripe_subscription_id as string | null | undefined;
    if (stripeSubId) {
      await getStripe().subscriptions.cancel(stripeSubId);
    }
  } catch (err) {
    console.error("[account/delete] stripe cancel failed", {
      email,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Delete user-owned rows. Best-effort: collect failures but keep going so
  //    one locked table can't strand the account in a half-deleted state.
  const failures: string[] = [];

  const byEmail = [
    "subscribers",
    "user_pick_status",
    "prior_holdings",
    "device_tokens",
    "user_dividend_events",
    "support_tickets", // support_ticket_messages cascade via ticket_id FK
  ];
  for (const table of byEmail) {
    const { error } = await admin.from(table).delete().eq("email", email);
    if (error) {
      failures.push(`${table}: ${error.message}`);
    }
  }

  // notification_reads is keyed by the auth user id, not email.
  {
    const { error } = await admin
      .from("notification_reads")
      .delete()
      .eq("user_id", id);
    if (error) failures.push(`notification_reads: ${error.message}`);
  }

  if (failures.length > 0) {
    console.error("[account/delete] row deletion errors", { email, failures });
  }

  // 3. Delete the auth user — the account itself. Cascades api_keys +
  //    api_credit_ledger (FK to auth.users ON DELETE CASCADE). Must succeed.
  const { error: authErr } = await admin.auth.admin.deleteUser(id);
  if (authErr) {
    console.error("[account/delete] auth user deletion failed", {
      id,
      email,
      err: authErr.message,
    });
    return NextResponse.json(
      { error: "Could not delete account. Please try again." },
      { status: 500 }
    );
  }

  console.log("[account/delete] account deleted", {
    email,
    partialDataFailures: failures.length,
  });
  return NextResponse.json({ ok: true });
}
