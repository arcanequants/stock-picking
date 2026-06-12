import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Vectorial Data",
  description: "Política de privacidad de Vectorial Data — qué datos recopilamos y cómo los usamos.",
};

export default function EsPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-text-faint mb-8">Última actualización: 12/06/2026</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">
          Tu privacidad nos importa. Esta política explica qué datos recopilamos y cómo
          los usamos.
        </p>

        <section>
          <h2>1. Datos que Recopilamos</h2>
          <p>
            Dirección de correo electrónico (para autenticación y comunicación), información
            de pago (procesada por Apple o Stripe — nunca almacenamos datos de tarjetas),
            número de teléfono (opcional, para entrega de picks por WhatsApp) y datos de
            uso (análisis de visitas).
          </p>
        </section>

        <section>
          <h2>2. Cómo Usamos tus Datos</h2>
          <p>
            Para proporcionar el servicio (picks, acceso al dashboard), comunicarnos sobre
            tu suscripción y mejorar el servicio mediante analíticas agregadas.
          </p>
        </section>

        <section>
          <h2>3. Terceros</h2>
          <p>
            Compartimos datos con: Apple (procesamiento de compras in-app), Stripe
            (procesamiento de pagos web), Supabase (base de datos y autenticación), Vercel
            (hosting) y WhatsApp/Meta (entrega opcional de mensajes). Cada proveedor tiene
            su propia política de privacidad.
          </p>
        </section>

        <section>
          <h2>4. Retención de Datos</h2>
          <p>
            Conservamos tus datos mientras tu suscripción esté activa. Si cancelas,
            eliminamos tus datos personales en un plazo de 30 días, excepto cuando
            la ley lo requiera.
          </p>
        </section>

        <section>
          <h2>5. Tus Derechos</h2>
          <p>
            Dependiendo de tu ubicación, puedes tener derecho a: acceder, corregir o
            eliminar tus datos personales (GDPR — UE), solicitar portabilidad de datos
            (LGPD — Brasil), optar por no participar en la venta de datos (CCPA —
            California) y solicitar la eliminación de datos (DPDP — India / LFPDPPP —
            México). Escríbenos a{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>{" "}
            para ejercer estos derechos.
          </p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            Usamos cookies esenciales para el funcionamiento del servicio (autenticación,
            preferencias de idioma). No usamos cookies de rastreo de terceros para
            publicidad.
          </p>
        </section>

        <section>
          <h2>7. Menores</h2>
          <p>
            Nuestro servicio no está destinado a personas menores de 18 años. No recopilamos
            datos de menores de forma consciente.
          </p>
        </section>

        <section>
          <h2>8. Contacto</h2>
          <p>
            Para preguntas de privacidad:{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
