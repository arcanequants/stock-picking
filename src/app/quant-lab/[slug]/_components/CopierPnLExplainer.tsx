import type { QuantLabSnapshot } from "@/lib/quant-lab";

export default function CopierPnLExplainer({
  latest,
}: {
  latest: QuantLabSnapshot | null;
}) {
  const copierPnl = latest?.copier_pnl != null ? Number(latest.copier_pnl) : null;
  if (copierPnl == null) return null;
  const positive = copierPnl >= 0;

  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">PnL agregado de copiers (30 días)</h2>
      <p
        className={`text-2xl font-semibold ${
          positive ? "text-emerald-500" : "text-red-500"
        }`}
      >
        {positive ? "+" : ""}${Math.abs(copierPnl).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })} USDT
      </p>
      <p className="text-xs text-text-faint mt-2 leading-relaxed">
        Este número suma el PnL de todos los copiers activos. Es muy sensible al
        tamaño de cada copier: si una cuenta grande entra en un mal momento o
        decide desconectar con pérdida, mueve el agregado más que el ROI real
        del bot. Por eso siempre mostramos también el ROI porcentual.
      </p>
    </div>
  );
}
