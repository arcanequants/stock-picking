import { getTranslations } from "next-intl/server";
import Link from "next/link";
import FreeSignupForm from "@/components/FreeSignupForm";

export default async function JoinPage() {
  const t = await getTranslations("Join");
  const f = await getTranslations("FreeSignup");

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-text-muted text-lg">{t("subtitle")}</p>
      </section>

      <div className="border border-brand-border bg-brand-subtle rounded-2xl p-8 mx-auto max-w-md">
        <p className="text-sm text-brand-text font-medium uppercase tracking-wider mb-2">{t("pricingLabel")}</p>
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-5xl font-bold">$1</span>
          <span className="text-text-muted">/mes</span>
        </div>
        <p className="text-text-faint text-sm mb-6">{t("pricingSubtitle")}</p>

        <ul className="text-left space-y-3 mb-8 text-sm">
          {[t("feature1"), t("feature2"), t("feature3"), t("feature4"), t("feature5")].map((item) => (
            <li key={item} className="flex items-start gap-2 text-text-secondary">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>

        <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "#"} className="cta-glow block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors text-center">
          {t("cta")}
        </a>
        <p className="text-xs text-text-faint mt-3">{t("disclaimer")}</p>
        <p className="text-xs text-text-faint mt-2">
          {t.rich("consent", {
            terms: (chunks) => <Link href="/terms" className="underline hover:text-text-muted">{chunks}</Link>,
            privacy: (chunks) => <Link href="/privacy" className="underline hover:text-text-muted">{chunks}</Link>,
          })}
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <p className="text-sm text-text-muted font-medium">{f("separator")}</p>
          <div className="flex-1 h-px bg-border" />
        </div>
        <p className="text-sm text-text-faint">{f("description")}</p>
        <FreeSignupForm />
      </div>

      <section className="text-left space-y-4 mt-12">
        <h2 className="text-xl font-bold text-center mb-6">{t("faqTitle")}</h2>
        <FaqItem q={t("faq1Q")} a={t("faq1A")} />
        <FaqItem q={t("faq2Q")} a={t("faq2A")} />
        <FaqItem q={t("faq3Q")} a={t("faq3A")} />
        <FaqItem q={t("faq4Q")} a={t("faq4A")} />
        <FaqItem q={t("faq5Q")} a={t("faq5A")} />
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
