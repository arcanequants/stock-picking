import { SignJWT, importPKCS8 } from "jose";

/**
 * Minimal APNs HTTP/2 client.
 *
 * Uses token-based auth (APNs provider JWT signed with a P8 key).
 *
 * Required env vars:
 *   APNS_TEAM_ID           Apple Developer Team ID (10 chars, e.g. "ABCD123456")
 *   APNS_KEY_ID            Key ID from the downloaded .p8 (10 chars)
 *   APNS_P8_KEY            Full contents of AuthKey_XXXX.p8 (PEM)
 *   APNS_BUNDLE_ID         App bundle id, e.g. com.vectorialdata.app
 *   APNS_PRODUCTION        "true" in prod (api.push.apple.com), anything else → sandbox
 */

type APNsPayload = {
  aps: {
    alert?: { title?: string; subtitle?: string; body?: string };
    badge?: number;
    sound?: string;
    "mutable-content"?: number;
    "content-available"?: number;
    "thread-id"?: string;
  };
  // Custom keys the app reads
  ticker?: string;
  pick_number?: number;
  return_pct?: number;
  kind?: "new_pick" | "price_move" | "system";
};

let cachedJwt: { value: string; expiresAt: number } | null = null;

async function getProviderJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Apple rejects JWTs older than 60 min. Refresh every 50.
  if (cachedJwt && cachedJwt.expiresAt > now + 600) return cachedJwt.value;

  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const p8 = process.env.APNS_P8_KEY;
  if (!teamId || !keyId || !p8) {
    throw new Error("APNS_TEAM_ID / APNS_KEY_ID / APNS_P8_KEY not configured");
  }

  const key = await importPKCS8(p8.replace(/\\n/g, "\n"), "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .sign(key);

  cachedJwt = { value: jwt, expiresAt: now + 3000 };
  return jwt;
}

export type APNsResult = {
  token: string;
  ok: boolean;
  status: number;
  reason?: string;
};

/**
 * Sends a push to a single device token. Returns the status so the caller
 * can deactivate dead tokens (410 BadDeviceToken / Unregistered).
 */
export async function sendAPNs(
  deviceToken: string,
  payload: APNsPayload
): Promise<APNsResult> {
  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) throw new Error("APNS_BUNDLE_ID not configured");

  const host =
    process.env.APNS_PRODUCTION === "true"
      ? "api.push.apple.com"
      : "api.sandbox.push.apple.com";

  const jwt = await getProviderJwt();

  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) return { token: deviceToken, ok: true, status: res.status };

  let reason: string | undefined;
  try {
    const body = (await res.json()) as { reason?: string };
    reason = body.reason;
  } catch {}
  return { token: deviceToken, ok: false, status: res.status, reason };
}

/**
 * Fan-out: send the same payload to many device tokens in parallel.
 * Caller is responsible for deactivating tokens that return 410.
 */
export async function sendAPNsMany(
  tokens: string[],
  payload: APNsPayload
): Promise<APNsResult[]> {
  if (tokens.length === 0) return [];
  return Promise.all(tokens.map((t) => sendAPNs(t, payload)));
}
