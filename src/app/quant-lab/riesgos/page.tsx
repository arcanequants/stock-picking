import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riesgos de Copy Trading — Quant Lab",
  description:
    "Riesgos del copy trading de futuros: apalancamiento, discontinuidad, comisiones, outliers, regulación.",
};

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "Apalancamiento",
    body: "Los bots de futuros operan con apalancamiento — típicamente entre 5x y 20x. Un movimiento adverso del 5% puede liquidar una posición 20x. Una liquidación parcial o total en tu copia reduce tu capital directamente, y en el peor caso puedes perder el 100% del monto asignado al copy.",
  },
  {
    title: "Outliers y PnL agregado",
    body: "El 'PnL de copiers' que mostramos suma a todos los copiers activos. Es muy sensible: una sola cuenta grande que entra en mal momento puede mover el agregado decenas de miles. Por eso siempre mostramos también ROI porcentual — esa métrica no depende del tamaño de capital.",
  },
  {
    title: "Discontinuidad de estrategia",
    body: "El bot puede cambiar de estrategia sin previo aviso. El número de 365 días en Binance mezcla estrategias pasadas que ya no operan — por eso en Vectorial Data sólo mostramos la ventana correspondiente al bot actual. Nada garantiza que la estrategia de hoy siga operando mañana.",
  },
  {
    title: "Comisiones reales",
    body: "El lead trader cobra 10% de las ganancias realizadas (profit share). Además, pagas comisiones regulares de futuros a Binance por cada trade. Tu ROI neto siempre va a ser menor al ROI bruto que muestra el panel del lead.",
  },
  {
    title: "Regulación y jurisdicción",
    body: "Copy trading de futuros no está disponible para residentes de EE.UU. y otras jurisdicciones. Binance decide quién puede copiar — no Vectorial Data. Algunos países pueden requerir declaración fiscal de las ganancias. Consulta a un asesor local.",
  },
  {
    title: "No somos asesores",
    body: "Vectorial Data no custodia fondos, no ejecuta trades, y no da asesoría financiera personalizada. Sólo mostramos métricas públicas que Binance ya publica sobre el lead trader. La decisión de copiar es enteramente tuya.",
  },
];

export default function RisksPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-text-muted mb-6">
        <Link href="/quant-lab" className="hover:text-foreground">
          ← Quant Lab
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold mb-3">Riesgos del Copy Trading</h1>
      <p className="text-text-muted mb-8">
        Léelos antes de copiar cualquier bot. Si algo no te queda claro, mejor
        no copies.
      </p>

      <div className="space-y-5">
        {SECTIONS.map((s) => (
          <section key={s.title} className="border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-1">{s.title}</h2>
            <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 p-4 border border-amber-500/30 bg-amber-500/5 rounded-xl text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
        Rendimiento pasado no garantiza resultados futuros. El copy trading de
        futuros con apalancamiento puede resultar en pérdida total del capital.
      </div>
    </div>
  );
}
