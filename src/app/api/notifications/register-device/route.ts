import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const ALLOWED_PLATFORMS = ["ios", "android"] as const;
type Platform = (typeof ALLOWED_PLATFORMS)[number];

/**
 * POST /api/notifications/register-device
 *
 * iOS/Android app calls this after receiving a push token from APNs/FCM.
 * Upserts into device_tokens so we can push pick notifications to the device.
 *
 * Body: { token: string, platform: "ios"|"android", app_version?: string }
 * Auth: session cookie (Supabase SSR).
 */
export async function POST(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { token?: string; platform?: string; app_version?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  if (token.length < 32 || token.length > 512) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const platform = body.platform as Platform | undefined;
  if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }

  const appVersion =
    body.app_version && body.app_version.length < 32 ? body.app_version : null;

  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("device_tokens")
    .upsert(
      {
        email: authed.email,
        token,
        platform,
        app_version: appVersion,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "email,token" }
    );

  if (error) {
    console.error("Failed to upsert device token:", error);
    return NextResponse.json({ error: "upsert_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/notifications/register-device
 *
 * Called by the app on logout or manual disable. Marks the token inactive
 * rather than deleting (for historical audit).
 *
 * Body: { token: string }
 */
export async function DELETE(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("device_tokens")
    .update({ is_active: false })
    .eq("email", authed.email)
    .eq("token", token);

  if (error) {
    console.error("Failed to deactivate device token:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
