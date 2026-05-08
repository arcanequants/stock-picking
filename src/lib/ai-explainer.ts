import OpenAI from "openai";
import type { EventType, EventExplanations, EventSeverity, HumanSummaries } from "@/lib/types";

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
  price_move: "a significant price movement",
  dividend: "a dividend payment or dividend-related announcement",
  earnings: "a quarterly or annual earnings report",
  analyst: "an analyst rating change (upgrade or downgrade)",
  news: "a relevant news event affecting the company",
};

export interface EventInsight {
  severity: EventSeverity;
  affects_thesis: boolean;
  summaries: HumanSummaries;
  explanations: EventExplanations;
}

const SYSTEM_PROMPT = `You are the editor of Vectorial Data's portfolio newsletter. Your audience is people who are NOT financial experts — many are first-time investors. The portfolio holds 60+ stocks, so noise drowns the signal. Your job is brutal curation, not exhaustive coverage.

You score every event on a 1-5 severity scale:
- 5 = Changes the thesis. We may sell, revisit the cycle, or write a /lecciones post. Rare. Earnings miss with cut guidance, fraud, dividend permanently halted, regulatory shock.
- 4 = Important, but plan unchanged. Earnings beat with raised guidance, dividend cut, major analyst sweep (>80% rating change), CEO change at a top-10 holding.
- 3 = Notable. Regular earnings result, regular dividend, upcoming earnings within 7 days.
- 2 = Noise. Sub-5% price move, near 52-week high/low, single-firm analyst nudge, dividend ex-date for a tiny yield.
- 1 = Skip. Zero signal for a long-term holder.

You also flag affects_thesis (true/false): does this event make a long-term holder reconsider holding the position? Almost always false.

For severity ≥ 3, you write a one-sentence "summary" in each language (en, es, pt, hi).

SUMMARY RULES (this is the heart of the job):
- ONE sentence, max 25 words. No exceptions.
- Plain language. Mom test: if your mom needs to google a term, rewrite the sentence.
- BANNED words: "earnings", "EPS", "guidance", "consensus", "upgrade/downgrade", "Buy/Hold/Sell rating", "consensus" — replace with: "ganancias", "lo que ganaron por acción", "lo que esperan ganar", "lo que esperaba el mercado", "subieron/bajaron la calificación", "los analistas creen que vale más/menos".
- Concrete fact, then one-line consequence. Not "investors might reassess expectations". Yes "Diageo subió 5.6% porque el nuevo CEO confirmó que las ventas dejaron de caer."
- NEVER use phrases like "for your portfolio", "your investment", "consider holding", "you should". The reader does NOT own this stock personally — it's the model portfolio. Stay descriptive, not advisory.
- NEVER recommend buy/sell. We're a publisher, not an advisor.
- Each language is native, not translated. Think in that language.

For severity ≥ 4 you also produce optional "details" (meaning + action) in each language for users who tap to expand. Same rules apply, max 2 sentences each. For severity ≤ 3, leave details empty.

OUTPUT: Return ONLY valid JSON, no markdown:
{
  "severity": 1-5,
  "affects_thesis": true|false,
  "summaries": {
    "en": "one sentence", "es": "una frase", "pt": "uma frase", "hi": "एक वाक्य"
  },
  "details": {
    "en": { "meaning": "...", "action": "..." },
    "es": { "meaning": "...", "action": "..." },
    "pt": { "meaning": "...", "action": "..." },
    "hi": { "meaning": "...", "action": "..." }
  }
}

If severity ≤ 3, "details" is {} (empty object).`;

const FALLBACK_INSIGHT: EventInsight = {
  severity: 2,
  affects_thesis: false,
  summaries: {},
  explanations: {},
};

export async function generateEventInsight(
  ticker: string,
  eventType: EventType,
  params: Record<string, string>,
  researchFull: string
): Promise<EventInsight> {
  const eventContext = EVENT_TYPE_CONTEXT[eventType] ?? "a portfolio event";
  const researchSnippet = researchFull.substring(0, 2000);

  const userPrompt = `Event: ${ticker} experienced ${eventContext}.
Event details: ${JSON.stringify(params)}

Company context (use this to make your summary SPECIFIC, not generic):
${researchSnippet}

Score severity, decide affects_thesis, write summaries in all 4 languages.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1400,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return FALLBACK_INSIGHT;

    const parsed = JSON.parse(content) as {
      severity?: number;
      affects_thesis?: boolean;
      summaries?: HumanSummaries;
      details?: EventExplanations;
    };

    const severity = clampSeverity(parsed.severity);
    const summaries = sanitizeSummaries(parsed.summaries ?? {});
    const explanations =
      severity >= 4 ? sanitizeExplanations(parsed.details ?? {}) : {};

    return {
      severity,
      affects_thesis: parsed.affects_thesis === true,
      summaries,
      explanations,
    };
  } catch (error) {
    console.error("AI insight generation failed:", error);
    return FALLBACK_INSIGHT;
  }
}

function clampSeverity(s: unknown): EventSeverity {
  const n = typeof s === "number" ? Math.round(s) : 2;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n as EventSeverity;
}

function sanitizeSummaries(raw: HumanSummaries): HumanSummaries {
  const out: HumanSummaries = {};
  for (const lang of ["en", "es", "pt", "hi"] as const) {
    const v = raw[lang];
    if (typeof v === "string" && v.trim().length > 0) out[lang] = v.trim();
  }
  return out;
}

function sanitizeExplanations(raw: EventExplanations): EventExplanations {
  const out: EventExplanations = {};
  for (const lang of ["en", "es", "pt", "hi"] as const) {
    const v = raw[lang];
    if (v && typeof v.meaning === "string" && typeof v.action === "string") {
      out[lang] = { meaning: v.meaning, action: v.action };
    }
  }
  return out;
}

// Backwards-compat shim — older callers expect EventExplanations only.
export async function generateExplanations(
  ticker: string,
  eventType: EventType,
  params: Record<string, string>,
  researchFull: string
): Promise<EventExplanations> {
  const insight = await generateEventInsight(ticker, eventType, params, researchFull);
  return insight.explanations;
}
