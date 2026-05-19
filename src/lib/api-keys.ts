import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

const KEY_PREFIX = "vd_live_";

// Pricing. 1 credit = 1 request = $0.002 USD (matches x402 price).
// Routes can override the cost for heavier endpoints via withApiKey(req, costCredits).
export const DEFAULT_REQUEST_COST_CREDITS = 1;
// Lifetime free grant on signup. 100 credits = $0.20 USD gift.
export const SIGNUP_GRANT_CREDITS = 100;

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
}): Promise<{ key: string; credits_remaining: number }> {
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
      credits_remaining: SIGNUP_GRANT_CREDITS,
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
      p_credits: SIGNUP_GRANT_CREDITS,
      p_source: "grant_signup",
      p_stripe_payment_intent_id: null,
      p_notes: `signup grant: ${SIGNUP_GRANT_CREDITS} credits`,
    });
  }

  return { key, credits_remaining: SIGNUP_GRANT_CREDITS };
}

export interface ApiKeyInfo {
  keyId: string;
  tier: string;
  credits_remaining: number;
}

/**
 * Atomically debit one request from the caller's key.
 * Returns the key info + post-debit balance, or null when the key is invalid,
 * revoked, expired, or has insufficient credits (caller should respond 402).
 */
export async function debitApiKey(
  key: string,
  endpoint: string,
  costCredits: number = DEFAULT_REQUEST_COST_CREDITS
): Promise<ApiKeyInfo | null> {
  const key_hash = hashApiKey(key);

  const { data: newBalance, error: debitError } = await getSupabaseAdmin().rpc(
    "debit_api_credits",
    { p_key_hash: key_hash, p_credits: costCredits, p_endpoint: endpoint }
  );

  if (debitError || newBalance === null || newBalance === undefined) {
    return null;
  }

  // debit_api_credits returns just the new balance; fetch id+tier for the caller.
  const { data: row } = await getSupabaseAdmin()
    .from("api_keys")
    .select("id, tier")
    .eq("key_hash", key_hash)
    .single();
  if (!row) return null;

  return {
    keyId: row.id,
    tier: row.tier,
    credits_remaining: newBalance as number,
  };
}

/**
 * @deprecated Use `debitApiKey(key, endpoint, costCredits)` — credits are now
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
  credits: number;
  source: "grant_promo" | "topup_stripe" | "topup_crypto" | "refund" | "adjustment";
  stripe_payment_intent_id?: string;
  notes?: string;
}): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc("credit_api_balance", {
    p_account_id: opts.account_id,
    p_api_key_id: opts.api_key_id,
    p_credits: opts.credits,
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
