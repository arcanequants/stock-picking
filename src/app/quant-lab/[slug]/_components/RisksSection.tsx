import Link from "next/link";

const RISKS: Array<{ title: string; body: string }> = [
  {
    title: "Apalancamiento.",
    body: "Esto opera con 10-20x. Un mal movimiento puede borrar toda tu copia. Empieza con dinero que puedas perder sin afectar tu mes.",
  },
  {
    title: "Slippage.",
    body: "Tu copia replica los trades con un pequeño retraso — el precio al que entras no es exactamente el del bot. La diferencia se nota más en mercados rápidos.",
  },
  {
    title: "Distorsión por tamaños.",
    body: "Cuando un copier muy grande entra o sale, el PnL agregado se mueve más que el ROI real del bot. Por eso siempre miramos el ROI porcentual primero.",
  },
  {
    title: "Discontinuidad.",
    body: "El bot puede pausarse, cambiar de estrategia o cerrarse sin previo aviso — esa es una decisión del lead trader, no nuestra. Por eso mandamos alertas.",
  },
  {
    title: "Comisiones.",
    body: "10% del profit va al lead trader, más las comisiones regulares de futuros de Binance. Si el bot pierde, no hay profit share — pero las comisiones de Binance siguen aplicando.",
  },
];

export default function RisksSection() {
  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">Lo que tienes que saber antes de copiar</h2>
      <p className="text-xs text-text-muted mb-4">
        No es una lista de letra chica. Es lo que de verdad te puede salir mal.
      </p>
      <ul className="text-sm space-y-3">
        {RISKS.map((r) => (
          <li key={r.title} className="flex gap-3">
            <span aria-hidden className="text-text-faint shrink-0 mt-0.5">·</span>
            <p className="text-text-secondary leading-relaxed">
              <span className="font-semibold text-foreground">{r.title}</span>{" "}
              {r.body}
            </p>
          </li>
        ))}
      </ul>
      <Link
        href="/quant-lab/riesgos"
        className="inline-block mt-4 text-xs underline text-text-muted hover:text-foreground"
      >
        Ver el desglose completo de riesgos →
      </Link>
    </div>
  );
}
