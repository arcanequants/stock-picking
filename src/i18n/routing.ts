import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en", "pt", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

/**
 * URL strategy: `as-needed`.
 *
 * Spanish keeps the bare paths it has always had (/picks, /stocks/ZTS,
 * /acciones/sector/tecnologia). Those URLs are the ones Google already
 * indexes and ranks, so they stay byte-identical — this migration adds
 * /pt, /en and /hi as *new* URLs rather than moving the existing ones.
 *
 * `localeDetection: false` on purpose: with detection on, next-intl 302s a
 * visitor (or a crawler) from /picks to /pt/picks based on Accept-Language,
 * which would make the canonical Spanish URL redirect for anyone whose
 * browser isn't Spanish — including Googlebot crawling from the US. Language
 * is chosen explicitly via the switcher, which sets the NEXT_LOCALE cookie.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});
