import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_MAX_AGE } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

/**
 * Diagnostic. Sets a plain cookie with the same options as auth cookies,
 * to test whether the persistence issue is in Supabase or in cookie/Safari.
 *
 * /api/auth/test-cookie?action=set    — sets `vd-test=hello` (60d, Secure, Lax)
 * /api/auth/test-cookie?action=read   — reads it back
 * /api/auth/test-cookie?action=clear  — deletes it
 */
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") ?? "read";
  const existing = request.cookies.get("vd-test")?.value ?? null;

  const body = {
    timestamp: new Date().toISOString(),
    action,
    cookie_received: existing,
    is_safari: /^((?!chrome|android).)*safari/i.test(
      request.headers.get("user-agent") || ""
    ),
  };

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };

  if (action === "set") {
    const response = NextResponse.json(
      { ...body, set: { value: "hello", maxAge: AUTH_SESSION_MAX_AGE } },
      { headers }
    );
    response.cookies.set("vd-test", "hello", {
      maxAge: AUTH_SESSION_MAX_AGE,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });
    return response;
  }

  if (action === "clear") {
    const response = NextResponse.json({ ...body, cleared: true }, { headers });
    response.cookies.set("vd-test", "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.json(body, { headers });
}
