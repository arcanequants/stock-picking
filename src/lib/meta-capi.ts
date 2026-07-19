import { createHash } from "crypto";

/**
 * Meta Conversions API (server-side events).
 *
 * Complements the browser pixel: server events survive iOS tracking
 * prevention and ad blockers, which kill a large share of client-side
 * attribution. We send Registration/Purchase ONLY from the server (the
 * browser pixel only fires PageView), so no event_id dedup is needed.
 *
 * No-ops silently unless BOTH env vars are set:
 *   NEXT_PUBLIC_META_PIXEL_ID — the pixel id (shared with the browser tag)
 *   META_CAPI_ACCESS_TOKEN    — CAPI token (Events Manager → Settings)
 */

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface MetaEventInput {
  eventName: "CompleteRegistration" | "Purchase" | "StartTrial";
  email: string;
  /** Idempotency id (e.g. stripe session id, or email+day for signups). */
  eventId: string;
  /** Page where the action happened, for attribution quality. */
  sourceUrl?: string;
  value?: number;
  currency?: string;
  clientIp?: string | null;
  userAgent?: string | null;
  /** Meta browser/click cookies when available (_fbp / _fbc). */
  fbp?: string | null;
  fbc?: string | null;
}

export async function sendMetaEvent(input: MetaEventInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) return;

  const userData: Record<string, unknown> = {
    em: [sha256(input.email.toLowerCase().trim())],
  };
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const eventData: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "website",
    user_data: userData,
  };
  if (input.sourceUrl) eventData.event_source_url = input.sourceUrl;
  if (input.value != null) {
    eventData.custom_data = {
      value: input.value,
      currency: input.currency ?? "USD",
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: [eventData], access_token: token }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("meta-capi error:", res.status, body.slice(0, 300));
    }
  } catch (err) {
    // Never let ad tracking break the product path.
    console.error("meta-capi fetch failed:", err);
  }
}

/** Read Meta's browser cookies + attribution cookie from a request. */
export function metaCookiesFromRequest(request: Request): {
  fbp: string | null;
  fbc: string | null;
  attribution: Record<string, string> | null;
} {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const jar = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) jar.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
  }
  let attribution: Record<string, string> | null = null;
  const raw = jar.get("vd_attr");
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed && typeof parsed === "object") attribution = parsed;
    } catch {
      // Malformed cookie — ignore.
    }
  }
  return {
    fbp: jar.get("_fbp") ?? null,
    fbc: jar.get("_fbc") ?? null,
    attribution,
  };
}
