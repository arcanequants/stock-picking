import { stocks, transactions } from "@/data/stocks";
import { normalizeSector } from "@/lib/related-picks";
import type { Stock } from "@/lib/types";

/**
 * Data layer for the /acciones/* list pages (sector, country, dividends).
 *
 * These pages exist so the 120+ per-ticker pages stop being orphans reachable
 * only from /stocks: they answer discovery queries ("acciones que pagan
 * dividendos", "acciones de salud") and give every ticker page a lateral link
 * from a topical hub.
 *
 * Only tickers we actually bought are listed — a "pick" list that included
 * watchlist/avoid research would misrepresent the track record.
 */

export type ListStock = Stock & { firstPickDate: string };

/** Stocks with at least one transaction, deduped by ticker, oldest pick first. */
export function getPickedStocks(): ListStock[] {
  const firstPick = new Map<string, string>();
  for (const tx of transactions) {
    const prev = firstPick.get(tx.ticker);
    if (!prev || tx.date < prev) firstPick.set(tx.ticker, tx.date);
  }

  const seen = new Set<string>();
  const out: ListStock[] = [];
  for (const s of stocks) {
    const date = firstPick.get(s.ticker);
    if (!date || seen.has(s.ticker)) continue;
    seen.add(s.ticker);
    out.push({ ...s, firstPickDate: date });
  }
  return out.sort((a, b) => a.firstPickDate.localeCompare(b.firstPickDate));
}

/* ── Slugs ────────────────────────────────────────────────
 * Spanish slugs on purpose: es is the source language and the SERP we can
 * actually win. Maps are explicit (not derived from the message catalogs) so a
 * translation edit can never silently change a live URL.
 */

const SECTOR_SLUGS: Record<string, string> = {
  Industrials: "industriales",
  Financials: "financiero",
  Technology: "tecnologia",
  "Consumer Staples": "consumo-basico",
  ETF: "etf",
  Materials: "materiales",
  Healthcare: "salud",
  "Consumer Discretionary": "consumo-discrecional",
  "Communication Services": "comunicaciones",
  Utilities: "servicios-publicos",
  Energy: "energia",
  "Real Estate": "bienes-raices",
};

const COUNTRY_SLUGS: Record<string, string> = {
  "United States": "estados-unidos",
  "United Kingdom": "reino-unido",
  Canada: "canada",
  Brazil: "brasil",
  Switzerland: "suiza",
  France: "francia",
  China: "china",
  "South Africa": "sudafrica",
  Germany: "alemania",
  Israel: "israel",
  Australia: "australia",
  "South Korea": "corea-del-sur",
  India: "india",
  Netherlands: "paises-bajos",
  Spain: "espana",
  Denmark: "dinamarca",
  Turkey: "turquia",
  "New Zealand": "nueva-zelanda",
  Mexico: "mexico",
  "Saudi Arabia": "arabia-saudita",
};

/**
 * `country` is a geography field, but ETFs park non-countries in it
 * ("Global", "Multi-Country", "Asia"). Those never get a country page.
 */
const NON_COUNTRIES = new Set(["Global", "Multi-Country", "Asia"]);

/** A group needs 2+ picks to earn its own page — one-pick groups would be
 * thin duplicates of the ticker page they'd link to. Those tickers are still
 * reachable: the /acciones hub links them directly. */
const MIN_GROUP_SIZE = 2;

export type StockGroup = {
  /** Raw English value from stocks.ts — the key for Labels.* dictionaries. */
  value: string;
  slug: string;
  stocks: ListStock[];
};

function buildGroups(
  picked: ListStock[],
  keyOf: (s: ListStock) => string,
  slugs: Record<string, string>,
  skip: (value: string) => boolean = () => false,
): StockGroup[] {
  const byValue = new Map<string, ListStock[]>();
  for (const s of picked) {
    const value = keyOf(s);
    if (skip(value)) continue;
    const slug = slugs[value];
    if (!slug) continue; // unmapped value: no page rather than a guessed URL
    const list = byValue.get(value);
    if (list) list.push(s);
    else byValue.set(value, [s]);
  }

  return [...byValue.entries()]
    .filter(([, list]) => list.length >= MIN_GROUP_SIZE)
    .map(([value, list]) => ({ value, slug: slugs[value], stocks: list }))
    .sort((a, b) => b.stocks.length - a.stocks.length);
}

export function getSectorGroups(picked = getPickedStocks()): StockGroup[] {
  return buildGroups(picked, (s) => normalizeSector(s.sector), SECTOR_SLUGS);
}

export function getCountryGroups(picked = getPickedStocks()): StockGroup[] {
  return buildGroups(picked, (s) => s.country, COUNTRY_SLUGS, (v) =>
    NON_COUNTRIES.has(v),
  );
}

/**
 * Picks below MIN_GROUP_SIZE for their country — linked from the hub so no
 * ticker page is left without a lateral entry point.
 *
 * Excludes the ETF pseudo-geographies ("Global", "Asia", …): listing them
 * under "countries" would be wrong, and those tickers are already linked from
 * the ETF sector page.
 */
export function getUngroupedByCountry(picked = getPickedStocks()): ListStock[] {
  const grouped = new Set(
    getCountryGroups(picked).flatMap((g) => g.stocks.map((s) => s.ticker)),
  );
  return picked
    .filter((s) => !grouped.has(s.ticker) && !NON_COUNTRIES.has(s.country))
    .sort((a, b) => a.country.localeCompare(b.country));
}

/** Dividend payers, highest yield first. */
export function getDividendStocks(picked = getPickedStocks()): ListStock[] {
  return picked
    .filter((s) => (s.dividend_yield ?? 0) > 0)
    .sort((a, b) => (b.dividend_yield ?? 0) - (a.dividend_yield ?? 0));
}

export function findSectorGroup(slug: string): StockGroup | undefined {
  return getSectorGroups().find((g) => g.slug === slug);
}

export function findCountryGroup(slug: string): StockGroup | undefined {
  return getCountryGroups().find((g) => g.slug === slug);
}

/** Path of the list page a ticker belongs to, or null when that group has no
 * page (unmapped value, or fewer than MIN_GROUP_SIZE picks). */
export function sectorPathFor(sector: string): string | null {
  const key = normalizeSector(sector);
  const group = getSectorGroups().find((g) => g.value === key);
  return group ? `/acciones/sector/${group.slug}` : null;
}

export function countryPathFor(country: string): string | null {
  const group = getCountryGroups().find((g) => g.value === country);
  return group ? `/acciones/pais/${group.slug}` : null;
}

/** Most recent `last_updated_at` in a group — the honest sitemap lastmod. */
export function groupLastModified(list: ListStock[]): string | undefined {
  const dates = list.map((s) => s.last_updated_at).filter(Boolean).sort();
  return dates[dates.length - 1];
}

/** Average dividend yield of the payers in a list, or null if none pay. */
export function averageYield(list: ListStock[]): number | null {
  const payers = list.filter((s) => (s.dividend_yield ?? 0) > 0);
  if (payers.length === 0) return null;
  const sum = payers.reduce((acc, s) => acc + (s.dividend_yield ?? 0), 0);
  return Math.round((sum / payers.length) * 100) / 100;
}
