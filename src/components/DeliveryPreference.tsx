"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface DeliveryPreferenceProps {
  labels: {
    title: string;
    subtitle: string;
    whatsapp: string;
    whatsappDesc: string;
    email: string;
    emailDesc: string;
    both: string;
    bothDesc: string;
    saved: string;
    saving: string;
    joinWhatsApp: string;
    waFallbackTitle: string;
    waFallbackDesc: string;
  };
}

type Channel = "whatsapp" | "email" | "both";

export default function DeliveryPreference({
  labels,
}: DeliveryPreferenceProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [selected, setSelected] = useState<Channel>("whatsapp");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [waLinkLoading, setWaLinkLoading] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/delivery-preference", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { channel?: Channel };
        if (!cancelled && json.channel) {
          setSelected(json.channel);
        }
      } catch {
        // silently fall back to default
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch WhatsApp group invite link (auth-gated server-side).
  // Passes session_id for post-checkout arrivals who haven't clicked magic link yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = sessionId
          ? `/api/subscriber/wa-invite?session_id=${encodeURIComponent(sessionId)}`
          : "/api/subscriber/wa-invite";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { link?: string };
        if (!cancelled && json.link) {
          setWaLink(json.link);
        }
      } catch {
        // fall through — user still sees fallback messaging
      } finally {
        if (!cancelled) setWaLinkLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleSelect(channel: Channel) {
    setSelected(channel);
    setSaving(true);
    setSaved(false);

    try {
      await fetch("/api/auth/delivery-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail — preference is optional
    } finally {
      setSaving(false);
    }
  }

  const options: { key: Channel; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: "whatsapp",
      label: labels.whatsapp,
      desc: labels.whatsappDesc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.574-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.287 0-4.406-.744-6.13-2.004l-.428-.321-2.714.87.897-2.642-.353-.46A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
        </svg>
      ),
    },
    {
      key: "email",
      label: labels.email,
      desc: labels.emailDesc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 4l-10 8L2 4" />
        </svg>
      ),
    },
    {
      key: "both",
      label: labels.both,
      desc: labels.bothDesc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{labels.title}</h3>
      <p className="text-xs text-text-muted">{labels.subtitle}</p>

      <div className={`grid gap-3 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSelect(opt.key)}
            disabled={loading}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
              selected === opt.key
                ? "border-brand bg-brand-subtle ring-1 ring-brand"
                : "border-border hover:border-brand/50"
            }`}
          >
            <div className="mt-0.5 shrink-0">{opt.icon}</div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">{opt.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
            </div>
            {selected === opt.key && (
              <div className="ml-auto shrink-0 mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* WhatsApp group CTA: always rendered when whatsapp/both selected, with fallback if link not ready */}
      {(selected === "whatsapp" || selected === "both") && (
        <>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              {labels.joinWhatsApp}
            </a>
          ) : !waLinkLoading ? (
            <div className="mt-2 rounded-lg border border-border bg-surface-subtle p-3">
              <p className="text-sm font-medium text-foreground">{labels.waFallbackTitle}</p>
              <p className="text-xs text-text-muted mt-1">{labels.waFallbackDesc}</p>
            </div>
          ) : null}
        </>
      )}

      {saving && (
        <p className="text-xs text-text-faint animate-pulse">{labels.saving}</p>
      )}
      {saved && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{labels.saved}</p>
      )}
    </div>
  );
}
