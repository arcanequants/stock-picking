// Server-rendered SVG sparkline for Quant Lab cards.
// Pure function of input data — no client JS needed for the grid.

export default function Sparkline({
  series,
  positive,
}: {
  series: Array<{ t: string; roi: number }>;
  positive: boolean;
}) {
  if (series.length < 2) {
    return (
      <div className="h-12 flex items-center text-xs text-text-faint">
        — sin datos suficientes
      </div>
    );
  }

  const xs = series.map((_, i) => i / (series.length - 1));
  const ys = series.map((s) => s.roi);
  const min = Math.min(...ys, 0);
  const max = Math.max(...ys, 0);
  const range = max - min || 1;
  const pts = xs.map((x, i) => {
    const y = 1 - (ys[i] - min) / range;
    return `${(x * 100).toFixed(2)},${(y * 100).toFixed(2)}`;
  });
  const zeroY = ((1 - (0 - min) / range) * 100).toFixed(2);
  const stroke = positive ? "#10b981" : "#ef4444";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-12 block"
    >
      <line
        x1="0"
        x2="100"
        y1={zeroY}
        y2={zeroY}
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeDasharray="2 2"
      />
      <path
        d={"M" + pts.join(" L")}
        fill="none"
        stroke={stroke}
        strokeWidth="0.9"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
