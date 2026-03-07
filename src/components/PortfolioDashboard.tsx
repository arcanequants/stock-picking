import { Stock } from "@/lib/types";

interface Props {
  stocks: Stock[];
}

export default function PortfolioDashboard({ stocks }: Props) {
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
    sectorMap.set(s.region, (regionMap.get(s.region) || 0) + 1);
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
          value="1 of 5 (New)"
          subtitle="Next: 4 new picks"
        />
      </div>

      {/* Sector Allocation */}
      {activeStocks.length > 0 && (
        <div className="border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Sector Allocation
          </h3>
          <div className="space-y-3">
            {Array.from(sectorMap.entries()).map(([sector, count]) => {
              const pct =
                activeStocks.length > 0
                  ? (count / activeStocks.length) * 100
                  : 0;
              return (
                <div key={sector}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{sector}</span>
                    <span className="text-zinc-400 font-mono">
                      {pct.toFixed(0)}% ({count})
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
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
    <div className="border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}
