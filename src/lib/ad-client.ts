"use client";

/**
 * Client-side ad conversion events (X/Twitter pixel).
 *
 * Meta conversions are server-side (CAPI) — do NOT add fbq() conversion
 * calls here or events double-count. X has no server path wired, so its
 * conversions fire from the browser using the event codes created in
 * X Ads → Events Manager, exposed as env vars:
 *   NEXT_PUBLIC_X_EVENT_SIGNUP   (e.g. "tw-abcde-fghij")
 *   NEXT_PUBLIC_X_EVENT_PURCHASE
 */

declare global {
  interface Window {
    twq?: (...args: unknown[]) => void;
  }
}

export function trackXSignup(email?: string) {
  const code = process.env.NEXT_PUBLIC_X_EVENT_SIGNUP;
  if (!code || typeof window === "undefined" || !window.twq) return;
  try {
    window.twq("event", code, email ? { email_address: email } : {});
  } catch {
    // Ad tracking must never break the flow.
  }
}

export function trackXPurchase(value: number, currency = "USD") {
  const code = process.env.NEXT_PUBLIC_X_EVENT_PURCHASE;
  if (!code || typeof window === "undefined" || !window.twq) return;
  try {
    window.twq("event", code, { value, currency });
  } catch {
    // Ad tracking must never break the flow.
  }
}
