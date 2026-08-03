import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const SITE_URL = "https://vectorialdata.com";

/**
 * Canonical + hreflang for a page that exists in all four languages.
 *
 * `path` is the route without any locale prefix ("/picks", "/stocks/NU", ""
 * for the homepage). Spanish stays unprefixed, matching the as-needed URL
 * strategy, so the Spanish canonicals are exactly the URLs Google already has.
 *
 * Getting this wrong is the one mistake that would sink the migration: if
 * /pt/picks kept declaring /picks as its canonical, Google would treat the
 * Portuguese page as a duplicate and drop it, and the translations would stay
 * invisible — the very problem this is meant to fix.
 */
export function localeHref(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  return locale === defaultLocale
    ? `${SITE_URL}${clean}`
    : `${SITE_URL}/${locale}${clean}`;
}

export function localizedAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localeHref(l, path);
  // x-default points at Spanish: it is the source language and the version we
  // want served to anyone whose language we don't publish.
  languages["x-default"] = localeHref(defaultLocale, path);

  return {
    canonical: localeHref(locale, path),
    languages,
  };
}

/** BCP-47 tags, for og:locale and Intl formatting. */
export const BCP47: Record<Locale, string> = {
  es: "es_MX",
  en: "en_US",
  pt: "pt_BR",
  hi: "hi_IN",
};
