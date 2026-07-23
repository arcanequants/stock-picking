import OpenAI from "openai";
import { newsModel, isReasoningModel } from "@/lib/news-model";

/**
 * Ingest-time enrichment for app news: classify (topic / regions / tickers)
 * and rewrite into the 4-block "explainer de 60 segundos" format, in Spanish
 * (source of truth — en/pt/hi are produced by translate-content afterwards).
 *
 * The publisher keeps sending plain headline+body (nothing changes for the
 * Routine); everything here is derived server-side. Failures are non-fatal:
 * a null return publishes the item exactly like today (headline+body only,
 * topic 'markets', region 'global').
 */

let _client: OpenAI | null = null;
function client(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

export const NEWS_TOPICS = [
  "picks",
  "companies",
  "economy",
  "politics",
  "markets",
] as const;
export type NewsTopic = (typeof NEWS_TOPICS)[number];

export const NEWS_REGIONS = [
  "global",
  "us",
  "mx",
  "br",
  "in",
  "eu",
  "asia",
] as const;
export type NewsRegion = (typeof NEWS_REGIONS)[number];

export interface NewsBlocks {
  what: string;
  why: string;
  you: string;
  tell: string;
}

export interface GlossaryEntry {
  term: string;
  def: string;
}

export interface NewsEnrichment {
  topic: NewsTopic;
  regions: NewsRegion[];
  tickers: string[];
  blocks: NewsBlocks;
  glossary: GlossaryEntry[];
}

const SYSTEM_PROMPT = `Eres el editor de Vectorial Noticias. Tu audiencia NO es experta en finanzas — muchos invierten por primera vez. Tu trabajo: que después de 60 segundos el lector sienta que ENTENDIÓ algo y pueda contárselo a alguien más.

Recibes una noticia (titular + cuerpo en español) y devuelves SOLO un JSON válido, sin markdown:

{
  "topic": "picks" | "companies" | "economy" | "politics" | "markets",
  "regions": ["global" | "us" | "mx" | "br" | "in" | "eu" | "asia", ...],
  "tickers": ["MU", ...],
  "blocks": {
    "what": "...",
    "why": "...",
    "you": "...",
    "tell": "..."
  },
  "glossary": [{ "term": "...", "def": "..." }, ...]
}

TAXONOMÍA:
- topic "picks": la noticia es específicamente sobre una empresa del portafolio Vectorial (el cuerpo lo dirá; si menciona un pick/ticker del portafolio, es picks).
- "companies": empresas y resultados en general (ganancias, productos, movidas grandes).
- "economy": macro — tasas, inflación, empleo, bancos centrales.
- "politics": política y regulación que mueve dinero (elecciones, aranceles, leyes).
- "markets": bolsas, divisas, petróleo, oro, cripto.
- regions: 1 a 3. "global" solo si de verdad afecta al mundo entero (decisiones de la Fed cuentan como us Y global). País específico → su código. Otros países → la región más cercana o "global".
- tickers: SOLO tickers de empresas que la noticia afecta de forma directa y material. Vacío si no aplica.

LOS 4 BLOQUES (el corazón del trabajo):
- "what" (QUÉ PASÓ): máx 280 caracteres. El hecho, con números concretos. Cero jerga — prueba de la mamá: si tu mamá tendría que googlear un término, reescríbelo o mételo al glosario.
- "why" (POR QUÉ IMPORTA): máx 320. El contexto que hace sentir "ahora entiendo". Causa → consecuencia, en palabras de todos los días.
- "you" (Y PARA TU PORTAFOLIO): máx 320. Conexión con inversionistas de largo plazo estilo Vectorial. DESCRIPTIVO, nunca consejo: prohibido "deberías", "compra", "vende", "considera". Si no hay conexión clara con inversiones, di qué significa para el bolsillo de una persona normal.
- "tell" (CUÉNTALO ASÍ): máx 180. UNA frase citable que el lector pueda repetir en la cena y sonar listo. Simple, concreta, memorable. SIN comillas de ningún tipo — la app las agrega al mostrarla.

GLOSARIO: 0 a 3 términos que aparezcan en tus bloques y que un principiante no conozca (Fed, tasa de interés, arancel...). "def" = una línea, máx 140 caracteres, en español llano.

NOTICIAS MACRO (PIB, inflación, tasas, empleo, tipo de cambio) — el puente "qué hueva → aaah, ya entendí":
- Traduce SIEMPRE el número a vida diaria: inflación 5% = "lo que costaba $100 ahora cuesta $105"; PIB débil = "las empresas venden menos y contratan más lento".
- "why" nombra los SECTORES concretos que lo sienten primero (construcción, consumo, crédito, gasolina, tortilla...).
- El lector debe salir con el insight "esto puede afectar esto y esto" — algo que pueda usar en su día a día o en una plática.

POLÍTICA (elecciones, propuestas de ley, impuestos, aranceles):
- Explica QUÉ propone/cambió y su efecto económico probable: quién paga, quién gana, qué sectores, qué precios.
- NEUTRALIDAD ABSOLUTA: describe el impacto económico, jamás opines sobre partidos, candidatos o ideologías. Cero adjetivos de juicio político.

REGLAS DURAS:
- Nunca recomiendas comprar o vender. Somos publicación, no asesores.
- Nunca inventes datos que no estén en la noticia.
- Español neutro, cálido, directo. Frases cortas.`;

export async function classifyNews(
  headline: string,
  body: string,
): Promise<NewsEnrichment | null> {
  const c = client();
  if (!c) return null;
  try {
    const model = newsModel();
    const res = await c.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      // Enrichment runs once per news, offline — think more, the blocks ARE
      // the product.
      ...(isReasoningModel(model)
        ? { reasoning_effort: "medium" as const, max_completion_tokens: 2000 }
        : { temperature: 0.4 }),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `TITULAR: ${headline}\n\nCUERPO:\n${body}` },
      ],
    });
    const raw = JSON.parse(res.choices[0]?.message?.content ?? "null") as {
      topic?: string;
      regions?: unknown[];
      tickers?: unknown[];
      blocks?: Partial<NewsBlocks>;
      glossary?: { term?: string; def?: string }[];
    } | null;
    if (!raw?.blocks) return null;

    const topic = NEWS_TOPICS.includes(raw.topic as NewsTopic)
      ? (raw.topic as NewsTopic)
      : "markets";
    const regions = (raw.regions ?? [])
      .filter((r): r is NewsRegion => NEWS_REGIONS.includes(r as NewsRegion))
      .slice(0, 3);
    const tickers = (raw.tickers ?? [])
      .filter((t): t is string => typeof t === "string" && /^[A-Z.\-]{1,8}$/.test(t))
      .slice(0, 5);

    const { what, why, you, tell } = raw.blocks;
    if (!what?.trim() || !why?.trim() || !you?.trim() || !tell?.trim()) {
      return null;
    }

    const glossary = (raw.glossary ?? [])
      .filter(
        (g): g is GlossaryEntry =>
          typeof g?.term === "string" &&
          typeof g?.def === "string" &&
          g.term.trim().length > 0 &&
          g.def.trim().length > 0,
      )
      .slice(0, 3)
      .map((g) => ({ term: g.term.trim(), def: g.def.trim().slice(0, 160) }));

    return {
      topic,
      regions: regions.length > 0 ? regions : ["global"],
      tickers,
      blocks: {
        what: what.trim().slice(0, 320),
        why: why.trim().slice(0, 360),
        you: you.trim().slice(0, 360),
        tell: tell.trim().slice(0, 200),
      },
      glossary,
    };
  } catch (err) {
    console.error("classifyNews failed:", err);
    return null;
  }
}
