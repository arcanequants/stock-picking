import Link from "next/link";
import type { Metadata } from "next";
import { getAllBotCards } from "@/lib/quant-lab";
import Sparkline from "./_components/Sparkline";

export const metadata: Metadata = {
  title: "Quant Lab — Vectorial Data",
  description:
    "Bots sistemáticos de Vectorial Data. Performance pública en tiempo real, sin promesas.",
};

export const revalidate = 600;

const ASSET_CHIP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  crypto: {
    label: "Cripto",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
  stocks: {
    label: "Acciones",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  metals: {
    label: "Metales",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
  },
};

function chipFor(assetClass: string) {
  return (
    ASSET_CHIP[assetClass] ?? {
      label: assetClass.replace(/-/g, " "),
      bg: "bg-text-muted/10",
      text: "text-text-muted",
      border: "border-border",
    }
  );
}

function exchangeLabel(exchange: string, portfolioId: string): string {
  // "binance-futures" → "Binance · Futuros"
  const parts = exchange.toLowerCase().split(/[-_\s]/).filter(Boolean);
  const map: Record<string, string> = {
    binance: "Binance",
    futures: "Futuros",
    spot: "Spot",
    coinbase: "Coinbase",
  };
  const pretty = parts.map((p) => map[p] ?? p[0].toUpperCase() + p.slice(1));
  return pretty.length > 1 ? `${pretty[0]} · ${pretty.slice(1).join(" ")}` : pretty[0] ?? portfolioId;
}

function formatPct(n: number | null | undefined, signed = true): string {
  if (n == null) return "—";
  const v = Number(n);
  const sign = signed && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

export default async function QuantLabPage() {
  const cards = await getAllBotCards();

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <p className="text-sm text-text-muted mb-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            Vectorial Data
          </Link>{" "}
          → Quant Lab
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">Quant Lab</h1>
        <p className="text-text-muted max-w-2xl leading-relaxed">
          El laboratorio cuantitativo de Vectorial Data. Mientras el portafolio
          principal hace stock-picking discrecional, aquí ponemos a prueba
          estrategias sistemáticas en público. Cada bot muestra su performance
          en tiempo real — sin curvas ajustadas, sin promesas.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.length === 0 && (
          <p className="text-sm text-text-muted md:col-span-2">
            Aún no hay bots públicos. Vuelve pronto.
          </p>
        )}
        {cards.map(({ bot, latest, sparkline, daysLive }) => {
          const chip = chipFor(bot.asset_class);
          const roi = latest?.roi != null ? Number(latest.roi) : null;
          const positive = (roi ?? 0) >= 0;

          return (
            <Link
              key={bot.slug}
              href={`/quant-lab/${bot.slug}`}
              className="block border border-border rounded-2xl p-5 hover:border-foreground/40 transition-colors bg-surface"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{bot.name}</h2>
                  <p className="text-xs text-text-faint mt-0.5">
                    {exchangeLabel(bot.exchange, bot.portfolio_id)} · {daysLive}d en vivo
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${chip.bg} ${chip.text} ${chip.border}`}
                >
                  {chip.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint mb-0.5">
                    ROI 30d
                  </p>
                  <p
                    className={`text-base font-semibold ${
                      roi == null
                        ? "text-text-muted"
                        : positive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatPct(roi)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint mb-0.5">
                    Max DD
                  </p>
                  <p className="text-base font-semibold text-text-secondary">
                    {formatPct(latest?.mdd ?? null, false)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint mb-0.5">
                    Copiers
                  </p>
                  <p className="text-base font-semibold text-text-secondary">
                    {latest?.current_copy_count ?? "—"}
                  </p>
                </div>
              </div>

              <Sparkline series={sparkline} positive={positive} />
            </Link>
          );
        })}
      </div>

      <div className="mt-10 p-4 border border-border rounded-xl text-xs text-text-faint">
        <p className="font-semibold mb-1 text-text-muted">Aviso</p>
        <p className="leading-relaxed">
          Rendimiento pasado no garantiza resultados futuros. El copy trading de
          futuros con apalancamiento puede resultar en pérdida total del
          capital. Vectorial Data no ejecuta ni custodia fondos — la
          intermediación la realiza el exchange correspondiente.
        </p>
      </div>
    </div>
  );
}
