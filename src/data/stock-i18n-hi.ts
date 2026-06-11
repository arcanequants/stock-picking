import type { StockTranslation } from "./stock-translations";
import data from "./stock-i18n-hi.json";

/**
 * Hindi stock-research translations.
 * FROZEN for investment CONTENT (SEBI legal gate): the pipeline must not
 * write hi content until the SEBI Research Analyst opinion clears it, so
 * this store may stay at its current (UI-era) state and every field falls
 * back to Spanish. Stored in `stock-i18n-hi.json` (committed).
 */
export const hiTranslations: Record<string, StockTranslation> =
  data as Record<string, StockTranslation>;
