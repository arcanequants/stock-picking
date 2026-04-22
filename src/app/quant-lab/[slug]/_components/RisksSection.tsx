import Link from "next/link";

const RISKS = [
  "Apalancamiento: una estrategia con 10-20x puede perder el capital completo en un solo movimiento.",
  "Slippage de entrada: tu copia replica los trades con delay — el precio al que entras puede diferir.",
  "Outliers: un copier grande que entra o sale en mal momento distorsiona el PnL agregado.",
  "Discontinuidad: el bot puede cambiar de estrategia, pausarse o cerrarse sin previo aviso.",
  "Comisiones: 10% del profit va al lead trader, más las comisiones regulares de futuros de Binance.",
];

export default function RisksSection() {
  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-3">Riesgos que debes conocer</h2>
      <ul className="text-sm text-text-muted space-y-2">
        {RISKS.map((r) => (
          <li key={r} className="flex gap-2">
            <span className="text-text-faint">·</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/quant-lab/riesgos"
        className="inline-block mt-3 text-xs underline text-text-muted hover:text-foreground"
      >
        Ver página completa de riesgos →
      </Link>
    </div>
  );
}
