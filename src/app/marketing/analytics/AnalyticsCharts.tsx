"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsRow {
  week_start: string;
  platform: string;
  followers: number;
  impressions: number;
  engagements: number;
  engagement_rate: number;
  posts_count: number;
}

export default function AnalyticsCharts({
  data,
}: {
  data: AnalyticsRow[];
}) {
  // Group by week, merge platforms
  const weeks = [...new Set(data.map((d) => d.week_start))].sort();
  const chartData = weeks.map((week) => {
    const twitter = data.find(
      (d) => d.week_start === week && d.platform === "twitter"
    );
    const ig = data.find(
      (d) => d.week_start === week && d.platform === "instagram"
    );
    return {
      week: week.slice(5), // MM-DD
      tw_followers: twitter?.followers ?? 0,
      ig_followers: ig?.followers ?? 0,
      tw_impressions: twitter?.impressions ?? 0,
      ig_impressions: ig?.impressions ?? 0,
      tw_engagement: twitter?.engagement_rate ?? 0,
      ig_engagement: ig?.engagement_rate ?? 0,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center text-text-muted">
        <p className="text-lg">No analytics data yet</p>
        <p className="text-sm mt-2">
          Enter your first week&apos;s data in{" "}
          <a href="/marketing/data" className="text-brand hover:underline">
            Data Entry
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Followers */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Follower Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="week" stroke="var(--color-text-muted)" fontSize={12} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="tw_followers"
              name="Twitter"
              stroke="#1DA1F2"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="ig_followers"
              name="Instagram"
              stroke="#E4405F"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Impressions */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Weekly Impressions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="week" stroke="var(--color-text-muted)" fontSize={12} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="tw_impressions" name="Twitter" fill="#1DA1F2" />
            <Bar dataKey="ig_impressions" name="Instagram" fill="#E4405F" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement Rate */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-4">Engagement Rate (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="week" stroke="var(--color-text-muted)" fontSize={12} />
            <YAxis stroke="var(--color-text-muted)" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="tw_engagement"
              name="Twitter"
              stroke="#1DA1F2"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="ig_engagement"
              name="Instagram"
              stroke="#E4405F"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
