import Link from "next/link";

export default function HowToCopy({
  leadDetailsUrl,
  referralUrl,
}: {
  leadDetailsUrl: string;
  referralUrl: string | null;
}) {
  return (
    <div className="border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">¿Cómo lo copio?</h2>
      <p className="text-xs text-text-muted mb-5">
        Tres caminos según dónde estés. Binance se encarga del KYC, las reglas
        de tu país y la ejecución — nosotros sólo te llevamos a la página
        correcta.
      </p>

      <div className="space-y-5 text-sm">
        <Door
          step="1"
          title="Ya hago copy trading en Binance"
          body="Toca el botón y empieza la copia desde tu cuenta."
          cta={
            <a
              href={leadDetailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Abrir en Binance Copy Trading →
            </a>
          }
        />

        <Door
          step="2"
          title="Tengo Binance pero nunca he copiado"
          body={
            <>
              <ol className="list-decimal pl-4 space-y-1 text-text-secondary">
                <li>
                  Entra a Binance → menú <em>Trading</em> → <em>Copy Trading</em> → <em>Futures</em>.
                </li>
                <li>Activa el módulo si es la primera vez (firma rápida, sin KYC extra).</li>
                <li>Toca <em>Abrir en Binance Copy Trading</em> aquí abajo y elige tu monto.</li>
              </ol>
              <a
                href={leadDetailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 border border-border px-3 py-1.5 rounded-lg text-xs hover:border-foreground/40"
              >
                Abrir en Binance Copy Trading →
              </a>
            </>
          }
        />

        <Door
          step="3"
          title="Todavía no tengo cuenta de Binance"
          body={
            <div className="flex flex-wrap gap-2 text-xs">
              {referralUrl && (
                <a
                  href={referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border px-3 py-1.5 rounded-lg hover:border-foreground/40"
                >
                  Crear cuenta con nuestro referral
                </a>
              )}
              <Link
                href="/quant-lab/guia-copy-trading-binance"
                className="border border-border px-3 py-1.5 rounded-lg hover:border-foreground/40"
              >
                Guía paso a paso
              </Link>
            </div>
          }
        />
      </div>

      <p className="text-xs text-text-faint mt-5 leading-relaxed">
        El copy trading de futuros puede no estar disponible en tu país. Si
        Binance te bloquea el módulo, no podrás copiar — esto está fuera de
        nuestro control.
      </p>
    </div>
  );
}

function Door({
  step,
  title,
  body,
  cta,
}: {
  step: string;
  title: string;
  body: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-semibold text-text-muted">
        {step}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium mb-1">{title}</p>
        <div className="text-text-muted">{body}</div>
        {cta && <div className="mt-2">{cta}</div>}
      </div>
    </div>
  );
}
