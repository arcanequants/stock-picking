import type { StockTranslation } from "./stock-translations";
import data from "./stock-i18n-hi.json";

/**
 * Hindi stock-research translations.
 * UNFROZEN 2026-07-12 (founder decision): full es→hi backfill; new picks
 * ship i18n_hi alongside en/pt. Missing fields fall back to Spanish.
 * Stored in `stock-i18n-hi.json` (committed).
 */
export const hiTranslations: Record<string, StockTranslation> =
  data as Record<string, StockTranslation>;
