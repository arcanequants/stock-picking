/**
 * Stock research translations for non-Spanish locales.
 * Spanish text lives in stocks.ts (source of truth).
 * EN/PT/HI translations live in separate files to keep bundles manageable.
 */
import { enTranslations } from "./stock-i18n-en";
import { ptTranslations } from "./stock-i18n-pt";
import { hiTranslations } from "./stock-i18n-hi";

export type TranslatableField =
  | "summary_short"
  | "summary_what"
  | "summary_why"
  | "summary_risk";

export type StockTranslation = Partial<Record<TranslatableField, string>>;

const translations: Record<string, Record<string, StockTranslation>> = {
  en: enTranslations,
  pt: ptTranslations,
  hi: hiTranslations,
};

/**
 * Returns a localized stock research field.
 * Falls back to the Spanish text from the stock object.
 */
export function getLocalizedField<T extends { ticker: string }>(
  stock: T,
  field: TranslatableField,
  locale: string,
): string {
  if (locale === "es") return (stock as Record<string, unknown>)[field] as string ?? "";
  const t = translations[locale]?.[stock.ticker]?.[field];
  return t ?? ((stock as Record<string, unknown>)[field] as string ?? "");
}
