/**
 * Tiny Catmull-Rom sparkline (server-safe, no client JS). Shared by the
 * lab home strategy list and the /copy-trading leader directory.
 */
export default function MiniSpark({ vals }: { vals: number[] }) {
  if (vals.length < 2) return <svg viewBox="0 0 200 48" />;
  const min = Math.min(...vals, 0), max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => [
    (200 * i) / (vals.length - 1),
    44 - ((v - min) / (max - min || 1)) * 40,
  ] as [number, number]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1],
      p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  const last = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 200 48" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--vl-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.8" fill="#18A8D8" />
    </svg>
  );
}
