import type { Metadata } from "next";
import Link from "next/link";
import { listLiveSignals } from "@/lib/signals";
import { getSupabaseAdmin } from "@/lib/supabase";

const SITE_URL = "https://vectorialdata.com";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Signal IC dashboard — Vectorial Signals",
  description:
    "Public out-of-sample IC for every Vectorial signal. Honesty-as-moat: when a signal stops working, we mark it decayed in public.",
  alternates: {
    canonical: `${SITE_URL}/signals/methodology`,
  },
  robots: { index: true, follow: true },
};

type IcRow = {
  signal_id: string;
  evaluated_at: string;
  rolling_ic_252d: number;
  sample_size: number;
};

async function loadIcLatest(): Promise<Map<string, IcRow>> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("signal_ic_history")
      .select("*")
      .order("evaluated_at", { ascending: false })
      .limit(1000);
    const latest = new Map<string, IcRow>();
    for (const row of (data ?? []) as IcRow[]) {
      if (!latest.has(row.signal_id)) latest.set(row.signal_id, row);
    }
    return latest;
  } catch {
    return new Map();
  }
}

async function loadObservationCounts(): Promise<
  Map<string, { count: number; first: string | null; last: string | null }>
> {
  // Supabase REST defaults to max 1000 rows per query. Page through in 1k chunks
  // so a single signal with decades of weekly data (e.g. EIA: 2.2k+ rows) doesn't
  // silently truncate and show "—" on the methodology page.
  try {
    const sb = getSupabaseAdmin();
    const stats = new Map<
      string,
      { count: number; first: string | null; last: string | null }
    >();
    const PAGE = 1000;
    let from = 0;
    for (;;) {
      const { data, error } = await sb
        .from("signal_observations")
        .select("signal_id, observed_at")
        .order("observed_at", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as { signal_id: string; observed_at: string }[];
      for (const row of rows) {
        const cur = stats.get(row.signal_id) ?? { count: 0, first: null, last: null };
        cur.count += 1;
        if (!cur.first || row.observed_at < cur.first) cur.first = row.observed_at;
        if (!cur.last || row.observed_at > cur.last) cur.last = row.observed_at;
        stats.set(row.signal_id, cur);
      }
      if (rows.length < PAGE) break;
      from += PAGE;
    }
    return stats;
  } catch {
    return new Map();
  }
}

const STATUS_LABEL: Record<string, string> = {
  live: "live",
  decayed: "decayed",
  deprecated: "deprecated",
};

function fmtIc(ic: number) {
  const sign = ic >= 0 ? "+" : "";
  return `${sign}${ic.toFixed(3)}`;
}

export default async function SignalsMethodologyPage() {
  const [signals, icLatest, obsStats] = await Promise.all([
    listLiveSignals(),
    loadIcLatest(),
    loadObservationCounts(),
  ]);

  return (
    <div className="space-y-10 max-w-3xl">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-signals-accent-text">
          <Link href="/signals" className="hover:text-signals-accent-hover">
            Vectorial Signals
          </Link>{" "}
          <span className="text-text-faint">/ methodology</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Signal IC dashboard
        </h1>
        <p className="text-text-muted leading-relaxed max-w-2xl">
          The <em>Information Coefficient</em> — the rolling 252-day correlation
          between each signal&apos;s reading and the thing it&apos;s supposed to
          predict — published for every live signal. When IC falls below
          threshold for 60 consecutive days, the signal is publicly decommissioned
          with a methodology post-mortem. Decommissioning is a feature.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Live signals
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card text-text-faint">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Signal</th>
                <th className="text-left px-4 py-2 font-medium">Domain</th>
                <th className="text-right px-4 py-2 font-medium">Observations</th>
                <th className="text-right px-4 py-2 font-medium">
                  Rolling 252d IC
                </th>
                <th className="text-right px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {signals.map((s) => {
                const ic = icLatest.get(s.id);
                const obs = obsStats.get(s.id);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/signals/${s.id}`}
                        className="hover:text-signals-accent-hover underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-text-muted">{s.domain}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {obs ? (
                        <span title={`${obs.first?.slice(0, 10)} → ${obs.last?.slice(0, 10)}`}>
                          {obs.count.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-text-faint">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {ic ? fmtIc(ic.rolling_ic_252d) : (
                        <span className="text-text-faint">pending 252d</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`text-xs uppercase ${
                          s.status === "live"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : s.status === "decayed"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-text-faint"
                        }`}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {icLatest.size === 0 && (
          <p className="text-xs text-text-faint">
            IC history begins accumulating once at least 252 trading days of
            observations exist per signal. Phase 1 baseline reads are live; full
            IC publishes after the first walk-forward window completes.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          What we publish
        </h2>
        <ul className="text-sm text-text-muted space-y-1.5 list-disc list-inside">
          <li>Source provenance + license per signal</li>
          <li>Sample size and freshness</li>
          <li>Walk-forward backtest dates and t-cost assumption</li>
          <li>Known biases (in plain language)</li>
          <li>Public decommission posts when a signal decays</li>
        </ul>
      </section>

      <footer className="border-t border-border pt-6 text-xs text-text-faint leading-relaxed space-y-2">
        <p>
          Vectorial Signals is descriptive market intelligence. Not investment
          advice. Past correlations don&apos;t predict future performance.
        </p>
        <p>
          <Link
            href="/legal/signals-terms"
            className="underline hover:text-signals-accent-hover"
          >
            Vectorial Signals Terms of Use
          </Link>
        </p>
      </footer>
    </div>
  );
}
