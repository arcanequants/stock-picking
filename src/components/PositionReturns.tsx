"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ReturnBadge from "./ReturnBadge";
import ShareButton from "./ShareButton";
import type { PositionReturn } from "@/lib/types";
import Link from "next/link";

interface PositionReturnsProps {
  isSubscribed: boolean;
}

interface PositionsData {
  positions: PositionReturn[];
  total_return_pct: number;
  total_positions: number;
  since: string | null;
}

export default function PositionReturns({
  isSubscribed,
}: PositionReturnsProps) {
  const [data, setData] = useState<PositionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Returns");
  const tPremium = useTranslations("Premium");

  useEffect(() => {
    fetch("/api/portfolio/positions")
      .then((r) => r.json())
      .then((d: PositionsData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-5 animate-pulse">
        <div className="h-6 bg-tag-bg rounded w-48 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-tag-bg rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!data || data.positions.length === 0) return null;

  const paymentLink =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "/join";

  // Free users: only show top 3 positions as teaser
  const FREE_PREVIEW_COUNT = 3;
  const visiblePositions = isSubscribed
    ? data.positions
    : data.positions.slice(0, FREE_PREVIEW_COUNT);
  const hiddenCount = isSubscribed
    ? 0
    : data.positions.length - FREE_PREVIEW_COUNT;

  return (
    <section className="border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("positionReturns")}
        </h3>
        {!isSubscribed && (
          <span className="pro-badge">{tPremium("badge")}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-text-faint">
                Ticker
              </th>
              <th className="text-left py-2 px-3 text-text-faint hidden sm:table-cell">
                {t("name")}
              </th>
              {isSubscribed && (
                <>
                  <th className="text-right py-2 px-3 text-text-faint hidden md:table-cell">
                    {t("buyPrice")}
                  </th>
                  <th className="text-right py-2 px-3 text-text-faint hidden md:table-cell">
                    {t("currentPrice")}
                  </th>
                </>
              )}
              <th className="text-right py-2 px-3 text-text-faint">
                {t("return")}
              </th>
              {isSubscribed && (
                <>
                  <th className="text-right py-2 px-3 text-text-faint hidden sm:table-cell">
                    {t("daysHeld")}
                  </th>
                  <th className="py-2 px-3 text-text-faint w-8" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visiblePositions.map((pos) => (
              <tr
                key={pos.ticker}
                className="border-b border-border/50 hover:bg-card-hover"
              >
                <td className="py-2 px-3 font-bold text-foreground">
                  <Link
                    href={`/stocks/${pos.ticker}`}
                    className="hover:text-brand-text transition-colors"
                  >
                    {pos.ticker}
                  </Link>
                </td>
                <td className="py-2 px-3 text-text-secondary hidden sm:table-cell">
                  {pos.name}
                </td>
                {isSubscribed ? (
                  <>
                    <td className="py-2 px-3 text-right font-mono text-text-muted hidden md:table-cell">
                      ${pos.buy_price.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-foreground hidden md:table-cell">
                      ${pos.current_price.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <ReturnBadge value={pos.return_pct} />
                    </td>
                    <td className="py-2 px-3 text-right text-text-muted text-xs hidden sm:table-cell">
                      {pos.days_held}d
                    </td>
                    <td className="py-2 px-3">
                      <ShareButton
                        url={`/share/${pos.ticker}`}
                        title={`${pos.ticker} ${pos.return_pct >= 0 ? "+" : ""}${pos.return_pct.toFixed(1)}%`}
                        variant="icon"
                      />
                    </td>
                  </>
                ) : (
                  <td className="py-2 px-3 text-right">
                    <ReturnBadge value={pos.return_pct} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Free: show hidden count + CTA */}
      {!isSubscribed && (
        <div className="mt-2 relative">
          {hiddenCount > 0 && (
            <p className="text-center text-xs text-text-faint mb-3">
              {t("andMore", { count: hiddenCount })}
            </p>
          )}
          <div className="text-center">
            <a
              href={paymentLink}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t("subscribeToSee")}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
