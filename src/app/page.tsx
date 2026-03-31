import { stocks, transactions } from "@/data/stocks";
import Link from "next/link";
import Image from "next/image";
import HeroMetrics from "@/components/HeroMetrics";
import ScrollReveal from "@/components/ScrollReveal";
import HomeNoticiasPreview from "@/components/HomeNoticiasPreview";
import FreeSignupForm from "@/components/FreeSignupForm";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Home");
  const f = await getTranslations("FreeSignup");
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

  // Rotating sample pick: exclude last 5 (premium), rotate daily among older picks
  const olderTxs = transactions.slice(0, Math.max(1, transactions.length - 5));
  const dayIndex = Math.floor(Date.now() / 86400000) % olderTxs.length;
  const sampleTx = olderTxs[dayIndex];
  const samplePick = sampleTx
    ? activeStocks.find((s) => s.ticker === sampleTx.ticker) ?? activeStocks[0]
    : activeStocks[0];
  const samplePickNumber = sampleTx?.id ?? 1;
  const samplePickDate = sampleTx
    ? new Date(sampleTx.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-24">
      {/* HERO — with animated gradient mesh */}
      <section className="text-center pt-8 md:pt-16 hero-gradient">
        <ScrollReveal>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image src="/logo.png" alt="Vectorial Data" width={64} height={64} className="relative z-10" />
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl z-0 owl-glow" />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <HeroMetrics avgDivYield={avgDivYield} />
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <h1 className="text-4xl md:text-6xl font-bold mt-6 tracking-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto mt-4">
            {t("heroSubtitle")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={450}>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-text-faint">
            <span>{t("companies", { count: activeStocks.length })}</span>
            <span className="w-1 h-1 rounded-full bg-text-faint" />
            <span>{t("regions", { count: regions })}</span>
            <span className="w-1 h-1 rounded-full bg-text-faint" />
            <span>{t("avgDivYield", { yield: avgDivYield.toFixed(1) })}</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={600}>
          <div className="mt-8">
            <Link href="/join" className="cta-glow inline-block bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors">
              {t("heroCta")}
            </Link>
          </div>
          <p className="text-xs text-text-faint mt-4">{t("heroProof")}</p>
          <Link href="/verify" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            {t("heroVerify", { count: transactions.length })}
          </Link>
        </ScrollReveal>
      </section>

      {/* PROBLEMA */}
      <ScrollReveal>
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("problemTitle")}{" "}
            <span className="text-text-muted">{t("problemSubtitle")}</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
            <ScrollReveal delay={100} className="h-full">
              <div className="border border-border rounded-xl p-5 card-hover h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">{t("noise")}</h3>
                <p className="text-sm text-text-muted">{t("noiseDesc")}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} className="h-full">
              <div className="border border-border rounded-xl p-5 card-hover h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">{t("noTime")}</h3>
                <p className="text-sm text-text-muted">{t("noTimeDesc")}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300} className="h-full">
              <div className="border border-border rounded-xl p-5 card-hover h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1">{t("fear")}</h3>
                <p className="text-sm text-text-muted">{t("fearDesc")}</p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>

      {/* COMO FUNCIONA */}
      <ScrollReveal>
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("howTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={100}>
              <div className="text-center card-hover rounded-xl p-4">
                <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">1</div>
                <h3 className="font-semibold mt-4 mb-2">{t("step1Title")}</h3>
                <p className="text-sm text-text-muted">{t("step1Desc")}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center card-hover rounded-xl p-4">
                <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">2</div>
                <h3 className="font-semibold mt-4 mb-2">{t("step2Title")}</h3>
                <p className="text-sm text-text-muted">{t("step2Desc")}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="text-center card-hover rounded-xl p-4">
                <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">3</div>
                <h3 className="font-semibold mt-4 mb-2">{t("step3Title")}</h3>
                <p className="text-sm text-text-muted">{t("step3Desc")}</p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ScrollReveal>

      {/* FREE DIGEST SIGNUP — after how it works */}
      <ScrollReveal>
        <section className="max-w-md mx-auto text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">{f("homeTitle")}</p>
          <p className="text-sm text-text-faint">{f("homeSubtitle")}</p>
          <FreeSignupForm />
        </section>
      </ScrollReveal>

      {/* TRACK RECORD */}
      <ScrollReveal>
        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("trackTitle")}</h2>

          {/* CTA to /stocks */}
          <ScrollReveal delay={100}>
            <div className="border border-brand-border bg-brand-subtle rounded-xl p-6 text-center mb-8">
              <p className="text-lg font-semibold">{t("trackCta")}</p>
              <p className="text-sm text-text-muted mt-1">{t("trackCtaDesc", { count: activeStocks.length })}</p>
              <Link
                href="/stocks"
                className="inline-block mt-4 bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                {t("trackCtaButton")} {"\u2192"}
              </Link>
            </div>
          </ScrollReveal>

          {/* Ticker pills — show first 8 + "and X more" */}
          <ScrollReveal>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {tickers.slice(0, 8).map((ticker) => (
                <span key={ticker} className="text-xs font-mono px-3 py-1.5 rounded-full bg-tag-bg text-text-muted border border-border">
                  {ticker}
                </span>
              ))}
              {tickers.length > 8 && (
                <Link
                  href="/stocks"
                  className="text-xs font-mono px-3 py-1.5 rounded-full bg-brand-subtle text-brand border border-brand-border hover:bg-brand hover:text-white transition-colors"
                >
                  {t("andMore", { count: tickers.length - 8 })}
                </Link>
              )}
            </div>
          </ScrollReveal>

          {/* Rotating sample pick card */}
          {samplePick && (
            <ScrollReveal>
              <div className="border border-border rounded-xl p-6 max-w-2xl mx-auto card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                    {t("samplePickLabel")}
                  </span>
                  {samplePickDate && (
                    <span className="text-xs text-text-faint font-mono">
                      {t("pickNumber", { number: samplePickNumber, date: samplePickDate })}
                    </span>
                  )}
                </div>
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
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-text-faint italic">{t("samplePickSentDate", { date: samplePickDate ?? "" })}</p>
                  <Link href="/join" className="text-sm text-brand font-medium hover:text-brand-hover">{t("samplePickFomo")}</Link>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Notario Digital trust card */}
          <ScrollReveal>
            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-5 max-w-2xl mx-auto mt-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <h3 className="font-semibold text-sm">{t("verifyCardTitle")}</h3>
              </div>
              <p className="text-sm text-text-muted">{t("verifyCardText")}</p>
              <Link href="/verify" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2 inline-block">
                {t("verifyCardCta")} {"\u2192"}
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </ScrollReveal>

      {/* FEATURES */}
      <ScrollReveal>
        <section className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t("featuresTitle")}</h2>
          <div className="space-y-4">
            {[t("feature1"), t("feature2"), t("feature3"), t("feature4"), t("feature5", { regions }), t("feature6")].map((item, i) => (
              <ScrollReveal key={item} delay={i * 80}>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">&#10003;</span>
                  <span className="text-text-secondary">{item}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* NOTICIAS PREVIEW */}
      <ScrollReveal>
        <HomeNoticiasPreview />
      </ScrollReveal>

      {/* PRICING */}
      <ScrollReveal>
        <section className="text-center">
          <div className="border border-brand-border bg-brand-subtle rounded-2xl p-10 max-w-md mx-auto card-hover">
            <p className="text-sm text-brand-text font-medium uppercase tracking-wider mb-3">{t("pricingLabel")}</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-bold">{t("pricingAmount")}</span>
              <span className="text-text-muted text-lg">{t("pricingPeriod")}</span>
            </div>
            <p className="text-text-faint text-sm mt-2">{t("pricingSubtitle")}</p>
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "/join"} className="cta-glow block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors text-center mt-6">
              {t("pricingCta")}
            </a>
            <p className="text-xs text-text-faint mt-3">{t("pricingDisclaimer")}</p>
            <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              {t("pricingVerify")}
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal>
        <section className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">{t("faqTitle")}</h2>
          <div className="space-y-4">
            {[
              { q: t("faq1Q"), a: t("faq1A") },
              { q: t("faq2Q"), a: t("faq2A") },
              { q: t("faq3Q"), a: t("faq3A") },
              { q: t("faq4Q"), a: t("faq4A") },
              { q: t("faq5Q"), a: t("faq5A") },
              { q: t("faq6Q"), a: t("faq6A") },
            ].map((faq, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="border border-border rounded-xl p-4 card-hover">
                  <h3 className="font-semibold text-foreground mb-1">{faq.q}</h3>
                  <p className="text-sm text-text-muted">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* CTA FINAL */}
      <ScrollReveal>
        <section className="text-center pb-8">
          <h2 className="text-2xl md:text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="text-text-muted text-lg mt-2">{t("ctaSubtitle")}</p>
          <div className="mt-6">
            <Link href="/join" className="cta-glow inline-block bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors">
              {t("ctaCta")}
            </Link>
          </div>
          <div className="max-w-md mx-auto mt-8 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <p className="text-sm text-text-muted font-medium">{f("homeFinalAlt")}</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-sm text-text-faint">{f("homeFinalDesc")}</p>
            <FreeSignupForm />
          </div>
          <p className="text-xs text-text-faint mt-8">{t("ctaDisclaimer")}</p>
        </section>
      </ScrollReveal>
    </div>
  );
}
