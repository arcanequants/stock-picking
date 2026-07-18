import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  getEventBySlug,
  pickAnalysis,
  renderJsonLdDataset,
  type EconLocale,
} from "@/lib/economic-events";
import { EconEventCard } from "@/components/EconEventCard";
import { JsonLd, metaDescription } from "@/lib/seo";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function normalizeLocale(locale: string): EconLocale {
  if (locale === "en" || locale === "pt" || locale === "hi") return locale;
  return "es";
}

// Human title framing per locale — the raw event_name alone isn't a query
// anyone types; "qué significa" is.
const META_COPY: Record<EconLocale, { suffix: string; notFound: string }> = {
  es: { suffix: "qué significa para los mercados", notFound: "No encontrado — Vectorial Economía" },
  en: { suffix: "what it means for markets", notFound: "Not found — Vectorial Economía" },
  pt: { suffix: "o que significa para os mercados", notFound: "Não encontrado — Vectorial Economía" },
  hi: { suffix: "बाज़ारों के लिए इसका मतलब", notFound: "नहीं मिला — Vectorial Economía" },
};

const DATE_TAGS: Record<EconLocale, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = normalizeLocale(await getLocale());
  const copy = META_COPY[locale];
  const ev = await getEventBySlug(slug);
  if (!ev) return { title: copy.notFound };
  const a = pickAnalysis(ev, locale);
  const url = `${SITE_URL}/economia/${ev.slug}`;
  const date = new Date(`${ev.event_date}T12:00:00`).toLocaleDateString(
    DATE_TAGS[locale],
    { day: "numeric", month: "short", year: "numeric" }
  );
  const title = `${ev.event_name} (${date}): ${copy.suffix}`;
  const description = metaDescription(
    [a.headline, a.what_it_means].filter(Boolean).join(" ")
  );
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "Vectorial Data",
    },
  };
}

export default async function EconEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = normalizeLocale(await getLocale());
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <JsonLd data={renderJsonLdDataset(ev, locale)} />

      <Link
        href="/economia"
        className="text-sm text-text-muted hover:text-foreground inline-block mb-4"
      >
        ← Economía
      </Link>

      <EconEventCard ev={ev} locale={locale} />

      <footer className="mt-8 text-xs text-text-faint">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a
            href={`/economia/${ev.slug}/brief.md`}
            className="hover:text-foreground underline"
          >
            brief.md
          </a>
          <a
            href={`/api/economic-events/${ev.slug}`}
            className="hover:text-foreground underline"
          >
            machine JSON
          </a>
        </div>
      </footer>
    </div>
  );
}
