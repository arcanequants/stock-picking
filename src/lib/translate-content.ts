import OpenAI from "openai";

/**
 * Server-side auto-translation for dynamic content (app news, economic
 * events). Spanish is the source of truth; en/pt/hi are generated at ingest
 * so every surface ships all four locales without manual SQL.
 *
 * Uses the existing OPENAI_API_KEY (gpt-4o-mini) — cheap and already
 * provisioned. Failures are always non-fatal: callers treat a null return as
 * "no translation" and the UI falls back to Spanish.
 */

let _client: OpenAI | null = null;
function client(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

export type TargetLocale = "en" | "pt" | "hi";

const LANG_SPEC: Record<TargetLocale, string> = {
  en: "US English",
  pt: "Brazilian Portuguese (use 'US$ X bilhões' style for large amounts)",
  hi: "Hindi in Devanagari script for retail investors in India. Keep tickers, company/brand names, and technical terms commonly used in English in India (stock, ETF, blockchain, CEO, EPS, P/E) in Latin script. dividend = लाभांश. 'mil millones' = अरब.",
};

/**
 * Translate a flat map of Spanish strings to the target locale.
 * Returns null if the client is unconfigured, the call fails, or the
 * response doesn't echo every key back as a non-empty string.
 */
export async function translateFields(
  fields: Record<string, string>,
  target: TargetLocale,
): Promise<Record<string, string> | null> {
  const c = client();
  if (!c) return null;
  try {
    const res = await c.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You translate Spanish financial content for retail investors into ${LANG_SPEC[target]}. Reply with ONLY a JSON object having exactly the same keys as the input, each value translated. Preserve every number, percentage, currency amount, ticker, and proper noun exactly. Clear plain register. Never add or drop facts.`,
        },
        { role: "user", content: JSON.stringify(fields) },
      ],
    });
    const out = JSON.parse(res.choices[0]?.message?.content ?? "null") as
      | Record<string, unknown>
      | null;
    if (!out) return null;
    const result: Record<string, string> = {};
    for (const k of Object.keys(fields)) {
      const v = out[k];
      if (typeof v !== "string" || !v.trim()) return null;
      result[k] = v.trim();
    }
    return result;
  } catch (err) {
    console.error(`translateFields(${target}) failed:`, err);
    return null;
  }
}
