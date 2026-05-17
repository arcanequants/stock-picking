export const SIGNALS_TERMS_LAST_UPDATED = "2026-05-17";

export type SignalsTermsLocale = "es" | "en";

export type SignalsTermsSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SignalsTermsContent = {
  title: string;
  intro: string;
  lastUpdatedLabel: string;
  sections: SignalsTermsSection[];
};

const ES: SignalsTermsContent = {
  title: "Términos de Uso — Vectorial Signals",
  intro:
    "Estos términos rigen el uso de Vectorial Signals, un servicio de Vectorial Data que publica inteligencia descriptiva de mercado derivada de fuentes públicas de datos alternativos (imágenes satelitales, datasets gubernamentales, observaciones atmosféricas y marítimas). Vectorial Signals se entrega vía web (vectorialdata.com/signals), feeds RSS/JSON, API JSON y email digests. Estos términos aplican a todos los consumidores de Vectorial Signals — humanos, organizaciones, agentes automatizados y sistemas de IA.",
  lastUpdatedLabel: "Última actualización",
  sections: [
    {
      heading: "1. Alcance",
      paragraphs: [
        "Estos términos rigen el uso de Vectorial Signals. Aplican a todos los consumidores: personas físicas, organizaciones, agentes automatizados y sistemas de IA. Al acceder o utilizar Vectorial Signals aceptas estos términos.",
      ],
    },
    {
      heading: "2. Vectorial Signals NO es asesoría de inversión",
      paragraphs: [
        "Vectorial Signals proporciona únicamente inteligencia descriptiva de mercado. NO realizamos lo siguiente:",
      ],
      bullets: [
        "Recomendar compra o venta de valores, derivados, commodities o cualquier activo.",
        "Administrar dinero ni mantener custodia de activos.",
        "Personalizar contenido a tu situación financiera, portafolio o tolerancia al riesgo.",
        "Proporcionar pronósticos de desempeño futuro de mercado.",
      ],
    },
    {
      heading: "3. Otorgamiento de licencia (permisiva)",
      paragraphs: [
        "Sujeto a tu suscripción o pago por uso al corriente, Vectorial Data te otorga una licencia mundial, no exclusiva para:",
      ],
      bullets: [
        "Acceder y leer los datos de Vectorial Signals.",
        "Usar Vectorial Signals para cualquier propósito lícito, incluyendo: investigación interna y toma de decisiones; incorporación en productos derivados, modelos y reportes; redistribución a tus propios clientes o usuarios finales; entrenamiento de modelos de machine learning, IA o estadísticos.",
        "Cachear, almacenar y procesar los datos según lo necesario para tu caso de uso.",
      ],
    },
    {
      heading: "4. Requisito de atribución",
      paragraphs: [
        'Cuando los datos de Vectorial Signals se muestren, redistribuyan o usen para producir outputs derivados visibles a terceros, debes incluir: "Signal data sourced from Vectorial Signals (vectorialdata.com/signals). Methodology and Information Coefficient at vectorialdata.com/signals/methodology."',
        "Este requisito es no negociable y refleja las condiciones de atribución de nuestras fuentes upstream (Copernicus EU Reg 1159/2013, NASA Earthdata, Kystverket NLOD 2.0, USDA NASS, U.S. EIA, NOAA MarineCadastre).",
      ],
    },
    {
      heading: '5. Sin garantía, sin promesa',
      paragraphs: [
        'Vectorial Signals se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo, expresas o implícitas. No garantizamos precisión, integridad, oportunidad, idoneidad para un propósito particular ni no infracción. Las fuentes de datos pueden contener errores, retrasos o vacíos; los resultados de backtest pueden no reflejar el desempeño futuro; las señales pueden decaer o ser descomisionadas en cualquier momento.',
      ],
    },
    {
      heading: "6. Limitación de responsabilidad",
      paragraphs: [
        "Hasta el máximo permitido por la ley, la responsabilidad total de Vectorial Data hacia ti por cualquier reclamo relacionado con Vectorial Signals no excederá el mayor de (a) el monto pagado a nosotros en los 12 meses previos al reclamo, o (b) USD $100. No somos responsables de daños indirectos, incidentales, consecuentes, especiales o punitivos — incluidos lucro cesante, pérdida de datos o pérdidas de trading.",
      ],
    },
    {
      heading: "7. Indemnización",
      paragraphs: [
        "Aceptas indemnizar y mantener a Vectorial Data libre de daños frente a cualquier reclamo de terceros que surja de (a) tu uso de Vectorial Signals, (b) tu redistribución de los datos, (c) cualquier decisión, recomendación u output que produzcas usando Vectorial Signals — incluyendo outputs de modelos de IA, o (d) tu incumplimiento de estos términos.",
      ],
    },
    {
      heading: "8. Reconocimiento de fuentes de datos",
      paragraphs: ["Vectorial Signals incorpora datos de:"],
      bullets: [
        'Copernicus Sentinel (EU Reg 1159/2013) — "Contains modified Copernicus Sentinel data".',
        "NASA Earthdata — Dominio público, atribución solicitada.",
        "U.S. EIA, USDA NASS, U.S. BLS — Gobierno federal de EE.UU., dominio público.",
        "NOAA MarineCadastre (datos AIS) — CC0 Dominio Público.",
        "Kystverket (AIS noruego) — Licencia Noruega de Datos Gubernamentales Abiertos (NLOD) 2.0.",
        "Cumplimos con todas las obligaciones de licencia upstream.",
      ],
    },
    {
      heading: "9. Conducta prohibida",
      paragraphs: ["No puedes:"],
      bullets: [
        "Tergiversar Vectorial Signals como asesoría de inversión o como recomendación nuestra de compra/venta.",
        "Remover, ocultar u ofuscar la atribución requerida en la Sección 4.",
        "Usar Vectorial Signals para facilitar manipulación de mercado, insider trading u otra actividad ilegal.",
        "Realizar ingeniería inversa de nuestro servicio para extraer datos de pago sin pagar (eludir el paywall).",
      ],
    },
    {
      heading: "10. Vigencia, suspensión, terminación",
      paragraphs: [
        "Podemos suspender o terminar tu acceso por incumplimiento, falta de pago o cuando lo requiera la ley. Puedes dejar de usar Vectorial Signals en cualquier momento. Las Secciones 2, 5, 6, 7 y 9 sobreviven a la terminación.",
      ],
    },
    {
      heading: "11. Cambios",
      paragraphs: [
        'Podemos actualizar estos términos. Los cambios materiales se anunciarán en la parte superior de esta página con una nueva fecha de "Última actualización". El uso continuado tras los cambios constituye aceptación.',
      ],
    },
    {
      heading: "12. Ley aplicable",
      paragraphs: [
        "Estos términos se rigen por las leyes de México, sin atender a principios de conflicto de leyes. Las disputas se resolverán en los tribunales competentes de la Ciudad de México.",
      ],
    },
    {
      heading: "13. Contacto",
      paragraphs: ["Preguntas: hello@vectorialdata.com"],
    },
  ],
};

const EN: SignalsTermsContent = {
  title: "Vectorial Signals — Terms of Use",
  intro:
    "These terms govern your use of Vectorial Signals, a service of Vectorial Data that publishes descriptive market intelligence derived from public alt-data sources (satellite imagery, government datasets, atmospheric and maritime observations). Vectorial Signals is delivered via the web (vectorialdata.com/signals), RSS/JSON feeds, JSON API, and email digests. These terms apply to all consumers of Vectorial Signals — humans, organizations, automated agents, and AI systems.",
  lastUpdatedLabel: "Last updated",
  sections: [
    {
      heading: "1. Scope",
      paragraphs: [
        "These terms govern your use of Vectorial Signals. They apply to all consumers: individuals, organizations, automated agents, and AI systems. By accessing or using Vectorial Signals you accept these terms.",
      ],
    },
    {
      heading: "2. Vectorial Signals is NOT investment advice",
      paragraphs: [
        "Vectorial Signals provides descriptive market intelligence only. We do not:",
      ],
      bullets: [
        "Recommend buying or selling any security, derivative, commodity, or asset.",
        "Manage money or hold custody of assets.",
        "Tailor content to your individual financial situation, portfolio, or risk tolerance.",
        "Provide forecasts of future market performance.",
      ],
    },
    {
      heading: "3. License grant (permissive)",
      paragraphs: [
        "Subject to your subscription or pay-per-use payment in good standing, Vectorial Data grants you a worldwide, non-exclusive license to:",
      ],
      bullets: [
        "Access and read Vectorial Signals data.",
        "Use Vectorial Signals for any lawful purpose, including: internal research and decision-making; incorporation into derivative products, models, and reports; redistribution to your own customers or end-users; training of machine learning, AI, or statistical models.",
        "Cache, store, and process Vectorial Signals data as needed for your use case.",
      ],
    },
    {
      heading: "4. Attribution requirement",
      paragraphs: [
        'Whenever Vectorial Signals data is displayed, redistributed, or used to produce derivative outputs visible to third parties, you must include: "Signal data sourced from Vectorial Signals (vectorialdata.com/signals). Methodology and Information Coefficient at vectorialdata.com/signals/methodology."',
        "This requirement is non-negotiable and reflects the attribution conditions of our upstream sources (Copernicus EU Regulation 1159/2013, NASA Earthdata, Kystverket NLOD 2.0, USDA NASS, U.S. EIA, NOAA MarineCadastre).",
      ],
    },
    {
      heading: "5. No warranty, no guarantee",
      paragraphs: [
        'Vectorial Signals is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied. We do not warrant accuracy, completeness, timeliness, fitness for a particular purpose, or non-infringement. Data sources may contain errors, delays, or gaps; backtest results may not reflect future signal performance; signals may decay or be decommissioned at any time.',
      ],
    },
    {
      heading: "6. Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, Vectorial Data's total liability to you for any claim arising out of or relating to Vectorial Signals shall not exceed the greater of (a) the amount you paid us in the 12 months preceding the claim, or (b) USD $100. We are not liable for indirect, incidental, consequential, special, or punitive damages — including lost profits, lost data, or trading losses.",
      ],
    },
    {
      heading: "7. Indemnification",
      paragraphs: [
        "You agree to indemnify and hold Vectorial Data harmless from any third-party claim arising from (a) your use of Vectorial Signals, (b) your redistribution of Vectorial Signals data, (c) any decision, recommendation, or output you produce using Vectorial Signals, including AI model outputs, or (d) your violation of these terms.",
      ],
    },
    {
      heading: "8. Source data acknowledgments",
      paragraphs: ["Vectorial Signals incorporates data from:"],
      bullets: [
        'Copernicus Sentinel (EU Regulation 1159/2013) — "Contains modified Copernicus Sentinel data".',
        "NASA Earthdata — Public domain, attribution requested.",
        "U.S. EIA, USDA NASS, U.S. BLS — U.S. federal government, public domain.",
        "NOAA MarineCadastre (AIS data) — CC0 Public Domain.",
        "Kystverket (Norwegian AIS) — Norwegian Licence for Open Government Data (NLOD) 2.0.",
        "We comply with all upstream license obligations.",
      ],
    },
    {
      heading: "9. Prohibited conduct",
      paragraphs: ["You may not:"],
      bullets: [
        "Misrepresent Vectorial Signals as investment advice or as our recommendation to buy/sell.",
        "Strip, hide, or obfuscate the attribution required by Section 4.",
        "Use Vectorial Signals to facilitate market manipulation, insider trading, or other illegal activity.",
        "Reverse engineer our service to extract paid data without payment (circumvent the paywall).",
      ],
    },
    {
      heading: "10. Term, suspension, termination",
      paragraphs: [
        "We may suspend or terminate your access for breach of these terms, non-payment, or where required by law. You may stop using Vectorial Signals at any time. Sections 2, 5, 6, 7, and 9 survive termination.",
      ],
    },
    {
      heading: "11. Changes",
      paragraphs: [
        'We may update these terms. Material changes will be announced at the top of this page with a new "Last updated" date. Continued use after changes constitutes acceptance.',
      ],
    },
    {
      heading: "12. Governing law",
      paragraphs: [
        "These terms are governed by the laws of Mexico, without regard to conflict-of-law principles. Disputes shall be resolved in the competent courts of Mexico City.",
      ],
    },
    {
      heading: "13. Contact",
      paragraphs: ["Questions: hello@vectorialdata.com"],
    },
  ],
};

export function getSignalsTerms(locale: string): SignalsTermsContent {
  if (locale === "es") return ES;
  return EN;
}
