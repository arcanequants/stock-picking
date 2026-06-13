import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import {
  getLatestEvent,
  listEvents,
  pickAnalysis,
  type EconLocale,
} from "@/lib/economic-events";
import { EconEventCard, ECON_LABELS } from "@/components/EconEventCard";
import { JsonLd } from "@/lib/seo";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function normalizeLocale(locale: string): EconLocale {
  if (locale === "en" || locale === "pt" || locale === "hi") return locale;
  return "es";
}

export const metadata: Metadata = {
  title: "Economía — Vectorial Data",
  description:
    "El evento económico más relevante del día, explicado en lenguaje simple — con un aprendizaje que te llevas siempre. Datos macro para humanos y para bots.",
  alternates: { canonical: `${SITE_URL}/economia` },
  robots: { index: true, follow: true },
};

export default async function EconomiaPage() {
  const locale = normalizeLocale(await getLocale());
  const l = ECON_LABELS[locale];
  const [latest, events] = await Promise.all([getLatestEvent(), listEvents(30)]);
  const archive = events.filter((e) => e.slug !== latest?.slug);

  return (
    <div className="max-w-2xl mx-auto">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Vectorial Economía",
          url: `${SITE_URL}/economia`,
          description: l.intro,
        }}
      />

      <header className="mb-6">
        <p className="text-text-muted">{l.intro}</p>
      </header>

      {latest ? (
        <EconEventCard ev={latest} locale={locale} />
      ) : (
        <p className="text-text-muted py-12 text-center">{l.empty}</p>
      )}

      {archive.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-text-muted mb-3">
            {l.archive}
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {archive.map((ev) => {
              const a = pickAnalysis(ev, locale);
              return (
                <li key={ev.slug}>
                  <Link
                    href={`/economia/${ev.slug}`}
                    className="flex items-baseline justify-between gap-4 py-3 group"
                  >
                    <div>
                      <p className="text-foreground group-hover:text-brand transition-colors font-medium">
                        {ev.event_name}
                      </p>
                      <p className="text-sm text-text-muted line-clamp-1">
                        {a.headline}
                      </p>
                    </div>
                    <span className="text-xs text-text-faint whitespace-nowrap font-mono">
                      {ev.event_date}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="mt-10 text-xs text-text-faint">
        <p className="mb-1">{l.forBots}:</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="/economia/feed.json" className="hover:text-foreground underline">
            feed.json
          </a>
          <a href="/economia/feed.xml" className="hover:text-foreground underline">
            feed.xml
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/economic-events" className="hover:text-foreground underline">
            /api/economic-events
          </a>
          <Link href="/developers" className="hover:text-foreground underline">
            API docs
          </Link>
        </div>
      </footer>
    </div>
  );
}
