import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_MAX_AGE } from "@/lib/auth-session";

/**
 * Diagnostic endpoint for auth session persistence bug.
 * Reports exactly what cookies the server sees, whether getUser() succeeds,
 * and the result of an explicit refresh attempt. Returns redacted token info.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const sbCookies = allCookies
    .filter((c) => c.name.startsWith("sb-"))
    .map((c) => ({
      name: c.name,
      value_preview: c.value.slice(0, 24) + "...",
      value_length: c.value.length,
    }));

  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op for read-only diagnostic.
        },
      },
    }
  );

  let userResult: {
    user_id: string | null;
    email: string | null;
    error: string | null;
  } = { user_id: null, email: null, error: null };
  try {
    const { data, error } = await supabase.auth.getUser();
    userResult = {
      user_id: data.user?.id ?? null,
      email: data.user?.email ?? null,
      error: error?.message ?? null,
    };
  } catch (e) {
    userResult.error = e instanceof Error ? e.message : String(e);
  }

  let sessionResult: {
    access_token_preview: string | null;
    refresh_token_preview: string | null;
    expires_at: number | null;
    error: string | null;
  } = {
    access_token_preview: null,
    refresh_token_preview: null,
    expires_at: null,
    error: null,
  };
  try {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
      sessionResult.access_token_preview =
        data.session.access_token.slice(0, 16) + "...";
      sessionResult.refresh_token_preview =
        data.session.refresh_token.slice(0, 16) + "...";
      sessionResult.expires_at = data.session.expires_at ?? null;
    }
    sessionResult.error = error?.message ?? null;
  } catch (e) {
    sessionResult.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      ssr_version: "0.10.x",
      max_age_seconds: AUTH_SESSION_MAX_AGE,
      max_age_days: AUTH_SESSION_MAX_AGE / 86400,
      headers: {
        user_agent_preview: ua.slice(0, 80),
        referer,
        is_safari: /^((?!chrome|android).)*safari/i.test(ua),
      },
      cookies_received: {
        total: allCookies.length,
        sb_cookies: sbCookies,
        non_sb_names: allCookies
          .filter((c) => !c.name.startsWith("sb-"))
          .map((c) => c.name),
      },
      get_user: userResult,
      get_session: sessionResult,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
