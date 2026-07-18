import { stocks } from "@/data/stocks";
import type { Stock } from "@/lib/types";

/**
 * stocks.ts mixes two sector taxonomies (Yahoo + GICS-style). Aliases map
 * them onto one grouping key so related-pick lists don't split "Financials"
 * and "Financial Services" into different families. Display still uses each
 * stock's original sector string — this is grouping-only.
 */
const SECTOR_ALIASES: Record<string, string> = {
  "Financial Services": "Financials",
  "Basic Materials": "Materials",
  "Consumer Cyclical": "Consumer Discretionary",
  "Consumer Defensive": "Consumer Staples",
  "Health Care": "Healthcare",
  "Broad Market ETF": "ETF",
};

export function normalizeSector(sector: string): string {
  return SECTOR_ALIASES[sector] ?? sector;
}

export type RelatedPicks = {
  sector: Stock[];
  country: Stock[];
};

/**
 * Lateral links for a stock page: up to `max` picks in the same (normalized)
 * sector, then up to `max` more from the same country that weren't already
 * listed. Re-picked tickers appear once.
 */
export function getRelatedPicks(stock: Stock, max = 6): RelatedPicks {
  const seen = new Set<string>([stock.ticker]);
  const unique: Stock[] = [];
  for (const s of stocks) {
    if (seen.has(s.ticker)) continue;
    seen.add(s.ticker);
    unique.push(s);
  }

  const sectorKey = normalizeSector(stock.sector);
  const sector = unique
    .filter((s) => normalizeSector(s.sector) === sectorKey)
    .slice(0, max);

  const inSector = new Set(sector.map((s) => s.ticker));
  const country = unique
    .filter((s) => s.country === stock.country && !inSector.has(s.ticker))
    .slice(0, max);

  return { sector, country };
}
