import { getAuthState } from "@/lib/auth";
import { getTranslations, getLocale } from "next-intl/server";
import { getPublicEvents } from "@/lib/notifications";
import NotificationsList from "./NotificationsList";

export default async function NotificationsPage() {
  const { isSubscribed, user } = await getAuthState();
  const t = await getTranslations("Notifications");
  const locale = await getLocale();

  const allEvents = await getPublicEvents(20);

  // Count events with explanations BEFORE sanitizing (for FOMO counter)
  const totalWithExplanations = allEvents.filter(
    (e) => e.explanations && Object.keys(e.explanations).length > 0
  ).length;

  // Free users: limit to 10 events, only latest gets full explanations
  const limitedEvents = isSubscribed ? allEvents : allEvents.slice(0, 10);
  const events = limitedEvents.map((event, index) => {
    if (isSubscribed || index === 0) return event;
    return { ...event, explanations: {} };
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t("pageTitle")}</h1>
        <p className="text-text-muted text-sm">{t("pageSubtitle")}</p>
      </div>
      <NotificationsList
        initialEvents={events}
        isSubscribed={isSubscribed}
        isLoggedIn={!!user}
        locale={locale}
        totalWithExplanations={totalWithExplanations}
      />
    </div>
  );
}
