import { verifySession } from "@/lib/marketing/session";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { WeeklyAnalytics, BudgetEntry } from "@/lib/marketing/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing Dashboard" };

function MetricCard({
  label,
  value,
  change,
  suffix = "",
}: {
  label: string;
  value: number | string;
  change?: number | null;
  suffix?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value}
        {suffix}
      </p>
      {change != null && (
        <p
          className={`text-xs mt-1 ${change >= 0 ? "text-green-500" : "text-red-500"}`}
        >
          {change >= 0 ? "+" : ""}
          {change}% vs last week
        </p>
      )}
    </div>
  );
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function MarketingDashboard() {
  const session = await verifySession();
  if (!session) redirect("/marketing/login");

  const supabase = getSupabaseAdmin();

  // Fetch latest 4 rows (2 weeks * 2 platforms)
  const { data: analytics } = await supabase
    .from("marketing_analytics")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(4);

  // Fetch current month budget
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: budget } = await supabase
    .from("marketing_budget")
    .select("*")
    .eq("month", currentMonth);

  // Split analytics by platform
  const allAnalytics = (analytics ?? []) as WeeklyAnalytics[];
  const twitterWeeks = allAnalytics.filter((a) => a.platform === "twitter");
  const igWeeks = allAnalytics.filter((a) => a.platform === "instagram");

  const twitterCurrent = twitterWeeks[0] ?? null;
  const twitterPrev = twitterWeeks[1] ?? null;
  const igCurrent = igWeeks[0] ?? null;

  const totalBudget = ((budget ?? []) as BudgetEntry[]).reduce(
    (sum, b) => sum + Number(b.spent),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-text-muted text-sm mt-1">
            Welcome back, {session.displayName || session.username}
          </p>
        </div>
        <span className="text-text-faint text-xs">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Twitter Section */}
      <h2 className="text-lg font-semibold mb-3">X / Twitter</h2>
      {twitterCurrent ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <MetricCard
            label="Followers"
            value={twitterCurrent.followers}
            change={
              twitterPrev
                ? pctChange(twitterCurrent.followers, twitterPrev.followers)
                : null
            }
          />
          <MetricCard
            label="Impressions"
            value={twitterCurrent.impressions.toLocaleString()}
            change={
              twitterPrev
                ? pctChange(
                    twitterCurrent.impressions,
                    twitterPrev.impressions
                  )
                : null
            }
          />
          <MetricCard
            label="Engagements"
            value={twitterCurrent.engagements}
            change={
              twitterPrev
                ? pctChange(
                    twitterCurrent.engagements,
                    twitterPrev.engagements
                  )
                : null
            }
          />
          <MetricCard
            label="Engagement Rate"
            value={twitterCurrent.engagement_rate}
            suffix="%"
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-text-muted mb-8">
          <p>No Twitter data yet.</p>
          <a href="/marketing/data" className="text-brand text-sm hover:underline">
            Enter weekly data
          </a>
        </div>
      )}

      {/* Instagram Section */}
      <h2 className="text-lg font-semibold mb-3">Instagram</h2>
      {igCurrent ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Followers" value={igCurrent.followers} />
          <MetricCard
            label="Impressions"
            value={igCurrent.impressions.toLocaleString()}
          />
          <MetricCard label="Engagements" value={igCurrent.engagements} />
          <MetricCard
            label="Engagement Rate"
            value={igCurrent.engagement_rate}
            suffix="%"
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-text-muted mb-8">
          <p>No Instagram data yet.</p>
          <a href="/marketing/data" className="text-brand text-sm hover:underline">
            Enter weekly data
          </a>
        </div>
      )}

      {/* Budget */}
      <h2 className="text-lg font-semibold mb-3">Budget This Month</h2>
      <div className="bg-card border border-border rounded-xl p-4 mb-8">
        <p className="text-2xl font-bold">
          ${totalBudget.toFixed(2)}{" "}
          <span className="text-text-muted text-sm font-normal">USD spent</span>
        </p>
        {((budget ?? []) as BudgetEntry[]).length > 0 ? (
          <div className="mt-3 space-y-1">
            {((budget ?? []) as BudgetEntry[]).map((b) => (
              <div
                key={b.id}
                className="flex justify-between text-sm text-text-muted"
              >
                <span>{b.category}</span>
                <span>${Number(b.spent).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-faint text-sm mt-2">No budget entries yet</p>
        )}
      </div>
    </div>
  );
}
