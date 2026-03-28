import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getPublicEvents } from "@/lib/notifications";
import type { EventExplanation } from "@/lib/types";

const EVENT_ICONS: Record<string, string> = {
  price_move: "\u{1F4C8}",
  dividend: "\u{1F4B0}",
  earnings: "\u{1F4CA}",
  analyst: "\u2B50",
  news: "\u{1F4F0}",
};

export default async function HomeNoticiasPreview() {
  const events = await getPublicEvents(1);
  if (events.length === 0) return null;

  const event = events[0];
  const tNotif = await getTranslations("Notifications");
  const tHome = await getTranslations("Home");

  let headline: string;
  try {
    const key = event.title_key.replace("notifications.", "");
    headline = tNotif(key, event.params);
  } catch {
    headline = event.title_key;
    for (const [k, v] of Object.entries(event.params)) {
      headline = headline.replace(`{${k}}`, v);
    }
  }

  const icon = EVENT_ICONS[event.event_type] ?? "\u{1F4CC}";
  const locale = await getLocale();
  const explanation = (event.explanations?.[locale as "en" | "es" | "pt" | "hi"] ?? event.explanations?.["en"]) as EventExplanation | undefined;

  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
        {tHome("noticiasTitle")}
      </h2>
      <Link
        href="/notifications"
        className="block border border-border rounded-xl p-5 hover:border-brand transition-colors card-hover"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {headline}
            </p>
            {explanation && (
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                {explanation.meaning}
              </p>
            )}
            <p className="text-sm font-medium text-brand mt-3">
              {tHome("noticiasCta")} {"\u2192"}
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
