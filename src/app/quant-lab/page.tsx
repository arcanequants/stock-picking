import Link from "next/link";
import type { Metadata } from "next";
import { getAllBots } from "@/lib/quant-lab";

export const metadata: Metadata = {
  title: "Quant Lab — Vectorial Data",
  description:
    "Laboratorio de bots sistemáticos. Mostramos el performance público de cada bot en tiempo real.",
};

export const revalidate = 600;

export default async function QuantLabPage() {
  const bots = await getAllBots();

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="text-sm text-text-muted mb-2">Vectorial Data →</p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-3">Quant Lab</h1>
        <p className="text-text-muted max-w-2xl">
          Laboratorio de bots sistemáticos. Experimentamos con estrategias
          cuantitativas en distintas clases de activos: acciones, metales y
          cripto. Cada bot se muestra con su performance público en tiempo real
          — sin promesas.
        </p>
      </header>

      {bots.length === 0 ? (
        <p className="text-text-muted">Próximamente.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bots.map((b) => (
            <Link
              key={b.slug}
              href={`/quant-lab/${b.slug}`}
              className="block border border-border rounded-2xl p-5 hover:border-foreground/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">{b.name}</h2>
                <span className="text-xs text-text-muted uppercase tracking-wider">
                  {b.asset_class.replace(/-/g, " ")}
                </span>
              </div>
              {b.description && (
                <p className="text-sm text-text-muted">{b.description}</p>
              )}
              <p className="text-xs text-text-faint mt-3">{b.exchange}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 p-4 border border-border rounded-xl text-xs text-text-faint">
        <p className="font-semibold mb-1 text-text-muted">Aviso</p>
        <p>
          Rendimiento pasado no garantiza resultados futuros. El copy trading de
          futuros con apalancamiento puede resultar en pérdida total del
          capital. Vectorial Data no ejecuta ni custodia fondos — la
          intermediación la realiza Binance.
        </p>
      </div>
    </div>
  );
}
