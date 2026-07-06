import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/supabase";
import {
  PLAY_SUBSCRIPTION_ID,
  acknowledgeIfPending,
  applyPlaySubscriptionForEmail,
  expiryOf,
  fetchSubscription,
  playConfigured,
  statusForSubscription,
} from "@/lib/google-play";

export const dynamic = "force-dynamic";

/**
 * POST /api/iap/verify-play
 * Android mirror of /api/iap/verify (Apple). Called by the Android app right
 * after a Play Billing purchase (or restore). Bearer-authed.
 *
 * Body: { purchaseToken: string }
 *
 * Looks the token up in the Play Developer API (the authoritative source —
 * nothing client-signed is trusted), confirms it's our subscription product,
 * acknowledges it, and marks the authenticated user's subscriber row.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!playConfigured()) {
      return NextResponse.json(
        { error: "Play billing not configured" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const purchaseToken: unknown = body?.purchaseToken;
    if (typeof purchaseToken !== "string" || !purchaseToken) {
      return NextResponse.json(
        { error: "Missing purchaseToken" },
        { status: 400 }
      );
    }

    let sub;
    try {
      sub = await fetchSubscription(purchaseToken);
    } catch (err) {
      console.error("Play verify: lookup failed:", err);
      return NextResponse.json({ error: "Invalid purchase" }, { status: 400 });
    }

    const ourProduct = (sub.lineItems ?? []).some(
      (li) => li.productId === PLAY_SUBSCRIPTION_ID
    );
    if (!ourProduct) {
      return NextResponse.json({ error: "Unknown product" }, { status: 400 });
    }

    const status = statusForSubscription(sub);
    const periodEnd = expiryOf(sub);

    await applyPlaySubscriptionForEmail(user.email, status, periodEnd);
    await acknowledgeIfPending(purchaseToken, sub);

    return NextResponse.json({
      // Both trialing and active grant full access (same contract as Apple).
      is_subscribed: status === "active" || status === "trialing",
      subscription_status: status,
      current_period_end: periodEnd ? periodEnd.toISOString() : null,
    });
  } catch (err) {
    console.error("Play verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
