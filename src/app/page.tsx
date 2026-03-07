import StockCard from "@/components/StockCard";
import PortfolioDashboard from "@/components/PortfolioDashboard";
import CycleTracker from "@/components/CycleTracker";
import { stocks, cycles } from "@/data/stocks";
import Link from "next/link";

export default function Home() {
  const activeStocks = stocks.filter((s) => s.status === "active");
  const latestPick = activeStocks[0];
  const currentCycle = cycles[0];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <h1 className="text-4xl font-bold mb-2">Stock Picking Portfolio</h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Seleccionamos acciones que generan flujo a través de dividendos y
          plusvalía por su valor. Picks diarios de lunes a viernes.
        </p>
      </section>

      {/* Latest Pick Highlight */}
      {latestPick && (
        <section className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
              Latest Pick — 4 Mar 2026
            </span>
            <span className="text-xs text-zinc-500">New Position</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                {latestPick.ticker}{" "}
                <span className="text-zinc-400 font-normal text-lg">
                  — {latestPick.name}
                </span>
              </h2>
              <p className="text-zinc-300 mt-2 max-w-xl">
                {latestPick.summary_what}
              </p>
              <Link
                href={`/stocks/${latestPick.ticker}`}
                className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Ver research completo →
              </Link>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-3xl font-mono font-bold">
                ${latestPick.price?.toFixed(2)}
              </p>
              <p className="text-sm text-zinc-400">
                Div: {latestPick.dividend_yield}% | P/E:{" "}
                {latestPick.pe_forward}x
              </p>
              {latestPick.analyst_upside && (
                <p className="text-emerald-400 text-sm font-mono mt-1">
                  +{latestPick.analyst_upside}% upside
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cycle Tracker */}
      <CycleTracker cycle={currentCycle} />

      {/* Dashboard */}
      <PortfolioDashboard stocks={stocks} />

      {/* How it Works */}
      <section className="border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-blue-500 mb-2">1</div>
            <h3 className="font-semibold mb-1">Daily Picks</h3>
            <p className="text-sm text-zinc-400">
              Lun-Mar: 2 acciones. Mié-Vie: 1 acción. 7 picks por semana entre
              compras nuevas y recompras.
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500 mb-2">2</div>
            <h3 className="font-semibold mb-1">Cycles of 5</h3>
            <p className="text-sm text-zinc-400">
              Primero compramos 5 acciones nuevas. Luego recompramos 5 que ya
              tenemos. Y así sucesivamente — diversificamos y consolidamos.
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500 mb-2">3</div>
            <h3 className="font-semibold mb-1">Dividends + Growth</h3>
            <p className="text-sm text-zinc-400">
              Cada acción seleccionada busca generar flujo por dividendos Y
              plusvalía por apreciación del precio.
            </p>
          </div>
        </div>
      </section>

      {/* All Active Stocks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Active Positions</h2>
          <Link
            href="/stocks"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Ver todas →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {stocks
            .filter((s) => s.status === "active")
            .map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
        </div>
      </section>

      {/* Watchlist */}
      {stocks.filter((s) => s.status === "watchlist").length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Watchlist</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {stocks
              .filter((s) => s.status === "watchlist")
              .map((stock) => (
                <StockCard key={stock.ticker} stock={stock} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
