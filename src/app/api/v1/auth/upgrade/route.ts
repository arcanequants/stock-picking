import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1-middleware";
import { verifyUsdcPayment } from "@/lib/crypto";
import { upgradeToProTier } from "@/lib/api-keys";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const result = await withApiKey(request);
  if (!result.ok) return result.response;

  try {
    const body = await request.json();
    const { tx_hash } = body as { tx_hash?: string };

    if (!tx_hash) {
      return NextResponse.json(
        { error: "tx_hash is required" },
        { status: 400 }
      );
    }

    // Check if tx_hash already used
    const { data: existing } = await getSupabaseAdmin()
      .from("crypto_payments")
      .select("id")
      .eq("tx_hash", tx_hash)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Transaction already used for a subscription" },
        { status: 409 }
      );
    }

    // Verify on-chain
    const verification = await verifyUsdcPayment(tx_hash);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "Payment verification failed" },
        { status: 400 }
      );
    }

    // Record payment
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await getSupabaseAdmin().from("crypto_payments").insert({
      tx_hash,
      from_address: verification.from,
      amount: verification.amount,
      chain: "base",
      api_key_id: result.auth.keyId,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    // Upgrade API key
    await upgradeToProTier(result.auth.keyId);

    return NextResponse.json({
      data: {
        success: true,
        tier: "pro",
        daily_limit: 1000,
        expires_at: periodEnd.toISOString(),
        tx_verified: true,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upgrade failed" },
      { status: 500 }
    );
  }
}
