import PortfolioDashboard from "@/components/PortfolioDashboard";
import CycleTracker from "@/components/CycleTracker";
import { stocks, transactions, cycles } from "@/data/stocks";

export default function PortfolioPage() {
  const activeStocks = stocks.filter((s) => s.status === "active");
  const currentCycle = cycles[0] ?? null;
  const hasActivity =
    activeStocks.length > 0 || transactions.length > 0 || currentCycle;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold mb-2">Portfolio Dashboard</h1>
        <p className="text-zinc-400">
          Overview of our positions, allocations, and cycle progress.
        </p>
      </section>

      {!hasActivity && (
        <section className="border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-lg">
            No active positions yet. When we start a new cycle, all the data
            will appear here.
          </p>
        </section>
      )}

      {currentCycle && <CycleTracker cycle={currentCycle} />}

      {activeStocks.length > 0 && (
        <PortfolioDashboard stocks={stocks} cycle={currentCycle} />
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <section className="border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Transaction History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-zinc-500">Date</th>
                  <th className="text-left py-2 px-3 text-zinc-500">Ticker</th>
                  <th className="text-left py-2 px-3 text-zinc-500">Type</th>
                  <th className="text-left py-2 px-3 text-zinc-500">Cycle</th>
                  <th className="text-right py-2 px-3 text-zinc-500">Price</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
                  >
                    <td className="py-2 px-3 font-mono text-zinc-300">
                      {tx.date}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">
                      {tx.ticker}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.type === "new"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {tx.type === "new" ? "New" : "Rebuy"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-400">
                      #{tx.cycle_number}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-white">
                      ${tx.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Active Positions Table */}
      {activeStocks.length > 0 && (
        <section className="border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Active Positions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-zinc-500">Ticker</th>
                  <th className="text-left py-2 px-3 text-zinc-500">Name</th>
                  <th className="text-left py-2 px-3 text-zinc-500">Sector</th>
                  <th className="text-right py-2 px-3 text-zinc-500">Price</th>
                  <th className="text-right py-2 px-3 text-zinc-500">
                    Div Yield
                  </th>
                  <th className="text-right py-2 px-3 text-zinc-500">
                    Upside
                  </th>
                  <th className="text-right py-2 px-3 text-zinc-500">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeStocks.map((s) => (
                  <tr
                    key={s.ticker}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50"
                  >
                    <td className="py-2 px-3 font-bold text-white">
                      {s.ticker}
                    </td>
                    <td className="py-2 px-3 text-zinc-300">{s.name}</td>
                    <td className="py-2 px-3 text-zinc-400">{s.sector}</td>
                    <td className="py-2 px-3 text-right font-mono text-white">
                      ${s.price?.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-zinc-300">
                      {s.dividend_yield}%
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono ${
                        (s.analyst_upside || 0) > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {s.analyst_upside && s.analyst_upside > 0 ? "+" : ""}
                      {s.analyst_upside}%
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-300">
                      {s.analyst_consensus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
