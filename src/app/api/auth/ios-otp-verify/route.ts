import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/ios-otp-verify
 *
 * Alternative to the magic-link deep-link flow. The iOS app can verify the
 * 6-digit code shown in the sign-in email directly, without needing to open
 * a `vectorialdata://` deep link. Useful when the email is opened on a
 * different device or when the deep link fails to launch the app.
 *
 * Request:  { email: string, otp: string }  (otp = 6-digit code from email)
 * Response: { access_token, refresh_token, expires_at, email }
 */
export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }
    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json({ error: "invalid_otp_format" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp.trim(),
      type: "email",
    });

    if (error || !data.session || !data.user?.email) {
      console.error("iOS OTP verify failed:", error);
      return NextResponse.json(
        { error: "invalid_or_expired_otp" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      email: data.user.email.toLowerCase(),
    });
  } catch (err) {
    console.error("iOS OTP verify error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
