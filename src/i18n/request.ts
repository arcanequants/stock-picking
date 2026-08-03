import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * The locale now comes from the URL segment (or the default, for the
 * unprefixed Spanish paths) instead of being sniffed from a cookie and
 * Accept-Language on every request.
 *
 * That is the point of the routing migration: one URL per language, so a
 * shared link opens in the language it was written in and Google can index
 * all four. Pages outside the [locale] segment (/account, /admin, …) get the
 * default locale, which is what they rendered for most visitors anyway.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
