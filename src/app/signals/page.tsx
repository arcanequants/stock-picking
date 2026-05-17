import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
import {
  listLiveSignals,
  getLatestObservation,
  type SignalDefinition,
  type SignalLocale,
} from "@/lib/signals";
import { getSignalView } from "@/lib/signals-view";
import { SignalCard } from "@/components/SignalCard";
import { SignalViewToggle } from "@/components/SignalViewToggle";
import { JsonLd, getServiceSchema } from "@/lib/seo";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Vectorial Signals — alt-data signals translated to plain language",
  description:
    "Hedge-fund-tier alternative-data signals from satellites, AIS, EIA, USDA, TROPOMI. Free preview per signal; full history + alerts on the $1/mo subscription.",
  alternates: {
    canonical: `${SITE_URL}/signals`,
    languages: {
      es: `${SITE_URL}/signals`,
      en: `${SITE_URL}/signals`,
      pt: `${SITE_URL}/signals`,
      hi: `${SITE_URL}/signals`,
    },
    types: {
      "application/rss+xml": [
        { url: `${SITE_URL}/signals/feed.xml`, title: "Vectorial Signals (RSS)" },
      ],
      "application/feed+json": [
        { url: `${SITE_URL}/signals/feed.json`, title: "Vectorial Signals (JSON Feed)" },
      ],
    },
  },
  robots: { index: true, follow: true },
};

function normalizeLocale(locale: string): SignalLocale {
  if (locale === "en" || locale === "pt" || locale === "hi") return locale;
  return "es";
}

async function loadSignals() {
  const definitions = await listLiveSignals();
  const enriched = await Promise.all(
    definitions.map(async (def) => {
      const latest = await getLatestObservation(def.id);
      const delta =
        latest && latest.baseline_value !== null && latest.baseline_value !== 0
          ? (Number(latest.value) - Number(latest.baseline_value)) /
            Math.abs(Number(latest.baseline_value))
          : null;
      return { def, latest, delta };
    })
  );
  return enriched;
}

type EnrichedRow = Awaited<ReturnType<typeof loadSignals>>[number];

function groupByDomain(rows: EnrichedRow[]) {
  const order: SignalDefinition["domain"][] = [
    "maritime",
    "energy",
    "geospatial",
    "atmospheric",
    "agricultural",
    "cross",
  ];
  const map = new Map<string, EnrichedRow[]>();
  for (const r of rows) {
    const key = r.def.domain;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return order.filter((d) => map.has(d)).map((d) => ({ domain: d, rows: map.get(d)! }));
}

const DOMAIN_LABEL: Record<SignalDefinition["domain"], string> = {
  maritime: "Maritime",
  energy: "Energy & Commodities",
  geospatial: "Geospatial",
  atmospheric: "Atmospheric",
  agricultural: "Agricultural",
  cross: "Cross-domain",
};

export default async function SignalsIndexPage() {
  const locale = normalizeLocale(await getLocale());
  const { user } = await getAuthState();
  const view = await getSignalView();
  const enriched = await loadSignals();
  const grouped = groupByDomain(enriched);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Vectorial Signals catalog",
    description:
      "All live alternative-data signals published by Vectorial Data.",
    itemListElement: enriched.map((row, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/signals/${row.def.id}`,
      name: row.def.name,
    })),
  };

  return (
    <div className="space-y-10">
      <JsonLd data={getServiceSchema("signals")} />
      <JsonLd data={itemListSchema} />

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-signals-accent-text">
              Vectorial Signals
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              The hedge fund&apos;s eyes. Translated.
            </h1>
            <p className="text-text-muted max-w-2xl mt-2 leading-relaxed">
              Alternative-data signals from public satellites, AIS, EIA, USDA, and
              TROPOMI — cleaned, baselined, translated. One number, one baseline,
              one sentence.
            </p>
          </div>
          {user && (
            <SignalViewToggle view={view} returnPath="/signals" />
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-text-faint">
          <Link href="/api/signals" className="underline hover:text-signals-accent-hover">
            JSON catalog
          </Link>
          <span>·</span>
          <Link
            href="/api/signals/openapi.json"
            className="underline hover:text-signals-accent-hover"
          >
            OpenAPI 3.1
          </Link>
          <span>·</span>
          <Link href="/llms.txt" className="underline hover:text-signals-accent-hover">
            llms.txt
          </Link>
          <span>·</span>
          <Link href="/signals/feed.xml" className="underline hover:text-signals-accent-hover">
            RSS
          </Link>
          <span>·</span>
          <Link href="/signals/feed.json" className="underline hover:text-signals-accent-hover">
            JSON Feed
          </Link>
        </div>
      </header>

      {grouped.length === 0 ? (
        <p className="text-text-muted text-sm">No live signals yet.</p>
      ) : (
        grouped.map((group) => (
          <section key={group.domain} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
              {DOMAIN_LABEL[group.domain]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.rows.map((row) => (
                <SignalCard
                  key={row.def.id}
                  definition={row.def}
                  latest={row.latest}
                  delta={row.delta}
                  locale={locale}
                  view={view}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <footer className="border-t border-border pt-6 text-xs text-text-faint leading-relaxed max-w-3xl space-y-2">
        <p>
          Vectorial Signals is descriptive market intelligence. Not investment
          advice. We don&apos;t manage money. Past correlations don&apos;t
          predict future performance. Decisions are yours.
        </p>
        <p>
          <Link
            href="/legal/signals-terms"
            className="underline hover:text-signals-accent-hover"
          >
            Vectorial Signals Terms of Use
          </Link>
        </p>
      </footer>
    </div>
  );
}
