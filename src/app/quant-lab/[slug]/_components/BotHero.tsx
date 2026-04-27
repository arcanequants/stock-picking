import type { QuantLabBot, QuantLabSnapshot } from "@/lib/quant-lab";

const TAGLINES_ES: Record<string, string> = {
  "arcane-quant":
    "Tu cuenta de Binance copia los trades. Nada más que hacer.",
};

const EXCHANGE_LABELS: Record<string, string> = {
  "binance-futures": "BINANCE · FUTUROS",
  binance: "BINANCE",
  coinbase: "COINBASE",
};

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
  const dd = latest?.mdd != null ? Number(latest.mdd) : null;
  const exchangeLabel =
    EXCHANGE_LABELS[bot.exchange.toLowerCase()] ??
    bot.exchange.replace(/-/g, " · ").toUpperCase();
  const tagline = TAGLINES_ES[bot.slug] ?? bot.description ?? null;

  const copyCount = latest?.current_copy_count ?? null;
  const maxCount = latest?.max_copy_count ?? null;
  const slotsLeft =
    copyCount != null && maxCount != null ? Math.max(0, maxCount - copyCount) : null;

  return (
    <div className="border border-border rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
            {exchangeLabel}
          </p>
          <h1 className="text-3xl font-semibold">{bot.name}</h1>
          {tagline && (
            <p className="text-sm text-text-muted mt-1.5 max-w-xl">{tagline}</p>
          )}
        </div>
        <div className="flex items-baseline gap-5">
          <div className="text-right">
            <p className="text-xs text-text-muted">ROI 30 días</p>
            <p
              className={`text-4xl font-semibold leading-tight ${
                positive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {fmtPct(roi)}
            </p>
          </div>
          <div className="text-right border-l border-border/50 pl-5">
            <p className="text-xs text-text-muted">Peor caída</p>
            <p className="text-2xl font-semibold leading-tight text-text-secondary">
              {dd != null ? `-${dd.toFixed(2)}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Stat label="Sharpe" value={latest?.sharp_ratio?.toFixed(2) ?? "—"} />
        <Stat
          label="Win rate"
          value={latest?.win_rate != null ? `${Number(latest.win_rate).toFixed(1)}%` : "—"}
        />
        <Stat
          label="Cupos"
          value={
            slotsLeft != null && maxCount != null
              ? `${slotsLeft} / ${maxCount} libres`
              : "—"
          }
        />
      </div>

      <div className="mt-5 pt-4 border-t border-border/60 space-y-1.5 text-xs text-text-faint leading-relaxed">
        <p>
          <span className="text-text-muted">Skin in the game:</span> el fundador
          de Vectorial Data opera este bot con capital propio — mismos trades,
          mismo apalancamiento que cualquier copier.
        </p>
        <p>
          Bot en fase de validación · {daysLive} días en vivo · Datos públicos
          de Binance, cada 2 horas.
        </p>
      </div>
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
