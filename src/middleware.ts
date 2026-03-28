import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MARKETING_PUBLIC = ["/marketing/login", "/marketing/setup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Marketing dashboard auth gate ───
  if (pathname.startsWith("/marketing")) {
    const isPublic =
      MARKETING_PUBLIC.some((r) => pathname.startsWith(r)) ||
      pathname.startsWith("/api/marketing/auth");

    if (!isPublic) {
      const sessionToken = request.cookies.get("marketing_session")?.value;
      if (!sessionToken) {
        return NextResponse.redirect(
          new URL("/marketing/login", request.url)
        );
      }
    }

    // Pass pathname header for layout conditional rendering
    const response = NextResponse.next({ request });
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // ─── Main app: Supabase auth session refresh ───
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh auth session — uses getUser() not getSession() for security
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks|api/v1).*)",
  ],
};
