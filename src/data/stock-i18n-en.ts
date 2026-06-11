import type { StockTranslation } from "./stock-translations";
import data from "./stock-i18n-en.json";

/**
 * English stock-research translations.
 * Content is generated/maintained by `scripts/generate-i18n.ts` and stored
 * in `stock-i18n-en.json` (committed). Do not hand-edit the JSON for bulk
 * changes — re-run the pipeline so the QA gates apply.
 */
export const enTranslations: Record<string, StockTranslation> =
  data as Record<string, StockTranslation>;
