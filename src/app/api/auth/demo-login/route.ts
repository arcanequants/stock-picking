import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseAuthExchangeClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/demo-login
 *
 * App Store Review bypass. Returns a JWT for a pre-configured demo account
 * without requiring email verification. Only works for the DEMO_EMAIL
 * configured in env vars. Used exclusively so Apple reviewers can sign in
 * without accessing an email inbox.
 *
 * Request:  { email: string, password: string }
 * Response: { access_token, refresh_token, expires_at, email }
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const demoEmail = process.env.DEMO_EMAIL;
    const demoPassword = process.env.DEMO_PASSWORD;

    if (!demoEmail || !demoPassword) {
      return NextResponse.json({ error: "not_configured" }, { status: 404 });
    }

    const normalizedEmail = (email ?? "").toLowerCase().trim();

    if (
      normalizedEmail !== demoEmail.toLowerCase() ||
      password !== demoPassword
    ) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    // Generate a fresh session for the demo account using admin sign-in
    const supabase = getSupabaseAdmin();
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: demoEmail.toLowerCase(),
      });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Demo login: failed to generate link:", linkError);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = actionUrl.searchParams.get("token");

    if (!tokenHash) {
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    // Throwaway client: verifyOtp on the shared admin singleton would leave
    // the demo session attached to it for the rest of the lambda's life.
    const { data, error } = await getSupabaseAuthExchangeClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (error || !data.session || !data.user?.email) {
      console.error("Demo login: verifyOtp failed:", error);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      email: data.user.email.toLowerCase(),
    });
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
