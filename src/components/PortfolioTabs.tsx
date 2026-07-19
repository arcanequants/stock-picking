"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import PersonalPortfolio from "@/components/PersonalPortfolio";

/**
 * Model / Personal portfolio switch. The model view (server-rendered) comes
 * in as children; the personal view is client-fetched on demand.
 * Only rendered for authed users — anonymous visitors get the plain model page.
 */
export default function PortfolioTabs({ children }: { children: ReactNode }) {
  const t = useTranslations("PersonalPortfolio");
  const [tab, setTab] = useState<"model" | "personal">("model");

  return (
    <div className="space-y-8">
      <div
        data-tour="portfolio-tabs"
        className="inline-flex rounded-lg border border-border p-1 gap-1"
        role="tablist"
      >
        <TabButton active={tab === "model"} onClick={() => setTab("model")}>
          {t("tabModel")}
        </TabButton>
        <TabButton active={tab === "personal"} onClick={() => setTab("personal")}>
          {t("tabPersonal")}
        </TabButton>
      </div>

      <div className={tab === "model" ? "" : "hidden"}>{children}</div>
      {tab === "personal" && <PersonalPortfolio />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand text-white"
          : "text-text-muted hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
