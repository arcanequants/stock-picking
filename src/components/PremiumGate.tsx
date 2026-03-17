"use client";

import { useTranslations } from "next-intl";

interface PremiumGateProps {
  children: React.ReactNode;
  title: string;
  description: string;
  icon: "chart" | "table" | "lock";
  variant?: "blur" | "fade";
  showBadge?: boolean;
  freeContent?: React.ReactNode;
  isSubscribed?: boolean;
}

const icons = {
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  table: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" />
    </svg>
  ),
  lock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

export default function PremiumGate({
  children,
  title,
  description,
  icon,
  variant = "blur",
  showBadge = false,
  freeContent,
  isSubscribed = false,
}: PremiumGateProps) {
  const t = useTranslations("Premium");
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "/join";

  // If subscribed, render children directly
  if (isSubscribed) {
    return (
      <div>
        {freeContent && <div className="mb-0">{freeContent}</div>}
        {children}
      </div>
    );
  }

  return (
    <div>
      {showBadge && (
        <div className="flex justify-end mb-2">
          <span className="pro-badge">{t("badge")}</span>
        </div>
      )}

      {freeContent && <div className="mb-0">{freeContent}</div>}

      <div className="relative">
        {variant === "fade" ? (
          <div className="premium-table-fade">
            <div className="premium-blur">{children}</div>
          </div>
        ) : (
          <div className="premium-blur">{children}</div>
        )}

        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-sm mx-4 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center mx-auto mb-4 text-brand-text">
              {icons[icon]}
            </div>
            <h3 className="font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-text-muted mb-4">{description}</p>
            <a
              href={stripeLink}
              className="cta-glow block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors text-center"
            >
              {t("cta")}
            </a>
            <p className="text-xs text-text-faint mt-2">{t("includes")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
