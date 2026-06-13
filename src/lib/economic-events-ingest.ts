import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  AffectedMarket,
  EconAnalysis,
  EconLocale,
} from "@/lib/economic-events";

const LOCALES: EconLocale[] = ["es", "en", "pt", "hi"];
const DIRECTIONS = new Set(["up", "down", "neutral"]);
const IMPORTANCE = new Set(["high", "medium"]);
const SURPRISE = new Set(["hotter", "cooler", "inline", "mixed"]);

export type IngestOk = {
  ok: true;
  slug: string;
  event_date: string;
  page_url: string;
};
export type IngestErr = { ok: false; error: string; status: number };
export type IngestResult = IngestOk | IngestErr;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanAnalysis(raw: unknown): EconAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const headline = typeof o.headline === "string" ? o.headline.trim() : "";
  const what = typeof o.what_it_means === "string" ? o.what_it_means.trim() : "";
  const impact =
    typeof o.market_impact === "string" ? o.market_impact.trim() : "";
  const learning = typeof o.learning === "string" ? o.learning.trim() : "";
  if (!headline || !what || !impact || !learning) return null;
  return { headline, what_it_means: what, market_impact: impact, learning };
}

function cleanMarkets(raw: unknown): AffectedMarket[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m): AffectedMarket | null => {
      if (!m || typeof m !== "object") return null;
      const o = m as Record<string, unknown>;
      const market = typeof o.market === "string" ? o.market.trim() : "";
      const direction =
        typeof o.direction === "string" && DIRECTIONS.has(o.direction)
          ? (o.direction as AffectedMarket["direction"])
          : "neutral";
      const why = typeof o.why === "string" ? o.why.trim() : "";
      if (!market) return null;
      return { market, direction, why };
    })
    .filter((m): m is AffectedMarket => m !== null);
}

/**
 * Validates a raw economic-event payload and upserts it (one row per
 * event_date). Shared by the HTTP ingest route and the MCP tool so both apply
 * identical validation. Caller is responsible for authentication.
 */
export async function ingestEconomicEvent(
  body: Record<string, unknown>
): Promise<IngestResult> {
  const eventDate =
    typeof body.event_date === "string" ? body.event_date.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { ok: false, status: 400, error: "event_date must be YYYY-MM-DD" };
  }

  const eventName =
    typeof body.event_name === "string" ? body.event_name.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  if (!eventName || !country || !category) {
    return {
      ok: false,
      status: 400,
      error: "event_name, country and category are required",
    };
  }

  const analysisRaw =
    body.analysis && typeof body.analysis === "object"
      ? (body.analysis as Record<string, unknown>)
      : {};
  const analysis: Partial<Record<EconLocale, EconAnalysis>> = {};
  for (const loc of LOCALES) {
    const cleaned = cleanAnalysis(analysisRaw[loc]);
    if (cleaned) analysis[loc] = cleaned;
  }
  if (!analysis.es) {
    return {
      ok: false,
      status: 400,
      error:
        "analysis.es is required with headline, what_it_means, market_impact, learning",
    };
  }

  const importance =
    typeof body.importance === "string" && IMPORTANCE.has(body.importance)
      ? body.importance
      : "high";
  const surprise =
    typeof body.surprise === "string" && SURPRISE.has(body.surprise)
      ? body.surprise
      : null;

  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : slugify(`${eventDate}-${country}-${eventName}`);

  const row = {
    event_date: eventDate,
    slug,
    event_name: eventName,
    country,
    category,
    importance,
    actual: typeof body.actual === "string" ? body.actual.trim() : null,
    forecast: typeof body.forecast === "string" ? body.forecast.trim() : null,
    previous: typeof body.previous === "string" ? body.previous.trim() : null,
    unit: typeof body.unit === "string" ? body.unit.trim() : null,
    surprise,
    affected_markets: cleanMarkets(body.affected_markets),
    analysis,
    source_url:
      typeof body.source_url === "string" ? body.source_url.trim() : null,
    occurred_at:
      typeof body.occurred_at === "string"
        ? body.occurred_at
        : new Date().toISOString(),
    published_at: new Date().toISOString(),
  };

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("economic_events")
    .upsert(row, { onConflict: "event_date" })
    .select("slug, event_date")
    .single();

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  return {
    ok: true,
    slug: data.slug,
    event_date: data.event_date,
    page_url: `https://vectorialdata.com/economia/${data.slug}`,
  };
}
