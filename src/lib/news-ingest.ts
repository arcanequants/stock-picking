import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendNewsPush } from "@/lib/news-push";
import { translateFields } from "@/lib/translate-content";
import {
  classifyNews,
  type GlossaryEntry,
  type NewsEnrichment,
} from "@/lib/news-classify";
import { newsModel, isReasoningModel } from "@/lib/news-model";

/**
 * Shared publish pipeline for Vectorial Noticias — used by both
 * POST /api/admin/news (manual publisher) and the `publish_news` MCP tool
 * (the daily routine). Enrich → dedupe gate → insert → push → translate.
 */

export type NewsAudience = "all" | "premium" | "free";

export interface PublishNewsInput {
  headline: string;
  body: string;
  link_url?: string | null;
  audience?: NewsAudience;
  /** Test hook: skip the push fan-out entirely (verification inserts). */
  skip_push?: boolean;
  /** Manual-publisher escape hatch; the routine never sets this. */
  skip_dedupe?: boolean;
}

export interface RecentNewsItem {
  id: string;
  headline: string;
  topic: string | null;
  regions: string[] | null;
  published_at: string;
}

export async function listRecentNews(days = 7): Promise<RecentNewsItem[]> {
  const admin = getSupabaseAdmin();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("app_news")
    .select("id, headline, topic, regions, published_at")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(30);
  return (data ?? []) as RecentNewsItem[];
}

/**
 * Second lock of the anti-repeat policy (the routine's prompt is the first):
 * compare the candidate against the last 7 days and reject same-story
 * repeats. "Same story with a genuinely NEW development" is allowed — the
 * check is semantic, not string matching. Fails OPEN: if the model call
 * errors, publishing proceeds (a rare dupe beats silently losing news).
 */
export async function checkDuplicateNews(
  headline: string,
  body: string,
): Promise<{ duplicate_of: string; reason: string } | null> {
  const recent = await listRecentNews(7);
  if (recent.length === 0) return null;

  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const client = new OpenAI({ apiKey: key });
    const model = newsModel();
    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      ...(isReasoningModel(model)
        ? { reasoning_effort: "low" as const, max_completion_tokens: 800 }
        : { temperature: 0 }),
      messages: [
        {
          role: "user",
          content: `Estas son las noticias publicadas los últimos 7 días en una app financiera:
${recent.map((r, i) => `${i + 1}. ${r.headline}`).join("\n")}

CANDIDATA A PUBLICAR:
TITULAR: ${headline}
CUERPO: ${body.slice(0, 1500)}

¿La candidata es LA MISMA HISTORIA que alguna ya publicada, sin un desarrollo genuinamente nuevo? Un desarrollo nuevo (dato nuevo, giro nuevo, consecuencia nueva) NO cuenta como repetida. Responde JSON: {"is_duplicate": boolean, "duplicate_of": "titular exacto de la lista o null", "reason": "una línea"}`,
        },
      ],
    });
    const raw = JSON.parse(res.choices[0]?.message?.content ?? "null") as {
      is_duplicate?: boolean;
      duplicate_of?: string | null;
      reason?: string;
    } | null;
    if (raw?.is_duplicate && raw.duplicate_of) {
      return { duplicate_of: raw.duplicate_of, reason: raw.reason ?? "" };
    }
    return null;
  } catch (err) {
    console.error("[news-ingest] dedupe check failed (fail-open):", err);
    return null;
  }
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

export type PublishNewsResult =
  | { ok: true; news: Record<string, unknown>; enriched: boolean; delivery: { sent: number; failed: number; deactivated: number }; translated: string[] }
  | { ok: false; status: number; error: string; duplicate_of?: string; reason?: string };

export async function publishNewsItem(
  input: PublishNewsInput,
): Promise<PublishNewsResult> {
  const headline = (input.headline ?? "").trim();
  const newsBody = (input.body ?? "").trim();
  const linkUrl = input.link_url?.trim() || null;
  const audience = input.audience ?? "all";

  if (headline.length < 1 || headline.length > 80) {
    return { ok: false, status: 400, error: "invalid_headline" };
  }
  if (newsBody.length < 1 || newsBody.length > 4000) {
    return { ok: false, status: 400, error: "invalid_body" };
  }
  if (audience !== "all" && audience !== "premium" && audience !== "free") {
    return { ok: false, status: 400, error: "invalid_audience" };
  }

  // 0. Anti-repeat gate (second lock; the routine's prompt is the first).
  if (!input.skip_dedupe) {
    const dupe = await checkDuplicateNews(headline, newsBody);
    if (dupe) {
      return {
        ok: false,
        status: 409,
        error: "duplicate_story",
        duplicate_of: dupe.duplicate_of,
        reason: dupe.reason,
      };
    }
  }

  // 1. Enrich: taxonomy + explainer blocks (Spanish). Non-fatal — a null
  // result publishes the item exactly like the legacy path.
  const enrichment: NewsEnrichment | null = await classifyNews(
    headline,
    newsBody,
  );

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
    .select(
      "id, headline, body, link_url, audience, published_at, topic, regions, tickers",
    )
    .single();

  if (error || !inserted) {
    console.error("Failed to insert app_news:", error);
    return { ok: false, status: 500, error: "insert_failed" };
  }

  // 2. Preference-aware push.
  const delivery = input.skip_push
    ? { sent: 0, failed: 0, deactivated: 0 }
    : await sendNewsPush({
        id: inserted.id,
        headline: inserted.headline,
        body: inserted.body,
        audience: inserted.audience as NewsAudience,
        targeting: enrichment
          ? {
              topic: enrichment.topic,
              regions: enrichment.regions,
              tickers: enrichment.tickers,
            }
          : undefined,
      });

  if (!input.skip_push) {
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

  return {
    ok: true,
    news: inserted as Record<string, unknown>,
    enriched: enrichment != null,
    delivery,
    translated,
  };
}
