import OpenAI from "openai";
import type { EventType, EventExplanations } from "@/lib/types";

let _openai: OpenAI | null = null;

function getOpenAI() {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not configured");
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

const EVENT_TYPE_CONTEXT: Record<EventType, string> = {
  price_move: "a significant price movement (5% or more in a single day)",
  dividend: "a dividend payment or dividend-related announcement",
  earnings: "a quarterly or annual earnings report",
  analyst: "an analyst rating change (upgrade or downgrade)",
  news: "a relevant news event affecting the company",
};

const SYSTEM_PROMPT = `You are a financial educator for Vectorial Data. Your audience is people who are NOT financial experts — they may be first-time investors.

RULES:
1. Zero jargon. If you must use a financial term, explain it immediately in parentheses or with a dash. Example: "reportaron earnings — o sea, cuánto dinero ganaron este trimestre"
2. Connect to real life. Not "margin expansion" but "están ganando más dinero por cada dólar que entra"
3. "meaning" = what happened and WHY it matters for someone who owns this stock (max 3 sentences)
4. "action" = what a long-term investor should think about this — we don't sell on short-term moves (max 2 sentences)
5. Do NOT give specific buy/sell advice. Frame as educational.
6. Each language must be native-quality writing, NOT a translation of English. Think in that language.
7. Tone: a smart friend explaining over coffee. Honest but calm.
8. Always answer the implicit question: "Is my money okay?"

OUTPUT: Return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "en": { "meaning": "...", "action": "..." },
  "es": { "meaning": "...", "action": "..." },
  "pt": { "meaning": "...", "action": "..." },
  "hi": { "meaning": "...", "action": "..." }
}`;

export async function generateExplanations(
  ticker: string,
  eventType: EventType,
  params: Record<string, string>,
  researchFull: string
): Promise<EventExplanations> {
  const eventContext = EVENT_TYPE_CONTEXT[eventType] ?? "a portfolio event";
  const researchSnippet = researchFull.substring(0, 2000);

  const userPrompt = `Event: ${ticker} experienced ${eventContext}.
Event details: ${JSON.stringify(params)}

Company context (use this to make your explanation SPECIFIC to this company, not generic):
${researchSnippet}

Generate explanations in all 4 languages (en, es, pt, hi).`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as EventExplanations;

    // Validate structure
    for (const lang of ["en", "es", "pt", "hi"] as const) {
      if (!parsed[lang]?.meaning || !parsed[lang]?.action) {
        throw new Error(`Missing ${lang} explanation in AI response`);
      }
    }

    return parsed;
  } catch (error) {
    console.error("AI explanation generation failed:", error);
    return {};
  }
}
