export default function ReturnBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const abs = Math.abs(value);

  let colorClass: string;
  if (abs < 1) {
    colorClass = "text-text-muted bg-tag-bg";
  } else if (value > 10) {
    colorClass =
      "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15";
  } else if (value > 0) {
    colorClass =
      "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
  } else if (value > -10) {
    colorClass = "text-red-600 dark:text-red-400 bg-red-500/10";
  } else {
    colorClass = "text-red-600 dark:text-red-400 bg-red-500/15";
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${colorClass}`}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%{" "}
      <span className="text-[10px]">{isPositive ? "↑" : value < -1 ? "↓" : ""}</span>
    </span>
  );
}
