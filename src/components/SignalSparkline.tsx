import type { SignalObservation } from "@/lib/signals";

/**
 * Minimal SVG sparkline — no client JS, no chart library. Renders the value
 * line over a 90-day window, with the rolling baseline drawn as a dashed
 * reference. Assumes observations are sorted ascending by observed_at.
 */
export function SignalSparkline({
  history,
  unit,
  decimals,
  height = 88,
}: {
  history: SignalObservation[];
  unit: string;
  decimals: number;
  height?: number;
}) {
  if (history.length < 2) {
    return (
      <div className="text-xs text-text-faint italic">
        Not enough history yet — chart will appear once 2+ observations exist.
      </div>
    );
  }

  const values = history.map((h) => Number(h.value));
  const baselines = history
    .map((h) => (h.baseline_value != null ? Number(h.baseline_value) : null))
    .filter((v): v is number => v != null);

  const min = Math.min(...values, ...baselines);
  const max = Math.max(...values, ...baselines);
  const range = max - min || 1;
  const pad = range * 0.08;
  const yMin = min - pad;
  const yMax = max + pad;
  const yRange = yMax - yMin;

  const width = 720; // intrinsic; scales via CSS
  const xStep = history.length > 1 ? width / (history.length - 1) : 0;

  const yFor = (v: number) =>
    height - ((v - yMin) / yRange) * height;

  const pathD = history
    .map((h, i) => `${i === 0 ? "M" : "L"} ${i * xStep} ${yFor(Number(h.value))}`)
    .join(" ");

  const baselinePath = history.every((h) => h.baseline_value != null)
    ? history
        .map(
          (h, i) =>
            `${i === 0 ? "M" : "L"} ${i * xStep} ${yFor(Number(h.baseline_value))}`
        )
        .join(" ")
    : null;

  const first = history[0];
  const last = history[history.length - 1];
  const firstDate = new Date(first.observed_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const lastDate = new Date(last.observed_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const fmt = (v: number) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <div className="space-y-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Sparkline of ${history.length} observations`}
      >
        {baselinePath && (
          <path
            d={baselinePath}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-text-faint"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-600 dark:text-emerald-400"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={(history.length - 1) * xStep}
          cy={yFor(Number(last.value))}
          r="3"
          className="fill-emerald-600 dark:fill-emerald-400"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-text-faint tabular-nums">
        <span>
          {firstDate} · {fmt(Number(first.value))} {unit}
        </span>
        <span>
          {lastDate} · {fmt(Number(last.value))} {unit}
        </span>
      </div>
    </div>
  );
}
