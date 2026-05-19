import { getSupabaseAdmin } from "@/lib/supabase";
import { sendCryptoPaymentAlertToAdmin } from "@/lib/resend";
import { ADMIN_EMAIL } from "@/lib/admin";

type X402PaymentPayload = {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    authorization?: { from?: string };
  };
};

export function extractPayerFromHeader(xPaymentHeader: string | null): {
  wallet: string;
  network: string;
} | null {
  if (!xPaymentHeader) return null;
  try {
    const decoded = Buffer.from(xPaymentHeader, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as X402PaymentPayload;
    const wallet = parsed?.payload?.authorization?.from;
    if (!wallet || typeof wallet !== "string" || !wallet.startsWith("0x")) {
      return null;
    }
    return { wallet: wallet.toLowerCase(), network: parsed.network ?? "unknown" };
  } catch {
    return null;
  }
}

/**
 * Upsert a payer row and, if this is their first payment, fire an admin alert.
 * Fire-and-forget — never block the API response on this.
 */
export async function trackX402Payer(opts: {
  wallet: string;
  network: string;
  endpoint: string;
  priceUsd: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Try INSERT first. If row exists (conflict), we fall to UPDATE.
  const { data: inserted, error: insertError } = await supabase
    .from("x402_payers")
    .insert({
      wallet: opts.wallet,
      network: opts.network,
      last_endpoint: opts.endpoint,
      total_paid_usd: Number(opts.priceUsd) || 0,
      alerted_at: new Date().toISOString(),
    })
    .select("wallet")
    .single();

  const isFirstPayment = !insertError && !!inserted;

  if (!isFirstPayment) {
    // Existing payer → bump counters (Supabase doesn't expose +=; read-then-write)
    const { data: row } = await supabase
      .from("x402_payers")
      .select("request_count, total_paid_usd")
      .eq("wallet", opts.wallet)
      .maybeSingle();

    if (row) {
      await supabase
        .from("x402_payers")
        .update({
          last_payment_at: new Date().toISOString(),
          request_count: (row.request_count ?? 0) + 1,
          total_paid_usd: Number(row.total_paid_usd ?? 0) + (Number(opts.priceUsd) || 0),
          last_endpoint: opts.endpoint,
        })
        .eq("wallet", opts.wallet);
    }
  }

  // Always alert — Alberto wants to feel every crypto payment (will optimize later if noisy).
  const { count } = await supabase
    .from("x402_payers")
    .select("wallet", { count: "exact", head: true });

  sendCryptoPaymentAlertToAdmin(ADMIN_EMAIL, {
    walletAddress: opts.wallet,
    endpoint: opts.endpoint,
    priceUsd: opts.priceUsd,
    network: opts.network,
    isFirstPayment,
    totalPayersToDate: count ?? null,
  }).catch((e) => console.error("Crypto payment admin alert failed:", e));
}
