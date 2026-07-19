"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface PersonalPosition {
  ticker: string;
  name: string;
  buys: number;
  prior_count: number;
  has_prior: boolean;
  total_invested: number;
  total_shares: number;
  avg_price: number;
  current_price: number;
  return_pct: number;
  first_bought: string;
  days_held: number;
}

interface PositionsResponse {
  positions: PersonalPosition[];
  total_return_pct: number;
  total_positions: number;
  total_invested: number;
  has_prior_holdings: boolean;
  since: string | null;
}

interface HistoryPoint {
  date: string;
  return_pct: number;
  spy_return_pct: number | null;
  personal_return_pct: number | null;
}

interface DividendsResponse {
  ytd_total: number;
  all_time_total: number;
  count: number;
  companies: number;
}

interface PriorHolding {
  id: number;
  ticker: string;
  purchase_date: string;
  buy_price: number;
  amount_invested: number;
}

const localeMap: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

export default function PersonalPortfolio() {
  const t = useTranslations("PersonalPortfolio");
  const locale = useLocale();
  const dateLocale = localeMap[locale] || "es-MX";

  const [positions, setPositions] = useState<PositionsResponse | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [dividends, setDividends] = useState<DividendsResponse | null>(null);
  const [prior, setPrior] = useState<PriorHolding[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [posRes, histRes, divRes, priorRes] = await Promise.all([
        fetch("/api/portfolio/positions?view=personal", { cache: "no-store" }),
        fetch("/api/portfolio/history?view=personal", { cache: "no-store" }),
        fetch("/api/portfolio/dividends", { cache: "no-store" }),
        fetch("/api/prior-holdings", { cache: "no-store" }),
      ]);
      if (posRes.ok) setPositions(await posRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (divRes.ok) setDividends(await divRes.json());
      if (priorRes.ok) setPrior((await priorRes.json()).holdings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="border border-border rounded-xl p-6 h-80 animate-pulse" />;
  }

  const hasPositions = (positions?.positions.length ?? 0) > 0;

  if (!hasPositions) {
    return (
      <div className="border border-border rounded-xl p-8 text-center space-y-3">
        <p className="text-lg font-semibold">{t("emptyTitle")}</p>
        <p className="text-sm text-text-muted max-w-md mx-auto">{t("emptyBody")}</p>
        <Link
          href="/picks"
          className="inline-block rounded-lg bg-brand text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          {t("emptyCta")}
        </Link>
        <PriorHoldingsSection prior={prior} onChanged={load} compact />
      </div>
    );
  }

  const p = positions!;
  const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  const money = (v: number) =>
    v.toLocaleString(dateLocale, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  // Chart data: only from the user's first buy onward.
  const firstIdx = history.findIndex((h) => h.personal_return_pct != null);
  const chartRaw = firstIdx >= 0 ? history.slice(firstIdx) : [];
  const chartData = chartRaw.map((h) => ({
    date: new Date(h.date + "T00:00:00").toLocaleDateString(dateLocale, { month: "short", day: "numeric" }),
    personal: h.personal_return_pct,
    model: h.return_pct,
    spy: h.spy_return_pct,
  }));
  const latest = chartData[chartData.length - 1];
  const personalColor = (latest?.personal ?? 0) >= 0 ? "#34d399" : "#f87171";

  return (
    <div className="space-y-8">
      {/* Metrics hero */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          label={t("totalReturn")}
          value={fmt(p.total_return_pct)}
          accent={p.total_return_pct >= 0 ? "up" : "down"}
        />
        <StatBox label={t("invested")} value={money(p.total_invested)} />
        <StatBox label={t("positions")} value={String(p.total_positions)} />
        <StatBox
          label={t("since")}
          value={
            p.since
              ? new Date(p.since + "T00:00:00").toLocaleDateString(dateLocale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
          }
        />
      </section>

      {/* Performance chart: personal vs model vs SPY */}
      {chartData.length > 1 && (
        <section className="border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              {t("chartTitle")}
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <LegendPill color={personalColor} label={t("chartYou")} value={latest?.personal != null ? fmt(latest.personal) : "—"} />
              <LegendPill color="#818cf8" label={t("chartModel")} value={latest?.model != null ? fmt(latest.model) : "—"} dashed />
              <LegendPill color="#9ca3af" label="S&P 500" value={latest?.spy != null ? fmt(latest.spy) : "—"} dashed />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" />
              <XAxis dataKey="date" tick={{ fill: "var(--tick-fill)", fontSize: 12 }} axisLine={{ stroke: "var(--axis-stroke)" }} tickLine={false} />
              <YAxis tick={{ fill: "var(--tick-fill)", fontSize: 12 }} axisLine={{ stroke: "var(--axis-stroke)" }} tickLine={false} tickFormatter={(v: number) => `${v}%`} width={50} />
              <Tooltip
                contentStyle={{ background: "var(--tooltip-bg, #111)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => [
                  typeof value === "number" ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "—",
                  name,
                ]}
              />
              <ReferenceLine y={0} stroke="var(--axis-stroke)" />
              <Line type="monotone" dataKey="personal" name={t("chartYou")} stroke={personalColor} strokeWidth={2.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="model" name={t("chartModel")} stroke="#818cf8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls />
              <Line type="monotone" dataKey="spy" name="S&P 500" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-text-faint">{t("chartHint")}</p>
        </section>
      )}

      {/* Dividends */}
      {dividends && dividends.count > 0 && (
        <section className="border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            {t("dividendsTitle")}
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {money(dividends.ytd_total)}
              </p>
              <p className="text-xs text-text-faint mt-1">{t("dividendsYtd")}</p>
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{money(dividends.all_time_total)}</p>
              <p className="text-xs text-text-faint mt-1">{t("dividendsAllTime")}</p>
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{dividends.companies}</p>
              <p className="text-xs text-text-faint mt-1">{t("dividendsCompanies")}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-faint">{t("dividendsHint")}</p>
        </section>
      )}

      {/* Positions table */}
      <section className="border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t("positionsTitle")}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-faint">
                <th className="text-left py-2 px-3">{t("colTicker")}</th>
                <th className="text-right py-2 px-3">{t("colInvested")}</th>
                <th className="text-right py-2 px-3 hidden sm:table-cell">{t("colAvgPrice")}</th>
                <th className="text-right py-2 px-3 hidden sm:table-cell">{t("colNow")}</th>
                <th className="text-right py-2 px-3">{t("colReturn")}</th>
              </tr>
            </thead>
            <tbody>
              {p.positions.map((pos) => (
                <tr key={pos.ticker} className="border-b border-border/50 hover:bg-card-hover">
                  <td className="py-2 px-3">
                    <Link href={`/stocks/${pos.ticker}`} className="font-bold text-foreground hover:text-brand transition-colors">
                      {pos.ticker}
                    </Link>
                    {pos.has_prior && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-text-faint border border-border rounded px-1 py-0.5">
                        {t("priorTag")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{money(pos.total_invested)}</td>
                  <td className="py-2 px-3 text-right font-mono text-text-muted hidden sm:table-cell">${pos.avg_price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono text-text-muted hidden sm:table-cell">${pos.current_price.toFixed(2)}</td>
                  <td className={`py-2 px-3 text-right font-mono font-bold ${pos.return_pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {fmt(pos.return_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PriorHoldingsSection prior={prior} onChanged={load} />

      <p className="text-xs text-text-faint italic">{t("disclaimer")}</p>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: "up" | "down" }) {
  return (
    <div className="border border-border rounded-xl p-4 text-center">
      <p
        className={`text-xl font-bold font-mono ${
          accent === "up"
            ? "text-emerald-600 dark:text-emerald-400"
            : accent === "down"
              ? "text-red-600 dark:text-red-400"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-text-faint mt-1">{label}</p>
    </div>
  );
}

function LegendPill({ color, label, value, dashed }: { color: string; label: string; value: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {dashed ? (
        <span className="inline-block w-3 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="inline-block w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="text-text-muted">{label}</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </span>
  );
}

/** User-entered positions from before joining Vectorial. */
function PriorHoldingsSection({
  prior,
  onChanged,
  compact,
}: {
  prior: PriorHolding[];
  onChanged: () => void;
  compact?: boolean;
}) {
  const t = useTranslations("PersonalPortfolio");
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/prior-holdings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          purchase_date: date,
          buy_price: parseFloat(price),
          amount_invested: parseFloat(amount),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error === "ticker_not_in_vectorial" ? t("priorNotAPick") : t("priorError"));
        return;
      }
      setTicker(""); setDate(""); setPrice(""); setAmount("");
      setOpen(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      await fetch(`/api/prior-holdings/${id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const valid =
    ticker.trim().length > 0 && date && parseFloat(price) > 0 && parseFloat(amount) > 0;

  return (
    <section className={compact ? "pt-4 text-left" : "border border-border rounded-xl p-5"}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            {t("priorTitle")}
          </h3>
          <p className="text-xs text-text-faint mt-1">{t("priorSubtitle")}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-card-hover transition-colors shrink-0"
        >
          {open ? t("priorClose") : t("priorAdd")}
        </button>
      </div>

      {prior.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {prior.map((h) => (
            <li key={h.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-1.5">
              <span className="font-mono">
                <span className="font-bold">{h.ticker}</span>{" "}
                <span className="text-text-faint">{h.purchase_date} · ${h.buy_price.toFixed(2)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-text-muted">${h.amount_invested.toFixed(0)}</span>
                <button
                  onClick={() => remove(h.id)}
                  disabled={busy}
                  className="text-xs text-text-faint hover:text-red-500 underline disabled:opacity-50"
                >
                  {t("priorDelete")}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder={t("priorTicker")}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("priorPrice")}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("priorAmount")}
            className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
            <button
              onClick={add}
              disabled={!valid || busy}
              className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {busy ? "…" : t("priorSave")}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
