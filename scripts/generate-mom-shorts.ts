#!/usr/bin/env tsx
/**
 * Generate plain-Spanish "mom-readable" overrides for each stock's
 * one_liner / why_short / risk_short, replacing the compactor output
 * with an LLM-rewritten version that strips finance jargon.
 *
 * Storage: `src/data/mom-overrides.json` — committed to repo, keyed by
 * ticker, loaded by the research API at request time. Override wins
 * over the compactor. Compactor remains the fallback so the API
 * never breaks on a missing ticker.
 *
 * Usage:
 *   npx tsx scripts/generate-mom-shorts.ts              # missing-only
 *   npx tsx scripts/generate-mom-shorts.ts DLR UBS      # specific tickers
 *   npx tsx scripts/generate-mom-shorts.ts --force      # re-run all
 *   npx tsx scripts/generate-mom-shorts.ts DLR --force  # re-run one
 *
 * Cost: ~$0.03 per stock at gpt-4o, ~$2 for full 70-stock backfill.
 * One-time + per new pick — not a daily cron, source text doesn't change.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { stocks } from "../src/data/stocks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OVERRIDES_PATH = path.join(__dirname, "..", "src", "data", "mom-overrides.json");

interface MomOverride {
  one_liner: string;
  why_short: string;
  risk_short: string;
  generated_at: string;
  model: string;
}

type Overrides = Record<string, MomOverride>;

const MODEL = process.env.MOM_MODEL ?? "gpt-4o";

const SYSTEM_PROMPT = `Eres una editora que traduce análisis financiero a español llano para una persona sin formación financiera — piensa en una mamá de 55 años que nunca ha invertido. Tu trabajo: tomar el texto técnico de Vectorial Data y reescribirlo para que cualquier persona lo entienda en la primera lectura.

REGLAS DE LENGUAJE (críticas):
- Cero anglicismos sin traducir. PROHIBIDO: "market cap", "catalyst", "ride-hailing", "delisting", "antitrust", "gig worker", "CAC", "regulatory recurrence", "guidance", "consensus", "earnings", "EPS", "core FFO", "REIT", "hyperscale", "AI inference", "backlog", "HK relisting", "10Y yields", "P/E forward".
- Reemplazos obligatorios:
  · "market cap" → "tamaño" o "vale X mil millones"
  · "catalyst" → "lo que la puede impulsar"
  · "ride-hailing" → "servicio de viajes en app"
  · "delisting" → "que la saquen de la bolsa"
  · "antitrust" → "leyes de competencia"
  · "guidance" → "lo que esperan ganar el próximo año"
  · "consensus" → "lo que esperaba el mercado"
  · "earnings" → "ganancias trimestrales"
  · "P/E" → "qué tan cara está vs sus ganancias"
  · "REIT" → "empresa de bienes raíces que reparte rentas"
  · "backlog" → "contratos ya firmados pendientes de cobrar"
- Si una palabra técnica es inevitable, explícala en la misma frase ("FFO — la ganancia que reparten los REITs").
- Test de la mamá: si una sola persona necesita googlear UN término, el texto falla.

REGLAS DE FORMATO:
- one_liner: UNA frase, máximo 220 caracteres. Lo que ES la empresa + por qué importa hoy.
- why_short: UN párrafo corto, máximo 280 caracteres. La razón #1 por la que la elegimos, en palabras simples.
- risk_short: UN párrafo corto, máximo 280 caracteres. El riesgo #1, en palabras simples. Sin alarmismo.
- No empieces con "Esta empresa..." ni "DLR es...". Empieza con el verbo o el hecho.
- No uses números de enumeración "(1)(2)(3)". Una idea por campo.
- Conserva nombres propios (Oracle, Meta, Microsoft, Italia) y cifras concretas ($1.22 trimestral, 30% subió).
- No inventes datos. Si la fuente no dice algo, no lo digas.
- No agregues disclaimers ni advertencias genéricas.

OUTPUT: SOLO JSON válido, sin markdown:
{
  "one_liner": "...",
  "why_short": "...",
  "risk_short": "..."
}`;

function buildUserPrompt(s: {
  ticker: string;
  name: string;
  country: string;
  sector: string;
  summary_short: string;
  summary_why: string;
  summary_risk: string;
}): string {
  return `Reescribe esto para una mamá que nunca ha invertido. Empresa: ${s.name} (${s.ticker}), ${s.sector}, ${s.country}.

=== summary_short (fuente para one_liner) ===
${s.summary_short}

=== summary_why (fuente para why_short) ===
${s.summary_why}

=== summary_risk (fuente para risk_short) ===
${s.summary_risk}

Devuelve JSON con one_liner, why_short, risk_short. Cero jargon. Lenguaje de mamá.`;
}

async function loadOverrides(): Promise<Overrides> {
  try {
    const raw = await fs.readFile(OVERRIDES_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveOverrides(overrides: Overrides): Promise<void> {
  const sorted: Overrides = {};
  for (const ticker of Object.keys(overrides).sort()) {
    sorted[ticker] = overrides[ticker];
  }
  await fs.writeFile(OVERRIDES_PATH, JSON.stringify(sorted, null, 2) + "\n");
}

async function rewriteOne(
  openai: OpenAI,
  stock: (typeof stocks)[number],
): Promise<MomOverride> {
  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(stock) },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    one_liner?: string;
    why_short?: string;
    risk_short?: string;
  };
  if (!parsed.one_liner || !parsed.why_short || !parsed.risk_short) {
    throw new Error(`Incomplete LLM response for ${stock.ticker}: ${raw}`);
  }
  return {
    one_liner: parsed.one_liner.trim(),
    why_short: parsed.why_short.trim(),
    risk_short: parsed.risk_short.trim(),
    generated_at: new Date().toISOString(),
    model: MODEL,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const requested = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set. Run with: OPENAI_API_KEY=sk-... npx tsx scripts/generate-mom-shorts.ts");
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey });

  const overrides = await loadOverrides();

  let targets = stocks;
  if (requested.length > 0) {
    targets = stocks.filter((s) => requested.includes(s.ticker));
    const missing = requested.filter((t) => !stocks.find((s) => s.ticker === t));
    if (missing.length > 0) {
      console.error(`Unknown tickers: ${missing.join(", ")}`);
      process.exit(1);
    }
  }
  if (!force) {
    targets = targets.filter((s) => !overrides[s.ticker]);
  }

  if (targets.length === 0) {
    console.log("Nothing to do — all targeted tickers already have overrides. Use --force to rerun.");
    process.exit(0);
  }

  console.log(`Rewriting ${targets.length} ticker(s) with ${MODEL}...`);
  let done = 0;
  let failed = 0;
  for (const stock of targets) {
    process.stdout.write(`  ${stock.ticker.padEnd(8)} ${stock.name.slice(0, 40).padEnd(40)} `);
    try {
      const override = await rewriteOne(openai, stock);
      overrides[stock.ticker] = override;
      // Persist after each so a crash doesn't lose the whole run.
      await saveOverrides(overrides);
      console.log(`✓ ${override.one_liner.slice(0, 60)}…`);
      done++;
    } catch (err) {
      console.log(`✗ ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${done} rewritten, ${failed} failed. Overrides saved to ${OVERRIDES_PATH}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
