import { stocks, transactions } from "@/data/stocks";
import Link from "next/link";
import Image from "next/image";
import HeroMetrics from "@/components/HeroMetrics";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Home");
  const activeStocks = stocks.filter((s) => s.status === "active");
  const regions = new Set(activeStocks.map((s) => s.region)).size;
  const tickers = activeStocks.map((s) => s.ticker);
  const firstDate = transactions.length > 0
    ? new Date(transactions[0].date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const avgDivYield =
    activeStocks.length > 0
      ? activeStocks.reduce((sum, s) => sum + (s.dividend_yield || 0), 0) /
        activeStocks.length
      : 0;

  const samplePick = activeStocks[0];

  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="text-center pt-8 md:pt-16">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Image src="/logo.png" alt="Vectorial Data" width={64} height={64} className="relative z-10" />
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl z-0" />
          </div>
        </div>

        <HeroMetrics avgDivYield={avgDivYield} />

        <h1 className="text-4xl md:text-6xl font-bold mt-6 tracking-tight">
          {t("heroTitle")}
        </h1>
        <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto mt-4">
          {t("heroSubtitle")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-text-faint">
          <span>{t("companies", { count: activeStocks.length })}</span>
          <span className="w-1 h-1 rounded-full bg-text-faint" />
          <span>{t("regions", { count: regions })}</span>
          <span className="w-1 h-1 rounded-full bg-text-faint" />
          <span>{t("avgDivYield", { yield: avgDivYield.toFixed(1) })}</span>
        </div>

        <div className="mt-8">
          <Link href="/join" className="inline-block bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors">
            {t("heroCta")}
          </Link>
        </div>

        <p className="text-xs text-text-faint mt-4">{t("heroProof")}</p>
      </section>

      {/* PROBLEMA */}
      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          {t("problemTitle")}{" "}
          <span className="text-text-muted">{t("problemSubtitle")}</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
          <div className="border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">{t("noise")}</h3>
            <p className="text-sm text-text-muted">{t("noiseDesc")}</p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">{t("noTime")}</h3>
            <p className="text-sm text-text-muted">{t("noTimeDesc")}</p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">{t("fear")}</h3>
            <p className="text-sm text-text-muted">{t("fearDesc")}</p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("howTitle")}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">1</div>
            <h3 className="font-semibold mt-4 mb-2">{t("step1Title")}</h3>
            <p className="text-sm text-text-muted">{t("step1Desc")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">2</div>
            <h3 className="font-semibold mt-4 mb-2">{t("step2Title")}</h3>
            <p className="text-sm text-text-muted">{t("step2Desc")}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">3</div>
            <h3 className="font-semibold mt-4 mb-2">{t("step3Title")}</h3>
            <p className="text-sm text-text-muted">{t("step3Desc")}</p>
          </div>
        </div>
      </section>

      {/* TRACK RECORD */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("trackTitle")}</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono">{activeStocks.length}</p>
            <p className="text-sm text-text-muted mt-1">{t("companiesInPortfolio")}</p>
          </div>
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">{avgDivYield.toFixed(1)}%</p>
            <p className="text-sm text-text-muted mt-1">{t("avgDivYieldLabel")}</p>
          </div>
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono">{regions}</p>
            <p className="text-sm text-text-muted mt-1">{t("regionsOfWorld")}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tickers.map((ticker) => (
            <span key={ticker} className="text-xs font-mono px-3 py-1.5 rounded-full bg-tag-bg text-text-muted border border-border">
              {ticker}
            </span>
          ))}
        </div>

        {samplePick && (
          <div className="border border-border rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-xs text-text-faint uppercase tracking-wider mb-3">{t("samplePickLabel")}</p>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold">
                {samplePick.ticker} <span className="text-text-muted font-normal">— {samplePick.name}</span>
              </h3>
              {(samplePick.dividend_yield ?? 0) > 0 && (
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {t("divYieldBadge", { yield: samplePick.dividend_yield ?? 0 })}
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-2">{samplePick.summary_short}</p>
            <p className="text-sm text-text-muted mt-3">{samplePick.summary_what}</p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-faint">{t("samplePickFooter")}</p>
              <Link href="/join" className="text-sm text-brand-text font-medium hover:text-brand-hover">{t("seeMore")}</Link>
            </div>
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t("featuresTitle")}</h2>
        <div className="space-y-4">
          {[t("feature1"), t("feature2"), t("feature3"), t("feature4"), t("feature5", { regions }), t("feature6")].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">&#10003;</span>
              <span className="text-text-secondary">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="text-center">
        <div className="border border-brand-border bg-brand-subtle rounded-2xl p-10 max-w-md mx-auto">
          <p className="text-sm text-brand-text font-medium uppercase tracking-wider mb-3">{t("pricingLabel")}</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold">{t("pricingAmount")}</span>
            <span className="text-text-muted text-lg">{t("pricingPeriod")}</span>
          </div>
          <p className="text-text-faint text-sm mt-2">{t("pricingSubtitle")}</p>
          <Link href="/join" className="block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors text-center mt-6">
            {t("pricingCta")}
          </Link>
          <p className="text-xs text-text-faint mt-3">{t("pricingDisclaimer")}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">{t("faqTitle")}</h2>
        <div className="space-y-4">
          <FaqItem q={t("faq1Q")} a={t("faq1A")} />
          <FaqItem q={t("faq2Q")} a={t("faq2A")} />
          <FaqItem q={t("faq3Q")} a={t("faq3A")} />
          <FaqItem q={t("faq4Q")} a={t("faq4A")} />
          <FaqItem q={t("faq5Q")} a={t("faq5A")} />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="text-center pb-8">
        <h2 className="text-2xl md:text-3xl font-bold">{t("ctaTitle")}</h2>
        <p className="text-text-muted text-lg mt-2">{t("ctaSubtitle")}</p>
        <div className="mt-6">
          <Link href="/join" className="inline-block bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors">
            {t("ctaCta")}
          </Link>
        </div>
        <p className="text-xs text-text-faint mt-8">{t("ctaDisclaimer")}</p>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-1">{q}</h3>
      <p className="text-sm text-text-muted">{a}</p>
    </div>
  );
}
