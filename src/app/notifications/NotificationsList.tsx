"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PortfolioEvent, EventExplanation } from "@/lib/types";

const EVENT_ICONS: Record<string, string> = {
  price_move: "\u{1F4C8}",
  dividend: "\u{1F4B0}",
  earnings: "\u{1F4CA}",
  analyst: "\u2B50",
  news: "\u{1F4F0}",
};

interface Props {
  initialEvents: PortfolioEvent[];
  isSubscribed: boolean;
  isLoggedIn: boolean;
  locale: string;
}

export default function NotificationsList({
  initialEvents,
  isSubscribed,
  isLoggedIn,
  locale,
}: Props) {
  const t = useTranslations("Notifications");
  const [events, setEvents] = useState(initialEvents);

  // Poll for premium users only (they have read tracking)
  useEffect(() => {
    if (!isSubscribed) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch {
        // Silently fail
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isSubscribed]);

  // Auto-mark-as-read for premium users
  useEffect(() => {
    if (!isSubscribed || !isLoggedIn) return;
    const unreadIds = events.filter((e) => !(e as PortfolioEvent & { is_read?: boolean }).is_read).map((e) => e.id);
    if (unreadIds.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventIds: unreadIds }),
        });
      } catch {
        // Silently fail
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [events, isSubscribed, isLoggedIn]);

  const renderEventText = (event: PortfolioEvent) => {
    const key = event.title_key.replace("notifications.", "");
    try {
      return t(key, event.params);
    } catch {
      let text = event.title_key;
      for (const [k, v] of Object.entries(event.params)) {
        text = text.replace(`{${k}}`, v);
      }
      return text;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getExplanation = (event: PortfolioEvent): EventExplanation | null => {
    if (!event.explanations || Object.keys(event.explanations).length === 0) {
      return null;
    }
    return (
      event.explanations[locale as "en" | "es" | "pt" | "hi"] ??
      event.explanations["en"] ??
      null
    );
  };

  // FOMO counter: events this week with explanations
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const eventsThisWeek = events.filter(
    (e) => new Date(e.created_at) >= oneWeekAgo
  );
  const withExplanations = eventsThisWeek.filter(
    (e) => e.explanations && Object.keys(e.explanations).length > 0
  );
  const understoodCount = isSubscribed
    ? withExplanations.length
    : Math.min(1, withExplanations.length);

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">{"\u{1F514}"}</div>
        <p className="text-text-muted">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* FOMO counter for free users */}
      {!isSubscribed && withExplanations.length > 1 && (
        <div className="bg-brand-subtle border border-brand-border rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-foreground">
            {t("fomoCounter", {
              understood: String(understoodCount),
              total: String(withExplanations.length),
            })}
          </p>
          <Link
            href="/join"
            className="text-sm font-medium text-brand hover:text-brand-hover mt-1 inline-block"
          >
            {t("understandAll")} {"\u2192"}
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {events.map((event, index) => {
          const explanation = getExplanation(event);
          const isLatest = index === 0;
          const showExplanation = isSubscribed || isLatest;
          const hasExplanation = explanation !== null;

          return (
            <div
              key={event.id}
              className="bg-card border border-border rounded-xl overflow-hidden notification-item"
            >
              {/* Layer 1: Headline (always visible) */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {EVENT_ICONS[event.event_type] ?? "\u{1F4CC}"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {renderEventText(event)}
                    </p>
                    <p className="text-xs text-text-faint mt-1.5">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-text-faint uppercase tracking-wide mt-1">
                    {event.ticker}
                  </span>
                </div>
              </div>

              {/* Layer 2+3: Full explanation (premium or latest event) */}
              {hasExplanation && showExplanation && (
                <div className="border-t border-border bg-background px-4 py-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-text uppercase tracking-wide mb-1">
                      {t("whatItMeans")}
                    </p>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {explanation.meaning}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-text uppercase tracking-wide mb-1">
                      {t("whatToDo")}
                    </p>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {explanation.action}
                    </p>
                  </div>
                </div>
              )}

              {/* Blurred explanation with CTA (free users, non-latest) */}
              {hasExplanation && !showExplanation && (
                <div className="border-t border-border relative">
                  <div className="px-4 py-3 explanation-blur">
                    <div className="space-y-2">
                      <div className="h-3 bg-tag-bg rounded w-full" />
                      <div className="h-3 bg-tag-bg rounded w-4/5" />
                      <div className="h-3 bg-tag-bg rounded w-3/5" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                    <Link
                      href="/join"
                      className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                    >
                      {t("blurCTA")} {"\u2192"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
