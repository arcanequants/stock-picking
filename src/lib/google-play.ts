import { SignJWT, importPKCS8 } from "jose";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Google Play Billing server-side verification (Android mirror of
 * `apple-iap.ts`). Verifies a subscription purchaseToken against the Play
 * Developer API (subscriptionsv2), acknowledges it, and writes the result
 * into the subscriber row.
 *
 * Required env vars:
 *   GOOGLE_PLAY_SERVICE_ACCOUNT  Full JSON of a service account linked in
 *                                Play Console with "View financial data" +
 *                                "Manage orders" permissions
 *                                (fields used: client_email, private_key).
 *   PLAY_PACKAGE_NAME            Defaults to com.vectorialdata.app
 *   PLAY_SUBSCRIPTION_ID         Play product id of the premium sub,
 *                                defaults to premium_monthly
 *
 * NOTE (M6): purchaseToken persistence + Real-Time Developer Notifications
 * (RTDN via Pub/Sub) land with the full billing milestone; this module only
 * covers the post-purchase verify path, same scope as Apple's verify.
 */

export const PLAY_PACKAGE_NAME =
  process.env.PLAY_PACKAGE_NAME ?? "com.vectorialdata.app";
export const PLAY_SUBSCRIPTION_ID =
  process.env.PLAY_SUBSCRIPTION_ID ?? "premium_monthly";

type PlayServiceAccount = { client_email: string; private_key: string };

type SubscriptionPurchaseV2 = {
  subscriptionState?: string;
  acknowledgementState?: string;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string; // RFC3339
    offerDetails?: { basePlanId?: string; offerId?: string };
  }>;
};

export function playConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT);
}

function getServiceAccount(): PlayServiceAccount {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT not configured");
  const sa = JSON.parse(raw.trim()) as PlayServiceAccount;
  if (!sa.client_email || !sa.private_key) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT missing client_email/private_key");
  }
  return sa;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 300) return cachedToken.value;

  const sa = getServiceAccount();
  const key = await importPKCS8(sa.private_key.replace(/\\n/g, "\n"), "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/androidpublisher",
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Play oauth token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

const API = "https://androidpublisher.googleapis.com/androidpublisher/v3";

/** Fetches the authoritative subscription state for a purchaseToken. */
export async function fetchSubscription(
  purchaseToken: string
): Promise<SubscriptionPurchaseV2> {
  const accessToken = await getAccessToken();
  const res = await fetch(
    `${API}/applications/${PLAY_PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    { headers: { authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Play subscriptionsv2 lookup failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as SubscriptionPurchaseV2;
}

export type PlaySubscriptionStatus = "active" | "trialing" | "canceled";

/** Latest expiry across line items (multi-item subs), or null. */
export function expiryOf(sub: SubscriptionPurchaseV2): Date | null {
  const times = (sub.lineItems ?? [])
    .map((li) => (li.expiryTime ? Date.parse(li.expiryTime) : NaN))
    .filter((t) => Number.isFinite(t));
  if (times.length === 0) return null;
  return new Date(Math.max(...times));
}

/**
 * Maps Play's subscriptionState to our subscriber status. ACTIVE under an
 * offer (offerId present = free-trial / intro offer) counts as trialing —
 * base-plan-only purchases carry no offerId. CANCELED still grants access
 * until expiry (auto-renew off ≠ access revoked), same as Apple.
 */
export function statusForSubscription(
  sub: SubscriptionPurchaseV2
): PlaySubscriptionStatus {
  const expiry = expiryOf(sub);
  const expired = expiry ? expiry.getTime() < Date.now() : false;

  const state = sub.subscriptionState ?? "";
  const grantsAccess =
    state === "SUBSCRIPTION_STATE_ACTIVE" ||
    state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
    state === "SUBSCRIPTION_STATE_CANCELED";

  if (!grantsAccess || expired) return "canceled";

  const underOffer = (sub.lineItems ?? []).some((li) => li.offerDetails?.offerId);
  return underOffer ? "trialing" : "active";
}

/**
 * Play refunds unacknowledged purchases after ~3 days — acknowledge on first
 * successful verify. Idempotent: skipped unless state is PENDING.
 */
export async function acknowledgeIfPending(
  purchaseToken: string,
  sub: SubscriptionPurchaseV2
): Promise<void> {
  if (sub.acknowledgementState !== "ACKNOWLEDGEMENT_STATE_PENDING") return;
  const productId = sub.lineItems?.[0]?.productId ?? PLAY_SUBSCRIPTION_ID;
  const accessToken = await getAccessToken();
  const res = await fetch(
    `${API}/applications/${PLAY_PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
  // Non-fatal: verify already succeeded; a failed ack retries on next verify.
  if (!res.ok) {
    console.error(`Play acknowledge failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Write a verified Play subscription into the subscriber row. Mirror of
 * apple-iap's applyTransactionForEmail. Idempotent.
 */
export async function applyPlaySubscriptionForEmail(
  email: string,
  status: PlaySubscriptionStatus,
  periodEnd: Date | null
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseAdmin();

  const payload: Record<string, unknown> = {
    subscription_status: status,
    subscription_source: "google_play",
    current_period_end: periodEnd ? periodEnd.toISOString() : null,
  };

  const { data: existing } = await supabase
    .from("subscribers")
    .select("email, access_started_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    if (!existing.access_started_at) {
      payload.access_started_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("subscribers")
      .update(payload)
      .eq("email", normalizedEmail);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("subscribers").insert({
      email: normalizedEmail,
      delivery_channel: "email",
      access_started_at: new Date().toISOString(),
      ...payload,
    });
    if (error) throw error;
  }
}
