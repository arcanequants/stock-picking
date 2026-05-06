import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_MAX_AGE } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/portfolio";

  console.log("[auth/callback] params:", { code: !!code, token_hash: !!token_hash, type, next });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const isDelete = options?.maxAge === 0;
            cookieStore.set(
              name,
              value,
              isDelete ? options : { ...options, maxAge: AUTH_SESSION_MAX_AGE }
            );
          });
        },
      },
    }
  );

  // The magic-link click lands the user in a NEW tab. We just send them
  // straight to `next` (logged in) — no sync interstitial, no auto-close,
  // no cross-tab broadcast. The original tab stays as it was; it's the
  // simplest, most predictable UX.
  const successUrl = `${origin}${next}`;

  // Flow 1: PKCE code exchange (from signInWithOtp)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] PKCE result:", error ? error.message : "success");
    if (!error) {
      return NextResponse.redirect(successUrl);
    }
  }

  // Flow 2: Token hash verification (from admin.generateLink)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "magiclink" | "email",
    });
    console.log("[auth/callback] verifyOtp result:", error ? error.message : "success");
    if (!error) {
      return NextResponse.redirect(successUrl);
    }
  }

  console.log("[auth/callback] All flows failed, redirecting to expired");
  // Both flows failed or no params — redirect with error hint
  return NextResponse.redirect(`${origin}/portfolio?login=expired`);
}
