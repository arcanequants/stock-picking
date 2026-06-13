import { getSupabaseAdmin } from "@/lib/supabase";

export type EconLocale = "es" | "en" | "pt" | "hi";

export type EconImportance = "high" | "medium";
export type EconSurprise = "hotter" | "cooler" | "inline" | "mixed";
export type MarketDirection = "up" | "down" | "neutral";

export type AffectedMarket = {
  market: string;
  direction: MarketDirection;
  why: string;
};

/**
 * The human-facing analysis, structured so every reader leaves with a takeaway.
 * headline → what_it_means → market_impact → learning (the "🎓 aprendizaje").
 */
export type EconAnalysis = {
  headline: string;
  what_it_means: string;
  market_impact: string;
  learning: string;
};

export type EconomicEvent = {
  id: number;
  event_date: string;
  slug: string;
  event_name: string;
  country: string;
  category: string;
  importance: EconImportance;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  unit: string | null;
  surprise: EconSurprise | null;
  affected_markets: AffectedMarket[];
  analysis: Partial<Record<EconLocale, EconAnalysis>>;
  source_url: string | null;
  occurred_at: string;
  published_at: string;
  created_at: string;
};

const EMPTY_ANALYSIS: EconAnalysis = {
  headline: "",
  what_it_means: "",
  market_impact: "",
  learning: "",
};

/** Locale fallback chain: requested → es (source of truth) → en → empty. */
export function pickAnalysis(
  ev: EconomicEvent,
  locale: EconLocale
): EconAnalysis {
  return ev.analysis[locale] ?? ev.analysis.es ?? ev.analysis.en ?? EMPTY_ANALYSIS;
}

export async function getLatestEvent(): Promise<EconomicEvent | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("economic_events")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(1);
  return (data?.[0] as EconomicEvent | undefined) ?? null;
}

export async function listEvents(limit = 50): Promise<EconomicEvent[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("economic_events")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as EconomicEvent[];
}

export async function getEventBySlug(
  slug: string
): Promise<EconomicEvent | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("economic_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as EconomicEvent | null) ?? null;
}

const DISCLAIMER_ES =
  "Vectorial Economía es información educativa descriptiva sobre datos macro. No es asesoría de inversión. El comportamiento histórico de los mercados no garantiza resultados futuros.";

const DISCLAIMER_EN =
  "Vectorial Economía is descriptive educational information about macro data. Not investment advice. Past market behavior does not guarantee future results.";

const DISCLAIMER_PT =
  "Vectorial Economía é informação educativa descritiva sobre dados macro. Não é aconselhamento de investimento. O comportamento histórico dos mercados não garante resultados futuros.";

function disclaimerFor(locale: EconLocale): string {
  if (locale === "en") return DISCLAIMER_EN;
  if (locale === "pt") return DISCLAIMER_PT;
  return DISCLAIMER_ES;
}

const ARROW: Record<MarketDirection, string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

export function renderBriefMarkdown(
  ev: EconomicEvent,
  locale: EconLocale
): string {
  const a = pickAnalysis(ev, locale);
  const unit = ev.unit ? ` ${ev.unit}` : "";
  const markets =
    ev.affected_markets.length > 0
      ? ev.affected_markets
          .map((m) => `- ${m.market} ${ARROW[m.direction]} — ${m.why}`)
          .join("\n")
      : "- (none specified)";

  return `# ${ev.event_name} — ${ev.event_date}

> ${a.headline}

## DATA
- Actual: ${ev.actual ?? "n/a"}${unit}
- Forecast: ${ev.forecast ?? "n/a"}${unit}
- Previous: ${ev.previous ?? "n/a"}${unit}
- Surprise vs forecast: ${ev.surprise ?? "n/a"}

## WHAT IT MEANS
${a.what_it_means}

## MARKET IMPACT
${a.market_impact}

### Affected markets
${markets}

## LEARNING
${a.learning}

## META
- Country: ${ev.country}
- Category: ${ev.category}
- Importance: ${ev.importance}
- Released at: ${ev.occurred_at}
- Source: ${ev.source_url ?? "n/a"}

## DISCLAIMER
${disclaimerFor(locale)}
`;
}

/** Machine-readable shape for bots/agents — structured numbers + English digest. */
export function renderMachineJson(ev: EconomicEvent) {
  const en = pickAnalysis(ev, "en");
  return {
    date: ev.event_date,
    slug: ev.slug,
    event: ev.event_name,
    country: ev.country,
    category: ev.category,
    importance: ev.importance,
    actual: ev.actual,
    forecast: ev.forecast,
    previous: ev.previous,
    unit: ev.unit,
    surprise: ev.surprise,
    affected_markets: ev.affected_markets,
    analysis_en: en,
    source_url: ev.source_url,
    occurred_at: ev.occurred_at,
    published_at: ev.published_at,
    brief_url: `https://vectorialdata.com/economia/${ev.slug}/brief.md`,
    page_url: `https://vectorialdata.com/economia/${ev.slug}`,
  };
}

export function renderJsonLdDataset(ev: EconomicEvent, locale: EconLocale) {
  const a = pickAnalysis(ev, locale);
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${ev.event_name} — ${ev.event_date}`,
    description: a.headline,
    creator: {
      "@type": "Organization",
      name: "Vectorial Data",
      url: "https://vectorialdata.com",
    },
    license: "https://vectorialdata.com/terms",
    variableMeasured: `${ev.event_name} (${ev.unit ?? "value"})`,
    temporalCoverage: ev.event_date,
    isAccessibleForFree: true,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `https://vectorialdata.com/api/economic-events/${ev.slug}`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/markdown",
        contentUrl: `https://vectorialdata.com/economia/${ev.slug}/brief.md`,
      },
    ],
  };
}

export { disclaimerFor as econDisclaimer };
