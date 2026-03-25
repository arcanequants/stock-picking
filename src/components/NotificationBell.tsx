"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { NotificationWithRead } from "@/lib/types";

const EVENT_ICONS: Record<string, string> = {
  price_move: "\u{1F4C8}",
  dividend: "\u{1F4B0}",
  earnings: "\u{1F4CA}",
  analyst: "\u2B50",
  news: "\u{1F4F0}",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface NotificationBellProps {
  isSubscribed: boolean;
}

export default function NotificationBell({ isSubscribed }: NotificationBellProps) {
  const t = useTranslations("Notifications");
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<NotificationWithRead[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (!isSubscribed) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isSubscribed, fetchNotifications]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setEvents((prev) => prev.map((e) => ({ ...e, is_read: true })));
    } catch {
      // Silently fail
    }
    setLoading(false);
  };

  if (!isSubscribed) return null;

  const renderEventText = (event: NotificationWithRead) => {
    const key = event.title_key.replace("notifications.", "");
    try {
      return t(key, event.params);
    } catch {
      // Fallback: render with simple replacement
      let text = event.title_key;
      for (const [k, v] of Object.entries(event.params)) {
        text = text.replace(`{${k}}`, v);
      }
      return text;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-text-muted hover:text-foreground transition-colors p-1"
        aria-label={t("bellLabel")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl min-w-[320px] max-w-[380px] z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">{t("title")}</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-brand hover:text-brand-hover transition-colors disabled:opacity-50"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>

            {/* Events */}
            <div className="max-h-[360px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-text-faint text-center py-8">
                  {t("empty")}
                </p>
              ) : (
                events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={`notification-item px-4 py-3 border-b border-border last:border-0 ${
                      !event.is_read ? "notification-unread" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5">
                        {EVENT_ICONS[event.event_type] ?? "\u{1F4CC}"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {renderEventText(event)}
                        </p>
                        <p className="text-xs text-text-faint mt-1">
                          {timeAgo(event.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {events.length > 0 && (
              <div className="border-t border-border px-4 py-2.5 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs text-brand hover:text-brand-hover transition-colors font-medium"
                >
                  {t("seeAll")}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
