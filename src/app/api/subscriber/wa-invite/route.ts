import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { buildTrackedWaUrl } from "@/lib/wa-track";

export const dynamic = "force-dynamic";

/**
 * Returns a CLICK-TRACKED WhatsApp group URL to authorized users:
 *   1. Authenticated subscribers with an active/trialing subscription, OR
 *   2. Fresh post-checkout arrivals with a valid Stripe session_id (status=paid)
 *
 * The tracked URL hits /api/go/wa?t=... which logs wa_click_at and
 * 302-redirects to WHATSAPP_GROUP_LINK.
 */
function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://www.vectorialdata.com")
  );
}

export async function GET(request: Request) {
  if (!process.env.WHATSAPP_GROUP_LINK) {
    console.error("WHATSAPP_GROUP_LINK not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const siteUrl = getSiteUrl();

  // Path 1: existing authenticated subscriber
  const auth = await getAuthState();
  if (auth.isSubscribed && auth.user?.email) {
    return NextResponse.json({
      link: buildTrackedWaUrl(auth.user.email, siteUrl),
    });
  }

  // Path 2: fresh post-checkout arrival — validate session_id against Stripe
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const email =
        session.customer_details?.email ?? session.customer_email;
      if (session.payment_status === "paid" && email) {
        return NextResponse.json({
          link: buildTrackedWaUrl(email.toLowerCase().trim(), siteUrl),
        });
      }
    } catch (err) {
      console.error("Stripe session validation failed:", err);
    }
  }

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
