import StockCard from "@/components/StockCard";
import { stocks } from "@/data/stocks";
import { getTranslations } from "next-intl/server";

export default async function StocksPage() {
  const t = await getTranslations("Stocks");
  const active = stocks.filter((s) => s.status === "active");
  const watchlist = stocks.filter((s) => s.status === "watchlist");
  const avoid = stocks.filter((s) => s.status === "avoid");

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-text-muted">
          {t("subtitle", { total: stocks.length, active: active.length })}
        </p>
      </section>

      {active.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
            {t("activePositions")} ({active.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {active.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
        </section>
      )}

      {watchlist.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full" />
            {t("watchlist")} ({watchlist.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {watchlist.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
        </section>
      )}

      {avoid.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            {t("avoid")} ({avoid.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {avoid.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
