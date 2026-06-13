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
import { JsonLd } from "@/lib/seo";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function normalizeLocale(locale: string): EconLocale {
  if (locale === "en" || locale === "pt" || locale === "hi") return locale;
  return "es";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return { title: "No encontrado — Vectorial Economía" };
  const a = pickAnalysis(ev, "en");
  const url = `${SITE_URL}/economia/${ev.slug}`;
  return {
    title: `${ev.event_name} (${ev.event_date}) — Vectorial Economía`,
    description: a.headline,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${ev.event_name} — Vectorial Economía`,
      description: a.headline,
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
