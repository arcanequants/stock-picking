import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/ios-exchange
 *
 * The iOS app calls this after the user taps the magic-link email.
 * We receive the `token_hash` that Supabase issued, verify it via
 * `verifyOtp`, and return the resulting JWT pair. The iOS app stores
 * `access_token` in the Keychain and sends it as `Authorization: Bearer`
 * on subsequent requests.
 *
 * Request:  { token_hash: string, type?: "magiclink" | "signup" | "email" }
 * Response: { access_token, refresh_token, expires_at, email }
 */
export async function POST(request: Request) {
  try {
    const { token_hash, type } = await request.json();

    if (!token_hash || typeof token_hash !== "string") {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }

    const verifyType = type === "signup" ? "signup" : type === "email" ? "email" : "magiclink";

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: verifyType,
    });

    if (error || !data.session || !data.user?.email) {
      console.error("iOS exchange verifyOtp failed:", error);
      return NextResponse.json(
        { error: "invalid_or_expired_token" },
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
    console.error("iOS exchange error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
