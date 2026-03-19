import { getSupabase } from "@/lib/supabase";
import { stocks, transactions } from "@/data/stocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

async function getStockData(ticker: string) {
  const upperTicker = ticker.toUpperCase();
  const tx = transactions.find((t) => t.ticker === upperTicker);
  const stock = stocks.find((s) => s.ticker === upperTicker);

  if (!tx || !stock) return null;

  // Get latest price from snapshot
  const { data: snapshots } = await getSupabase()
    .from("portfolio_snapshots")
    .select("prices")
    .order("date", { ascending: false })
    .limit(1);

  const latestPrices: Record<string, number> =
    (snapshots?.[0]?.prices as Record<string, number>) ?? {};

  const currentPrice = latestPrices[upperTicker] ?? stock.price;
  const returnPct = ((currentPrice - tx.price) / tx.price) * 100;
  const daysHeld = Math.ceil(
    (Date.now() - new Date(tx.date + "T00:00:00").getTime()) / 86400000
  );
  const pickNumber = transactions.indexOf(tx) + 1;

  return {
    ticker: upperTicker,
    name: stock.name,
    returnPct: Math.round(returnPct * 100) / 100,
    daysHeld,
    pickNumber,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const data = await getStockData(ticker);
  if (!data) return { title: "Not Found" };

  const t = await getTranslations("Share");
  const sign = data.returnPct >= 0 ? "+" : "";
  const returnStr = `${sign}${data.returnPct.toFixed(1)}%`;

  return {
    title: `${data.ticker} ${returnStr} | Vectorial Data`,
    description: t("metaStockDesc", { name: data.name, number: data.pickNumber }),
    openGraph: {
      title: t("metaStockReturn", { ticker: data.ticker, return: returnStr, days: data.daysHeld }),
      description: t("metaStockDesc", { name: data.name, number: data.pickNumber }),
      images: [
        {
          url: `/api/og/stock/${data.ticker}`,
          width: 1200,
          height: 630,
        },
      ],
      type: "article",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ShareStockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getStockData(ticker);
  if (!data) notFound();

  const t = await getTranslations("Share");
  const tLegal = await getTranslations("Legal");
  const isPositive = data.returnPct >= 0;
  const paymentLink =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "/join";

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-8">
      {/* Pick badge */}
      <span className="inline-block text-xs font-semibold uppercase tracking-wider text-text-muted border border-border rounded-full px-4 py-1">
        {t("pickBadge", { number: data.pickNumber })}
      </span>

      {/* Stock info */}
      <div>
        <h1 className="text-5xl font-extrabold text-foreground">
          {data.ticker}
        </h1>
        <p className="text-lg text-text-muted mt-1">{data.name}</p>
      </div>

      {/* Return card — shows return % (marketing) but NOT prices (premium) */}
      <div
        className={`border rounded-xl p-6 ${
          isPositive
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs text-text-muted uppercase tracking-wider">
              {t("returnLabel")}
            </p>
            <p
              className={`text-4xl font-extrabold font-mono ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {data.returnPct.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider">
              {t("daysLabel")}
            </p>
            <p className="text-2xl font-bold font-mono text-text-secondary">
              {data.daysHeld}
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <a
          href={paymentLink}
          className="block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold text-lg transition-colors cta-glow"
        >
          {t("subscribeCta")}
        </a>
        <Link
          href={`/stocks/${data.ticker}`}
          className="block w-full border border-border hover:border-brand-border text-foreground py-3 rounded-xl font-semibold transition-colors"
        >
          {t("seeResearch")}
        </Link>
      </div>

      <p className="text-xs text-text-muted">
        {t("pageFooter")}
      </p>
      <p className="text-xs text-text-faint italic">
        {tLegal("pastPerformance")} {tLegal("notFinancialAdvice")}
      </p>
    </div>
  );
}
