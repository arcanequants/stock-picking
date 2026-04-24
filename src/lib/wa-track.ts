import { createHmac, timingSafeEqual } from "crypto";

// HMAC-signed WhatsApp click token.
// Format: base64url(email).base64url(sig) — stable per subscriber, unforgeable.
// Reuses MARKETING_SESSION_SECRET so we don't have to manage another secret.

function getSecret(): string {
  const secret = process.env.MARKETING_SESSION_SECRET;
  if (!secret) throw new Error("MARKETING_SESSION_SECRET not configured");
  return secret;
}

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(email: string): string {
  return createHmac("sha256", getSecret()).update(email).digest("base64url");
}

export function buildWaTrackToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  const emailPart = toBase64Url(normalized);
  const sigPart = sign(normalized);
  return `${emailPart}.${sigPart}`;
}

export function verifyWaTrackToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [emailPart, sigPart] = parts;
  let email: string;
  try {
    email = fromBase64Url(emailPart).toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(email);
  const a = Buffer.from(sigPart);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return email;
}

export function buildTrackedWaUrl(email: string, siteUrl: string): string {
  return `${siteUrl}/api/go/wa?t=${buildWaTrackToken(email)}`;
}
