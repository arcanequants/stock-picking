import type { QuantLabBot, QuantLabSnapshot } from "@/lib/quant-lab";

function fmtPct(v: number | null | undefined) {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export default function BotHero({
  bot,
  latest,
  daysLive,
}: {
  bot: QuantLabBot;
  latest: QuantLabSnapshot | null;
  daysLive: number;
}) {
  const roi = latest?.roi != null ? Number(latest.roi) : null;
  const positive = roi != null && roi >= 0;

  return (
    <div className="border border-border rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
            {bot.exchange.replace(/-/g, " ")}
          </p>
          <h1 className="text-3xl font-semibold">{bot.name}</h1>
          {bot.description && (
            <p className="text-sm text-text-muted mt-1 max-w-xl">
              {bot.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">ROI 30 días</p>
          <p
            className={`text-4xl font-semibold ${
              positive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {fmtPct(roi)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Sharpe" value={latest?.sharp_ratio?.toFixed(2) ?? "—"} />
        <Stat
          label="Max drawdown"
          value={latest?.mdd != null ? `-${Number(latest.mdd).toFixed(2)}%` : "—"}
        />
        <Stat
          label="Win rate"
          value={latest?.win_rate != null ? `${Number(latest.win_rate).toFixed(1)}%` : "—"}
        />
        <Stat
          label="Copiers activos"
          value={
            latest?.current_copy_count != null && latest?.max_copy_count != null
              ? `${latest.current_copy_count} / ${latest.max_copy_count}`
              : "—"
          }
        />
      </div>

      <p className="text-xs text-text-faint mt-4">
        Bot activo hace {daysLive} días · Datos públicos de Binance, actualizados cada 2 horas.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
