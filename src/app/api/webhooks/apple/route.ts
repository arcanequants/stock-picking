import { NextResponse } from "next/server";
import { verifyNotification, applyNotification } from "@/lib/apple-iap";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/apple — App Store Server Notifications V2.
 * Apple POSTs { signedPayload } server-to-server on subscription lifecycle
 * events (renew, expire, refund, revoke, billing retry). We verify the JWS
 * and update subscribers.subscription_status by apple_original_transaction_id.
 *
 * Configure this URL in App Store Connect → App → App Information →
 * App Store Server Notifications (Production + Sandbox).
 */
export async function POST(request: Request) {
  let signedPayload: string | undefined;
  try {
    const body = await request.json();
    signedPayload = body?.signedPayload;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!signedPayload) {
    return NextResponse.json({ error: "Missing signedPayload" }, { status: 400 });
  }

  let notification;
  try {
    notification = await verifyNotification(signedPayload);
  } catch (err) {
    console.error("Apple webhook: signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await applyNotification(notification);
  } catch (err) {
    // Log and 500 so Apple retries — but never leak details.
    console.error("Apple webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
