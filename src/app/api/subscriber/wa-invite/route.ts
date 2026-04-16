import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Returns the WhatsApp group invite link ONLY to:
 *   1. Authenticated users with an active/trialing subscription, OR
 *   2. Fresh post-checkout arrivals with a valid Stripe session_id (status=paid)
 *
 * The link itself is stored in WHATSAPP_GROUP_LINK env var — never in client source.
 */
export async function GET(request: Request) {
  const link = process.env.WHATSAPP_GROUP_LINK;
  if (!link) {
    console.error("WHATSAPP_GROUP_LINK not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  // Path 1: existing authenticated subscriber
  const { isSubscribed } = await getAuthState();
  if (isSubscribed) {
    return NextResponse.json({ link });
  }

  // Path 2: fresh post-checkout arrival — validate session_id against Stripe
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        return NextResponse.json({ link });
      }
    } catch (err) {
      console.error("Stripe session validation failed:", err);
    }
  }

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
