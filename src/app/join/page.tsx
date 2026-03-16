export default function JoinPage() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-4">Empieza a generar ingresos</h1>
        <p className="text-text-muted text-lg">
          Recibe picks diarios en tu WhatsApp. Empresas que te pagan dividendos
          por ser dueño. Research completo incluido.
        </p>
      </section>

      {/* Pricing Card */}
      <div className="border border-brand-border bg-brand-subtle rounded-2xl p-8 mx-auto max-w-md">
        <p className="text-sm text-brand-text font-medium uppercase tracking-wider mb-2">
          Membresía mensual
        </p>
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-5xl font-bold">$1</span>
          <span className="text-text-muted">/mes</span>
        </div>
        <p className="text-text-faint text-sm mb-6">Un peso al mes. Sin truco.</p>

        <ul className="text-left space-y-3 mb-8 text-sm">
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">&#10003;</span>
            Pick diario con research completo (7 por semana)
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">&#10003;</span>
            Empresas que pagan dividendos cada trimestre
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">&#10003;</span>
            Portfolio dashboard en tiempo real
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">&#10003;</span>
            Diversificación global (múltiples regiones)
          </li>
          <li className="flex items-start gap-2 text-text-secondary">
            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">&#10003;</span>
            Grupo privado de WhatsApp
          </li>
        </ul>

        <a
          href="#"
          className="block w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-semibold transition-colors text-center"
        >
          Empieza ahora
        </a>
        <p className="text-xs text-text-faint mt-3">Cancela cuando quieras. Sin compromiso.</p>
      </div>

      {/* FAQ */}
      <section className="text-left space-y-4 mt-12">
        <h2 className="text-xl font-bold text-center mb-6">Preguntas frecuentes</h2>
        <FaqItem
          q="¿Qué son los dividendos?"
          a="Son pagos que las empresas te hacen por ser accionista. Compras una fracción de una empresa, y cada trimestre recibes dinero en tu cuenta por las ganancias que generó."
        />
        <FaqItem
          q="¿Cuántos picks recibo por semana?"
          a="7 picks por semana: 2 el lunes, 2 el martes, 1 el miércoles, 1 el jueves, 1 el viernes. Alternamos entre empresas nuevas y recompras en ciclos de 5."
        />
        <FaqItem
          q="¿Qué tipo de empresas seleccionan?"
          a="Empresas que generan flujo de efectivo a través de dividendos Y tienen potencial de apreciación. Negocios de calidad con fundamentos sólidos en todos los sectores y regiones."
        />
        <FaqItem
          q="¿Es consejo financiero?"
          a="No. Esto es educacional e informativo. Siempre consulta con un asesor financiero antes de invertir."
        />
        <FaqItem
          q="¿Cómo recibo los picks?"
          a="Directo en tu WhatsApp. Recibes un resumen de cada pick con un link al research completo en nuestra página."
        />
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
