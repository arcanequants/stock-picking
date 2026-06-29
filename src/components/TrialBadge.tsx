"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Small pill shown only while the user is on a trial: "Trial · N days left".
// Fetches the isolated /api/trial/status (renders nothing otherwise).
export default function TrialBadge() {
  const t = useTranslations("TrialBadge");
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/trial/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.trialing) setDays(d.daysLeft ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (days === null) return null;

  return (
    <Link
      href="/join"
      title={t("cta")}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-text hover:bg-brand/15 transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
      {t("daysLeft", { days })}
    </Link>
  );
}
