import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

const KEY_PREFIX = "vd_live_";

// In-memory cache for warm serverless instances (60s TTL)
const cache = new Map<string, { tier: string; keyId: string; dailyLimit: number; requestsToday: number; expiresAt: string | null; cachedAt: number }>();
const CACHE_TTL = 60_000;

export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(24).toString("hex");
}

export async function createApiKey(opts: {
  email?: string;
  wallet_address?: string;
  name?: string;
}): Promise<{ key: string; tier: string; daily_limit: number }> {
  const key = generateApiKey();
  const { error } = await getSupabaseAdmin()
    .from("api_keys")
    .insert({
      key,
      tier: "free",
      daily_limit: 10,
      email: opts.email?.toLowerCase().trim(),
      wallet_address: opts.wallet_address?.toLowerCase(),
      name: opts.name,
    });

  if (error) throw new Error(`Failed to create API key: ${error.message}`);
  return { key, tier: "free", daily_limit: 10 };
}

export interface ApiKeyInfo {
  keyId: string;
  tier: string;
  remaining: number;
}

export async function validateApiKey(key: string): Promise<ApiKeyInfo | null> {
  // Check cache first
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    if (cached.requestsToday >= cached.dailyLimit) return null;
    return {
      keyId: cached.keyId,
      tier: cached.tier,
      remaining: cached.dailyLimit - cached.requestsToday,
    };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("api_keys")
    .select("id, tier, daily_limit, requests_today, expires_at, is_active")
    .eq("key", key)
    .single();

  if (error || !data) return null;
  if (!data.is_active) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (data.requests_today >= data.daily_limit) return null;

  // Cache the result
  cache.set(key, {
    keyId: data.id,
    tier: data.tier,
    dailyLimit: data.daily_limit,
    requestsToday: data.requests_today,
    expiresAt: data.expires_at,
    cachedAt: Date.now(),
  });

  return {
    keyId: data.id,
    tier: data.tier,
    remaining: data.daily_limit - data.requests_today,
  };
}

export async function incrementUsage(keyId: string): Promise<void> {
  await getSupabaseAdmin().rpc("increment_api_usage", { key_id: keyId });

  // Update cache
  for (const [k, v] of cache.entries()) {
    if (v.keyId === keyId) {
      v.requestsToday++;
      break;
    }
  }
}

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

  // Invalidate cache
  for (const [k, v] of cache.entries()) {
    if (v.keyId === keyId) {
      cache.delete(k);
      break;
    }
  }
}
