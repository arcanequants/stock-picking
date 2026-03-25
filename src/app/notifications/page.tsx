import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import NotificationsList from "./NotificationsList";

export default async function NotificationsPage() {
  const { isSubscribed } = await getAuthState();

  if (!isSubscribed) {
    redirect("/join");
  }

  const t = await getTranslations("Notifications");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <NotificationsList />
    </div>
  );
}
