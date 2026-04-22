import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía: Copy Trading en Binance — Quant Lab",
  description:
    "Cómo crear cuenta en Binance, completar KYC y copiar un bot de futuros paso a paso.",
};

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "1. Crear cuenta en Binance",
    body: "Regístrate con email y contraseña fuerte. Activa la verificación en dos pasos (2FA) con Google Authenticator o passkey. El SMS 2FA no cuenta como seguro.",
  },
  {
    title: "2. Completar KYC",
    body: "Binance pide identificación oficial y selfie. Sin KYC nivel intermedio no puedes acceder a Copy Trading de futuros. Este proceso puede tomar de minutos a 48 horas.",
  },
  {
    title: "3. Fondear la cuenta",
    body: "Deposita USDT (red BEP20 o TRC20 son las más baratas) o compra USDT directamente dentro de Binance con tarjeta. Mínimo para copiar: 10 USDT, pero para que el stop loss del bot tenga espacio lo razonable es 100 USDT+.",
  },
  {
    title: "4. Transferir a la wallet de Futuros",
    body: "Desde tu Spot Wallet → Transfer → selecciona 'USDⓈ-M Futures'. Copy trading de futuros sólo lee de esta wallet.",
  },
  {
    title: "5. Abrir el bot en Copy Trading",
    body: "Desde la página del bot en Vectorial Data pulsa 'Abrir en Binance Copy Trading'. Te redirige directo al perfil del lead trader.",
  },
  {
    title: "6. Configurar el copy",
    body: "Binance te pide elegir: monto a invertir, modo (ratio fijo o monto fijo por trade), y stop loss global. Lee las reglas que Binance muestra — ellos son los responsables de la ejecución.",
  },
  {
    title: "7. Monitorear",
    body: "Binance actualiza ROI y PnL cada ~10 minutos en tu panel. En Vectorial Data ves el performance público del lead trader cada 2 horas.",
  },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-text-muted mb-6">
        <Link href="/quant-lab" className="hover:text-foreground">
          ← Quant Lab
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold mb-3">
        Guía: Copy Trading de futuros en Binance
      </h1>
      <p className="text-text-muted mb-8">
        Paso a paso para crear cuenta, fondear y copiar un bot. Tiempo estimado: 30-60 min si tu KYC va fluido.
      </p>

      <ol className="space-y-5">
        {STEPS.map((s) => (
          <li key={s.title} className="border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-1">{s.title}</h2>
            <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 p-4 border border-border rounded-xl text-xs text-text-faint">
        Binance bloquea Copy Trading de futuros para usuarios en EE.UU. y
        algunas otras jurisdicciones. Si el sistema te rechaza, no es un error
        nuestro — son las reglas del exchange.
      </div>
    </div>
  );
}
