"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ShareButtonProps {
  url: string;
  title: string;
  variant?: "icon" | "button";
}

export default function ShareButton({
  url,
  title,
  variant = "button",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("Share");

  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${url}`
      : url;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  const shareIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className="text-text-muted hover:text-brand-text transition-colors p-1"
        title={t("shareStock")}
      >
        {copied ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-emerald-500"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          shareIcon
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand-text transition-colors border border-border hover:border-brand-border rounded-lg px-3 py-1.5"
    >
      {copied ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-emerald-500"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t("linkCopied")}
        </>
      ) : (
        <>
          {shareIcon}
          {t("sharePortfolio")}
        </>
      )}
    </button>
  );
}
