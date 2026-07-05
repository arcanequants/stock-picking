import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAuthState } from "@/lib/auth";
import {
  getSignal,
  getSignalSnapshot,
  pickCopyCasual,
  pickCopyPro,
  renderJsonLdDataset,
  type SignalLocale,
} from "@/lib/signals";
import { getSignalView } from "@/lib/signals-view";
import { SignalViewToggle } from "@/components/SignalViewToggle";
import { SignalChart } from "@/components/SignalChart";
import { SignalsHormuzMap } from "@/components/SignalsHormuzMap";
import { SignalsTropomiMap } from "@/components/SignalsTropomiMap";
import { JsonLd } from "@/lib/seo";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function normalizeLocale(locale: string): SignalLocale {
  if (locale === "en" || locale === "pt" || locale === "hi") return locale;
  return "es";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const def = await getSignal(id);
  if (!def) return { title: "Signal not found — Vectorial Signals" };

  const casual = pickCopyCasual(def.copy, "en");
  const url = `${SITE_URL}/signals/${def.id}`;
  return {
    title: `${casual.title || def.name} — Vectorial Signals`,
    description: casual.tagline || `${def.name} (${def.unit})`,
    alternates: {
      canonical: url,
      languages: { es: url, en: url, pt: url, hi: url },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${casual.title || def.name} — Vectorial Signals`,
      description: casual.tagline,
      url,
      siteName: "Vectorial Data",
    },
  };
}

function fmtValue(value: number, decimals: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(pct: number) {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${(pct * 100).toFixed(1)}%`;
}

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await getSignalSnapshot(id);
  if (!snapshot) notFound();

  const { definition, latest, delta_vs_baseline_pct, history } = snapshot;
  const locale = normalizeLocale(await getLocale());
  const { user } = await getAuthState();
  const view = await getSignalView();

  const casual = pickCopyCasual(definition.copy, locale);
  const pro = pickCopyPro(definition.copy, locale);
  const m = definition.methodology;

  const valueDisplay = latest
    ? `${fmtValue(Number(latest.value), definition.display_decimals)} ${definition.unit}`
    : "—";

  const observedAt = latest?.observed_at
    ? new Date(latest.observed_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }) + " UTC"
    : "no observation yet";

  // Honest cadence note — EIA daily spots publish T+2 business days,
  // weekly petroleum publishes Wed for prior Fri. Users were confused why
  // the chart "ended on May 18" when today is May 21 — this names the lag.
  const cadenceNote = (() => {
    const cad = m.cadence.toLowerCase();
    if (cad.includes("weekly")) return "Source publishes weekly, ~5-day lag.";
    if (cad.includes("daily")) return "Source publishes T+1 to T+2 business days.";
    if (cad.includes("monthly")) return "Source publishes monthly.";
    return null;
  })();

  const deltaPositive =
    delta_vs_baseline_pct !== null && delta_vs_baseline_pct >= 0;

  return (
    <div className="space-y-8 max-w-3xl">
      <JsonLd data={renderJsonLdDataset(snapshot, locale)} />

      <nav className="text-xs text-text-faint">
        <Link href="/signals" className="hover:text-signals-accent-hover">
          ← All signals
        </Link>
      </nav>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-faint">
              {definition.domain} · {definition.status}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {view === "pro" ? definition.name : casual.title || definition.name}
            </h1>
            {view === "casual" && casual.tagline && (
              <p className="text-text-muted mt-2 leading-relaxed max-w-2xl">
                {casual.tagline}
              </p>
            )}
          </div>
          {user && (
            <SignalViewToggle view={view} returnPath={`/signals/${definition.id}`} />
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-baseline gap-4 flex-wrap">
          <div className="text-4xl md:text-5xl font-semibold tabular-nums">
            {valueDisplay}
          </div>
          <div
            className={`text-sm tabular-nums ${
              delta_vs_baseline_pct === null
                ? "text-text-faint"
                : deltaPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {delta_vs_baseline_pct !== null
              ? fmtPct(delta_vs_baseline_pct)
              : "n/a"}
            <span className="text-text-faint"> vs {m.baseline_method}</span>
          </div>
        </div>
        <p className="text-xs text-text-faint">
          Observed: {observedAt}
          {cadenceNote && (
            <span className="text-text-faint/70"> · {cadenceNote}</span>
          )}
        </p>
        {history.length >= 2 && (
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] uppercase tracking-wide text-text-faint mb-2">
              Interactive chart · hover for date + value · dashed ={" "}
              {definition.methodology.baseline_method}
            </p>
            <SignalChart
              history={history}
              unit={definition.unit}
              decimals={definition.display_decimals}
              baselineLabel={definition.methodology.baseline_method}
            />
          </div>
        )}
      </section>

      {/* Live visualization — gated by signal id so other detail pages stay
          uncluttered. Maritime + Atmospheric flagships only for now. */}
      {definition.id === "hormuz-transit" && (
        <SignalsHormuzMap
          baselineCount={
            latest?.baseline_value !== null && latest?.baseline_value !== undefined
              ? Number(latest.baseline_value)
              : null
          }
          liveCountFallback={
            latest?.value !== null && latest?.value !== undefined
              ? Number(latest.value)
              : null
          }
        />
      )}
      {definition.id === "tropomi-no2-economic" && <SignalsTropomiMap />}

      {view === "pro" ? (
        <section className="rounded-xl border border-border p-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-faint">
            Pro one-liner
          </p>
          <p className="text-sm font-mono leading-relaxed">{pro.one_liner}</p>
        </section>
      ) : (
        <section className="rounded-xl border border-border p-5 space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-faint">
            Translation
          </p>
          <p className="text-base leading-relaxed">{casual.translation}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Methodology
        </h2>
        <dl className="text-sm grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
          <dt className="text-text-faint">Source</dt>
          <dd>{m.source}</dd>
          <dt className="text-text-faint">Cadence</dt>
          <dd>{m.cadence}</dd>
          <dt className="text-text-faint">Sensors / APIs</dt>
          <dd>{m.sensors_or_apis.join(", ")}</dd>
          {m.geo_aoi && (
            <>
              <dt className="text-text-faint">AOI</dt>
              <dd>{m.geo_aoi}</dd>
            </>
          )}
          <dt className="text-text-faint">Baseline</dt>
          <dd>{m.baseline_method}</dd>
          {m.uncertainty_note && (
            <>
              <dt className="text-text-faint">Uncertainty</dt>
              <dd>{m.uncertainty_note}</dd>
            </>
          )}
          {m.known_biases && m.known_biases.length > 0 && (
            <>
              <dt className="text-text-faint">Known biases</dt>
              <dd>
                <ul className="list-disc list-inside space-y-1">
                  {m.known_biases.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </dd>
            </>
          )}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Provenance
        </h2>
        <dl className="text-sm grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
          <dt className="text-text-faint">Source URL</dt>
          <dd>
            <a
              href={definition.source_url}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-signals-accent-hover break-all"
            >
              {definition.source_url}
            </a>
          </dd>
          <dt className="text-text-faint">License</dt>
          <dd>{definition.license}</dd>
          {definition.backtest && (
            <>
              <dt className="text-text-faint">Backtest IC</dt>
              <dd>
                {definition.backtest.ic.toFixed(2)} ·{" "}
                {definition.backtest.walk_forward_window}
              </dd>
            </>
          )}
        </dl>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          For developers and AI agents
        </h2>
        <ul className="text-sm space-y-1">
          <li>
            <Link
              href={`/signals/${definition.id}/brief.md`}
              className="underline hover:text-signals-accent-hover"
            >
              /signals/{definition.id}/brief.md
            </Link>{" "}
            <span className="text-text-faint">— LLM-citable markdown</span>
          </li>
          <li>
            <Link
              href={`/api/signals/${definition.id}`}
              className="underline hover:text-signals-accent-hover"
            >
              /api/signals/{definition.id}
            </Link>{" "}
            <span className="text-text-faint">— JSON + JSON-LD Dataset</span>
          </li>
        </ul>
      </section>

      <footer className="border-t border-border pt-6 text-xs text-text-faint leading-relaxed space-y-2">
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
