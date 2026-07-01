import {
  SignedDataVerifier,
  Environment,
  NotificationTypeV2,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { APPLE_ROOT_CERTS } from "./apple-root-certs";
import { getSupabaseAdmin } from "./supabase";

/**
 * Apple In-App Purchase verification + subscriber reconciliation.
 *
 * Apple subscriptions feed the SAME source of truth as Stripe:
 * subscribers.subscription_status ('active' | 'past_due' | 'canceled') and
 * current_period_end. The verify endpoint (post-purchase) and the App Store
 * Server Notifications V2 webhook (renew/expire/refund) both route through
 * `applyTransaction` / `applyNotification` here.
 */

const BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? "com.vectorialdata.app";

// The numeric App Store app id (App Store Connect → App Information →
// "Apple ID"). Required by the library to verify production notifications.
function appAppleId(): number | undefined {
  const raw = process.env.APPLE_APP_APPLE_ID;
  return raw ? Number(raw) : undefined;
}

// One verifier per environment, lazily built. We don't know which
// environment a given JWS came from until we peek at it, so we keep both.
const verifiers = new Map<Environment, SignedDataVerifier>();

function getVerifier(environment: Environment): SignedDataVerifier {
  const cached = verifiers.get(environment);
  if (cached) return cached;
  const verifier = new SignedDataVerifier(
    APPLE_ROOT_CERTS,
    // Online checks (OCSP) — enabled for stronger revocation checking.
    true,
    environment,
    BUNDLE_ID,
    environment === Environment.PRODUCTION ? appAppleId() : undefined
  );
  verifiers.set(environment, verifier);
  return verifier;
}

/** Decode the unverified JWS body just to read its `environment` claim. */
function peekEnvironment(jws: string): Environment {
  try {
    const [, payloadB64] = jws.split(".");
    const json = JSON.parse(
      Buffer.from(payloadB64, "base64").toString("utf8")
    );
    // Transactions carry `environment`; notifications carry `data.environment`.
    const env = json.environment ?? json?.data?.environment;
    return env === "Sandbox" ? Environment.SANDBOX : Environment.PRODUCTION;
  } catch {
    return Environment.PRODUCTION;
  }
}

export async function verifyTransaction(
  signedTransaction: string
): Promise<JWSTransactionDecodedPayload> {
  const env = peekEnvironment(signedTransaction);
  return getVerifier(env).verifyAndDecodeTransaction(signedTransaction);
}

export async function verifyNotification(
  signedPayload: string
): Promise<ResponseBodyV2DecodedPayload> {
  const env = peekEnvironment(signedPayload);
  return getVerifier(env).verifyAndDecodeNotification(signedPayload);
}

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

/**
 * True when a decoded transaction is inside a free-trial introductory offer.
 * Apple sets offerType=1 (INTRODUCTORY) and offerDiscountType="FREE_TRIAL"
 * for the 14-day trial. Both 'trialing' and 'active' grant full access — the
 * distinction only drives trial-aware UI and lifecycle emails.
 */
export function isFreeTrialTransaction(
  tx: JWSTransactionDecodedPayload
): boolean {
  return tx.offerDiscountType === "FREE_TRIAL";
}

/** Access status for a verified transaction: canceled if expired, trialing if
 *  in the free-trial period, otherwise active. */
export function statusForTransaction(
  tx: JWSTransactionDecodedPayload
): SubscriptionStatus {
  const expired = tx.expiresDate ? tx.expiresDate < Date.now() : false;
  if (expired) return "canceled";
  return isFreeTrialTransaction(tx) ? "trialing" : "active";
}

/**
 * Write a verified Apple transaction into the subscriber row identified by
 * `email`. Used by the post-purchase verify endpoint, where we know the
 * authenticated user. Idempotent.
 */
export async function applyTransactionForEmail(
  email: string,
  tx: JWSTransactionDecodedPayload,
  status: SubscriptionStatus = "active"
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseAdmin();
  const periodEnd = tx.expiresDate
    ? new Date(tx.expiresDate).toISOString()
    : null;

  const payload: Record<string, unknown> = {
    subscription_status: status,
    subscription_source: "apple",
    apple_original_transaction_id: tx.originalTransactionId,
    apple_product_id: tx.productId,
    current_period_end: periodEnd,
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

/**
 * Apply an App Store Server Notification V2 to the subscriber row, found by
 * the Apple originalTransactionId (the email isn't in the notification).
 */
export async function applyNotification(
  notification: ResponseBodyV2DecodedPayload
): Promise<void> {
  const signedTx = notification.data?.signedTransactionInfo;
  if (!signedTx) return; // not a transaction-bearing notification

  const env = peekEnvironment(signedTx);
  const tx = await getVerifier(env).verifyAndDecodeTransaction(signedTx);
  const originalTxId = tx.originalTransactionId;
  if (!originalTxId) return;

  let status = statusForNotification(
    notification.notificationType,
    notification.subtype
  );
  if (!status) return; // notification we don't act on (e.g. CONSUMPTION_REQUEST)

  // Initial subscribe/redeem while inside the free trial is 'trialing', not a
  // paid 'active' period. Paid renewals (DID_RENEW) carry no free-trial offer,
  // so they stay 'active'.
  if (status === "active" && isFreeTrialTransaction(tx)) {
    status = "trialing";
  }

  const supabase = getSupabaseAdmin();
  const payload: Record<string, unknown> = {
    subscription_status: status,
    current_period_end: tx.expiresDate
      ? new Date(tx.expiresDate).toISOString()
      : null,
    apple_product_id: tx.productId,
  };

  const { error } = await supabase
    .from("subscribers")
    .update(payload)
    .eq("apple_original_transaction_id", originalTxId);
  if (error) throw error;
}

function statusForNotification(
  type: string | undefined,
  subtype?: string
): SubscriptionStatus | null {
  switch (type) {
    case NotificationTypeV2.SUBSCRIBED:
    case NotificationTypeV2.DID_RENEW:
    case NotificationTypeV2.OFFER_REDEEMED:
      return "active";
    case NotificationTypeV2.DID_FAIL_TO_RENEW:
      // GRACE_PERIOD subtype: still has access while Apple retries billing.
      return subtype === "GRACE_PERIOD" ? "past_due" : "canceled";
    case NotificationTypeV2.EXPIRED:
    case NotificationTypeV2.GRACE_PERIOD_EXPIRED:
    case NotificationTypeV2.REFUND:
    case NotificationTypeV2.REVOKE:
      return "canceled";
    case NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS:
      // Auto-renew toggled. Access continues until EXPIRED fires; don't
      // change status here.
      return null;
    default:
      return null;
  }
}
