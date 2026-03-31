import { transactions, stocks } from "@/data/stocks";
import { createHash } from "crypto";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const count = transactions.length;
  return {
    title: `Registro Verificable — ${count} Picks | Vectorial Data`,
    description: `${count} stock picks certificados en blockchain Base (Ethereum L2). Verifica que no cambiamos nada.`,
    openGraph: {
      title: `Registro Verificable — ${count} Picks Certificados`,
      description: "Cada pick certificado en blockchain. No te pedimos que confíes. Te pedimos que verifiques.",
      images: [{ url: "/api/og/verify", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function VerifyPage() {
  const t = await getTranslations("Verify");

  // Build hash chain
  let previousHash = "0".repeat(64);
  const chain = transactions.map((tx, i) => {
    const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
    const hash = createHash("sha256").update(input).digest("hex");
    const stock = stocks.find((s) => s.ticker === tx.ticker);
    const entry = {
      pickNumber: i + 1,
      ticker: tx.ticker,
      name: stock?.name ?? tx.ticker,
      price: tx.price,
      date: tx.date,
      type: tx.type,
      hash,
      hasAttestation: !!tx.attestation_uid,
    };
    previousHash = hash;
    return entry;
  });

  const certifiedCount = chain.filter((c) => c.hasAttestation).length;
  const since = transactions[0]?.date ?? "";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("pageTitle")}</h1>
        <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto mb-6">
          {t("pageSubtitle")}
        </p>
        <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-text-muted flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t("pickCount", { count: certifiedCount })}
          </span>
          <span className="text-border">·</span>
          <span>{t("chainIntact")}</span>
          <span className="text-border">·</span>
          <span>{t("since", { date: since })}</span>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4 text-center">{t("howItWorks")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: t("step1"), desc: t("step1Desc"), icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { step: "2", title: t("step2"), desc: t("step2Desc"), icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
            { step: "3", title: t("step3"), desc: t("step3Desc"), icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          ].map((s) => (
            <div
              key={s.step}
              className="border border-border rounded-xl p-5 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 mb-12">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />

        {chain.reverse().map((pick) => (
          <div key={pick.pickNumber} className="relative pb-8 last:pb-0">
            {/* Node circle */}
            <div
              className={`absolute left-[-21px] top-1.5 w-4 h-4 rounded-full border-2 border-background z-10 ${
                pick.hasAttestation ? "bg-emerald-500" : "bg-text-muted"
              }`}
            />

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted mb-1">{pick.date}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono bg-brand/10 text-brand px-2 py-0.5 rounded">
                    #{pick.pickNumber}
                  </span>
                  <span className="font-semibold text-sm">{pick.ticker}</span>
                  <span className="text-text-muted text-sm">{pick.name}</span>
                  <span className="text-xs text-text-muted">${pick.price}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      pick.type === "new"
                        ? "bg-brand/10 text-brand"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {pick.type === "new" ? t("newPick") : t("rebuy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {pick.hasAttestation ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                      {t("statusVerified")}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">{t("statusPending")}</span>
                  )}
                </div>
              </div>
              <Link
                href={`/verify/${pick.ticker}`}
                className="text-xs text-brand hover:underline whitespace-nowrap"
              >
                {t("viewCertificate")} &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-text-faint text-center">{t("disclaimer")}</p>
    </div>
  );
}
