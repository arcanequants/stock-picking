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

  // Average dividend yield of active positions
  const avgDivYield =
    activeStocks.length > 0
      ? activeStocks.reduce((sum, s) => sum + (s.dividend_yield || 0), 0) /
        activeStocks.length
      : 0;

  // Sample pick for preview (oldest active stock)
  const samplePick = activeStocks[0];

  return (
    <div className="space-y-24">
      {/* ── SECTION 1: HERO ── */}
      <section className="text-center pt-8 md:pt-16">
        <HeroMetrics avgDivYield={avgDivYield} />

        <h1 className="text-4xl md:text-6xl font-bold mt-6 tracking-tight">
          Genera ingresos por ser dueño de empresas.
        </h1>
        <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto mt-4">
          Cada vez que alguien compra un producto de tus empresas, tú ganas dinero.
          Se llaman dividendos. Nosotros elegimos las empresas por ti.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-text-faint">
          <span>{activeStocks.length} empresas</span>
          <span className="w-1 h-1 rounded-full bg-text-faint" />
          <span>{regions} regiones</span>
          <span className="w-1 h-1 rounded-full bg-text-faint" />
          <span>{avgDivYield.toFixed(1)}% dividend yield promedio</span>
        </div>

        <div className="mt-8">
          <Link
            href="/join"
            className="inline-block bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            Empieza por $1/mes
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
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M11 8v6M8 11h6" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Demasiado ruido</h3>
            <p className="text-sm text-text-muted">
              Miles de acciones, cientos de opiniones. No sabes cuál comprar.
            </p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Sin tiempo</h3>
            <p className="text-sm text-text-muted">
              Analizar una acción toma horas. Tú tienes trabajo, familia, vida.
            </p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-text" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
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
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">
              1
            </div>
            <h3 className="font-semibold mt-4 mb-2">Recibes un pick</h3>
            <p className="text-sm text-text-muted">
              Cada día te llega una empresa seleccionada directo a tu WhatsApp. Con research incluido.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">
              2
            </div>
            <h3 className="font-semibold mt-4 mb-2">Compras tu fracción</h3>
            <p className="text-sm text-text-muted">
              $3, $5, $50 — lo que puedas. Compras una fracción y ya eres dueño de esa empresa.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold mx-auto">
              3
            </div>
            <h3 className="font-semibold mt-4 mb-2">Cobras dividendos</h3>
            <p className="text-sm text-text-muted">
              Las empresas te pagan por ser dueño. Cada trimestre recibes dinero en tu cuenta. Automático.
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
            <p className="text-sm text-text-muted mt-1">Empresas en portafolio</p>
          </div>
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">{avgDivYield.toFixed(1)}%</p>
            <p className="text-sm text-text-muted mt-1">Dividend yield promedio</p>
          </div>
          <div className="border border-border rounded-xl p-5 text-center">
            <p className="text-3xl font-bold font-mono">{regions}</p>
            <p className="text-sm text-text-muted mt-1">Regiones del mundo</p>
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
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold">
                {samplePick.ticker}{" "}
                <span className="text-text-muted font-normal">
                  — {samplePick.name}
                </span>
              </h3>
              {(samplePick.dividend_yield ?? 0) > 0 && (
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {samplePick.dividend_yield}% div yield
                </span>
              )}
            </div>
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
                className="text-sm text-brand-text font-medium hover:text-brand-hover"
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
          Todo lo que necesitas para generar ingresos
        </h2>

        <div className="space-y-4">
          {[
            "Pick diario con research completo",
            "Empresas que pagan dividendos cada trimestre",
            "Grupo privado de WhatsApp",
            "Portfolio dashboard en tiempo real",
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
        <div className="border border-brand-border bg-brand-subtle rounded-2xl p-10 max-w-md mx-auto">
          <p className="text-sm text-brand-text font-medium uppercase tracking-wider mb-3">
            Membresía mensual
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold">$1</span>
            <span className="text-text-muted text-lg">/mes</span>
          </div>
          <p className="text-text-faint text-sm mt-2">Un peso al mes. Sin truco.</p>

          <Link
            href="/join"
            className="block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors text-center mt-6"
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
            q="¿Qué son los dividendos?"
            a="Son pagos que las empresas te hacen por ser accionista. Compras una fracción de Coca-Cola, y cada vez que alguien compra una Coca, una parte de esa ganancia llega a tu cuenta. Así de simple."
          />
          <FaqItem
            q="¿Cuánto necesito para empezar a invertir?"
            a="Con $3 por pick es suficiente. Compras una fracción de la acción y ya eres dueño. Lo importante es ser consistente."
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
            className="inline-block bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            Empieza por $1/mes
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
