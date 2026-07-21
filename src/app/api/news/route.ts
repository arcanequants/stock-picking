import { NextResponse } from "next/server";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { parseLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

/**
 * GET /api/news — chronological list of curated app news, newest first.
 *
 * Locale: reads Accept-Language header (en/pt/es). When a translation exists
 * in app_news_i18n it overlays headline + body; otherwise falls back to the
 * Spanish original.
 *
 * Filters by audience:
 *   - 'all'     → visible to everyone
 *   - 'premium' → visible only to active/trialing subscribers
 *   - 'free'    → visible only to non-subscribers (upsell nudges)
 */
export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const locale = parseLocale(request.headers.get("Accept-Language"));

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("subscription_status")
    .eq("email", authed.email)
    .single();

  const status = subscriber?.subscription_status;
  const isSubscribed = status === "active" || status === "trialing";

  const audiences = isSubscribed ? ["all", "premium"] : ["all", "free"];

  const { data: rows, error } = await admin
    .from("app_news")
    .select(
      "id, headline, body, link_url, audience, published_at, topic, regions, tickers, block_what, block_why, block_you, block_tell, glossary",
    )
    .in("audience", audiences)
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  let news = rows ?? [];

  if (locale !== "es" && news.length > 0) {
    const ids = news.map((r) => r.id);
    const { data: i18n } = await admin
      .from("app_news_i18n")
      .select(
        "news_id, headline, body, block_what, block_why, block_you, block_tell, glossary",
      )
      .eq("locale", locale)
      .in("news_id", ids);

    if (i18n?.length) {
      const i18nMap = new Map(i18n.map((t) => [t.news_id, t]));
      news = news.map((r) => {
        const t = i18nMap.get(r.id);
        if (!t) return r;
        return {
          ...r,
          headline: t.headline,
          body: t.body,
          // Blocks translate as a set; fall back to es per-field if absent.
          block_what: t.block_what ?? r.block_what,
          block_why: t.block_why ?? r.block_why,
          block_you: t.block_you ?? r.block_you,
          block_tell: t.block_tell ?? r.block_tell,
          glossary: t.glossary ?? r.glossary,
        };
      });
    }
  }

  // The per-news AI chat is a premium/trial feature — the app uses this to
  // route "Pregúntale a la IA" either into the chat or into the paywall.
  return NextResponse.json({ news, chat_enabled: isSubscribed });
}
