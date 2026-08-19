"use client";

import { useEffect, useRef } from "react";

/** Stat band with Stripe-style count-up. Values arrive server-rendered
 *  (SEO/no-JS safe); the animation only re-plays them on mount. */
export default function LabMetrics({
  items,
}: {
  items: Array<{ value: number; pre?: string; suf?: string; dec?: number; label: string }>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = ref.current?.querySelectorAll<HTMLElement>("[data-count]");
    els?.forEach((el) => {
      const target = parseFloat(el.dataset.count ?? "0");
      const dec = +(el.dataset.dec ?? 0);
      const pre = el.dataset.pre ?? "";
      const suf = el.dataset.suf ?? "";
      const t0 = performance.now();
      const dur = 1100;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + (target * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, []);

  return (
    <div className="vl-metrics" ref={ref}>
      <div className="vl-container vl-metrics-in">
        {items.map((m) => (
          <div className="vl-metric" key={m.label}>
            <div className="v" data-count={m.value} data-pre={m.pre} data-suf={m.suf} data-dec={m.dec}>
              {(m.pre ?? "") + m.value.toFixed(m.dec ?? 0) + (m.suf ?? "")}
            </div>
            <div className="k">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
