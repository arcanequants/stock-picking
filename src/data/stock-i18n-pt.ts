import type { StockTranslation } from "./stock-translations";
import data from "./stock-i18n-pt.json";

/**
 * Portuguese (Brazil) stock-research translations.
 * Content is generated/maintained by `scripts/generate-i18n.ts` and stored
 * in `stock-i18n-pt.json` (committed). Do not hand-edit the JSON for bulk
 * changes — re-run the pipeline so the QA gates apply.
 */
export const ptTranslations: Record<string, StockTranslation> =
  data as Record<string, StockTranslation>;
