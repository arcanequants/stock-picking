import { transactions, stocks } from "@/data/stocks";
import { createHash } from "crypto";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TechnicalDetails from "@/components/TechnicalDetails";
import { getEasExplorerUrl } from "@/lib/eas";

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
  const txIndex = transactions.findIndex((t) => t.ticker === upper);
  const stock = stocks.find((s) => s.ticker === upper);
  if (txIndex === -1 || !stock) return { title: "Not Found" };

  const tx = transactions[txIndex];
  const pickNumber = txIndex + 1;

  return {
    title: `${upper} — Certificado Digital #${pickNumber} | Vectorial Data`,
    description: `Pick #${pickNumber}: ${stock.name} a $${tx.price} el ${tx.date}. Certificado en blockchain.`,
    openGraph: {
      title: `Certificado: ${upper} — Pick #${pickNumber}`,
      description: `${stock.name} a $${tx.price} — ${tx.date}. Verificado en Base L2.`,
      images: [{ url: `/api/og/verify/${upper}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
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

  const txIndex = transactions.findIndex((t) => t.ticker === upper);
  if (txIndex === -1) notFound();

  const tx = transactions[txIndex];
  const stock = stocks.find((s) => s.ticker === upper);
  if (!stock) notFound();

  const name = stock.name.replace(
    / (PLC|Inc\.|Ltd\.|S\.A\.|AG|N\.V\.|Corporation|Company)\.?$/i,
    ""
  );

  // Compute hash chain up to this pick
  let previousHash = "0".repeat(64);
  for (let i = 0; i < txIndex; i++) {
    const t = transactions[i];
    const input = `${t.ticker}|${t.price}|${t.date}|${previousHash}`;
    previousHash = createHash("sha256").update(input).digest("hex");
  }
  const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
  const hash = createHash("sha256").update(input).digest("hex");

  const pickNumber = txIndex + 1;
  const hasAttestation = !!tx.attestation_uid;
  const formattedDate = new Date(tx.date + "T12:00:00").toLocaleDateString(
    localeMap[locale] ?? "es-MX",
    { day: "numeric", month: "short", year: "numeric" }
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Certificate Container */}
      <div className="relative border-2 border-border rounded-2xl overflow-hidden bg-card">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Vectorial Data" width={24} height={24} />
              <span className="text-sm font-medium text-text-muted">Vectorial Data</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-faint">
              {t("certTitle")}
            </span>
          </div>

          {/* Pick info */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-mono bg-brand/10 text-brand px-2 py-0.5 rounded">
                {t("pickLabel", { number: pickNumber })}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  tx.type === "new"
                    ? "bg-brand/10 text-brand"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {tx.type === "new" ? t("newPick") : t("rebuy")}
              </span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-1">{tx.ticker}</p>
            <p className="text-text-muted text-sm">{name}</p>
          </div>

          {/* Price + Date grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-border rounded-xl p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-faint mb-1">
                {t("priceLabel")}
              </p>
              <p className="text-2xl font-bold">${tx.price.toFixed(2)}</p>
            </div>
            <div className="border border-border rounded-xl p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-faint mb-1">
                {t("dateLabel")}
              </p>
              <p className="text-2xl font-bold">{formattedDate}</p>
            </div>
          </div>

          {/* Verified status */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {hasAttestation ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {t("statusVerified")}
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

          {/* What this means */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-faint mb-2">
              {t("whatThisMeans")}
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              {t("whatThisMeansText")}
            </p>
          </div>

          {/* Technical details (expandable) */}
          <div className="mb-6">
            <TechnicalDetails label={t("technicalDetails")}>
              <div className="space-y-3">
                {hasAttestation && (
                  <div>
                    <p className="text-text-faint text-[10px] uppercase mb-0.5">{t("attestationUid")}</p>
                    <p className="text-foreground">{tx.attestation_uid}</p>
                  </div>
                )}
                <div>
                  <p className="text-text-faint text-[10px] uppercase mb-0.5">{t("chainHash")}</p>
                  <p className="text-foreground">{hash}</p>
                </div>
                <div>
                  <p className="text-text-faint text-[10px] uppercase mb-0.5">{t("algorithm")}</p>
                  <p className="text-foreground">SHA-256(ticker|price|date|previous_hash)</p>
                </div>
                {hasAttestation && tx.attestation_uid && (
                  <div className="flex gap-3 pt-2">
                    <a
                      href={getEasExplorerUrl(tx.attestation_uid)}
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

          {/* Disclaimer */}
          <p className="text-[11px] text-text-faint text-center mb-4">
            {t("disclaimer")}
          </p>

          {/* Back link */}
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
    </div>
  );
}
