import { Stock } from "@/lib/types";

interface Cycle {
  type: "new" | "rebuy";
  current_count: number;
  target_count: number;
}

interface Props {
  stocks: Stock[];
  cycle: Cycle | null;
}

export default function PortfolioDashboard({ stocks, cycle }: Props) {
  const activeStocks = stocks.filter((s) => s.status === "active");
  const watchlistStocks = stocks.filter((s) => s.status === "watchlist");

  // Sector allocation
  const sectorMap = new Map<string, number>();
  activeStocks.forEach((s) => {
    sectorMap.set(s.sector, (sectorMap.get(s.sector) || 0) + 1);
  });

  // Region allocation
  const regionMap = new Map<string, number>();
  activeStocks.forEach((s) => {
    regionMap.set(s.region, (regionMap.get(s.region) || 0) + 1);
  });

  // Avg dividend yield
  const avgDivYield =
    activeStocks.length > 0
      ? activeStocks.reduce((sum, s) => sum + (s.dividend_yield || 0), 0) /
        activeStocks.length
      : 0;

  // Avg upside
  const avgUpside =
    activeStocks.length > 0
      ? activeStocks.reduce((sum, s) => sum + (s.analyst_upside || 0), 0) /
        activeStocks.length
      : 0;

  const remaining = cycle ? cycle.target_count - cycle.current_count : 0;

  const sectorColors: Record<string, string> = {
    Financials: "bg-blue-500",
    Technology: "bg-purple-500",
    Industrials: "bg-amber-500",
    Materials: "bg-green-500",
    "Consumer Staples": "bg-red-500",
    "Health Care": "bg-pink-500",
    Energy: "bg-orange-500",
    Utilities: "bg-teal-500",
    "Real Estate": "bg-cyan-500",
    "Communication Services": "bg-indigo-500",
    "Consumer Discretionary": "bg-rose-500",
  };

  const regionColors: Record<string, string> = {
    "North America": "bg-blue-500",
    Europe: "bg-emerald-500",
    Asia: "bg-amber-500",
    LatAm: "bg-purple-500",
    "Middle East": "bg-orange-500",
    Africa: "bg-red-500",
    Oceania: "bg-teal-500",
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox
          label="Active Positions"
          value={activeStocks.length.toString()}
        />
        <StatBox label="Watchlist" value={watchlistStocks.length.toString()} />
        <StatBox label="Avg Div Yield" value={`${avgDivYield.toFixed(1)}%`} />
        <StatBox label="Avg Upside" value={`${avgUpside.toFixed(0)}%`} />
        <StatBox
          label="Cycle"
          value={cycle ? `${cycle.current_count} of ${cycle.target_count} (${cycle.type === "new" ? "New" : "Rebuy"})` : "—"}
          subtitle={cycle ? `${remaining} ${cycle.type === "new" ? "new picks" : "rebuys"} remaining` : "No active cycle"}
        />
      </div>

      {/* Allocations */}
      {activeStocks.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sector Allocation */}
          <div className="border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Sector Allocation
            </h3>
            <div className="space-y-3">
              {Array.from(sectorMap.entries()).map(([sector, count]) => {
                const pct = (count / activeStocks.length) * 100;
                return (
                  <div key={sector}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{sector}</span>
                      <span className="text-text-muted font-mono">
                        {pct.toFixed(0)}% ({count})
                      </span>
                    </div>
                    <div className="w-full bg-progress-bg rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${sectorColors[sector] || "bg-zinc-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Region Allocation */}
          <div className="border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Region Allocation
            </h3>
            <div className="space-y-3">
              {Array.from(regionMap.entries()).map(([region, count]) => {
                const pct = (count / activeStocks.length) * 100;
                return (
                  <div key={region}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{region}</span>
                      <span className="text-text-muted font-mono">
                        {pct.toFixed(0)}% ({count})
                      </span>
                    </div>
                    <div className="w-full bg-progress-bg rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${regionColors[region] || "bg-zinc-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="border border-border rounded-xl p-4">
      <p className="text-xs text-text-faint uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {subtitle && <p className="text-xs text-text-faint mt-1">{subtitle}</p>}
    </div>
  );
}
