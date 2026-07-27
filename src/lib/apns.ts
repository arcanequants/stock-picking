import http2 from "node:http2";
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
  news_id?: string;
  kind?:
    | "new_pick"
    | "price_move"
    | "system"
    | "weekly_digest"
    | "dividend_paid"
    | "news";
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

function apnsHost(): string {
  return process.env.APNS_PRODUCTION === "true"
    ? "api.push.apple.com"
    : "api.sandbox.push.apple.com";
}

/** One request over an already-open HTTP/2 session. */
function http2Send(
  client: http2.ClientHttp2Session,
  deviceToken: string,
  jwt: string,
  bundleId: string,
  body: string
): Promise<APNsResult> {
  return new Promise((resolve) => {
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });
    let status = 0;
    let data = "";
    req.setEncoding("utf8");
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk: string) => (data += chunk));
    req.on("end", () => {
      if (status >= 200 && status < 300) {
        resolve({ token: deviceToken, ok: true, status });
        return;
      }
      let reason: string | undefined;
      try {
        reason = (JSON.parse(data) as { reason?: string }).reason;
      } catch {}
      resolve({ token: deviceToken, ok: false, status, reason });
    });
    req.on("error", (err) => {
      resolve({
        token: deviceToken,
        ok: false,
        status: 0,
        reason: err instanceof Error ? err.message : "stream_error",
      });
    });
    req.end(body);
  });
}

/**
 * Sends a push to a single device token. Returns the status so the caller
 * can deactivate dead tokens (410 BadDeviceToken / Unregistered).
 *
 * APNs is HTTP/2-ONLY — `fetch` (undici) speaks HTTP/1.1 and dies with
 * "fetch failed" before the request even leaves, so this goes through
 * node:http2. (That fetch call is why no iOS push was ever delivered.)
 */
export async function sendAPNs(
  deviceToken: string,
  payload: APNsPayload
): Promise<APNsResult> {
  const results = await sendAPNsMany([deviceToken], payload);
  return results[0];
}

/**
 * Fan-out: send the same payload to many device tokens over ONE HTTP/2
 * connection (parallel streams). Caller is responsible for deactivating
 * tokens that return 410.
 */
export async function sendAPNsMany(
  tokens: string[],
  payload: APNsPayload
): Promise<APNsResult[]> {
  if (tokens.length === 0) return [];

  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) throw new Error("APNS_BUNDLE_ID not configured");

  const jwt = await getProviderJwt();
  const body = JSON.stringify(payload);

  const client = http2.connect(`https://${apnsHost()}`);
  const connectionError: Promise<APNsResult[]> = new Promise((resolve) => {
    client.on("error", (err) => {
      resolve(
        tokens.map((t) => ({
          token: t,
          ok: false,
          status: 0,
          reason: err instanceof Error ? err.message : "connection_error",
        }))
      );
    });
  });

  try {
    return await Promise.race([
      Promise.all(tokens.map((t) => http2Send(client, t, jwt, bundleId, body))),
      connectionError,
    ]);
  } finally {
    client.close();
  }
}
