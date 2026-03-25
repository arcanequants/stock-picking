"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { NotificationWithRead } from "@/lib/types";

const EVENT_ICONS: Record<string, string> = {
  price_move: "\u{1F4C8}",
  dividend: "\u{1F4B0}",
  earnings: "\u{1F4CA}",
  analyst: "\u2B50",
  news: "\u{1F4F0}",
};

export default function NotificationsList() {
  const t = useTranslations("Notifications");
  const [events, setEvents] = useState<NotificationWithRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark visible unread events as read after 2 seconds
  useEffect(() => {
    const unread = events.filter((e) => !e.is_read);
    if (unread.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventIds: unread.map((e) => e.id) }),
        });
        setEvents((prev) => prev.map((e) => ({ ...e, is_read: true })));
        setUnreadCount(0);
      } catch {
        // Silently fail
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [events]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setEvents((prev) => prev.map((e) => ({ ...e, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
    setMarkingAll(false);
  };

  const renderEventText = (event: NotificationWithRead) => {
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
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4">
            <div className="h-4 bg-tag-bg rounded w-3/4 mb-2" />
            <div className="h-3 bg-tag-bg rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-brand hover:text-brand-hover transition-colors disabled:opacity-50"
          >
            {t("markAllRead")}
          </button>
        </div>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">{"\u{1F514}"}</div>
          <p className="text-text-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-card border border-border rounded-xl p-4 notification-item ${
                !event.is_read ? "notification-unread" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">
                  {EVENT_ICONS[event.event_type] ?? "\u{1F4CC}"}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">
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
          ))}
        </div>
      )}
    </div>
  );
}
