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

  const valueDisplay = latest
    ? `${fmtValue(Number(latest.value), definition.display_decimals)} ${definition.unit}`
    : "—";

  const deltaDisplay = delta !== null ? fmtPct(delta) : "n/a";
  const deltaPositive = delta !== null && delta >= 0;

  return (
    <Link
      href={`/signals/${definition.id}`}
      className="block rounded-2xl border border-border bg-card p-5 hover:border-signals-accent-border transition-colors"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-faint mb-2">
        <span aria-hidden>{glyph}</span>
        <span>{definition.domain}</span>
        <span className="ml-auto text-emerald-600 dark:text-emerald-400">
          ● {definition.status}
        </span>
      </div>

      <h3 className="font-semibold text-base mb-1">
        {view === "pro" ? definition.name : casual.title || definition.name}
      </h3>

      <div className="flex items-baseline gap-3 mb-3">
        <div className="text-2xl font-semibold tabular-nums">{valueDisplay}</div>
        <div
          className={`text-xs tabular-nums ${
            delta === null
              ? "text-text-faint"
              : deltaPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {deltaDisplay}
          <span className="text-text-faint"> vs baseline</span>
        </div>
      </div>

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
