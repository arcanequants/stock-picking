"use client";

import { useEffect, useState } from "react";

export interface ReferralLabels {
  title: string;
  desc: string;
  copy: string;
  copied: string;
  referred: string;
  converted: string;
  monthsEarned: string;
}

interface ReferralData {
  link: string;
  referred: number;
  converted: number;
  monthsEarned: number;
}

export default function ReferralCard({ labels }: { labels: ReferralLabels }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/referral/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setData(d as ReferralData);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const copy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  };

  return (
    <div>
      <h2 className="font-semibold mb-1">{labels.title}</h2>
      <p className="text-sm text-text-muted mb-4">{labels.desc}</p>
      {data ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <input
              readOnly
              value={data.link}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground font-mono"
            />
            <button
              onClick={copy}
              className="shrink-0 px-3 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
            >
              {copied ? labels.copied : labels.copy}
            </button>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-border p-3">
              <dd className="text-2xl font-bold text-foreground">{data.referred}</dd>
              <dt className="text-xs text-text-muted mt-1">{labels.referred}</dt>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dd className="text-2xl font-bold text-foreground">{data.converted}</dd>
              <dt className="text-xs text-text-muted mt-1">{labels.converted}</dt>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dd className="text-2xl font-bold text-brand">{data.monthsEarned}</dd>
              <dt className="text-xs text-text-muted mt-1">{labels.monthsEarned}</dt>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-text-faint">…</p>
      )}
    </div>
  );
}
