import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import DcaCalculator from "@/components/DcaCalculator";
import { getAuthState } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metodo");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://www.vectorialdata.com/metodo",
    },
  };
}

const AVOID_KEYS = ["avoid1", "avoid2", "avoid3", "avoid4"] as const;

export default async function MetodoPage() {
  const t = await getTranslations("Metodo");
  const locale = await getLocale();
  const { isSubscribed } = await getAuthState();

  // Pull labels from Welcome namespace (shared with /welcome calculator).
  const tWelcome = await getTranslations("Welcome");
  const calculatorLabels = {
    title: t("calculatorHeading"),
    subtitle: t("calculatorSubtitle"),
    budgetLabel: tWelcome("budgetInputLabel"),
    perPickLabel: tWelcome("budgetPerPickLabel"),
    perPickSuffix: tWelcome("budgetPerPickSuffix"),
    saveButton: tWelcome("budgetSave"),
    saving: tWelcome("budgetSaving"),
    saved: tWelcome("budgetSaved"),
    minHint: tWelcome("budgetMinHint"),
  };

  // Suppress unused-locale warning; kept in case future copy keys off it.
  void locale;

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
      {/* Hero */}
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">{t("pageTitle")}</h1>
        <p className="text-lg text-brand font-medium">{t("pageSubtitle")}</p>
        <p className="text-text-muted max-w-xl mx-auto">{t("heroBody")}</p>
      </header>

      {/* The rule — 3 steps */}
      <section className="space-y-5">
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          {t("ruleTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="border border-border rounded-2xl p-5 bg-surface"
            >
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm mb-3">
                {i + 1}
              </div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive calculator — saves for authed subscribers, read-only for visitors */}
      <section className="border border-border rounded-2xl p-6 bg-surface">
        <Suspense fallback={null}>
          <DcaCalculator labels={calculatorLabels} persist={isSubscribed} />
        </Suspense>
      </section>

      {/* Framing */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-6 bg-surface">
          <h2 className="font-semibold mb-3">{t("ritualTitle")}</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            {t("ritualBody")}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-6 bg-surface">
          <h2 className="font-semibold mb-3">{t("thresholdTitle")}</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            {t("thresholdBody")}
          </p>
        </div>
      </section>

      {/* When to upgrade */}
      <section className="rounded-2xl border border-border p-6 bg-surface">
        <h2 className="font-semibold mb-3">{t("upgradeTitle")}</h2>
        <p className="text-sm text-text-muted leading-relaxed">
          {t("upgradeBody")}
        </p>
      </section>

      {/* What you avoid */}
      <section>
        <h2 className="font-semibold mb-4">{t("whatYouAvoidTitle")}</h2>
        <ul className="space-y-3">
          {AVOID_KEYS.map((k) => (
            <li key={k} className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-rose-500 shrink-0 mt-0.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="text-sm text-text-muted leading-relaxed">
                {t(k)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA — hidden for existing subscribers */}
      {!isSubscribed && (
        <section className="rounded-2xl border border-brand/30 bg-brand-subtle p-8 text-center space-y-3">
          <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
          <p className="text-sm text-text-muted">{t("ctaBody")}</p>
          <Link
            href="/join"
            className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors mt-2"
          >
            {t("ctaButton")}
          </Link>
        </section>
      )}

      <p className="text-xs text-text-faint text-center pt-4">
        {t("disclaimer")}
      </p>
    </div>
  );
}
