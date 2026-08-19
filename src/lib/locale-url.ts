import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * URL-derived locale helpers.
 *
 * The URL is the only trustworthy source of the current locale in client
 * components: NextIntlClientProvider lives in the root layout, which
 * persists across client-side navigations, so useLocale() goes stale the
 * moment the user switches language without a full reload. That stale
 * context produced /en/hi 404s and a switcher stuck on the previous
 * language. Deriving from location.pathname is deterministic.
 */

export function splitLocale(pathname: string): { locale: Locale; base: string } {
  const seg = pathname.split("/")[1];
  if ((locales as readonly string[]).includes(seg)) {
    return { locale: seg as Locale, base: pathname.slice(seg.length + 1) || "/" };
  }
  return { locale: defaultLocale, base: pathname || "/" };
}

export function buildLocalePath(base: string, target: Locale): string {
  const clean = base.startsWith("/") ? base : `/${base}`;
  if (target === defaultLocale) return clean;
  return clean === "/" ? `/${target}` : `/${target}${clean}`;
}

/**
 * vd_locale records an EXPLICIT choice (switcher or suggestion banner) —
 * deliberately not NEXT_LOCALE, which next-intl used to stamp on every
 * response, poisoning both "first visit?" and "did the user choose?".
 */
export const LOCALE_COOKIE = "vd_locale";

export function rememberLocale(target: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=31536000;samesite=lax`;
}

/**
 * Full-page navigation on purpose: a soft navigation re-renders the page
 * but not the root layout, leaving the intl provider, the global nav
 * labels and <html lang> in the previous language. Locale switches are
 * rare — correctness beats the SPA transition here.
 */
export function switchLocaleHard(target: Locale) {
  const { pathname, search, hash } = window.location;
  const { base } = splitLocale(pathname);
  rememberLocale(target);
  window.location.href = buildLocalePath(base, target) + search + hash;
}
