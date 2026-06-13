import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

const KEY_PREFIX = "vd_live_";

// Billing unit: micro-USDC. 1 USDC = 1_000_000 micro.
export const MICRO_PER_USDC = 1_000_000;

/** Convert a USD-cents amount (Stripe) to micro-USDC. 500 cents = $5 = 5_000_000. */
export function centsToMicroUsdc(cents: number): number {
  return Math.round(cents * 10_000);
}

// Default per-request cost. 2000 micro = $0.002 (matches the legacy 1-credit price
// and the cheapest x402 endpoint). Phase 2 sets real per-endpoint costs.
export const DEFAULT_REQUEST_COST_MICRO_USDC = 2_000;
// Trial grant for a brand-new signup key. 200_000 micro = $0.20 (unchanged from the
// old 100-credit grant). Phase 4 may zero this in favor of a mandatory 5 USDC deposit.
export const SIGNUP_GRANT_MICRO_USDC = 200_000;

export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(24).toString("hex");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(opts: {
  account_id?: string;
  email?: string;
  wallet_address?: string;
  name?: string;
}): Promise<{ key: string; balance_micro: number }> {
  const key = generateApiKey();
  const key_hash = hashApiKey(key);

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("api_keys")
    .insert({
      key,
      key_hash,
      account_id: opts.account_id ?? null,
      tier: "free",
      daily_limit: 0,
      email: opts.email?.toLowerCase().trim(),
      wallet_address: opts.wallet_address?.toLowerCase(),
      name: opts.name,
      balance_micro: SIGNUP_GRANT_MICRO_USDC,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to create API key: ${error?.message ?? "unknown"}`);
  }

  // Ledger entry for the signup grant — only when we have an account_id, since
  // api_credit_ledger.account_id is NOT NULL. Orphan (no-account) keys get the
  // balance from the column default and just don't show up in the ledger view.
  if (opts.account_id) {
    await getSupabaseAdmin().rpc("credit_api_balance", {
      p_account_id: opts.account_id,
      p_api_key_id: null,
      p_micro: SIGNUP_GRANT_MICRO_USDC,
      p_source: "grant_signup",
      p_stripe_payment_intent_id: null,
      p_notes: `signup grant: ${SIGNUP_GRANT_MICRO_USDC} micro-USDC`,
    });
  }

  return { key, balance_micro: SIGNUP_GRANT_MICRO_USDC };
}

export interface ApiKeyInfo {
  keyId: string;
  tier: string;
  balance_micro: number;
}

/**
 * Atomically debit one request from the caller's key.
 * Returns the key info + post-debit balance, or null when the key is invalid,
 * revoked, expired, or has insufficient credits (caller should respond 402).
 */
export async function debitApiKey(
  key: string,
  endpoint: string,
  costMicroUsdc: number = DEFAULT_REQUEST_COST_MICRO_USDC
): Promise<ApiKeyInfo | null> {
  const key_hash = hashApiKey(key);

  const { data: newBalance, error: debitError } = await getSupabaseAdmin().rpc(
    "debit_api_balance",
    { p_key_hash: key_hash, p_micro: costMicroUsdc, p_endpoint: endpoint }
  );

  if (debitError || newBalance === null || newBalance === undefined) {
    return null;
  }

  // debit_api_balance returns just the new balance; fetch id+tier for the caller.
  const { data: row } = await getSupabaseAdmin()
    .from("api_keys")
    .select("id, tier")
    .eq("key_hash", key_hash)
    .single();
  if (!row) return null;

  return {
    keyId: row.id,
    tier: row.tier,
    balance_micro: newBalance as number,
  };
}

/**
 * @deprecated Use `debitApiKey(key, endpoint, costMicroUsdc)` — balance is now
 * debited at validate-time in a single atomic RPC. Kept for compile compat.
 */
export async function validateApiKey(key: string): Promise<ApiKeyInfo | null> {
  return debitApiKey(key, "unknown");
}

/**
 * @deprecated Debit happens inside `debitApiKey` now. Kept as a no-op so old
 * callers compile until they're migrated.
 */
export async function incrementUsage(_keyId: string): Promise<void> {
  return;
}

/**
 * Grant credits to an account. Used by:
 *   - Stripe top-up webhook ('topup_stripe', idempotent on payment_intent_id)
 *   - Crypto top-up ('topup_crypto')
 *   - Manual promo / refund / adjustment (admin)
 */
export async function grantCredits(opts: {
  account_id: string;
  api_key_id: string;
  micro_usdc: number;
  source: "grant_promo" | "topup_stripe" | "topup_crypto" | "refund" | "adjustment";
  stripe_payment_intent_id?: string;
  notes?: string;
}): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc("credit_api_balance", {
    p_account_id: opts.account_id,
    p_api_key_id: opts.api_key_id,
    p_micro: opts.micro_usdc,
    p_source: opts.source,
    p_stripe_payment_intent_id: opts.stripe_payment_intent_id ?? null,
    p_notes: opts.notes ?? null,
  });
  if (error) throw new Error(`grantCredits failed: ${error.message}`);
  return data as number;
}

/**
 * @deprecated The pro-tier / daily-limit model is replaced by credit balances.
 * The /v1/auth/upgrade route still calls this; Phase 1.3 will rewire it to
 * grant credits proportional to the USDC payment via `grantCredits()`.
 */
export async function upgradeToProTier(keyId: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await getSupabaseAdmin()
    .from("api_keys")
    .update({
      tier: "pro",
      daily_limit: 1000,
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", keyId);
}
