import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/supabase";
import { verifyTransaction, applyTransactionForEmail } from "@/lib/apple-iap";

export const dynamic = "force-dynamic";

const PRODUCT_ID =
  process.env.APPLE_IAP_PRODUCT_ID ?? "com.vectorialdata.app.premium.monthly";

/**
 * POST /api/iap/verify
 * Called by the iOS app immediately after a StoreKit purchase (or restore).
 * Body: { signedTransaction: <Transaction.jwsRepresentation> }
 *
 * Verifies the JWS against Apple's cert chain, confirms it's our product,
 * and marks the authenticated user's subscriber row active. Bearer-authed.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const signedTransaction: unknown = body?.signedTransaction;
    if (typeof signedTransaction !== "string" || !signedTransaction) {
      return NextResponse.json(
        { error: "Missing signedTransaction" },
        { status: 400 }
      );
    }

    let tx;
    try {
      tx = await verifyTransaction(signedTransaction);
    } catch (err) {
      console.error("IAP verify: signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid transaction" },
        { status: 400 }
      );
    }

    if (tx.productId !== PRODUCT_ID) {
      return NextResponse.json(
        { error: "Unknown product" },
        { status: 400 }
      );
    }

    const expired = tx.expiresDate ? tx.expiresDate < Date.now() : false;
    const status = expired ? "canceled" : "active";

    await applyTransactionForEmail(user.email, tx, status);

    return NextResponse.json({
      is_subscribed: status === "active",
      subscription_status: status,
      current_period_end: tx.expiresDate
        ? new Date(tx.expiresDate).toISOString()
        : null,
    });
  } catch (err) {
    console.error("IAP verify error:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
