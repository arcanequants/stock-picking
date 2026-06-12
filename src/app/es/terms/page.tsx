import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio | Vectorial Data",
  description: "Términos de servicio de Vectorial Data, divulgación de renovación automática y avisos legales.",
};

export default function EsTermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
      <p className="text-sm text-text-faint mb-8">Última actualización: 12/06/2026</p>

      <div className="prose-research space-y-8">
        <p className="text-text-muted">
          Bienvenido a Vectorial Data. Al usar nuestro servicio, aceptas estos términos.
        </p>

        <section>
          <h2>1. El Servicio</h2>
          <p>
            Vectorial Data es un servicio de publicación que proporciona contenido educativo e
            informativo sobre acciones e inversiones. Publicamos selecciones de acciones ("picks")
            con análisis detallados. Esto NO es asesoría de inversión personalizada. Operamos
            bajo la exclusión de publicistas (Sección 202(a)(11)(D) de la Ley de Asesores de
            Inversión de EE.UU.), proporcionando información financiera impersonal y general.
          </p>
        </section>

        <section>
          <h2>2. Elegibilidad</h2>
          <p>
            Debes tener al menos 18 años para usar este servicio. El servicio no está disponible
            para residentes de países sujetos a sanciones de la OFAC, incluyendo Cuba, Irán,
            Corea del Norte, Siria y la región de Crimea.
          </p>
        </section>

        <section>
          <h2>3. Suscripción y Renovación Automática (Apple In-App Purchase)</h2>
          <p>
            Vectorial Data Premium está disponible como suscripción de renovación automática
            a través de Apple In-App Purchase.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Precio:</strong> USD $0.99 por mes.</li>
            <li>
              <strong>Renovación automática:</strong> Tu suscripción se renueva automáticamente
              cada mes a menos que la canceles al menos 24 horas antes del final del período
              de facturación actual.
            </li>
            <li>
              <strong>Cargo:</strong> Tu cuenta Apple ID será cobrada por la renovación dentro
              de las 24 horas anteriores al final del período vigente.
            </li>
            <li>
              <strong>Cómo cancelar:</strong> Gestiona o cancela tu suscripción en cualquier
              momento en la Configuración del Apple ID (Ajustes → [tu nombre] → Suscripciones)
              o en settings.apple.com.
            </li>
            <li>
              <strong>Sin reembolsos parciales:</strong> La cancelación entra en vigor al final
              del período de facturación actual. No se realizan reembolsos por períodos no
              utilizados.
            </li>
            <li>
              <strong>Suscripciones web</strong> son procesadas por Stripe y pueden cancelarse
              en cualquier momento sin contratos a largo plazo ni cargos por cancelación.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Limitación de Responsabilidad</h2>
          <p>
            Vectorial Data no es responsable de ninguna pérdida en inversiones. Todo el
            contenido se proporciona "tal cual" sin garantías de ningún tipo. Las decisiones
            de inversión son exclusivamente tuyas. El rendimiento pasado no garantiza resultados
            futuros.
          </p>
        </section>

        <section>
          <h2>5. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de investigación, materiales escritos y activos visuales son
            propiedad de Vectorial Data y están protegidos por derechos de autor. Puedes
            compartir enlaces a nuestro contenido, pero no puedes reproducir, distribuir ni
            revender nuestra investigación.
          </p>
        </section>

        <section>
          <h2>6. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de México. Cualquier disputa se resolverá
            mediante arbitraje. Este servicio no requiere registro ante la CNBV ya que es un
            servicio de publicación educativa, no asesoría de inversión personalizada.
          </p>
        </section>

        <section>
          <h2>7. Contacto</h2>
          <p>
            Para preguntas sobre estos términos:{" "}
            <a href="mailto:Hello@vectorialdata.com">Hello@vectorialdata.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
