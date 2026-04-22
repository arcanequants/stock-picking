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
      <h2 className="font-semibold mb-3">¿Cómo copio este bot?</h2>
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium mb-1">Ya tengo cuenta de Binance</p>
          <a
            href={leadDetailsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Abrir en Binance Copy Trading →
          </a>
          <p className="text-xs text-text-faint mt-2">
            Binance se encarga del KYC, reglas regionales y la ejecución. El
            copy trading puede no estar disponible en tu país.
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="font-medium mb-1">No tengo cuenta de Binance</p>
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
        </div>
      </div>
    </div>
  );
}
