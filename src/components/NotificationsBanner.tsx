import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPublicEvents } from "@/lib/notifications";
import type { EventExplanation } from "@/lib/types";

const EVENT_ICONS: Record<string, string> = {
  price_move: "\u{1F4C8}",
  dividend: "\u{1F4B0}",
  earnings: "\u{1F4CA}",
  analyst: "\u2B50",
  news: "\u{1F4F0}",
};

export default async function NotificationsBanner() {
  const events = await getPublicEvents(1);
  if (events.length === 0) return null;

  const event = events[0];
  const t = await getTranslations("Notifications");

  // Render headline using params
  let headline: string;
  try {
    const key = event.title_key.replace("notifications.", "");
    headline = t(key, event.params);
  } catch {
    headline = event.title_key;
    for (const [k, v] of Object.entries(event.params)) {
      headline = headline.replace(`{${k}}`, v);
    }
  }

  const icon = EVENT_ICONS[event.event_type] ?? "\u{1F4CC}";
  const explanation = (event.explanations?.["es"] ?? event.explanations?.["en"]) as EventExplanation | undefined;

  return (
    <Link
      href="/notifications"
      className="block bg-brand-subtle border border-brand-border rounded-xl p-4 mb-6 hover:border-brand transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {headline}
          </p>
          {explanation && (
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {explanation.meaning}
            </p>
          )}
        </div>
        <span className="text-sm font-medium text-brand whitespace-nowrap">
          {t("bannerCTA")} {"\u2192"}
        </span>
      </div>
    </Link>
  );
}
