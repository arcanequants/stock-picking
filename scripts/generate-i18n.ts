#!/usr/bin/env tsx
/**
 * content:i18n — generate per-locale stock-research content from the
 * Spanish source of truth, with anti-jargon + fidelity QA gates.
 *
 * Two strategies, applied per field in ONE generation call per {ticker,lang}:
 *   - TRANSLATE + anti-jargon  → summary_short/what/why/risk, research_full
 *     (faithful: keep every fact, name, ticker and number; only swap finance
 *      jargon for the plain-language glossary phrasing in the target language).
 *   - RE-AUTHOR from facts      → one_liner, why_short, risk_short
 *     (these are the "mom-readable" short fields; a literal translation
 *      reintroduces jargon, so we re-write them from the source in the
 *      target language — same spirit as scripts/generate-mom-shorts.ts.)
 *
 * Sources:
 *   - summary_* + research_full : src/data/stocks.ts
 *   - one_liner/why_short/risk_short : src/data/mom-overrides.json (es)
 *
 * Storage: src/data/stock-i18n-{lang}.json (committed), keyed by ticker.
 * Merge-and-persist after each ticker so a crash never loses the run.
 * The .ts wrappers import these JSON files.
 *
 * QA gates (second LLM call, unless --no-qa):
 *   - jargon score 1-5  (5 = a non-finance reader understands on first read)
 *   - fidelity score 1-5 (5 = no fact/name/number dropped or invented)
 *   Output is rejected + regenerated once if either score < 4. Persisted
 *   entries carry the scores so a later audit can find weak spots.
 *
 * HINDI IS FROZEN (SEBI legal gate): `hi` is refused unless --allow-hindi is
 * passed explicitly. Default langs are en + pt only.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-i18n.ts                 # en+pt, missing-only, all tickers
 *   ... npx tsx scripts/generate-i18n.ts --langs en           # one language
 *   ... npx tsx scripts/generate-i18n.ts UBS ROP              # specific tickers
 *   ... npx tsx scripts/generate-i18n.ts --langs en UBS --force  # re-run one
 *   ... npx tsx scripts/generate-i18n.ts --incomplete        # resume: only tickers missing the full field set (after a quota/429 stop)
 *   ... npx tsx scripts/generate-i18n.ts --no-qa              # skip QA gate (cheaper, not for prod)
 *   ... npx tsx scripts/generate-i18n.ts --limit 5            # MVP smoke run
 *
 * Cost: ~2 calls per {ticker,lang}. Full catalog (172 × 2 langs) is a real
 * run — budget for it and review a sample before trusting the batch.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { stocks } from "../src/data/stocks";
import glossary from "../src/data/i18n-glossary.json";
import doNotTranslate from "../src/data/i18n-do-not-translate.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "src", "data");
const MOM_PATH = path.join(DATA_DIR, "mom-overrides.json");

const MODEL = process.env.I18N_MODEL ?? process.env.MOM_MODEL ?? "gpt-4o";
const QA_MIN = 4;
// Pacing between tickers. Long research_full + QA can be ~7k tokens/ticker;
// on a 30k TPM tier that's ~4/min, so a small gap avoids constant 429 backoff.
const PACE_MS = Number(process.env.I18N_PACE_MS ?? 1500);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SUPPORTED = ["en", "pt", "hi"] as const;
type Lang = (typeof SUPPORTED)[number];
const DEFAULT_LANGS: Lang[] = ["en", "pt"];

const LANG_NAME: Record<Lang, string> = {
  en: "English (US)",
  pt: "Brazilian Portuguese",
  hi: "Hindi",
};

const TRANSLATE_FIELDS = [
  "summary_short",
  "summary_what",
  "summary_why",
  "summary_risk",
  "research_full",
] as const;
const REAUTHOR_FIELDS = ["one_liner", "why_short", "risk_short"] as const;
type Field = (typeof TRANSLATE_FIELDS)[number] | (typeof REAUTHOR_FIELDS)[number];

interface MomOverride {
  one_liner?: string;
  why_short?: string;
  risk_short?: string;
}
type Mom = Record<string, MomOverride>;

interface StoredTranslation {
  [field: string]: string | { jargon: number; fidelity: number; model: string; generated_at: string } | undefined;
  _qa?: { jargon: number; fidelity: number; model: string; generated_at: string };
}
type Store = Record<string, StoredTranslation>;

// ---- glossary / do-not-translate, rendered into the prompt -----------------

function glossaryBlock(lang: Lang): string {
  const terms = (glossary as { terms: Record<string, Record<string, string>> }).terms;
  const lines = Object.entries(terms)
    .map(([es, byLang]) => `  · "${es}" → "${byLang[lang] ?? es}"`)
    .join("\n");
  return `PLAIN-LANGUAGE GLOSSARY (use these phrasings, never the jargon term):\n${lines}`;
}

function doNotTranslateBlock(): string {
  const d = doNotTranslate as {
    brand: string[];
    keep_verbatim_categories: string[];
    number_format: Record<string, string>;
  };
  return [
    `KEEP VERBATIM (never translate, never localize spelling):`,
    `  · Brand/product: ${d.brand.join(", ")}`,
    ...d.keep_verbatim_categories.map((c) => `  · ${c}`),
  ].join("\n");
}

// ---- prompts ---------------------------------------------------------------

function systemPrompt(lang: Lang): string {
  const numFmt = (doNotTranslate as { number_format: Record<string, string> }).number_format[lang];
  return `You localize stock research for Vectorial Data into ${LANG_NAME[lang]} for readers with NO finance background. Two jobs in one response:

A) TRANSLATE (summary_short, summary_what, summary_why, summary_risk, research_full):
   - Faithful: every fact, company name, ticker, person, institution, date, number, % and currency figure must survive. Do NOT add, drop or invent anything.
   - Anti-jargon: replace finance jargon with the plain-language glossary phrasing below. If a technical term is unavoidable, explain it in the same sentence.
   - Natural ${LANG_NAME[lang]} — read like it was written by a native, not translated. Preserve paragraph breaks (\\n\\n) of research_full.

B) RE-AUTHOR (one_liner, why_short, risk_short):
   - These are ultra-short "explain-to-your-mom" fields. Do NOT translate literally — re-write from the facts in natural ${LANG_NAME[lang]} so a first-time reader understands on the first read.
   - one_liner: ONE sentence, ≤ 220 chars. What the company IS + why it matters.
   - why_short: ONE short paragraph, ≤ 280 chars. The #1 reason we picked it, plainly.
   - risk_short: ONE short paragraph, ≤ 280 chars. The #1 risk, plainly. No alarmism.

${glossaryBlock(lang)}

${doNotTranslateBlock()}

NUMBER FORMAT for ${LANG_NAME[lang]}: ${numFmt}. Localize only the decimal/thousands separator and the currency word; never change the figure itself.

Zero-jargon test: if a single reader would need to look up ONE term, the field fails — rewrite it.

OUTPUT: valid JSON only (no markdown). Include ONLY the keys present in the source I give you. Shape:
{ "summary_short": "...", "summary_what": "...", "summary_why": "...", "summary_risk": "...", "research_full": "...", "one_liner": "...", "why_short": "...", "risk_short": "..." }`;
}

function buildUserPrompt(
  lang: Lang,
  s: { ticker: string; name: string; sector: string; country: string },
  translateSrc: Partial<Record<Field, string>>,
  reauthorSrc: Partial<Record<Field, string>>,
): string {
  const parts: string[] = [
    `Company: ${s.name} (${s.ticker}) — ${s.sector}, ${s.country}. Target language: ${LANG_NAME[lang]}.`,
    ``,
  ];
  const present: string[] = [];
  for (const f of TRANSLATE_FIELDS) {
    if (translateSrc[f]) {
      present.push(f);
      parts.push(`=== TRANSLATE → ${f} (Spanish source) ===`, translateSrc[f] as string, ``);
    }
  }
  for (const f of REAUTHOR_FIELDS) {
    if (reauthorSrc[f]) {
      present.push(f);
      parts.push(`=== RE-AUTHOR → ${f} (Spanish source, rewrite from facts) ===`, reauthorSrc[f] as string, ``);
    }
  }
  parts.push(`Return JSON with EXACTLY these keys: ${present.join(", ")}. Nothing else.`);
  return parts.join("\n");
}

function qaPrompt(
  lang: Lang,
  source: Record<string, string>,
  output: Record<string, string>,
): { system: string; user: string } {
  return {
    system: `You are a bilingual QA grader for ${LANG_NAME[lang]} stock-research localization. Grade the OUTPUT against the Spanish SOURCE on two axes, each 1-5:
- "jargon": 5 = a person with no finance background understands every field on first read; 1 = full of untranslated jargon or Spanish leaking through.
- "fidelity": 5 = every fact, name, ticker, number and % from the source is preserved and nothing invented; 1 = facts dropped, changed or fabricated. (RE-AUTHORED short fields one_liner/why_short/risk_short are allowed to compress and simplify — judge them on faithfulness of the core claim, not coverage.)
Return JSON only: { "jargon": n, "fidelity": n, "notes": "one short line on the worst issue, or 'ok'" }`,
    user: `SOURCE (es):\n${JSON.stringify(source, null, 2)}\n\nOUTPUT (${lang}):\n${JSON.stringify(output, null, 2)}`,
  };
}

// ---- io --------------------------------------------------------------------

async function loadStore(lang: Lang): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, `stock-i18n-${lang}.json`), "utf8"));
  } catch {
    return {};
  }
}

async function saveStore(lang: Lang, store: Store): Promise<void> {
  const sorted: Store = {};
  for (const t of Object.keys(store).sort()) sorted[t] = store[t];
  await fs.writeFile(path.join(DATA_DIR, `stock-i18n-${lang}.json`), JSON.stringify(sorted, null, 2) + "\n");
}

async function loadMom(): Promise<Mom> {
  try {
    return JSON.parse(await fs.readFile(MOM_PATH, "utf8"));
  } catch {
    return {};
  }
}

// ---- generation ------------------------------------------------------------

async function generateOne(
  openai: OpenAI,
  lang: Lang,
  stock: (typeof stocks)[number],
  mom: MomOverride | undefined,
): Promise<{ fields: Record<string, string>; source: Record<string, string> }> {
  const translateSrc: Partial<Record<Field, string>> = {};
  for (const f of TRANSLATE_FIELDS) {
    const v = (stock as unknown as Record<string, unknown>)[f];
    if (typeof v === "string" && v.trim()) translateSrc[f] = v;
  }
  const reauthorSrc: Partial<Record<Field, string>> = {};
  for (const f of REAUTHOR_FIELDS) {
    const v = mom?.[f as keyof MomOverride];
    if (typeof v === "string" && v.trim()) reauthorSrc[f] = v;
  }

  const source: Record<string, string> = { ...translateSrc, ...reauthorSrc } as Record<string, string>;
  if (Object.keys(source).length === 0) {
    return { fields: {}, source };
  }

  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 16384,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt(lang) },
      { role: "user", content: buildUserPrompt(lang, stock, translateSrc, reauthorSrc) },
    ],
  });
  const content = resp.choices[0]?.message?.content ?? "{}";
  if (resp.choices[0]?.finish_reason === "length") {
    throw new Error(`output truncated at max_tokens — research_full too long for ${stock.ticker}`);
  }
  const parsed = JSON.parse(content) as Record<string, string>;
  const fields: Record<string, string> = {};
  for (const k of Object.keys(source)) {
    if (typeof parsed[k] === "string" && parsed[k].trim()) fields[k] = parsed[k].trim();
  }
  return { fields, source };
}

async function qaGrade(
  openai: OpenAI,
  lang: Lang,
  source: Record<string, string>,
  output: Record<string, string>,
): Promise<{ jargon: number; fidelity: number; notes: string }> {
  const { system, user } = qaPrompt(lang, source, output);
  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const p = JSON.parse(resp.choices[0]?.message?.content ?? "{}") as {
    jargon?: number;
    fidelity?: number;
    notes?: string;
  };
  return { jargon: Number(p.jargon ?? 0), fidelity: Number(p.fidelity ?? 0), notes: p.notes ?? "" };
}

// ---- main ------------------------------------------------------------------

function parseArgs() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const incomplete = argv.includes("--incomplete");
  const noQa = argv.includes("--no-qa");
  const allowHindi = argv.includes("--allow-hindi");
  let langs = DEFAULT_LANGS as Lang[];
  let limit = Infinity;

  const consumed = new Set<number>();
  const langsIdx = argv.indexOf("--langs");
  if (langsIdx >= 0 && argv[langsIdx + 1]) {
    langs = argv[langsIdx + 1].split(",").map((l) => l.trim()) as Lang[];
    consumed.add(langsIdx + 1);
  }
  const limitIdx = argv.indexOf("--limit");
  if (limitIdx >= 0 && argv[limitIdx + 1]) {
    limit = parseInt(argv[limitIdx + 1], 10);
    consumed.add(limitIdx + 1);
  }

  const tickers = argv
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => !a.startsWith("--") && !consumed.has(i))
    .map(({ a }) => a.toUpperCase());

  return { force, incomplete, noQa, allowHindi, langs, limit, tickers };
}

async function main() {
  const { force, incomplete, noQa, allowHindi, langs, limit, tickers } = parseArgs();

  for (const l of langs) {
    if (!SUPPORTED.includes(l)) {
      console.error(`Unsupported language: ${l}. Supported: ${SUPPORTED.join(", ")}`);
      process.exit(1);
    }
    if (l === "hi" && !allowHindi) {
      console.error(
        "Hindi investment content is FROZEN behind the SEBI legal gate. " +
          "Refusing to generate. Pass --allow-hindi only after legal clears it.",
      );
      process.exit(1);
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set. Run: OPENAI_API_KEY=sk-... npx tsx scripts/generate-i18n.ts");
    process.exit(1);
  }
  // High retry count so transient TPM (tokens-per-min) 429s are backed off
  // automatically by the SDK (respects Retry-After). insufficient_quota
  // (billing) 429s are NOT retried by the SDK and will surface immediately.
  const openai = new OpenAI({ apiKey, maxRetries: 8 });
  const mom = await loadMom();

  let targets = stocks;
  if (tickers.length > 0) {
    targets = stocks.filter((s) => tickers.includes(s.ticker));
    const missing = tickers.filter((t) => !stocks.find((s) => s.ticker === t));
    if (missing.length > 0) {
      console.error(`Unknown tickers: ${missing.join(", ")}`);
      process.exit(1);
    }
  }
  if (Number.isFinite(limit)) targets = targets.slice(0, limit);

  for (const lang of langs) {
    const store = await loadStore(lang);
    let pending = targets;
    if (incomplete) {
      // Resume mode: (re)generate tickers that are absent OR missing the full
      // field set (e.g. summary-only migrated entries, or rows that 429'd).
      pending = pending.filter((s) => {
        const e = store[s.ticker];
        return !e || !e.research_full;
      });
    } else if (!force) {
      pending = pending.filter((s) => !store[s.ticker]);
    }

    if (pending.length === 0) {
      console.log(`[${lang}] nothing to do (use --force to regenerate).`);
      continue;
    }

    console.log(`[${lang}] generating ${pending.length} ticker(s) with ${MODEL}${noQa ? " (QA off)" : ""}...`);
    let ok = 0;
    let weak = 0;
    let failed = 0;

    for (const stock of pending) {
      process.stdout.write(`  ${lang} ${stock.ticker.padEnd(8)} ${stock.name.slice(0, 34).padEnd(34)} `);
      try {
        let { fields, source } = await generateOne(openai, lang, stock, mom[stock.ticker]);
        if (Object.keys(fields).length === 0) {
          console.log("· no source content, skipped");
          continue;
        }

        let qa = { jargon: 0, fidelity: 0, notes: "qa-skipped" };
        if (!noQa) {
          qa = await qaGrade(openai, lang, source, fields);
          if (qa.jargon < QA_MIN || qa.fidelity < QA_MIN) {
            // one retry
            const retry = await generateOne(openai, lang, stock, mom[stock.ticker]);
            const reqa = await qaGrade(openai, lang, retry.source, retry.fields);
            if (reqa.jargon + reqa.fidelity > qa.jargon + qa.fidelity) {
              fields = retry.fields;
              source = retry.source;
              qa = reqa;
            }
          }
        }

        store[stock.ticker] = {
          ...fields,
          _qa: { jargon: qa.jargon, fidelity: qa.fidelity, model: MODEL, generated_at: new Date().toISOString() },
        };
        await saveStore(lang, store);

        const flagged = !noQa && (qa.jargon < QA_MIN || qa.fidelity < QA_MIN);
        if (flagged) weak++;
        else ok++;
        const badge = noQa ? "✓" : flagged ? `⚠ j${qa.jargon}/f${qa.fidelity}` : `✓ j${qa.jargon}/f${qa.fidelity}`;
        console.log(`${badge} ${(fields.one_liner ?? fields.summary_short ?? "").slice(0, 48)}…`);
      } catch (err) {
        console.log(`✗ ${(err as Error).message}`);
        failed++;
      }
      if (PACE_MS > 0) await sleep(PACE_MS);
    }
    console.log(`[${lang}] done: ${ok} ok, ${weak} flagged (<${QA_MIN}), ${failed} failed.\n`);
  }
}

main();
