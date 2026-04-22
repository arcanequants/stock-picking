export default function SimulatedCopierCard({
  roi,
}: {
  roi: number | null;
}) {
  if (roi == null) return null;
  const starting = 100;
  const wouldBe = starting * (1 + roi / 100);
  const diff = wouldBe - starting;

  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">Si hubieras copiado con $100</h2>
      <p className="text-xs text-text-muted mb-3">
        Cálculo simple: ROI × capital inicial. No incluye comisiones de Binance
        ni el 10% de profit share.
      </p>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold">
          ${wouldBe.toFixed(2)}
        </span>
        <span
          className={`text-sm font-medium ${
            diff >= 0 ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {diff >= 0 ? "+" : ""}${diff.toFixed(2)} ({roi.toFixed(2)}%)
        </span>
      </div>
      <p className="text-xs text-text-faint mt-2">Ventana: últimos 30 días.</p>
    </div>
  );
}
