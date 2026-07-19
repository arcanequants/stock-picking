import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import DcaCalculator from "@/components/DcaCalculator";
import InvestmentAmountModule from "@/components/InvestmentAmountModule";
import AccountActions from "@/components/AccountActions";
import ReferralCard from "@/components/ReferralCard";
import { getAuthState } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account — Vectorial Data",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://vectorialdata.com/account" },
};

export default async function AccountPage() {
  const { user, isSubscribed } = await getAuthState();

  // Gate: subscribers only. Logged-out → login (so the email "set my rule"
  // CTA brings them back here after auth). Logged-in but not subscribed → join.
  if (!user) redirect("/login?next=/account");
  if (!isSubscribed) redirect("/join");

  const t = await getTranslations("Welcome");
  const tAccount = await getTranslations("Account");
  const tReferral = await getTranslations("Referral");
  const tOnboarding = await getTranslations("Onboarding");

  const referralLabels = {
    title: tReferral("title"),
    desc: tReferral("desc"),
    copy: tReferral("copy"),
    copied: tReferral("copied"),
    referred: tReferral("referred"),
    converted: tReferral("converted"),
    monthsEarned: tReferral("monthsEarned"),
  };

  const budgetLabels = {
    title: t("budgetCalcTitle"),
    subtitle: t("budgetCalcSubtitle"),
    budgetLabel: t("budgetInputLabel"),
    perPickLabel: t("budgetPerPickLabel"),
    perPickSuffix: t("budgetPerPickSuffix"),
    saveButton: t("budgetSave"),
    saving: t("budgetSaving"),
    saved: t("budgetSaved"),
    minHint: t("budgetMinHint"),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{tAccount("title")}</h1>
        <p className="text-text-muted">{tAccount("subtitle")}</p>
      </div>

      {/* Delivery: email-only since the WhatsApp channel was retired */}
      <section className="border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-2">{t("deliveryTitle")}</h2>
        <p className="text-sm text-text-muted">{t("channelEmailDesc")}</p>
      </section>

      {/* Per-buy amount (default_investment) + tutorial replay */}
      <section className="border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-3">{tOnboarding("moduleTitle")}</h2>
        <InvestmentAmountModule />
      </section>

      {/* DCA rule */}
      <section className="border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-semibold">{t("budgetStepTitle")}</h2>
          <Link
            href="/metodo"
            className="text-sm text-brand hover:underline shrink-0"
          >
            {t("methodLearnMore")}
          </Link>
        </div>
        <Suspense fallback={null}>
          <DcaCalculator labels={budgetLabels} persist />
        </Suspense>
      </section>

      {/* Subscription */}
      <section className="border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-1">{tAccount("subscriptionTitle")}</h2>
        <p className="text-sm text-text-muted mb-4">
          {tAccount("subscriptionDesc")}
        </p>
        <AccountActions
          labels={{
            manage: tAccount("manageSubscription"),
            logout: tAccount("logout"),
          }}
        />
      </section>

      {/* Referrals */}
      <section className="border border-border rounded-2xl p-6">
        <ReferralCard labels={referralLabels} />
      </section>

      {/* Vectorial Signals */}
      <section className="border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold mb-1">Vectorial Signals</h2>
            <p className="text-sm text-text-muted">{tAccount("signalsDesc")}</p>
          </div>
          <Link
            href="/signals"
            className="shrink-0 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-foreground hover:bg-card-hover transition-colors"
          >
            {tAccount("signalsCta")}
          </Link>
        </div>
      </section>

      {/* Support */}
      <section className="border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold mb-1">{tAccount("supportTitle")}</h2>
            <p className="text-sm text-text-muted">{tAccount("supportDesc")}</p>
          </div>
          <Link
            href="/account/tickets"
            className="shrink-0 px-3 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-foreground hover:bg-card-hover transition-colors"
          >
            {tAccount("supportCta")}
          </Link>
        </div>
      </section>

      {/* Account info */}
      <section className="border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-3">{tAccount("accountInfoTitle")}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">{tAccount("email")}</dt>
            <dd className="text-foreground font-medium">{user.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
