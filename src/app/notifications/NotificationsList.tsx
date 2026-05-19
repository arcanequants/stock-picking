"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PortfolioEvent } from "@/lib/types";
import ShareButton from "@/components/ShareButton";

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
  totalWithExplanations: number;
}

type SummaryLocale = "en" | "es" | "pt" | "hi";

function pickSummary(event: PortfolioEvent, locale: string): string | null {
  const lang = (["es", "en", "pt", "hi"] as SummaryLocale[]).includes(
    locale as SummaryLocale
  )
    ? (locale as SummaryLocale)
    : "es";
  const map: Record<SummaryLocale, string | null> = {
    es: event.human_summary_es,
    en: event.human_summary_en,
    pt: event.human_summary_pt,
    hi: event.human_summary_hi,
  };
  return map[lang] ?? map.es ?? map.en ?? null;
}

export default function NotificationsList({
  initialEvents,
  isSubscribed,
  isLoggedIn,
  locale,
  totalWithExplanations,
}: Props) {
  const t = useTranslations("Notifications");
  const [events, setEvents] = useState(initialEvents);

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

  useEffect(() => {
    if (!isSubscribed || !isLoggedIn) return;
    const unreadIds = events
      .filter(
        (e) => !(e as PortfolioEvent & { is_read?: boolean }).is_read
      )
      .map((e) => e.id);
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

  const renderHeadline = (event: PortfolioEvent) => {
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

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const eventDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (eventDay.getTime() === today.getTime()) return t("dateToday");
    if (eventDay.getTime() === yesterday.getTime()) return t("dateYesterday");
    return date.toLocaleDateString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const understoodCount = isSubscribed
    ? totalWithExplanations
    : Math.min(1, totalWithExplanations);

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">{"\u2728"}</div>
        <p className="text-foreground font-medium">{t("emptyTitle")}</p>
        <p className="text-text-muted text-sm mt-2 max-w-sm mx-auto">
          {t("emptyBody")}
        </p>
      </div>
    );
  }

  let lastDateLabel = "";

  return (
    <div>
      {/* FOMO counter for free users — only shown if there's anything curated */}
      {!isSubscribed && totalWithExplanations > 1 && (
        <div className="bg-brand-subtle border border-brand-border rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-foreground">
            {t("fomoCounter", {
              understood: String(understoodCount),
              total: String(totalWithExplanations),
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

      <div className="space-y-2">
        {events.map((event, index) => {
          const summary = pickSummary(event, locale);
          const isLatest = index === 0;
          const showSummary = isSubscribed || isLatest;

          const dateLabel = getDateLabel(event.created_at);
          const showDateSeparator = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          return (
            <div key={event.id}>
              {showDateSeparator && (
                <div className="flex items-center gap-3 pt-4 pb-1 first:pt-0">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-text-faint uppercase tracking-wide">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              <Link
                href={`/stocks/${event.ticker}`}
                className="block bg-card border border-border rounded-xl p-4 hover:border-brand-border transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {EVENT_ICONS[event.event_type] ?? "\u{1F4CC}"}
                  </span>
                  <div className="flex-1 min-w-0">
                    {/* Single one-liner summary if we have it; fall back to the
                        i18n headline. We dropped the WHAT IT MEANS / FOR YOUR
                        PORTFOLIO double-section — it read as personalized
                        advice and was AI filler. */}
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {showSummary && summary ? summary : renderHeadline(event)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-text-faint">
                      <span>{formatDate(event.created_at)}</span>
                      <span>·</span>
                      <span className="font-medium tracking-wide">
                        {event.ticker}
                      </span>
                      {event.affects_thesis && (
                        <>
                          <span>·</span>
                          <span className="text-brand-text font-medium">
                            {t("thesisFlag")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {event.event_type === "dividend" && (
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="shrink-0"
                    >
                      <ShareButton
                        url={`/stocks/${event.ticker}`}
                        title={renderHeadline(event)}
                        variant="icon"
                      />
                    </div>
                  )}
                </div>

                {/* Free user blur teaser — only on non-latest if a summary
                    exists. The latest is shown as a free preview. */}
                {!isSubscribed && !isLatest && summary && (
                  <div className="mt-3 pt-3 border-t border-border relative">
                    <div className="space-y-2 explanation-blur">
                      <div className="h-3 bg-brand/10 rounded w-full" />
                      <div className="h-3 bg-brand/10 rounded w-4/5" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-subtle/40 backdrop-blur-[2px] rounded">
                      <span className="text-sm font-medium text-brand bg-background/80 px-4 py-1.5 rounded-full border border-brand-border">
                        {t("blurCTA")} {"\u2192"}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      {!isSubscribed && (
        <div className="mt-8 text-center">
          <div className="bg-brand-subtle border border-brand-border rounded-xl p-6">
            <p className="text-base font-semibold text-foreground mb-2">
              {t("bottomCTATitle")}
            </p>
            <p className="text-sm text-text-muted mb-4">
              {t("bottomCTADescription")}
            </p>
            <Link
              href="/join"
              className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm"
            >
              {t("bottomCTAButton")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
