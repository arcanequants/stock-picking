import { stocks, transactions } from "@/data/stocks";
import Link from "next/link";
import HeroMetrics from "@/components/HeroMetrics";

export default function Home() {
  const activeStocks = stocks.filter((s) => s.status === "active");
  const regions = new Set(activeStocks.map((s) => s.region)).size;
  const tickers = activeStocks.map((s) => s.ticker);
  const firstDate = transactions.length > 0
    ? new Date(transactions[0].date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  // Sample pick for preview (oldest active stock)
  const samplePick = activeStocks[0];

  return (
    <div className="space-y-24">
      {/* ── SECTION 1: HERO ── */}
      <section className="text-center pt-8 md:pt-16">
        <HeroMetrics />

        <h1 className="text-4xl md:text-6xl font-bold mt-6 tracking-tight">
          Un pick de acciones al día.
        </h1>
        <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto mt-4">
          Seleccionamos una acción cada día. Tú compras $3 o $50 — lo que puedas.
          Tu portafolio crece.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-text-faint">
          <span>{activeStocks.length} posiciones</span>
          <span className="w-1 h-1 rounded-full bg-text-faint" />
          <span>{regions} regiones</span>
          <span className="w-1 h-1 rounded-full bg-text-faint" />
          <span>Desde {firstDate}</span>
        </div>

        <div className="mt-8">
          <Link
            href="/join"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            Empieza por $1.99/mes
          </Link>
        </div>

        <p className="text-xs text-text-faint mt-4">
          7 picks por semana · Research completo · Directo a tu WhatsApp
        </p>
      </section>

      {/* ── SECTION 2: PROBLEMA ── */}
      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold">
          Sabes que deberías invertir.{" "}
          <span className="text-text-muted">Pero no sabes por dónde empezar.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
          <div className="border border-border rounded-xl p-5">
            <div className="text-2xl mb-3">?</div>
            <h3 className="font-semibold mb-1">Demasiado ruido</h3>
            <p className="text-sm text-text-muted">
              Miles de acciones, cientos de opiniones. No sabes cuál comprar.
            </p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="text-2xl mb-3">&#9203;</div>
            <h3 className="font-semibold mb-1">Sin tiempo</h3>
            <p className="text-sm text-text-muted">
              Analizar una acción toma horas. Tú tienes trabajo, familia, vida.
            </p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="text-2xl mb-3">&#9888;&#65039;</div>
            <h3 className="font-semibold mb-1">Miedo a perder</h3>
            <p className="text-sm text-text-muted">
              Sin guía, invertir se siente como apostar. No debería ser así.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: SOLUCION (Como funciona) ── */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Así de simple funciona
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
              1
            </div>
            <h3 className="font-semibold mt-4 mb-2">Recibes un pick</h3>
            <p className="text-sm text-text-muted">
              Cada día te llega una acción seleccionada directo a tu WhatsApp. Con research incluido.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
              2
            </div>
            <h3 className="font-semibold mt-4 mb-2">Compras tu fracción</h3>
            <p className="text-sm text-text-muted">
              $3, $5, $10 — lo que puedas sostener cada mes. Siempre la misma cantidad.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
              3
            </div>
            <h3 className="font-semibold mt-4 mb-2">Tu portafolio crece</h3>
            <p className="text-sm text-text-muted">
              Dividendos que te pagan por ser dueño + apreciación del precio. Automático.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: TRACK RECORD ── */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Resultados reales, no promesas
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono">{activeStocks.length}</p>
            <p className="text-sm text-text-muted mt-1">Posiciones activas</p>
          </div>
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono">{regions}</p>
            <p className="text-sm text-text-muted mt-1">Regiones del mundo</p>
          </div>
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono">7</p>
            <p className="text-sm text-text-muted mt-1">Picks por semana</p>
          </div>
        </div>

        {/* Ticker badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tickers.map((ticker) => (
            <span
              key={ticker}
              className="text-xs font-mono px-3 py-1.5 rounded-full bg-tag-bg text-text-muted border border-border"
            >
              {ticker}
            </span>
          ))}
        </div>

        {/* Sample pick preview */}
        {samplePick && (
          <div className="border border-border rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-xs text-text-faint uppercase tracking-wider mb-3">
              Ejemplo de pick
            </p>
            <h3 className="text-lg font-bold">
              {samplePick.ticker}{" "}
              <span className="text-text-muted font-normal">
                — {samplePick.name}
              </span>
            </h3>
            <p className="text-sm text-text-secondary mt-2">
              {samplePick.summary_short}
            </p>
            <p className="text-sm text-text-muted mt-3">
              {samplePick.summary_what}
            </p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-faint">
                Research completo disponible para miembros
              </p>
              <Link
                href="/join"
                className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-500 dark:hover:text-blue-300"
              >
                Ver más →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 5: QUE INCLUYE ── */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Todo lo que necesitas para invertir
        </h2>

        <div className="space-y-4">
          {[
            "Pick diario con research completo",
            "Grupo privado de WhatsApp",
            "Portfolio dashboard en tiempo real",
            "Acciones de dividendos + crecimiento",
            `Diversificación global (${regions} regiones)`,
            "Historial de todas las transacciones",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">&#10003;</span>
              <span className="text-text-secondary">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: PRICING ── */}
      <section className="text-center">
        <div className="border border-blue-500/30 bg-blue-500/5 rounded-2xl p-10 max-w-md mx-auto">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider mb-3">
            Membresía mensual
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold">$1.99</span>
            <span className="text-text-muted text-lg">/mes</span>
          </div>
          <p className="text-text-faint text-sm mt-2">Menos que un café</p>

          <Link
            href="/join"
            className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors text-center mt-6"
          >
            Empieza ahora
          </Link>

          <p className="text-xs text-text-faint mt-3">
            Cancela cuando quieras. Sin compromiso.
          </p>
        </div>
      </section>

      {/* ── SECTION 7: FAQ ── */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Preguntas frecuentes
        </h2>

        <div className="space-y-4">
          <FaqItem
            q="¿Cuánto necesito para empezar a invertir?"
            a="Con $3 por pick es suficiente. Lo importante no es cuánto, sino que sea consistente cada mes. $90/mes = $3 por pick. $300/mes = $10 por pick."
          />
          <FaqItem
            q="¿Es consejo financiero?"
            a="No. Esto es educacional e informativo. Siempre consulta con un asesor financiero antes de invertir."
          />
          <FaqItem
            q="¿Cómo recibo los picks?"
            a="Directo en tu WhatsApp, cada día de lunes a viernes. Incluye el ticker, un resumen, y un link al research completo."
          />
          <FaqItem
            q="¿Puedo cancelar?"
            a="Sí, en cualquier momento. Sin penalización, sin preguntas."
          />
        </div>
      </section>

      {/* ── SECTION 8: CTA FINAL ── */}
      <section className="text-center pb-8">
        <h2 className="text-2xl md:text-3xl font-bold">
          Tu próximo pick sale mañana.
        </h2>
        <p className="text-text-muted text-lg mt-2">
          ¿Vas a estar ahí?
        </p>

        <div className="mt-6">
          <Link
            href="/join"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            Empieza por $1.99/mes
          </Link>
        </div>

        <p className="text-xs text-text-faint mt-8">
          Vectorial Data — Stock Picking Portfolio. Not financial advice.
        </p>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-1">{q}</h3>
      <p className="text-sm text-text-muted">{a}</p>
    </div>
  );
}
