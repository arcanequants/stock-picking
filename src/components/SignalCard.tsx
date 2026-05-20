import Link from "next/link";
import {
  pickCopyCasual,
  pickCopyPro,
  type SignalDefinition,
  type SignalLocale,
  type SignalObservation,
  type SignalView,
} from "@/lib/signals";

const DOMAIN_GLYPH: Record<SignalDefinition["domain"], string> = {
  maritime: "⛴",
  energy: "⛽",
  geospatial: "🛰",
  atmospheric: "🌫",
  agricultural: "🌾",
  cross: "△",
};

// Signals that have a live visual layer on their detail page. The card surfaces
// a LIVE pill so users know the wow is one click away, even before the ingestor
// has produced its first observation.
const SIGNALS_WITH_LIVE_VIEW = new Set<string>([
  "hormuz-transit",
  "tropomi-no2-economic",
]);

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

export function SignalCard({
  definition,
  latest,
  delta,
  locale,
  view,
}: {
  definition: SignalDefinition;
  latest: SignalObservation | null;
  delta: number | null;
  locale: SignalLocale;
  view: SignalView;
}) {
  const casual = pickCopyCasual(definition.copy, locale);
  const pro = pickCopyPro(definition.copy, locale);
  const glyph = DOMAIN_GLYPH[definition.domain] ?? "•";
  const hasLiveView = SIGNALS_WITH_LIVE_VIEW.has(definition.id);

  // "Calibrating" replaces the dishonest "— · n/a vs baseline" empty state.
  // Worker consensus (Quant Alt Data + PM + Landing): a card with no
  // observations should communicate "we're still wiring this up, ETA X"
  // rather than ghost the user with em-dashes.
  const isCalibrating = !latest;

  const valueDisplay = latest
    ? `${fmtValue(Number(latest.value), definition.display_decimals)} ${definition.unit}`
    : null;

  const deltaPositive = delta !== null && delta >= 0;

  return (
    <Link
      href={`/signals/${definition.id}`}
      className={`block rounded-2xl border bg-card p-5 transition-colors ${
        isCalibrating
          ? "border-dashed border-border/60 hover:border-signals-accent-border/60"
          : "border-border hover:border-signals-accent-border"
      }`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-faint mb-2">
        <span aria-hidden>{glyph}</span>
        <span>{definition.domain}</span>
        <span className="ml-auto flex items-center gap-2">
          {hasLiveView && (
            <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 tracking-normal normal-case">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              LIVE
            </span>
          )}
          {isCalibrating ? (
            <span className="text-amber-600 dark:text-amber-400">
              ○ calibrating
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">
              ● {definition.status}
            </span>
          )}
        </span>
      </div>

      <h3 className="font-semibold text-base mb-1">
        {view === "pro" ? definition.name : casual.title || definition.name}
      </h3>

      {isCalibrating ? (
        <div className="mb-3">
          <p className="text-xs text-text-faint leading-relaxed">
            Calibrating — first observation pending data-source onboarding.
            {hasLiveView ? " Tap to see the live map." : ""}
          </p>
        </div>
      ) : (
        <div className="flex items-baseline gap-3 mb-3">
          <div className="text-2xl font-semibold tabular-nums">
            {valueDisplay}
          </div>
          <div
            className={`text-xs tabular-nums ${
              delta === null
                ? "text-text-faint"
                : deltaPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {delta !== null ? fmtPct(delta) : "—"}
            <span className="text-text-faint"> vs baseline</span>
          </div>
        </div>
      )}

      {view === "pro" ? (
        <p className="text-sm text-text-muted leading-relaxed font-mono">
          {pro.one_liner}
        </p>
      ) : (
        <p className="text-sm text-text-muted leading-relaxed">
          {casual.tagline}
        </p>
      )}
    </Link>
  );
}
