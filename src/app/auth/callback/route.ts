import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOverrides } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/portfolio";

  const cookieStore = await cookies();
  const successUrl = `${origin}${next}`;
  // Attach Set-Cookie headers directly to the redirect response — using
  // cookieStore.set() and returning a fresh NextResponse drops cookies in
  // some Next.js Route Handler paths.
  const response = NextResponse.redirect(successUrl);

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
            response.cookies.set(name, value, {
              ...options,
              ...authCookieOverrides(isDelete),
            });
          });
        },
      },
    }
  );

  // Flow 1: PKCE code exchange (from signInWithOtp)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  // Flow 2: Token hash verification (from admin.generateLink)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "magiclink" | "email",
    });
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/portfolio?login=expired`);
}
