import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCuratedEvents } from "@/lib/notifications";
import type { PortfolioEvent } from "@/lib/types";

const EVENT_ICONS: Record<string, string> = {
  price_move: "\u{1F4C8}",
  dividend: "\u{1F4B0}",
  earnings: "\u{1F4CA}",
  analyst: "\u2B50",
  news: "\u{1F4F0}",
};

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

export default async function PortfolioEventsHero() {
  const events = await getCuratedEvents(2);
  if (events.length === 0) return null;

  const locale = await getLocale();
  const t = await getTranslations("Portfolio");
  const tNotif = await getTranslations("Notifications");

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("eventsHeroTitle")}
        </h2>
        <Link
          href="/notifications"
          className="text-xs text-brand hover:text-brand-hover transition-colors"
        >
          {tNotif("seeAll")} {"\u2192"}
        </Link>
      </div>

      <div className="space-y-2">
        {events.map((event) => {
          const summary = pickSummary(event, locale);
          return (
            <Link
              key={event.id}
              href={`/stocks/${event.ticker}`}
              className="block bg-card border border-border rounded-xl p-4 hover:border-brand-border transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">
                  {EVENT_ICONS[event.event_type] ?? "\u{1F4CC}"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {summary ?? `${event.ticker}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-text-faint">
                    <span className="font-medium tracking-wide">
                      {event.ticker}
                    </span>
                    {event.affects_thesis && (
                      <>
                        <span>·</span>
                        <span className="text-brand-text font-medium">
                          {tNotif("thesisFlag")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
