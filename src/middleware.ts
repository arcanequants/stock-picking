import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { authCookieOverrides } from "@/lib/auth-session";
import { routing } from "@/i18n/routing";

// ─── AI Bot Detection ───
const AI_BOTS: Record<string, "search" | "training"> = {
  // Search/Citation bots (ALLOWED in robots.txt — drive referral traffic)
  "OAI-SearchBot": "search",
  "ChatGPT-User": "search",
  "PerplexityBot": "search",
  "Perplexity-User": "search",
  "ClaudeBot": "search",
  "Applebot-Extended": "search",
  "MistralAI-User": "search",
  // Training bots (BLOCKED in robots.txt — unpaid model training)
  "GPTBot": "training",
  "anthropic-ai": "training",
  "Google-Extended": "training",
  "CCBot": "training",
  "Bytespider": "training",
  "cohere-ai": "training",
  "AI2Bot": "training",
  "Diffbot": "training",
};

function detectBot(ua: string): { name: string; category: "search" | "training" | "unknown" } | null {
  for (const [name, category] of Object.entries(AI_BOTS)) {
    if (ua.includes(name)) return { name, category };
  }
  const uaLower = ua.toLowerCase();
  if (uaLower.includes("bot") || uaLower.includes("crawler") || uaLower.includes("spider")) {
    return { name: ua.slice(0, 80), category: "unknown" };
  }
  return null;
}

const MARKETING_PUBLIC = ["/marketing/login", "/marketing/setup"];

/**
 * Paths served outside the [locale] segment: the signed-in app, the internal
 * dashboards, auth callbacks, and everything under /api. next-intl must not
 * rewrite these — they have no localized URL — so they skip it entirely.
 */
const UNLOCALIZED = [
  "/account",
  "/admin",
  "/api",
  "/api-keys",
  "/auth",
  "/login",
  "/marketing",
  "/notifications",
  "/share",
  "/welcome",
  "/r/",
];

/**
 * Root-level files: /sitemap.xml, /robots.txt, /llms.txt, /openapi.yaml,
 * /logo.png … A single segment carrying an extension is never a page, and
 * running it through the locale rewrite turns it into /es/sitemap.xml, which
 * does not exist — that 404s the sitemap and robots.txt, the two files the
 * whole crawl depends on.
 *
 * Deliberately anchored to a single segment so the localized machine-readable
 * briefs (/economia/[slug]/brief.md) keep their per-language URLs.
 */
const ROOT_FILE = /^\/[^/]+\.[a-z0-9]+$/i;

function isUnlocalized(pathname: string): boolean {
  if (ROOT_FILE.test(pathname)) return true;
  return UNLOCALIZED.some(
    (p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`)
  );
}

const handleI18n = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── AI Bot Detection (fire-and-forget) ───
  const ua = request.headers.get("user-agent") || "";
  const bot = detectBot(ua);
  if (bot) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      fetch(`${supabaseUrl}/rest/v1/ai_crawler_logs`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          bot_name: bot.name,
          bot_category: bot.category,
          url: pathname,
        }),
      }).catch(() => {});
    }
    // Crawlers still need the locale rewrite. Returning NextResponse.next()
    // here would hand Googlebot a 404 on every public page, because the
    // pages now live under /[locale]/ and only this rewrite maps /picks
    // onto /es/picks. Bots skip the auth refresh, not the routing.
    return isUnlocalized(pathname)
      ? NextResponse.next()
      : handleI18n(request);
  }

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

  // ─── Main app: Supabase auth session refresh + locale routing ───
  //
  // Order matters. The session refresh runs first and only *records* the
  // cookies it wants to set, mutating request.cookies so the downstream
  // render sees the fresh session. The response is built afterwards, so the
  // locale rewrite survives: the previous code recreated the response inside
  // setAll(), which would have thrown away next-intl's rewrite and left every
  // /pt and /en URL resolving to nothing.
  const pendingCookies: {
    name: string;
    value: string;
    options: Record<string, unknown>;
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            const isDelete = options?.maxAge === 0;
            pendingCookies.push({
              name,
              value,
              options: { ...options, ...authCookieOverrides(isDelete) },
            });
          });
        },
      },
    }
  );

  // Refresh auth session — uses getUser() not getSession() for security
  await supabase.auth.getUser();

  const response = isUnlocalized(pathname)
    ? NextResponse.next({ request })
    : handleI18n(request);

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)",
  ],
};
