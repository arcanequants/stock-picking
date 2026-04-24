import { Suspense } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeliveryPreference from "@/components/DeliveryPreference";
import DcaCalculator from "@/components/DcaCalculator";
import WelcomeFlow from "@/components/WelcomeFlow";
import { getAuthState } from "@/lib/auth";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const hasSessionId = Boolean(params.session_id);

  // Gate: allow post-checkout arrivals (session_id validated by Stripe in WelcomeFlow)
  // or already-subscribed users. Everyone else → pricing page.
  if (!hasSessionId) {
    const { isSubscribed } = await getAuthState();
    if (!isSubscribed) {
      redirect("/join");
    }
  }

  const t = await getTranslations("Welcome");
  const locale = await getLocale();

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
    <Suspense fallback={null}>
      <WelcomeFlow locale={locale}>
        <div className="max-w-2xl mx-auto text-center space-y-8 py-8">
          {/* Success checkmark */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-emerald-600 dark:text-emerald-400"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-text-muted text-lg">{t("subtitle")}</p>

          {/* Step 1: Choose delivery channel */}
          <div className="border border-border rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="font-semibold">{t("step1TitleNew")}</h2>
            </div>
            <DeliveryPreference labels={deliveryLabels} />
          </div>

          {/* Step 2: Set your DCA rule (monthly budget ÷ 30) */}
          <div className="border border-border rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="font-semibold">{t("budgetStepTitle")}</h2>
            </div>
            <p className="text-sm text-text-muted mb-4">
              {t("budgetStepSubtitle")}{" "}
              <Link
                href="/metodo"
                className="text-brand hover:underline font-medium"
              >
                {t("methodLearnMore")}
              </Link>
            </p>
            <DcaCalculator labels={budgetLabels} persist />
          </div>

          {/* Step 3: Login for premium content */}
          <div className="border border-border rounded-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="font-semibold">{t("step2Title")}</h2>
            </div>
            <p className="text-sm text-text-muted mb-4">{t("step2Desc")}</p>
            <Link
              href="/portfolio"
              className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {t("goToPortfolio")}
            </Link>
          </div>

          {/* What to expect */}
          <div className="border border-border rounded-2xl p-6 text-left">
            <h2 className="font-semibold mb-4">{t("expectTitle")}</h2>
            <ul className="space-y-3 text-sm">
              {[t("expect1"), t("expect2"), t("expect3")].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tip */}
          <p className="text-sm text-text-faint">{t("tip")}</p>
        </div>
      </WelcomeFlow>
    </Suspense>
  );
}
