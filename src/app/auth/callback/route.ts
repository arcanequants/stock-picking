import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Flow 1: PKCE code exchange (from signInWithOtp)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] PKCE result:", error ? error.message : "success");
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  console.log("[auth/callback] All flows failed, redirecting to expired");
  // Both flows failed or no params — redirect with error hint
  return NextResponse.redirect(`${origin}/portfolio?login=expired`);
}
