import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import LocaleSuggestBanner from "@/components/LocaleSuggestBanner";

/**
 * Guards the [locale] segment. Without the hasLocale check any first path
 * segment would be accepted as a language — /foo/picks would render the
 * Spanish page under a junk URL and hand Google an infinite supply of
 * duplicates.
 *
 * The chrome (html/body, nav, footer) stays in the root layout because the
 * signed-in pages outside this segment share it.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  // The suggestion banner lives here — not in the root layout — so it only
  // renders on pages that exist in all four languages. Unlocalized routes
  // (/account, /admin…) must never offer a switch to a URL that 404s.
  return (
    <>
      <LocaleSuggestBanner />
      {children}
    </>
  );
}
