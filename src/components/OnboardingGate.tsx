"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DONE_KEY = "vd.webOnboardingDone";

/**
 * Shows the web onboarding (philosophy → per-buy amount → coach tour) once
 * per browser for authed users, mirroring the approved iOS flow. Mounted on
 * /picks, /portfolio and /account so both new signups and existing users
 * meet it wherever they land first.
 *
 * Replay: /picks?onboarding=1 re-runs the full flow; /picks?tour=1 runs
 * only the coach tour. (Both linked from Cuenta → "Ver tutorial".)
 */
export default function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<"idle" | "flow" | "tour">("idle");

  useEffect(() => {
    const forceFlow = searchParams.get("onboarding") === "1";
    const forceTour = searchParams.get("tour") === "1";
    const done = typeof window !== "undefined" && localStorage.getItem(DONE_KEY) === "1";

    if (forceFlow) setPhase("flow");
    else if (forceTour) setPhase("tour");
    else if (!done) setPhase("flow");
  }, [searchParams]);

  const finishFlow = useCallback(() => {
    localStorage.setItem(DONE_KEY, "1");
    // The tour's anchors live on /picks — go there if we aren't already.
    if (pathname === "/picks") {
      setPhase("tour");
    } else {
      setPhase("idle");
      router.push("/picks?tour=1");
    }
  }, [pathname, router]);

  const finishTour = useCallback(() => {
    localStorage.setItem(DONE_KEY, "1");
    setPhase("idle");
    // Drop ?tour=1 / ?onboarding=1 so refresh doesn't replay.
    if (searchParams.get("tour") || searchParams.get("onboarding")) {
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  if (phase === "flow") return <OnboardingFlow onFinish={finishFlow} onSkip={finishTour} />;
  if (phase === "tour" && pathname === "/picks") return <CoachTour onFinish={finishTour} />;
  return null;
}

/* ---------------------------------------------------------------- flow -- */

function OnboardingFlow({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  const t = useTranslations("Onboarding");
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: "🎁",
      title: t("s1Title"),
      body: t("s1Body"),
      highlight: t("s1Highlight"),
      visual: null as ReactNode,
    },
    {
      icon: "🌱",
      title: t("s2Title"),
      body: t("s2Body"),
      highlight: t("s2Highlight"),
      visual: <LadderVisual />,
    },
    {
      icon: "📄",
      title: t("s3Title"),
      body: t("s3Body"),
      highlight: t("s3Highlight"),
      visual: <PickPreview />,
    },
    {
      icon: "📈",
      title: t("proofTitle"),
      body: t("proofBody"),
      highlight: t("proofHighlight"),
      visual: <ProofVisual />,
    },
    {
      icon: "🤝",
      title: t("s4Title"),
      body: t("s4Body"),
      highlight: t("s4Legal"),
      visual: <ThreeSteps />,
    },
  ];

  const isAmountStep = step === slides.length;

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-6 py-10">
        {!isAmountStep ? (
          <div key={step} className="space-y-5">
            <div className="text-5xl">{slides[step].icon}</div>
            <h2 className="text-3xl font-bold whitespace-pre-line leading-tight">
              {slides[step].title}
            </h2>
            <p className="text-text-secondary leading-relaxed max-w-lg">{slides[step].body}</p>
            <p className="text-sm text-brand font-medium">{slides[step].highlight}</p>
            {slides[step].visual}
          </div>
        ) : (
          <AmountStep onDone={onFinish} />
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 pb-8 space-y-4">
        {/* progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {[...slides, null].map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === (isAmountStep ? slides.length : step) ? "w-6 bg-brand" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {!isAmountStep && (
          <div className="flex items-center gap-3 max-w-lg mx-auto w-full">
            <button
              onClick={onSkip}
              className="px-4 py-2.5 text-sm text-text-faint hover:text-text-muted transition-colors"
            >
              {t("skip")}
            </button>
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 rounded-lg bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              {t("next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Slide 2: the escalation ladder — start small, raise it in steps. */
function LadderVisual() {
  const t = useTranslations("Onboarding");
  const rungs = [
    { amount: "$2", when: t("ladder1When"), h: "h-10" },
    { amount: "$5", when: t("ladder2When"), h: "h-16" },
    { amount: "$50", when: t("ladder3When"), h: "h-24" },
  ];
  return (
    <div className="border border-border rounded-xl p-5 max-w-lg">
      <div className="flex items-end justify-around gap-4">
        {rungs.map((r) => (
          <div key={r.amount} className="flex flex-col items-center gap-2 flex-1">
            <span className="font-mono font-bold text-foreground">{r.amount}</span>
            <div className={`w-full ${r.h} rounded-t-lg bg-brand-subtle border border-brand/30`} />
            <span className="text-xs text-text-faint text-center">{r.when}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-text-faint text-center">{t("ladderNote")}</p>
    </div>
  );
}

/** Slide 3: a real pick, miniature — shows what "the full thesis" means. */
function PickPreview() {
  const t = useTranslations("Onboarding");
  return (
    <div className="border border-border rounded-xl p-5 max-w-lg space-y-3 bg-card-hover/30">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-bold">{t("prevName")}</span>
        <span className="font-mono text-sm text-text-muted">{t("prevTicker")}</span>
      </div>
      <p className="text-sm text-text-secondary leading-snug">{t("prevOneLiner")}</p>
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span aria-hidden>⚠️</span>
          <p>
            <span className="font-semibold">{t("prevRiskLabel")}: </span>
            <span className="text-text-muted">{t("prevRisk")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span aria-hidden>📊</span>
          <p>
            <span className="font-semibold">{t("prevValLabel")}: </span>
            <span className="text-text-muted">{t("prevVal")}</span>
          </p>
        </div>
      </div>
      <p className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        {t("prevCert")}
      </p>
    </div>
  );
}

/** Slide 4: live proof — the real model portfolio, wins AND losses. */
function ProofVisual() {
  const t = useTranslations("Onboarding");
  const [snap, setSnap] = useState<{
    total_return_pct: number;
    total_positions: number;
    since: string;
    best: { ticker: string; return_pct: number };
    worst: { ticker: string; return_pct: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/portfolio/snapshot")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setSnap(j))
      .catch(() => {});
  }, []);

  if (!snap) {
    return <div className="border border-border rounded-xl p-5 max-w-lg h-32 animate-pulse" />;
  }

  const fmt = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  const sinceYear = snap.since?.slice(0, 4) ?? "";

  return (
    <div className="border border-border rounded-xl p-5 max-w-lg space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className={`text-xl font-bold font-mono ${snap.total_return_pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {fmt(snap.total_return_pct)}
          </p>
          <p className="text-xs text-text-faint mt-1">{t("proofReturn")}</p>
        </div>
        <div>
          <p className="text-xl font-bold font-mono">{snap.total_positions}</p>
          <p className="text-xs text-text-faint mt-1">{t("proofPositions")}</p>
        </div>
        <div>
          <p className="text-xl font-bold font-mono">{sinceYear}</p>
          <p className="text-xs text-text-faint mt-1">{t("proofSince")}</p>
        </div>
      </div>
      <div className="flex gap-3 text-xs font-mono justify-center flex-wrap">
        <span className="border border-emerald-500/30 rounded-full px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
          {t("proofBest")}: {snap.best.ticker} {fmt(snap.best.return_pct)}
        </span>
        <span className="border border-red-500/30 rounded-full px-2.5 py-1 text-red-600 dark:text-red-400">
          {t("proofWorst")}: {snap.worst.ticker} {fmt(snap.worst.return_pct)}
        </span>
      </div>
    </div>
  );
}

function ThreeSteps() {
  const t = useTranslations("Onboarding");
  const steps = [
    { n: "1", title: t("s4Step1Title"), body: t("s4Step1Body") },
    { n: "2", title: t("s4Step2Title"), body: t("s4Step2Body") },
    { n: "3", title: t("s4Step3Title"), body: t("s4Step3Body") },
  ];
  return (
    <div className="space-y-3 pt-2">
      {steps.map((s) => (
        <div key={s.n} className="flex gap-3 items-start border border-border rounded-xl p-3.5">
          <span className="w-6 h-6 rounded-full bg-brand-subtle text-brand-text text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {s.n}
          </span>
          <div>
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const QUICK_AMOUNTS = [2, 5, 10, 25, 50];

function AmountStep({ onDone }: { onDone: () => void }) {
  const t = useTranslations("Onboarding");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const parsed = parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  async function save() {
    if (!valid) return;
    setBusy(true);
    try {
      await fetch("/api/me/default-investment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
    } catch {
      // Non-fatal — the buy sheet asks again if no default exists.
    } finally {
      setBusy(false);
      onDone();
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-5xl">💵</div>
      <h2 className="text-3xl font-bold leading-tight">{t("amountTitle")}</h2>
      <p className="text-text-secondary leading-relaxed">{t("amountBody")}</p>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className={`rounded-lg border px-4 py-2 text-sm font-mono font-semibold transition-colors ${
              parsed === q
                ? "border-brand bg-brand-subtle text-brand-text"
                : "border-border text-text-muted hover:bg-card-hover"
            }`}
          >
            ${q}
          </button>
        ))}
      </div>

      <div className="relative max-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("amountPlaceholder")}
          className="w-full rounded-lg border border-border bg-transparent pl-7 pr-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <p className="text-xs text-text-faint">{t("amountHint")}</p>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onDone}
          className="px-4 py-2.5 text-sm text-text-faint hover:text-text-muted transition-colors"
        >
          {t("amountLater")}
        </button>
        <button
          onClick={save}
          disabled={!valid || busy}
          className="flex-1 rounded-lg bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
        >
          {busy ? "…" : t("amountSave")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- tour -- */

interface TourStep {
  selector: string;
  titleKey: string;
  bodyKey: string;
}

const TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="pick-card"]', titleKey: "tour1Title", bodyKey: "tour1Body" },
  { selector: '[data-tour="buy-button"]', titleKey: "tour2Title", bodyKey: "tour2Body" },
  { selector: '[data-tour="nav-portfolio"]', titleKey: "tour3Title", bodyKey: "tour3Body" },
  { selector: '[data-tour="nav-account"]', titleKey: "tour4Title", bodyKey: "tour4Body" },
];

function CoachTour({ onFinish }: { onFinish: () => void }) {
  const t = useTranslations("Onboarding");
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = TOUR_STEPS[step];

  const measure = useCallback(() => {
    if (!current) return;
    // Same anchor can exist twice (desktop nav + mobile nav) — use the visible one.
    const el = Array.from(document.querySelectorAll(current.selector)).find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (el) {
      const r = el.getBoundingClientRect();
      // Hidden elements (e.g. desktop nav on mobile) measure 0×0 — treat as absent.
      setRect(r.width > 0 && r.height > 0 ? r : null);
      if (r.width > 0 && (r.top < 80 || r.bottom > window.innerHeight - 120)) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        // Re-measure after the scroll settles.
        setTimeout(() => {
          const r2 = el.getBoundingClientRect();
          setRect(r2.width > 0 && r2.height > 0 ? r2 : null);
        }, 350);
      }
    } else {
      setRect(null);
    }
  }, [current]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  if (!current) return null;

  function advance() {
    if (step + 1 >= TOUR_STEPS.length) onFinish();
    else setStep(step + 1);
  }

  const pad = 8;
  const spot = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Tooltip below the spotlight when there's room, else above; horizontally
  // anchored to the target's center, clamped to the viewport. Centered fallback.
  const vw = window.innerWidth;
  const tooltipW = Math.min(vw * 0.92, 380);
  const tooltipTop = spot
    ? spot.top + spot.height + 12 + 180 < window.innerHeight
      ? spot.top + spot.height + 12
      : Math.max(16, spot.top - 192)
    : window.innerHeight / 2 - 90;
  const tooltipLeft = spot
    ? Math.min(Math.max(spot.left + spot.width / 2 - tooltipW / 2, 16), vw - tooltipW - 16)
    : (vw - tooltipW) / 2;

  return (
    <div className="fixed inset-0 z-[80]" onClick={advance} role="dialog" aria-modal="true">
      {/* Dim layer with spotlight cutout */}
      {spot ? (
        <div
          className="absolute rounded-xl ring-2 ring-emerald-400 transition-all duration-300"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.72)" }} />
      )}

      {/* Tooltip */}
      <div
        className="absolute rounded-xl border border-emerald-400/40 bg-background p-4 space-y-2 shadow-2xl transition-all duration-300"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipW }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-mono text-text-faint">
          {t("tourProgress", { n: step + 1, total: TOUR_STEPS.length })}
        </p>
        <p className="font-bold">{t(current.titleKey)}</p>
        <p className="text-sm text-text-muted">{t(current.bodyKey)}</p>
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onFinish}
            className="text-sm text-text-faint hover:text-text-muted transition-colors"
          >
            {t("skip")}
          </button>
          <button
            onClick={advance}
            className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            {step + 1 >= TOUR_STEPS.length ? t("tourDone") : t("next")}
          </button>
        </div>
      </div>
    </div>
  );
}
