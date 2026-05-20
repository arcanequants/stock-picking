import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/ios-refresh
 *
 * The iOS app calls this when its `access_token` returns 401 from any
 * authed endpoint. We exchange the long-lived `refresh_token` (stored in
 * the Keychain) for a fresh `access_token` via Supabase's token endpoint.
 *
 * We do the call server-side so the Supabase anon key never ships to the
 * client.
 *
 * Request:  { refresh_token: string }
 * Response: { access_token, refresh_token, expires_at, email }
 */
export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token || typeof refresh_token !== "string") {
      return NextResponse.json(
        { error: "missing_refresh_token" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ error: "config_missing" }, { status: 500 });
    }

    const res = await fetch(
      `${url}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: anon,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token }),
      }
    );

    if (!res.ok) {
      // Refresh token is invalid / revoked / expired — caller should sign out.
      return NextResponse.json(
        { error: "refresh_failed" },
        { status: 401 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      email: data.user?.email?.toLowerCase() ?? null,
    });
  } catch (err) {
    console.error("iOS refresh error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
