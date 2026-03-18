import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getPortfolioData() {
  const { data: snapshots } = await getSupabase()
    .from("portfolio_snapshots")
    .select("prices")
    .order("date", { ascending: false })
    .limit(1);

  const latestPrices: Record<string, number> =
    (snapshots?.[0]?.prices as Record<string, number>) ?? {};

  const INVESTMENT_PER_POSITION = 50;
  let totalInvested = 0;
  let totalValue = 0;

  const positions = transactions.map((tx) => {
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    const currentPrice = latestPrices[tx.ticker] ?? stock?.price ?? tx.price;
    const returnPct = ((currentPrice - tx.price) / tx.price) * 100;
    const shares = INVESTMENT_PER_POSITION / tx.price;
    totalInvested += INVESTMENT_PER_POSITION;
    totalValue += shares * currentPrice;
    return {
      ticker: tx.ticker,
      name: stock?.name ?? tx.ticker,
      return_pct: Math.round(returnPct * 100) / 100,
    };
  });

  positions.sort((a, b) => b.return_pct - a.return_pct);

  const totalReturnPct =
    totalInvested > 0
      ? Math.round((((totalValue - totalInvested) / totalInvested) * 100) * 100) / 100
      : 0;

  return { positions, totalReturnPct };
}

export async function generateMetadata(): Promise<Metadata> {
  const { totalReturnPct, positions } = await getPortfolioData();
  const sign = totalReturnPct >= 0 ? "+" : "";
  return {
    title: `Portafolio ${sign}${totalReturnPct.toFixed(1)}% | Vectorial Data`,
    description: `${positions.length} posiciones activas. Stock picks diarios por $1.99/mo.`,
    openGraph: {
      title: `Portafolio Vectorial Data: ${sign}${totalReturnPct.toFixed(1)}%`,
      description: `${positions.length} posiciones activas. Stock picks diarios por $1.99/mo.`,
      images: [{ url: "/api/og/portfolio", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SharePortfolioPage() {
  const { positions, totalReturnPct } = await getPortfolioData();
  const isPositive = totalReturnPct >= 0;
  const top5 = positions.slice(0, 5);
  const remaining = positions.length - 5;
  const since = transactions.length > 0 ? transactions[0].date : "";
  const paymentLink =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "/join";

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-8">
      {/* Return hero */}
      <div>
        <p className="text-sm text-text-faint uppercase tracking-wider mb-2">
          Vectorial Data Portfolio
        </p>
        <p
          className={`text-6xl font-extrabold font-mono ${
            isPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {totalReturnPct.toFixed(1)}%
        </p>
        <p className="text-text-muted mt-2">
          {positions.length} posiciones · desde {since}
        </p>
      </div>

      {/* Position bars */}
      <div className="border border-border rounded-xl p-5 text-left space-y-3">
        {top5.map((pos) => {
          const posPositive = pos.return_pct > 0;
          const barWidth = Math.min(Math.abs(pos.return_pct) * 5, 80);
          return (
            <div key={pos.ticker} className="flex items-center gap-3">
              <span className="w-16 font-bold font-mono text-sm text-foreground">
                {pos.ticker}
              </span>
              <div className="flex-1 h-3 bg-tag-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    posPositive ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(barWidth, 3)}%` }}
                />
              </div>
              <span
                className={`text-sm font-mono font-semibold w-16 text-right ${
                  posPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {posPositive ? "+" : ""}
                {pos.return_pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
        {remaining > 0 && (
          <p className="text-xs text-text-faint text-center pt-1">
            + {remaining} posiciones mas
          </p>
        )}
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <a
          href={paymentLink}
          className="block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold text-lg transition-colors cta-glow"
        >
          Suscribete — $1.99/mo
        </a>
        <Link
          href="/portfolio"
          className="block text-sm text-text-muted hover:text-foreground transition-colors"
        >
          Ver portafolio completo →
        </Link>
      </div>

      <p className="text-xs text-text-faint">
        Stock picks diarios de lunes a viernes. Cada pick incluye research
        completo.
      </p>
    </div>
  );
}
