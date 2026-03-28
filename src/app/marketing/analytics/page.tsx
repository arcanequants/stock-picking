import { verifySession } from "@/lib/marketing/session";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import AnalyticsCharts from "./AnalyticsCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics — Marketing Dashboard" };

export default async function AnalyticsPage() {
  const session = await verifySession();
  if (!session) redirect("/marketing/login");

  const supabase = getSupabaseAdmin();

  const { data: analytics } = await supabase
    .from("marketing_analytics")
    .select("*")
    .order("week_start", { ascending: true })
    .limit(52);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <AnalyticsCharts data={analytics ?? []} />
    </div>
  );
}
