import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendNewsPush } from "@/lib/news-push";
import { translateFields } from "@/lib/translate-content";
import { classifyNews, type GlossaryEntry, type NewsEnrichment } from "@/lib/news-classify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/admin/news — publish a mobile news item.
 *
 * Bearer auth via `ADMIN_NEWS_TOKEN`. The publisher keeps sending plain
 * headline+body; the server enriches at ingest:
 *   1. classify → topic / regions / tickers + the 4-block explainer
 *      (qué pasó / por qué importa / y para tu portafolio / cuéntalo así)
 *      + glossary, all in Spanish (source of truth). Non-fatal.
 *   2. insert app_news with the enrichment.
 *   3. preference-aware push fan-out (user_news_prefs).
 *   4. auto-translate headline/body/blocks/glossary to en/pt/hi.
 *
 * App-only — the website intentionally has no equivalent surface.
 */
function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function checkToken(request: Request): boolean {
  const expected = process.env.ADMIN_NEWS_TOKEN?.trim();
  if (!expected) return false;
  const header = (request.headers.get("authorization") ?? "").trim();
  return header === `Bearer ${expected}`;
}

/** Flatten glossary entries into translateFields' flat string map. */
function glossaryToFields(glossary: GlossaryEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  glossary.forEach((g, i) => {
    out[`g${i}_term`] = g.term;
    out[`g${i}_def`] = g.def;
  });
  return out;
}

function glossaryFromFields(
  count: number,
  fields: Record<string, string>,
): GlossaryEntry[] {
  const out: GlossaryEntry[] = [];
  for (let i = 0; i < count; i++) {
    const term = fields[`g${i}_term`];
    const def = fields[`g${i}_def`];
    if (term && def) out.push({ term, def });
  }
  return out;
}

export async function POST(request: Request) {
  if (!checkToken(request)) return unauthorized();

  let body: {
    headline?: string;
    body?: string;
    link_url?: string | null;
    audience?: "all" | "premium" | "free";
    /** Test hook: skip the push fan-out entirely (verification inserts). */
    skip_push?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const headline = (body.headline ?? "").trim();
  const newsBody = (body.body ?? "").trim();
  const linkUrl = body.link_url?.trim() || null;
  const audience = body.audience ?? "all";

  if (headline.length < 1 || headline.length > 80) {
    return NextResponse.json({ error: "invalid_headline" }, { status: 400 });
  }
  if (newsBody.length < 1 || newsBody.length > 4000) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (audience !== "all" && audience !== "premium" && audience !== "free") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }

  // 1. Enrich: taxonomy + explainer blocks (Spanish). Non-fatal — a null
  // result publishes the item exactly like the legacy path.
  const enrichment: NewsEnrichment | null = await classifyNews(headline, newsBody);

  const admin = getSupabaseAdmin();
  const { data: inserted, error } = await admin
    .from("app_news")
    .insert({
      headline,
      body: newsBody,
      link_url: linkUrl,
      audience,
      ...(enrichment
        ? {
            topic: enrichment.topic,
            regions: enrichment.regions,
            tickers: enrichment.tickers.length > 0 ? enrichment.tickers : null,
            block_what: enrichment.blocks.what,
            block_why: enrichment.blocks.why,
            block_you: enrichment.blocks.you,
            block_tell: enrichment.blocks.tell,
            glossary: enrichment.glossary.length > 0 ? enrichment.glossary : null,
          }
        : {}),
    })
    .select("id, headline, body, link_url, audience, published_at, topic, regions, tickers")
    .single();

  if (error || !inserted) {
    console.error("Failed to insert app_news:", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // 2. Preference-aware push.
  const delivery = body.skip_push
    ? { sent: 0, failed: 0, deactivated: 0 }
    : await sendNewsPush({
        id: inserted.id,
        headline: inserted.headline,
        body: inserted.body,
        audience: inserted.audience as "all" | "premium" | "free",
        targeting: enrichment
          ? {
              topic: enrichment.topic,
              regions: enrichment.regions,
              tickers: enrichment.tickers,
            }
          : undefined,
      });

  if (!body.skip_push) {
    await admin
      .from("app_news")
      .update({
        push_sent_at: new Date().toISOString(),
        push_sent_count: delivery.sent,
      })
      .eq("id", inserted.id);
  }

  // 3. Auto-translate to en/pt/hi so iOS/web overlay them by Accept-Language.
  // Non-fatal: a failed translation just means that locale falls back to es.
  const glossary = enrichment?.glossary ?? [];
  const translations = await Promise.allSettled(
    (["en", "pt", "hi"] as const).map(async (loc) => {
      const tr = await translateFields(
        {
          headline,
          body: newsBody,
          ...(enrichment
            ? {
                block_what: enrichment.blocks.what,
                block_why: enrichment.blocks.why,
                block_you: enrichment.blocks.you,
                block_tell: enrichment.blocks.tell,
                ...glossaryToFields(glossary),
              }
            : {}),
        },
        loc,
      );
      if (!tr) throw new Error(`translate ${loc} failed`);
      const trGlossary = glossaryFromFields(glossary.length, tr);
      const { error: i18nError } = await admin.from("app_news_i18n").upsert(
        {
          news_id: inserted.id,
          locale: loc,
          headline: tr.headline.slice(0, 80),
          body: tr.body.slice(0, 4000),
          ...(enrichment
            ? {
                block_what: tr.block_what?.slice(0, 400) ?? null,
                block_why: tr.block_why?.slice(0, 400) ?? null,
                block_you: tr.block_you?.slice(0, 400) ?? null,
                block_tell: tr.block_tell?.slice(0, 240) ?? null,
                glossary: trGlossary.length > 0 ? trGlossary : null,
              }
            : {}),
        },
        { onConflict: "news_id,locale" },
      );
      if (i18nError) throw new Error(`upsert ${loc}: ${i18nError.message}`);
      return loc;
    }),
  );
  const translated = translations
    .filter(
      (r): r is PromiseFulfilledResult<"en" | "pt" | "hi"> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  return NextResponse.json({
    ok: true,
    news: inserted,
    enriched: enrichment != null,
    delivery,
    translated,
  });
}
