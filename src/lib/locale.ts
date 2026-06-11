export type Locale = "es" | "en" | "pt";

/** Parse Accept-Language header to a supported locale, defaulting to "es". */
export function parseLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return "es";
  const tag = acceptLanguage.split(",")[0].split(";")[0].trim().slice(0, 2).toLowerCase();
  if (tag === "en") return "en";
  if (tag === "pt") return "pt";
  return "es";
}
