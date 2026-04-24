import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import DeliveryPreference from "@/components/DeliveryPreference";
import DcaCalculator from "@/components/DcaCalculator";
import AccountActions from "@/components/AccountActions";
import { getAuthState } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account — Vectorial Data",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.vectorialdata.com/account" },
};

export default async function AccountPage() {
  const { user, isSubscribed } = await getAuthState();

  // Gate: only authenticated subscribers can access
  if (!user || !isSubscribed) {
    redirect("/join");
  }

  const t = await getTranslations("Welcome");
  const tAccount = await getTranslations("Account");

  const deliveryLabels = {
    title: t("deliveryTitle"),
    subtitle: t("deliverySubtitle"),
    whatsapp: t("channelWhatsApp"),
    whatsappDesc: t("channelWhatsAppDesc"),
    email: t("channelEmail"),
    emailDesc: t("channelEmailDesc"),
    both: t("channelBoth"),
    bothDesc: t("channelBothDesc"),
    saved: t("deliverySaved"),
    saving: t("deliverySaving"),
    joinWhatsApp: t("joinWhatsApp"),
    waFallbackTitle: t("waFallbackTitle"),
    waFallbackDesc: t("waFallbackDesc"),
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

      {/* Delivery preference */}
      <section className="border border-border rounded-2xl p-6">
        <DeliveryPreference labels={deliveryLabels} />
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
