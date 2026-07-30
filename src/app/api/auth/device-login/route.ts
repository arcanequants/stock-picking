import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import {
  getSupabaseAdmin,
  getSupabaseAuthExchangeClient,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/device-login   { device_token }
 *
 * Face ID / Touch ID re-login: exchanges a device credential (issued by
 * /api/auth/device-credential; the raw value lives in the iOS Keychain
 * behind biometrics) for a fresh Supabase session. Responds 401 on
 * unknown/revoked credentials so the client wipes the stored token and
 * falls back to the email-code flow.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const deviceToken: unknown = body?.device_token ?? body?.deviceToken;
    if (typeof deviceToken !== "string" || deviceToken.length < 32) {
      return NextResponse.json(
        { error: "missing_device_token" },
        { status: 400 }
      );
    }

    const hash = createHash("sha256").update(deviceToken).digest("hex");
    const admin = getSupabaseAdmin();

    const { data: cred, error } = await admin
      .from("device_credentials")
      .select("id, email, revoked")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error) throw error;
    if (!cred || cred.revoked) {
      return NextResponse.json({ error: "invalid_credential" }, { status: 401 });
    }

    // Mint a fresh session server-side (same dance as demo-login).
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: cred.email,
      });
    if (linkError || !linkData?.properties?.action_link) {
      // Most likely the auth user no longer exists (account deleted):
      // revoke the credential and tell the client to fall back.
      console.error("device-login: generateLink failed:", linkError);
      await admin
        .from("device_credentials")
        .update({ revoked: true })
        .eq("id", cred.id);
      return NextResponse.json({ error: "invalid_credential" }, { status: 401 });
    }

    const tokenHash = new URL(
      linkData.properties.action_link
    ).searchParams.get("token");
    if (!tokenHash) {
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    // Throwaway client: verifyOtp on the shared admin singleton would leave
    // this session attached to it for the rest of the lambda's life.
    const { data, error: otpError } =
      await getSupabaseAuthExchangeClient().auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });
    if (otpError || !data.session || !data.user?.email) {
      console.error("device-login: verifyOtp failed:", otpError);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    await admin
      .from("device_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", cred.id);

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      email: data.user.email.toLowerCase(),
    });
  } catch (err) {
    console.error("device-login error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
