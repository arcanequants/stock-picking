import { getTranslations } from "next-intl/server";

interface Cycle {
  type: "new" | "rebuy";
  current_count: number;
  target_count: number;
}

export default async function CycleTracker({ cycle }: { cycle: Cycle | null }) {
  const t = await getTranslations("Components");

  if (!cycle) {
    return (
      <div className="border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("currentCycle")}
        </h3>
        <p className="text-sm text-text-faint mt-3">
          {t("noCycle")}
        </p>
      </div>
    );
  }

  const dots = Array.from({ length: cycle.target_count }, (_, i) => i);
  const typeLabel = cycle.type === "new" ? t("cycleTypeNew") : t("cycleTypeRebuy");

  return (
    <div className="border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("currentCycle")}
        </h3>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            cycle.type === "new"
              ? "bg-brand-subtle text-brand-text border border-brand-border"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {cycle.type === "new" ? t("newStocks") : t("rebuys")}
        </span>
      </div>

      <div className="flex gap-2 mt-4">
        {dots.map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-full h-3 rounded-full transition-all ${
                i < cycle.current_count
                  ? cycle.type === "new"
                    ? "bg-brand"
                    : "bg-emerald-500"
                  : "bg-progress-bg"
              }`}
            />
            <span className="text-xs text-text-faint">{i + 1}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-text-muted mt-4">
        {t("cycleProgress", {
          current: cycle.current_count,
          target: cycle.target_count,
          type: typeLabel,
          remaining: cycle.target_count - cycle.current_count,
        })}
      </p>
    </div>
  );
}
