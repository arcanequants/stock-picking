import { stocks, transactions } from "@/data/stocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

function getStockData(ticker: string) {
  const upperTicker = ticker.toUpperCase();
  const tx = transactions.find((t) => t.ticker === upperTicker);
  const stock = stocks.find((s) => s.ticker === upperTicker);

  if (!tx || !stock) return null;

  const daysHeld = Math.ceil(
    (Date.now() - new Date(tx.date + "T00:00:00").getTime()) / 86400000
  );
  const pickNumber = transactions.indexOf(tx) + 1;

  return {
    ticker: upperTicker,
    name: stock.name,
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
  const data = getStockData(ticker);
  if (!data) return { title: "Not Found" };

  const t = await getTranslations("Share");

  return {
    title: `${data.ticker} — ${data.name} | Vectorial Data`,
    description: t("metaStockDesc", { name: data.name, number: data.pickNumber }),
    openGraph: {
      title: `${data.ticker} — ${data.name} | Vectorial Data`,
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
  const data = getStockData(ticker);
  if (!data) notFound();

  const t = await getTranslations("Share");
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

      {/* Teaser card — no prices, no return %, just the hook */}
      <div className="border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs text-text-faint uppercase tracking-wider">
              {t("daysLabel")}
            </p>
            <p className="text-2xl font-bold font-mono text-text-secondary">
              {data.daysHeld}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-faint uppercase tracking-wider">
              {t("returnLabel")}
            </p>
            <div className="flex items-center gap-2 justify-end mt-1">
              <div className="w-12 h-3 bg-tag-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 w-3/4" />
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-text-faint"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
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

      <p className="text-xs text-text-faint">
        {t("pageFooter")}
      </p>
    </div>
  );
}
