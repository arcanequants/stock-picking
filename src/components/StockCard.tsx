import Link from "next/link";
import { Stock } from "@/lib/types";

const statusLabels: Record<string, string> = {
  active: "activa",
  watchlist: "en lista",
  avoid: "evitar",
};

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    watchlist: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    avoid: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  };
  return colors[status] || colors.watchlist;
}

export default function StockCard({ stock }: { stock: Stock }) {
  return (
    <Link href={`/stocks/${stock.ticker}`}>
      <div className="border border-border rounded-xl p-5 hover:border-border-secondary transition-all hover:bg-card-hover cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground group-hover:text-brand-text transition-colors">
                {stock.ticker}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(stock.status)}`}
              >
                {statusLabels[stock.status] || stock.status}
              </span>
            </div>
            <p className="text-sm text-text-muted">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-foreground">
              ${stock.price?.toFixed(2)}
            </p>
            {stock.analyst_upside && (
              <p
                className={`text-xs font-mono ${stock.analyst_upside > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {stock.analyst_upside > 0 ? "+" : ""}
                {stock.analyst_upside}% potencial
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {stock.summary_short}
        </p>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-text-faint">P/E</p>
            <p className="text-sm font-mono text-text-secondary">
              {stock.pe_forward?.toFixed(1) || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-faint">Dividendo</p>
            <p className="text-sm font-mono text-text-secondary">
              {stock.dividend_yield ? `${stock.dividend_yield}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-faint">Cap. Mercado</p>
            <p className="text-sm font-mono text-text-secondary">
              {stock.market_cap_b ? `$${stock.market_cap_b}B` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-faint">Consenso</p>
            <p className="text-sm font-mono text-text-secondary">
              {stock.analyst_consensus || "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">
            {stock.sector}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-tag-bg text-text-muted">
            {stock.region}
          </span>
        </div>
      </div>
    </Link>
  );
}
