import { SignJWT, importPKCS8 } from "jose";
import { sendAPNsMany } from "@/lib/apns";

/**
 * Platform-routing push fan-out: iOS tokens go through APNs (`apns.ts`),
 * Android tokens through FCM HTTP v1. Callers pass `device_tokens` rows
 * ({token, platform}) and one platform-agnostic message; results come back
 * uniform with a `dead` flag so callers can deactivate rejected tokens the
 * same way for both stores.
 *
 * FCM required env var:
 *   FCM_SERVICE_ACCOUNT   Full JSON of a Firebase service account with the
 *                         "Firebase Cloud Messaging API" enabled
 *                         (fields used: project_id, client_email, private_key).
 *
 * If a platform isn't configured its sends fail soft (ok:false, dead:false,
 * reason:"*_not_configured") — never thrown, never deactivated.
 */

export type PushDevice = { token: string; platform: string };

export type PushMessage = {
  title: string;
  body?: string;
  sound?: string;
  threadId?: string;
  data?: {
    kind?:
      | "new_pick"
      | "price_move"
      | "system"
      | "weekly_digest"
      | "dividend_paid"
      | "news";
    ticker?: string;
    pick_number?: number;
    return_pct?: number;
    news_id?: string;
  };
};

export type PushResult = {
  token: string;
  platform: string;
  ok: boolean;
  /** Token rejected by the store as gone — caller should deactivate it. */
  dead: boolean;
  status: number;
  reason?: string;
};

export function pushConfigured(): { ios: boolean; android: boolean } {
  return {
    ios: Boolean(
      process.env.APNS_TEAM_ID && process.env.APNS_KEY_ID && process.env.APNS_P8_KEY
    ),
    android: Boolean(process.env.FCM_SERVICE_ACCOUNT),
  };
}

export function anyPushConfigured(): boolean {
  const c = pushConfigured();
  return c.ios || c.android;
}

/** Platforms worth querying in device_tokens for a fan-out. */
export function configuredPlatforms(): string[] {
  const c = pushConfigured();
  const p: string[] = [];
  if (c.ios) p.push("ios");
  if (c.android) p.push("android");
  return p;
}

// ---- FCM (HTTP v1) ----------------------------------------------------------

type FcmServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedFcmToken: { value: string; expiresAt: number } | null = null;

function getFcmServiceAccount(): FcmServiceAccount {
  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FCM_SERVICE_ACCOUNT not configured");
  const sa = JSON.parse(raw.trim()) as FcmServiceAccount;
  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error("FCM_SERVICE_ACCOUNT missing project_id/client_email/private_key");
  }
  return sa;
}

async function getFcmAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.expiresAt > now + 300) {
    return cachedFcmToken.value;
  }

  const sa = getFcmServiceAccount();
  const key = await importPKCS8(sa.private_key.replace(/\\n/g, "\n"), "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
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
    throw new Error(`FCM oauth token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedFcmToken = { value: json.access_token, expiresAt: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

async function sendFCM(deviceToken: string, msg: PushMessage): Promise<PushResult> {
  const sa = getFcmServiceAccount();
  const accessToken = await getFcmAccessToken();

  // FCM data payload values must all be strings.
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(msg.data ?? {})) {
    if (v !== undefined && v !== null) data[k] = String(v);
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: msg.title, body: msg.body },
          data,
          android: {
            priority: "HIGH",
            notification: {
              // The Android app creates this channel on first run (M5).
              channel_id: "vd_default",
              sound: msg.sound ?? "default",
            },
          },
        },
      }),
    }
  );

  if (res.ok) return { token: deviceToken, platform: "android", ok: true, dead: false, status: res.status };

  let reason: string | undefined;
  try {
    const body = (await res.json()) as {
      error?: { status?: string; message?: string };
    };
    reason = body.error?.status ?? body.error?.message;
  } catch {}
  // 404 UNREGISTERED = token gone (uninstall / new token). Same contract as
  // APNs 410 Unregistered.
  const dead = res.status === 404 || reason === "UNREGISTERED";
  return { token: deviceToken, platform: "android", ok: false, dead, status: res.status, reason };
}

// ---- Unified fan-out ----------------------------------------------------------

export async function sendPushMany(
  devices: PushDevice[],
  msg: PushMessage
): Promise<PushResult[]> {
  if (devices.length === 0) return [];
  const configured = pushConfigured();

  const iosTokens = devices.filter((d) => d.platform === "ios").map((d) => d.token);
  const androidTokens = devices.filter((d) => d.platform === "android").map((d) => d.token);

  const results: PushResult[] = [];

  if (iosTokens.length > 0) {
    if (!configured.ios) {
      results.push(...iosTokens.map((token): PushResult => ({
        token, platform: "ios", ok: false, dead: false, status: 0, reason: "apns_not_configured",
      })));
    } else {
      try {
        const apnsResults = await sendAPNsMany(iosTokens, {
          aps: {
            alert: { title: msg.title, body: msg.body },
            sound: msg.sound ?? "default",
            ...(msg.threadId ? { "thread-id": msg.threadId } : {}),
          },
          ...(msg.data ?? {}),
        });
        results.push(...apnsResults.map((r): PushResult => ({
          token: r.token,
          platform: "ios",
          ok: r.ok,
          dead: r.status === 410 || r.reason === "BadDeviceToken" || r.reason === "Unregistered",
          status: r.status,
          reason: r.reason,
        })));
      } catch (e) {
        results.push(...iosTokens.map((token): PushResult => ({
          token, platform: "ios", ok: false, dead: false, status: 0,
          reason: e instanceof Error ? e.message : "apns_error",
        })));
      }
    }
  }

  if (androidTokens.length > 0) {
    if (!configured.android) {
      results.push(...androidTokens.map((token): PushResult => ({
        token, platform: "android", ok: false, dead: false, status: 0, reason: "fcm_not_configured",
      })));
    } else {
      const fcmResults = await Promise.all(
        androidTokens.map(async (t): Promise<PushResult> => {
          try {
            return await sendFCM(t, msg);
          } catch (e) {
            return {
              token: t, platform: "android", ok: false, dead: false, status: 0,
              reason: e instanceof Error ? e.message : "fcm_error",
            };
          }
        })
      );
      results.push(...fcmResults);
    }
  }

  return results;
}

/** Convenience: tokens the caller should flip is_active=false on. */
export function deadTokens(results: PushResult[]): string[] {
  return results.filter((r) => r.dead).map((r) => r.token);
}
