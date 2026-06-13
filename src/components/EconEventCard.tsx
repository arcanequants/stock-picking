import {
  pickAnalysis,
  econDisclaimer,
  type EconLocale,
  type EconomicEvent,
} from "@/lib/economic-events";

const DIR_CLASS: Record<string, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-text-muted",
};
const DIR_ARROW: Record<string, string> = { up: "↑", down: "↓", neutral: "→" };

export type EconLabels = {
  intro: string;
  means: string;
  impact: string;
  markets: string;
  learning: string;
  actual: string;
  forecast: string;
  previous: string;
  archive: string;
  empty: string;
  forBots: string;
};

export const ECON_LABELS: Record<EconLocale, EconLabels> = {
  es: {
    intro: "El evento macro más importante del día, explicado simple.",
    means: "Qué significa",
    impact: "A qué le pega",
    markets: "Mercados afectados",
    learning: "Tu aprendizaje de hoy",
    actual: "Real",
    forecast: "Esperado",
    previous: "Anterior",
    archive: "Días anteriores",
    empty: "Aún no hay análisis publicado. Vuelve pronto.",
    forBots: "Para bots y agentes",
  },
  en: {
    intro: "The most important macro event of the day, explained simply.",
    means: "What it means",
    impact: "What it moves",
    markets: "Affected markets",
    learning: "Today's takeaway",
    actual: "Actual",
    forecast: "Forecast",
    previous: "Previous",
    archive: "Earlier days",
    empty: "No analysis published yet. Check back soon.",
    forBots: "For bots & agents",
  },
  pt: {
    intro: "O evento macro mais importante do dia, explicado de forma simples.",
    means: "O que significa",
    impact: "O que move",
    markets: "Mercados afetados",
    learning: "Seu aprendizado de hoje",
    actual: "Real",
    forecast: "Previsto",
    previous: "Anterior",
    archive: "Dias anteriores",
    empty: "Ainda não há análise publicada. Volte em breve.",
    forBots: "Para bots e agentes",
  },
  hi: {
    intro: "दिन की सबसे महत्वपूर्ण मैक्रो घटना, सरल भाषा में समझाई गई।",
    means: "इसका क्या मतलब है",
    impact: "यह किसे प्रभावित करता है",
    markets: "प्रभावित बाज़ार",
    learning: "आज की सीख",
    actual: "वास्तविक",
    forecast: "अनुमान",
    previous: "पिछला",
    archive: "पिछले दिन",
    empty: "अभी तक कोई विश्लेषण प्रकाशित नहीं हुआ। जल्द ही वापस आएं।",
    forBots: "बॉट्स और एजेंट्स के लिए",
  },
};

function FigureCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex-1 min-w-[80px]">
      <p className="text-xs text-text-faint uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold font-mono tabular-nums text-foreground">
        {value ?? "—"}
      </p>
    </div>
  );
}

export function EconEventCard({
  ev,
  locale,
  asH1 = true,
}: {
  ev: EconomicEvent;
  locale: EconLocale;
  asH1?: boolean;
}) {
  const a = pickAnalysis(ev, locale);
  const l = ECON_LABELS[locale];
  const Title = asH1 ? "h1" : "h2";
  return (
    <article className="border border-border rounded-2xl p-6 bg-background">
      <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
        <span className="px-2 py-0.5 rounded-full border border-border">
          {ev.country}
        </span>
        <span className="px-2 py-0.5 rounded-full border border-border capitalize">
          {ev.category}
        </span>
        <span>{ev.event_date}</span>
      </div>
      <Title className="text-2xl font-bold text-foreground mb-1">
        {ev.event_name}
      </Title>
      <p className="text-lg text-text-secondary mb-5">{a.headline}</p>

      <div className="flex gap-4 mb-6 border-y border-border py-4">
        <FigureCell label={l.actual} value={ev.actual} />
        <FigureCell label={l.forecast} value={ev.forecast} />
        <FigureCell label={l.previous} value={ev.previous} />
      </div>

      <section className="mb-5">
        <h3 className="text-xs uppercase tracking-wide text-text-faint mb-1">
          {l.means}
        </h3>
        <p className="text-foreground leading-relaxed">{a.what_it_means}</p>
      </section>

      <section className="mb-5">
        <h3 className="text-xs uppercase tracking-wide text-text-faint mb-1">
          {l.impact}
        </h3>
        <p className="text-foreground leading-relaxed">{a.market_impact}</p>
      </section>

      {ev.affected_markets.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs uppercase tracking-wide text-text-faint mb-2">
            {l.markets}
          </h3>
          <ul className="space-y-1">
            {ev.affected_markets.map((m, i) => (
              <li key={i} className="text-sm text-text-secondary">
                <span className="font-medium text-foreground">{m.market}</span>{" "}
                <span className={DIR_CLASS[m.direction]}>
                  {DIR_ARROW[m.direction]}
                </span>{" "}
                — {m.why}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl bg-brand/10 border border-brand/30 p-4">
        <h3 className="text-sm font-semibold text-brand mb-1">
          🎓 {l.learning}
        </h3>
        <p className="text-foreground leading-relaxed">{a.learning}</p>
      </section>

      <p className="text-xs text-text-faint mt-5">{econDisclaimer(locale)}</p>
    </article>
  );
}
