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
import { SignalsHormuzMap } from "@/components/SignalsHormuzMap";
import { SignalsTropomiMap } from "@/components/SignalsTropomiMap";
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
  // Energy first — it's the only domain with all observations live today, so
  // the user's first scroll lands on real numbers, not calibrating skeletons.
  const order: SignalDefinition["domain"][] = [
    "energy",
    "maritime",
    "atmospheric",
    "agricultural",
    "geospatial",
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

  // Split live vs calibrating. The main grouped grid shows ONLY live signals
  // so first-scroll trust is preserved — calibrating cards used to ghost the
  // page with em-dashes that made working signals look unfinished too.
  // Calibrating signals get a collapsed disclosure at the bottom (still
  // discoverable, no longer foreground).
  const liveRows = enriched.filter((r) => r.latest);
  const calibratingRows = enriched.filter((r) => !r.latest);
  const grouped = groupByDomain(liveRows);

  const liveCount = liveRows.length;
  const calibratingCount = calibratingRows.length;

  // Pull the Hormuz row so the flagship map can quote the real baseline from
  // DB (not invent one). When the ingestor hasn't produced an observation
  // yet, baselineCount stays null and the map shows "—" honestly.
  const hormuzRow = enriched.find((r) => r.def.id === "hormuz-transit");
  const hormuzBaseline =
    hormuzRow?.latest?.baseline_value !== null &&
    hormuzRow?.latest?.baseline_value !== undefined
      ? Number(hormuzRow.latest.baseline_value)
      : null;
  const hormuzLatest =
    hormuzRow?.latest?.value !== null && hormuzRow?.latest?.value !== undefined
      ? Number(hormuzRow.latest.value)
      : null;

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
              Alt-data signals, translated for retail.
            </h1>
            <p className="text-text-muted max-w-2xl mt-2 leading-relaxed">
              The same kind of data hedge funds buy — public satellites, AIS,
              EIA, USDA, TROPOMI — cleaned, baselined, and explained in plain
              language. One number, one baseline, one sentence.
            </p>
            <p className="text-xs text-text-faint mt-3 tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400">●</span>{" "}
              {liveCount} live · {calibratingCount} calibrating ·{" "}
              {enriched.length} total
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

      {/* Flagship live visuals — the "wow" surface. Two maps that move (one
          AIS, one satellite raster), each tied to a real signal in the
          catalog below. Maritime first because the AOI + ship dots animate
          continuously; TROPOMI second because it's a daily refresh. */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
            Live · seen from above
          </h2>
          <p className="text-xs text-text-faint">
            Maps refresh on their natural cadence (AIS: seconds · NO₂: daily).
            Open a card below for methodology, backtest, and provenance.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SignalsHormuzMap
            baselineCount={hormuzBaseline}
            liveCountFallback={hormuzLatest}
          />
          <SignalsTropomiMap />
        </div>
      </section>

      {grouped.length === 0 ? (
        <p className="text-text-muted text-sm">No live signals yet.</p>
      ) : (
        grouped.map((group, groupIndex) => (
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

      {/* Upcoming signals — collapsed by default. Calibrating cards used to
          live in the main grid alongside live ones, which made the page feel
          unfinished. Now they're discoverable but don't lead. Quant Alt Data
          + PM + Landing/Conversion all converged on this. */}
      {calibratingRows.length > 0 && (
        <details className="rounded-2xl border border-dashed border-border/60 bg-card/40">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 select-none">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40 text-amber-500 text-[10px] font-mono">
                {calibratingRows.length}
              </span>
              <div>
                <p className="text-sm font-semibold">Upcoming signals</p>
                <p className="text-xs text-text-faint">
                  Calibrating — first observation pending data-source onboarding.
                </p>
              </div>
            </div>
            <span className="text-xs text-text-faint font-mono uppercase tracking-widest">
              expand →
            </span>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-5 pb-5">
            {calibratingRows.map((row) => (
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
        </details>
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
