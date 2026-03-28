"use client";

import { useState } from "react";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function DataEntryForm() {
  const [platform, setPlatform] = useState<"twitter" | "instagram">("twitter");
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [form, setForm] = useState({
    followers: 0,
    followers_gained: 0,
    impressions: 0,
    engagements: 0,
    engagement_rate: 0,
    link_clicks: 0,
    profile_visits: 0,
    posts_count: 0,
    top_post_url: "",
    top_post_impressions: 0,
    notes: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "top_post_url" || field === "notes"
          ? value
          : Number(value) || 0,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    try {
      const res = await fetch("/api/marketing/analytics/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart,
          platform,
          ...form,
          top_post_url: form.top_post_url || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  const fields = [
    { key: "followers", label: "Total Followers" },
    { key: "followers_gained", label: "Followers Gained" },
    { key: "impressions", label: "Total Impressions" },
    { key: "engagements", label: "Total Engagements" },
    { key: "engagement_rate", label: "Engagement Rate (%)" },
    { key: "link_clicks", label: "Link Clicks" },
    { key: "profile_visits", label: "Profile Visits" },
    { key: "posts_count", label: "Posts Published" },
    { key: "top_post_impressions", label: "Top Post Impressions" },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {/* Week + Platform */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Week Start</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value as "twitter" | "instagram")
            }
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="twitter">Twitter / X</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-text-muted mb-1">
              {f.label}
            </label>
            <input
              type="number"
              step={f.key === "engagement_rate" ? "0.01" : "1"}
              value={form[f.key as keyof typeof form]}
              onChange={(e) => updateField(f.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
        ))}
      </div>

      {/* Text fields */}
      <div>
        <label className="block text-xs text-text-muted mb-1">
          Top Post URL
        </label>
        <input
          type="url"
          value={form.top_post_url}
          onChange={(e) => updateField("top_post_url", e.target.value)}
          placeholder="https://x.com/..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
          placeholder="What worked, what didn't..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        {status === "saving"
          ? "Saving..."
          : status === "saved"
            ? "Saved!"
            : "Save Week Data"}
      </button>

      {status === "error" && (
        <p className="text-red-500 text-sm">Failed to save. Try again.</p>
      )}
    </form>
  );
}
