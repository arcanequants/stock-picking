import { transactions, stocks } from "@/data/stocks";
import { createHash } from "crypto";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TechnicalDetails from "@/components/TechnicalDetails";
import { getEasExplorerUrl } from "@/lib/eas";
import { JsonLd, getBreadcrumbSchema } from "@/lib/seo";

const localeMap: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
  hi: "hi-IN",
};

export function generateStaticParams() {
  const tickers = new Set(transactions.map((tx) => tx.ticker));
  return Array.from(tickers).map((ticker) => ({ ticker }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const tickerTxs = transactions
    .map((tx, i) => ({ tx, pickNumber: i + 1 }))
    .filter(({ tx }) => tx.ticker === upper);
  const stock = stocks.find((s) => s.ticker === upper);
  if (tickerTxs.length === 0 || !stock) return { title: "Not Found" };

  const first = tickerTxs[0];
  const txCount = tickerTxs.length;

  return {
    title: `${upper} — Certificado Digital #${first.pickNumber} | Vectorial Data`,
    description: txCount > 1
      ? `${stock.name}: ${txCount} verified transactions. First at $${first.tx.price} on ${first.tx.date}.`
      : `Pick #${first.pickNumber}: ${stock.name} a $${first.tx.price} el ${first.tx.date}. Certificado en blockchain.`,
    openGraph: {
      title: `Certificado: ${upper} — Pick #${first.pickNumber}`,
      description: `${stock.name} a $${first.tx.price} — ${first.tx.date}. Verificado en Base L2.`,
      images: [{ url: `/api/og/verify/${upper}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `https://www.vectorialdata.com/verify/${upper}` },
  };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const t = await getTranslations("Verify");
  const locale = await getLocale();

  // Find ALL transactions for this ticker
  const tickerTxs = transactions
    .map((tx, i) => ({ tx, globalIndex: i }))
    .filter(({ tx }) => tx.ticker === upper);
  if (tickerTxs.length === 0) notFound();

  const stock = stocks.find((s) => s.ticker === upper);
  if (!stock) notFound();

  const name = stock.name.replace(
    / (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i,
    ""
  );

  // Pre-compute hash chain for all transactions
  const hashChain: string[] = [];
  let prevHash = "0".repeat(64);
  for (const txn of transactions) {
    const inp = `${txn.ticker}|${txn.price}|${txn.date}|${prevHash}`;
    prevHash = createHash("sha256").update(inp).digest("hex");
    hashChain.push(prevHash);
  }

  // Build data for each transaction of this ticker
  const entries = tickerTxs.map(({ tx, globalIndex }) => {
    const pickNumber = globalIndex + 1;
    const isSameDay = pickNumber >= 28;
    return {
      tx,
      pickNumber,
      hash: hashChain[globalIndex],
      hasAttestation: !!tx.attestation_uid,
      isSameDay,
      formattedDate: new Date(tx.date + "T12:00:00").toLocaleDateString(
        localeMap[locale] ?? "es-MX",
        { day: "numeric", month: "short", year: "numeric" }
      ),
    };
  });

  const totalTxs = entries.length;

  return (
    <div className="max-w-2xl mx-auto">
      <JsonLd data={getBreadcrumbSchema([
        { name: "Home", url: "https://www.vectorialdata.com" },
        { name: "Verify", url: "https://www.vectorialdata.com/verify" },
        { name: upper, url: `https://www.vectorialdata.com/verify/${upper}` },
      ])} />
      {/* Multiple transactions header */}
      {totalTxs > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm border border-brand/20 bg-brand/5 rounded-xl px-4 py-3 mb-6 text-center">
          <span className="font-medium text-brand">
            {t("transactionCount", { ticker: upper, count: totalTxs })}
          </span>
        </div>
      )}

      <div className="space-y-8">
        {entries.map((entry, entryIdx) => (
          <div key={entry.pickNumber} className="relative border-2 border-border rounded-2xl overflow-hidden bg-card">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Image src="/logo.png" alt="Vectorial Data" width={24} height={24} />
                  <span className="text-sm font-medium text-text-muted">Vectorial Data</span>
                </div>
                <div className="flex items-center gap-2">
                  {totalTxs > 1 && (
                    <span className="text-[10px] font-medium text-text-muted">
                      {entryIdx + 1}/{totalTxs}
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
                    {t("certTitle")}
                  </span>
                </div>
              </div>

              {/* Pick info */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-mono bg-brand/10 text-brand px-2 py-0.5 rounded">
                    {t("pickLabel", { number: entry.pickNumber })}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      entry.tx.type === "new"
                        ? "bg-brand/10 text-brand"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {entry.tx.type === "new" ? t("newPick") : t("rebuy")}
                  </span>
                </div>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-1">{entry.tx.ticker}</p>
                <p className="text-text-muted text-sm">{name}</p>
              </div>

              {/* Price + Date grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-border rounded-xl p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-faint mb-1">
                    {t("priceLabel")}
                  </p>
                  <p className="text-2xl font-bold">${entry.tx.price.toFixed(2)}</p>
                </div>
                <div className="border border-border rounded-xl p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-faint mb-1">
                    {t("dateLabel")}
                  </p>
                  <p className="text-2xl font-bold">{entry.formattedDate}</p>
                </div>
              </div>

              {/* Verified status */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {entry.hasAttestation ? (
                  <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                    entry.isSameDay
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}>
                    <svg className={`w-4 h-4 ${
                      entry.isSameDay
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <span className={`text-sm font-medium ${
                      entry.isSameDay
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {entry.isSameDay ? t("statusSameDay") : t("statusRetroactive")}
                    </span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted">{t("blockchain")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {t("statusPending")}
                    </span>
                  </div>
                )}
              </div>

              {/* What this means — only on first certificate */}
              {entryIdx === 0 && (
                <div className="bg-card border border-border rounded-xl p-5 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-faint mb-2">
                    {t("whatThisMeans")}
                  </p>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {t("whatThisMeansText")}
                  </p>
                </div>
              )}

              {/* Technical details (expandable) */}
              <div className="mb-6">
                <TechnicalDetails label={t("technicalDetails")}>
                  <div className="space-y-3">
                    {entry.hasAttestation && (
                      <div>
                        <p className="text-text-faint text-[10px] uppercase mb-0.5">{t("attestationUid")}</p>
                        <p className="text-foreground">{entry.tx.attestation_uid}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-text-faint text-[10px] uppercase mb-0.5">{t("chainHash")}</p>
                      <p className="text-foreground">{entry.hash}</p>
                    </div>
                    <div>
                      <p className="text-text-faint text-[10px] uppercase mb-0.5">{t("algorithm")}</p>
                      <p className="text-foreground">SHA-256(ticker|price|date|previous_hash)</p>
                    </div>
                    {entry.hasAttestation && entry.tx.attestation_uid && (
                      <div className="flex gap-3 pt-2">
                        <a
                          href={getEasExplorerUrl(entry.tx.attestation_uid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline text-xs"
                        >
                          EASScan &nearr;
                        </a>
                      </div>
                    )}
                  </div>
                </TechnicalDetails>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer + Back link */}
      <div className="mt-8">
        <p className="text-[11px] text-text-faint text-center mb-4">
          {t("disclaimer")}
        </p>
        <div className="text-center">
          <Link
            href="/verify"
            className="text-sm text-brand hover:underline"
          >
            &larr; {t("backToAll")}
          </Link>
        </div>
      </div>
    </div>
  );
}
