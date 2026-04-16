import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DeliveryPreference from "@/components/DeliveryPreference";
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
