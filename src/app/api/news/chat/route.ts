import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthedUser, getSupabaseAdmin } from "@/lib/supabase";
import { parseLocale } from "@/lib/locale";
import { newsModel, isReasoningModel } from "@/lib/news-model";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Per-news AI chat ("Pregúntale a la IA") — premium + free-trial only.
 *
 * GET  /api/news/chat?news_id=… → the user's thread for that news item.
 * POST /api/news/chat { news_id, message } → grounded answer, persisted.
 *
 * Guardrails: educational only, grounded on THIS news item. Questions asking
 * for personalized buy/sell advice get redirected to the Vectorial
 * philosophy (same amount, every pick, long term) — we're a publisher, not
 * an advisor. Answers in the user's app language (Accept-Language).
 */

let _openai: OpenAI | null = null;
function openai(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

const LANG_NAME: Record<string, string> = {
  es: "Spanish",
  en: "English",
  pt: "Brazilian Portuguese",
  hi: "Hindi (Devanagari; keep tickers and common English financial terms in Latin script)",
};

const MAX_USER_MESSAGES = 40;

async function requireSubscribed(email: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("subscribers")
    .select("subscription_status")
    .eq("email", email)
    .single();
  const s = data?.subscription_status;
  return s === "active" || s === "trialing";
}

export async function GET(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const newsId = new URL(request.url).searchParams.get("news_id");
  if (!newsId) {
    return NextResponse.json({ error: "missing_news_id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: messages } = await admin
    .from("news_chat_messages")
    .select("role, content, created_at")
    .eq("email", authed.email)
    .eq("news_id", newsId)
    .order("created_at", { ascending: true })
    .limit(200);

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: Request) {
  const authed = await getAuthedUser(request);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { news_id?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const newsId = (body.news_id ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!newsId) {
    return NextResponse.json({ error: "missing_news_id" }, { status: 400 });
  }
  if (message.length < 1 || message.length > 1000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  if (!(await requireSubscribed(authed.email))) {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  const client = openai();
  if (!client) {
    return NextResponse.json({ error: "chat_unavailable" }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const locale = parseLocale(request.headers.get("Accept-Language"));

  // Grounding: the news item, in the user's language when available.
  const { data: news } = await admin
    .from("app_news")
    .select(
      "id, headline, body, published_at, topic, regions, tickers, block_what, block_why, block_you, block_tell, glossary",
    )
    .eq("id", newsId)
    .single();
  if (!news) {
    return NextResponse.json({ error: "news_not_found" }, { status: 404 });
  }

  let localized = news;
  if (locale !== "es") {
    const { data: t } = await admin
      .from("app_news_i18n")
      .select("headline, body, block_what, block_why, block_you, block_tell")
      .eq("news_id", newsId)
      .eq("locale", locale)
      .maybeSingle();
    if (t) {
      localized = {
        ...news,
        headline: t.headline,
        body: t.body,
        block_what: t.block_what ?? news.block_what,
        block_why: t.block_why ?? news.block_why,
        block_you: t.block_you ?? news.block_you,
        block_tell: t.block_tell ?? news.block_tell,
      };
    }
  }

  // Thread so far (also enforces the per-news cap).
  const { data: prior } = await admin
    .from("news_chat_messages")
    .select("role, content")
    .eq("email", authed.email)
    .eq("news_id", newsId)
    .order("created_at", { ascending: true })
    .limit(200);
  const history = prior ?? [];
  const userCount = history.filter((m) => m.role === "user").length;
  if (userCount >= MAX_USER_MESSAGES) {
    return NextResponse.json({ error: "thread_limit" }, { status: 429 });
  }

  // The user's bought picks give "¿me afecta?" questions real context.
  const { data: bought } = await admin
    .from("user_pick_status")
    .select("ticker")
    .eq("email", authed.email)
    .eq("status", "bought")
    .limit(200);
  const ownedTickers = [...new Set((bought ?? []).map((b) => b.ticker))];

  const blocks = [
    localized.block_what && `WHAT HAPPENED: ${localized.block_what}`,
    localized.block_why && `WHY IT MATTERS: ${localized.block_why}`,
    localized.block_you && `FOR A LONG-TERM PORTFOLIO: ${localized.block_you}`,
    localized.block_tell && `ONE-LINER: ${localized.block_tell}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are the Vectorial Noticias explainer — a warm, clear guide for people who are NOT financial experts (many are first-time investors). The user is asking about ONE specific news item.

THE NEWS ITEM:
HEADLINE: ${localized.headline}
BODY: ${localized.body}
${blocks ? blocks + "\n" : ""}TOPIC: ${news.topic} · REGIONS: ${(news.regions ?? []).join(", ")}${news.tickers?.length ? ` · TICKERS: ${news.tickers.join(", ")}` : ""}

USER CONTEXT: ${ownedTickers.length > 0 ? `they have bought these Vectorial picks: ${ownedTickers.join(", ")}` : "they haven't bought any picks yet"}.

RULES:
- Answer in ${LANG_NAME[locale] ?? "Spanish"}. Plain language, zero jargon — if a technical term is unavoidable, define it in one clause. Mom test.
- Max ~120 words. Short paragraphs. Warm but direct.
- Ground every answer in the news above plus broadly-known context. If you genuinely don't know, say so — NEVER invent numbers or facts.
- You may explain how this kind of event has historically related to markets, always descriptive.
- NEVER give personalized investment advice. If asked "should I buy/sell?", warmly decline and restate the Vectorial philosophy: same amount, every pick, long term — news don't change the plan. The decision is always theirs.
- Never promise returns. Never predict prices.
- Stay on this news and closely related follow-ups; if asked something unrelated, briefly redirect to the news.`;

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  let reply: string;
  try {
    const model = newsModel();
    const res = await client.chat.completions.create({
      model,
      // Chat is the user-facing moment: low effort keeps replies snappy.
      ...(isReasoningModel(model)
        ? { reasoning_effort: "low" as const, max_completion_tokens: 1500 }
        : { temperature: 0.5, max_tokens: 400 }),
      messages: chatMessages,
    });
    reply = res.choices[0]?.message?.content?.trim() ?? "";
    if (!reply) throw new Error("empty completion");
  } catch (err) {
    console.error("news chat completion failed:", err);
    return NextResponse.json({ error: "chat_failed" }, { status: 502 });
  }

  const { error: insertError } = await admin.from("news_chat_messages").insert([
    { news_id: newsId, email: authed.email, role: "user", content: message },
    { news_id: newsId, email: authed.email, role: "assistant", content: reply.slice(0, 8000) },
  ]);
  if (insertError) {
    // Non-fatal: the user still gets the answer; the thread just won't reload.
    console.error("failed to persist news chat:", insertError);
  }

  return NextResponse.json({ reply });
}
