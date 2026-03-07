import Link from "next/link";
import { Stock } from "@/lib/types";

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    watchlist: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    avoid: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colors[status] || colors.watchlist;
}

export default function StockCard({ stock }: { stock: Stock }) {
  return (
    <Link href={`/stocks/${stock.ticker}`}>
      <div className="border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all hover:bg-zinc-900/50 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                {stock.ticker}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(stock.status)}`}
              >
                {stock.status}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-white">
              ${stock.price?.toFixed(2)}
            </p>
            {stock.analyst_upside && (
              <p
                className={`text-xs font-mono ${stock.analyst_upside > 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {stock.analyst_upside > 0 ? "+" : ""}
                {stock.analyst_upside}% upside
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-4 line-clamp-2">
          {stock.summary_short}
        </p>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-zinc-500">P/E</p>
            <p className="text-sm font-mono text-zinc-200">
              {stock.pe_forward?.toFixed(1) || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Div Yield</p>
            <p className="text-sm font-mono text-zinc-200">
              {stock.dividend_yield ? `${stock.dividend_yield}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Mkt Cap</p>
            <p className="text-sm font-mono text-zinc-200">
              {stock.market_cap_b ? `$${stock.market_cap_b}B` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Rating</p>
            <p className="text-sm font-mono text-zinc-200">
              {stock.analyst_consensus || "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
            {stock.sector}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
            {stock.region}
          </span>
        </div>
      </div>
    </Link>
  );
}
