/**
 * Stock research translations for non-Spanish locales.
 * Spanish text lives in stocks.ts + mom-overrides.json (source of truth).
 * EN/PT/HI translations live in separate files to keep bundles manageable.
 *
 * hi is intentionally frozen for investment CONTENT (SEBI legal gate): the
 * hi store may stay empty and every field falls back to Spanish until cleared.
 */
import { enTranslations } from "./stock-i18n-en";
import { ptTranslations } from "./stock-i18n-pt";
import { hiTranslations } from "./stock-i18n-hi";

export type TranslatableField =
  | "summary_short"
  | "summary_what"
  | "summary_why"
  | "summary_risk"
  | "research_full"
  | "one_liner"
  | "why_short"
  | "risk_short";

export type StockTranslation = Partial<Record<TranslatableField, string>>;

const translations: Record<string, Record<string, StockTranslation>> = {
  en: enTranslations,
  pt: ptTranslations,
  hi: hiTranslations,
};

/**
 * Core resolver: returns the localized value for a field, or the provided
 * Spanish fallback. Callers pass the es value explicitly because different
 * fields have different Spanish sources (stocks.ts vs mom-overrides.json vs
 * the compactor), so this module never has to know where es text lives.
 */
export function localized(
  ticker: string,
  field: TranslatableField,
  locale: string,
  esFallback: string,
): string {
  if (locale === "es") return esFallback;
  return translations[locale]?.[ticker]?.[field] ?? esFallback;
}

/**
 * Backward-compatible accessor for the summary_* fields whose Spanish source
 * is the stock object itself. Used by the web stock pages.
 */
export function getLocalizedField<T extends { ticker: string }>(
  stock: T,
  field: TranslatableField,
  locale: string,
): string {
  const esFallback = ((stock as Record<string, unknown>)[field] as string) ?? "";
  return localized(stock.ticker, field, locale, esFallback);
}

/** True when a non-es locale has at least one translated field for the ticker. */
export function hasTranslation(ticker: string, locale: string): boolean {
  if (locale === "es") return true;
  const t = translations[locale]?.[ticker];
  return !!t && Object.keys(t).length > 0;
}
