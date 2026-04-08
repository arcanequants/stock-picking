import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    return NextResponse.next();
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
