import { Stock } from "@/lib/types";

// WhatsApp tip rotation — (pickNumber - 1) % tips.length
// Each tip is a function that receives the stock context for personalization
// Usage: tips[index]({ name, ticker, dividend_yield, price, sector, country })
interface TipContext {
  name: string;
  ticker: string;
  dividend_yield: number;
  price: number;
  sector: string;
  country: string;
}

export const tips: ((ctx: TipContext) => string)[] = [
  // 💰 Budget & consistency
  (ctx) => `Con $3 compras una fracción de ${ctx.name}. Con $50 también. Lo que importa no es cuánto, es que lo hagas SIEMPRE.`,
  () => `Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.`,
  () => `Tu presupuesto mensual ÷ 30 = lo que compras de cada pick. Siempre igual. Así de simple.`,
  () => `¿Cuánto invertir? Lo que puedas mantener CADA MES. $90/mes = $3 por pick. $300/mes = $10 por pick.`,
  // 🏢 Ownership mindset
  (ctx) => `Acabas de comprar un pedacito de ${ctx.name}. Ahora eres dueño. Cada vez que generan dinero, una parte es tuya.`,
  (ctx) => `${ctx.name} tiene oficinas, empleados, y clientes pagando cada día. Tú solo tuviste que comprar una fracción para ser parte de eso.`,
  (ctx) => `Si alguien te dijera que por $3 puedes ser dueño de ${ctx.name}, ¿dirías que no? Eso es exactamente lo que acabas de hacer.`,
  (ctx) => `No compraste un ticker. Compraste un pedacito de un negocio real en ${ctx.country} que genera dinero mientras duermes.`,
  // ⏳ Patience & long term
  () => `Warren Buffett hizo el 99% de su fortuna después de los 50 años. La paciencia no es una virtud — es la estrategia.`,
  () => `El mejor momento para invertir fue hace 10 años. El segundo mejor momento es hoy. Ya lo estás haciendo.`,
  () => `Nadie se hizo rico comprando y vendiendo. Se hicieron ricos comprando y ESPERANDO.`,
  () => `Tu yo de 60 años te va a agradecer lo que estás haciendo hoy. Cada fracción cuenta.`,
  // 📈 Compounding & dividends
  (ctx) => `${ctx.name} paga ${ctx.dividend_yield}% anual de dividendo. Eso es dinero que llega a tu cuenta sin que hagas nada. Automático.`,
  (ctx) => `Con ${ctx.dividend_yield}% de dividendo, ${ctx.ticker} duplica tu inversión solo en dividendos en ~${Math.round(72 / ctx.dividend_yield)} años. Sin que suba de precio.`,
  (ctx) => `El dividendo de ${ctx.ticker} se reinvierte → compra más fracciones → genera más dividendo → compra más fracciones. Eso es interés compuesto.`,
  () => `El S&P 500 ha dado ~10% anual durante 100 años. Pero solo si NO vendiste en los días malos.`,
  // 😤 Behavior & psychology
  (ctx) => `No revises ${ctx.ticker} todos los días. ${ctx.name} no cambia de valor en 24 horas — tu ansiedad sí.`,
  () => `El mercado ha caído 50%+ varias veces en la historia. Y SIEMPRE se recuperó. Los que vendieron en pánico perdieron. Los que mantuvieron ganaron.`,
  () => `Los ricos no invierten cuando les sobra. Invierten PRIMERO y viven con lo que queda.`,
  (ctx) => `Si ${ctx.ticker} baja mañana, no pasa nada. Tú no compraste para mañana. Compraste para dentro de 5, 10, 20 años.`,
  // 🔄 Perspective shifts
  () => `Un café diario = $150/mes. $5 por pick = portafolio de 30 empresas pagándote dividendos. Misma plata, diferente futuro.`,
  () => `Invertir no es un evento. Es un hábito. Como ir al gym — los resultados llegan con el tiempo, no con la intensidad.`,
  (ctx) => `Miles de personas en ${ctx.country} trabajan para ${ctx.name} hoy. Generan ingresos, pagan dividendos, y tú eres dueño. Así funciona.`,
  () => `La diferencia entre alguien que invierte y alguien que no, no es el dinero. Es la decisión de empezar.`,
];

// Hardcoded data - will migrate to Supabase once connected
export const stocks: Stock[] = [
  {
    id: 1,
    ticker: "UBS",
    name: "UBS Group AG",
    sector: "Financials",
    industry: "Wealth Management / Investment Banking",
    country: "Switzerland",
    region: "Europe",
    currency: "USD",
    price: 39.76,
    pe_ratio: 18.41,
    pe_forward: 15.62,
    dividend_yield: 1.3,
    market_cap_b: 130.0,
    eps: 2.26,
    summary_short:
      "El banco más grande de Suiza y el wealth manager #1 del mundo. Acaban de absorber Credit Suisse, lo que los convierte en un gigante con $7 trillones en activos.",
    summary_what:
      "UBS maneja el dinero de los millonarios y empresas más grandes del mundo. Son el #1 global en wealth management (gestión de fortunas). También hacen banca de inversión, trading, y banca personal en Suiza. Compraron a su rival Credit Suisse en 2023 y están terminando de integrarlos.",
    summary_why:
      "La integración de Credit Suisse está generando $11B+ en ahorros. Profit subió 53% en 2025. Van a recomprar $3B en acciones en 2026 y subir dividendo +15%. Tienen $7T en activos — son un monstruo financiero.",
    summary_risk:
      "Regulación bancaria suiza puede endurecerse. Q4 2025 EPS no alcanzó estimados. Todavía faltan $2B en gastos de integración para 2026.",
    research_full: `# UBS Group AG (UBS) — Research Completo

## Precio: $41.53 | P/E: 18.4 | P/E Forward: 15.6 | Div Yield: 1.3% | Market Cap: $130B

---

## ¿Qué es UBS?

UBS Group AG es el **banco más grande de Suiza** y el **wealth manager #1 del mundo**. Tras la adquisición de Credit Suisse en 2023, se convirtieron en un gigante financiero con más de **$7 trillones en activos bajo gestión**.

## Segmentos de Negocio

| Segmento | Descripción | % Revenue aprox |
|----------|-------------|-----------------|
| **Global Wealth Management** | Gestión de fortunas para personas de alto patrimonio | ~55% |
| **Investment Bank** | Trading, advisory, mercados de capitales | ~25% |
| **Personal & Corporate Banking** | Banca tradicional en Suiza | ~12% |
| **Asset Management** | Fondos de inversión institucionales | ~8% |

## Resultados 2025 (Full Year)

- **Net Profit: $7.8B** (+53% YoY)
- **Revenue: $47B** (+10% crecimiento)
- **Activos totales bajo gestión: $7T+** (primera vez superan esta cifra)
- **Cost/Income ratio: 75%** — mejorando
- **Return on CET1 Capital: 11.9%**

### Por Segmento (Q3 2025):
- **Wealth Management:** Pre-tax profit $1.8B (+21% YoY)
- **Investment Bank:** Pre-tax profit $787M (+100% YoY, se duplicó)
- **Asset Management:** Pre-tax profit $282M (+19% YoY)
- **Personal Banking:** Pre-tax profit CHF 668M (+1%)

## Integración Credit Suisse — El Game Changer

- **$11B en ahorros** logrados hasta ahora (de un objetivo de $13B para fin 2026)
- **77% de las sinergias** ya capturadas
- **85% de las cuentas suizas** ya migradas a sistemas UBS
- **Falta:** Migrar últimas 100,000 cuentas en marzo 2026, cerrar data centers de CS → generará "un par de miles de millones más" en sinergias
- **Gastos pendientes:** ~$2B adicionales de gastos de integración en 2026

## Capital Return — Muy Agresivo

- **Dividendo 2025:** $1.10/acción (+22% YoY)
- **Dividendo 2026:** Se espera incremento de +15% (mid-teens)
- **Recompra de acciones 2026:** $3B planeados
- **Total return al accionista:** ~$6B+ entre dividendos y recompras

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **BUY** |
| # Analistas Buy | 25 |
| # Analistas Hold | 3 |
| # Analistas Sell | 3 |
| Price Target Promedio | **$49.43** |
| Price Target Alto | $72.70 |
| Price Target Bajo | $38.14 |
| **Upside al Target** | **+19%** |

## ¿Por Qué Nos Gusta?

1. **Wealth Management #1 mundial** — negocio de altísimos márgenes con activos "sticky" (los ricos no mueven su dinero frecuentemente)
2. **Credit Suisse synergies** — $11B ya logrados, más por venir. Esto es profit puro
3. **$7T en activos** — escala masiva que genera fee income recurrente
4. **Capital return agresivo** — $3B en buybacks + dividendo creciente 15%+
5. **P/E forward de 15.6x** — barato para un wealth manager global dominante
6. **Investment Bank duplicó profit** — momentum fuerte

## Riesgos

1. **Regulación suiza** — podrían exigir más capital tras el caso Credit Suisse
2. **Q4 2025 EPS miss** — el precio cayó post-earnings, riesgo de más caídas corto plazo
3. **$2B en gastos de integración pendientes** — pesarán en earnings 2026
4. **Exposición a mercados globales** — si hay recesión, wealth management y IB sufren
5. **Riesgo reputacional** — heredaron problemas legales de Credit Suisse

## Perspectiva de Portfolio Managers

### Berkshire (Abel): BUY
> Wealth management es un negocio de sueños — cobras fees sobre activos que crecen solos con el mercado. UBS es el #1 mundial en esto. A P/E forward de 15.6x con $3B en buybacks, es atractivo.

### BlackRock (Fink): BUY
> UBS es nuestra contraparte más grande en wealth management global. La integración de CS los hace imbatibles en Europa y Asia. Los $7T en activos generan fee income predecible.

### Goldman (Solomon): BUY
> Como competidores, reconocemos que UBS post-CS es formidable. 25 de 31 analistas dicen Buy. El target promedio de $49.43 ofrece ~19% de upside.

### JP Morgan (Dimon): OVERWEIGHT
> La combinación de wealth management dominante + investment bank en recuperación + $6B+ en capital returns es muy atractiva para accionistas.

---

*Research fecha: 4 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 49.43,
    analyst_upside: 19.0,
    status: "active",
    first_researched_at: "2026-03-04T00:00:00Z",
    last_updated_at: "2026-03-04T00:00:00Z",
    next_review_at: "2026-09-04T00:00:00Z",
  },
  {
    id: 2,
    ticker: "ROP",
    name: "Roper Technologies",
    sector: "Technology",
    industry: "Vertical Software / Industrial Technology",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 350.0,
    pe_ratio: 24.5,
    pe_forward: 16.0,
    dividend_yield: 1.0,
    market_cap_b: 36.0,
    eps: 21.4,
    summary_short:
      "El 'Berkshire Hathaway del software'. Compran empresas de software especializado y las dejan crecer. Cayó -44% por problemas temporales — oportunidad de década.",
    summary_what:
      "Roper compra empresas de software que son #1 en nichos específicos (software para abogados, contratistas del gobierno, freight, laboratorios). Las deja operar solas y reinvierte el cash flow en comprar más empresas.",
    summary_why:
      "Máquina de compounding con FCF margin del 31%. Cayó -44% por problemas temporales (recortes gobierno, recesión freight). P/E forward de 16x para una compounder de élite es extraordinario. $6B+ en capacidad de M&A.",
    summary_risk:
      "Recortes DOGE afectan Deltek. Recesión de freight afecta DAT. Guidance 2026 conservador.",
    research_full: "",
    analyst_consensus: "Buy",
    analyst_target: 478.0,
    analyst_upside: 37.0,
    status: "watchlist",
    first_researched_at: "2026-03-04T00:00:00Z",
    last_updated_at: "2026-03-04T00:00:00Z",
    next_review_at: "2026-09-04T00:00:00Z",
  },
  {
    id: 3,
    ticker: "PNR",
    name: "Pentair PLC",
    sector: "Industrials",
    industry: "Water Treatment / Pool Equipment",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 97.0,
    pe_ratio: 18.87,
    pe_forward: 18.6,
    dividend_yield: 1.1,
    market_cap_b: 15.7,
    eps: 5.33,
    summary_short:
      "Empresa pura de agua: tratamiento, filtración, y equipos para piscinas. Dividend Aristocrat con 50 años de dividendo creciente. Megatendencia del agua limpia.",
    summary_what:
      "Pentair hace todo lo relacionado con el agua: filtros para tu casa, bombas para piscinas, sistemas de tratamiento industrial, y equipos para municipios. Si el agua pasa por algo, probablemente Pentair lo fabrica.",
    summary_why:
      "Megatendencia secular del agua limpia (regulación PFAS, infraestructura vieja). 50 años de dividendo creciente. FCF récord $748M. Transformación 80/20 expandiendo márgenes 15 trimestres consecutivos.",
    summary_risk:
      "Crecimiento orgánico débil (3-4%). Pool depende de housing market. Volúmenes estancados desde 2021.",
    research_full: "",
    analyst_consensus: "Buy",
    analyst_target: 120.0,
    analyst_upside: 24.0,
    status: "watchlist",
    first_researched_at: "2026-03-04T00:00:00Z",
    last_updated_at: "2026-03-04T00:00:00Z",
    next_review_at: "2026-09-04T00:00:00Z",
  },
  {
    id: 4,
    ticker: "NTR",
    name: "Nutrien Ltd.",
    sector: "Materials",
    industry: "Fertilizers / Agriculture",
    country: "Canada",
    region: "North America",
    currency: "USD",
    price: 75.74,
    pe_ratio: 15.96,
    pe_forward: 15.66,
    dividend_yield: 2.9,
    market_cap_b: 36.0,
    eps: 3.72,
    summary_short:
      "El mayor productor de fertilizantes del mundo. Controlan ~20% del potasio global. Esencial para alimentar al mundo.",
    summary_what:
      "Nutrien produce y vende fertilizantes (potasio, nitrógeno, fosfato) y los distribuye directamente a los agricultores a través de su red de tiendas retail en Norte América, Sudamérica y Australia.",
    summary_why:
      "Minas de potasio de clase mundial con costos bajísimos. Megatendencia: alimentar 8B+ personas. Dividendo creciente. Integración vertical única.",
    summary_risk:
      "Commodity cyclicality. Precio actual sobre price targets. Cierre de operaciones en Trinidad.",
    research_full: "",
    analyst_consensus: "Hold",
    analyst_target: 66.5,
    analyst_upside: -12.0,
    status: "watchlist",
    first_researched_at: "2026-03-03T00:00:00Z",
    last_updated_at: "2026-03-03T00:00:00Z",
    next_review_at: "2026-09-03T00:00:00Z",
  },
  {
    id: 5,
    ticker: "KHC",
    name: "Kraft Heinz Co.",
    sector: "Consumer Staples",
    industry: "Packaged Foods",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 24.28,
    pe_ratio: 9.46,
    pe_forward: null,
    dividend_yield: 6.5,
    market_cap_b: 28.0,
    eps: null,
    summary_short:
      "Dueños de Heinz Ketchup, Philadelphia, Kraft Mac & Cheese. Berkshire Hathaway está vendiendo toda su posición — señal negativa fuerte.",
    summary_what:
      "Kraft Heinz hace ketchup, queso crema, macarrones, carnes frías y más. Marcas que todos conocen pero que están perdiendo relevancia frente a nuevas tendencias de consumo.",
    summary_why:
      "Yield del 6.5% parece atractivo. P/E de 9.5x es barato. 8 marcas con ventas de +$1B cada una.",
    summary_risk:
      "Berkshire vendiendo 27.5% stake. Revenue cayendo -1.5% a -3.5%. Value trap potencial. Dividendo cuestionable.",
    research_full: "",
    analyst_consensus: "Hold",
    analyst_target: 26.13,
    analyst_upside: 7.0,
    status: "avoid",
    first_researched_at: "2026-03-03T00:00:00Z",
    last_updated_at: "2026-03-03T00:00:00Z",
    next_review_at: "2026-09-03T00:00:00Z",
  },
  {
    id: 6,
    ticker: "VGK",
    name: "Vanguard FTSE Europe ETF",
    sector: "Broad Market ETF",
    industry: "European Equities",
    country: "Multi-Country",
    region: "Europe",
    currency: "USD",
    price: 84.64,
    pe_ratio: 14.0,
    pe_forward: 13.2,
    dividend_yield: 3.7,
    market_cap_b: 19.0,
    eps: null,
    summary_short:
      "ETF de Vanguard con 1,246 empresas europeas por solo 0.06% de comisión. Dividendo del 3.7% — más del doble que el S&P 500. Europa cotiza a un 33% de descuento vs EUA.",
    summary_what:
      "VGK rastrea el FTSE Developed Europe All Cap Index. Te da exposición a 1,246 empresas en 16 países europeos: UK (22%), Francia, Suiza, Alemania, Países Bajos, y más. Incluye líderes globales como ASML, Roche, Nestlé, SAP, y AstraZeneca.",
    summary_why:
      "Diversificación geográfica barata (0.06% expense ratio). Europa paga dividendos generosos (3.7%). Valuaciones atractivas a P/E ~14x vs S&P 500 a ~21x. Hedge natural contra debilidad del dólar.",
    summary_risk:
      "Crecimiento económico europeo históricamente más lento que EUA. Riesgo divisa EUR/GBP/CHF. No tiene mega-cap tech americanas que han dominado returns.",
    research_full: `# VGK — Vanguard FTSE Europe ETF — Research Completo

## Precio: $84.25 | Expense Ratio: 0.06% | Div Yield: 3.7% | AUM: $19B+

---

## ¿Qué es VGK?

VGK es un ETF de Vanguard que rastrea el **FTSE Developed Europe All Cap Index**. Ofrece exposición diversificada a más de **1,246 empresas** en 16 países europeos desarrollados. Es una de las formas más baratas y eficientes de invertir en el mercado europeo.

## Composición por País

| País | % del ETF |
|------|-----------|
| **Reino Unido** | ~22% |
| **Francia** | ~16% |
| **Suiza** | ~14% |
| **Alemania** | ~13% |
| **Países Bajos** | ~8% |
| **Otros (11 países)** | ~27% |

## Top 10 Holdings

| Empresa | Ticker | % del ETF |
|---------|--------|-----------|
| **ASML Holding** | ASML | 2.83% |
| **Roche** | ROG | 1.93% |
| **AstraZeneca** | AZN | 1.85% |
| **Nestlé** | NESN | 1.76% |
| **Novartis** | NOVN | 1.68% |
| **SAP** | SAP | 1.62% |
| **Shell** | SHEL | 1.58% |
| **HSBC** | HSBA | 1.31% |
| **Novo Nordisk** | NOVO | 1.28% |
| **TotalEnergies** | TTE | 1.20% |

## Distribución por Sector

| Sector | % |
|--------|---|
| **Financials** | ~20% |
| **Industrials** | ~16% |
| **Healthcare** | ~14% |
| **Consumer Discretionary** | ~11% |
| **Technology** | ~9% |
| **Otros** | ~30% |

## ¿Por Qué Nos Gusta?

1. **Diversificación geográfica** — 16 países, 1246 empresas. Reduce riesgo concentración en EUA
2. **Expense ratio de 0.06%** — prácticamente gratis. Pagas $0.60 por cada $1,000 invertidos
3. **Dividendo del 3.7%** — más del doble que el S&P 500. Europa paga dividendos generosos
4. **Valuaciones atractivas** — Europa cotiza a P/E ~14x vs S&P 500 a ~21x. Descuento del 33%
5. **Exposición a líderes globales** — ASML (monopolio en litografía), Nestlé, Roche, SAP, Novo Nordisk
6. **Hedge contra dólar débil** — si el USD se debilita, activos en EUR/GBP/CHF se aprecian en USD

## Riesgos

1. **Crecimiento económico europeo más lento** que EUA históricamente
2. **Riesgo divisa** — EUR/GBP/CHF pueden debilitarse vs USD
3. **Exposición a UK post-Brexit** — 22% del fondo está en UK
4. **Sin tech mega-caps** — no tiene las "Magnificent 7" americanas que han dominado returns

---

*Research fecha: 9 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "N/A (ETF)",
    analyst_target: null,
    analyst_upside: null,
    status: "active",
    first_researched_at: "2026-03-09T00:00:00Z",
    last_updated_at: "2026-03-09T00:00:00Z",
    next_review_at: "2026-09-09T00:00:00Z",
  },
  {
    id: 7,
    ticker: "VPL",
    name: "Vanguard FTSE Pacific ETF",
    sector: "Broad Market ETF",
    industry: "Asia-Pacific Equities",
    country: "Multi-Country",
    region: "Asia-Pacific",
    currency: "USD",
    price: 100.53,
    pe_ratio: 14.0,
    pe_forward: 13.0,
    dividend_yield: 2.3,
    market_cap_b: 7.0,
    eps: null,
    summary_short:
      "ETF de Vanguard con 2,363 empresas de Asia-Pacífico por 0.07%. Samsung, Toyota, SK Hynix — exposición directa al boom de AI y semiconductores asiáticos.",
    summary_what:
      "VPL rastrea el FTSE Developed Asia Pacific All Cap Index. Cubre 2,363 empresas en Japón (53%), Australia (17%), Corea del Sur (14%), Hong Kong, Singapur y Nueva Zelanda. Top holdings: Samsung, SK Hynix, Toyota, Sony.",
    summary_why:
      "Asia-Pacífico es la región de mayor crecimiento global. Samsung + SK Hynix (7.7% del fondo) son los líderes de memoria/semiconductores — exposición directa a AI. Japón reformándose con mejor corporate governance. Complemento perfecto a VGK para diversificar fuera de EUA.",
    summary_risk:
      "Concentración en Japón (53%) con población envejeciente. Tensiones geopolíticas (China/Taiwan, Corea del Norte). Yen japonés altamente volátil.",
    research_full: `# VPL — Vanguard FTSE Pacific ETF — Research Completo

## Precio: $108.61 | Expense Ratio: 0.07% | Div Yield: 2.3% | AUM: $7B+

---

## ¿Qué es VPL?

VPL es un ETF de Vanguard que rastrea el **FTSE Developed Asia Pacific All Cap Index**. Ofrece exposición a más de **2,363 empresas** en la región Asia-Pacífico desarrollada, incluyendo Japón, Australia, Corea del Sur, Hong Kong, Singapur y Nueva Zelanda.

## Composición por País

| País | % del ETF |
|------|-----------|
| **Japón** | ~53% |
| **Australia** | ~17% |
| **Corea del Sur** | ~14% |
| **Hong Kong** | ~7% |
| **Singapur** | ~4% |
| **Nueva Zelanda** | ~2% |
| **Otros** | ~3% |

## Top 10 Holdings

| Empresa | Ticker | % del ETF |
|---------|--------|-----------|
| **Samsung Electronics** | 005930 | 4.66% |
| **SK Hynix** | 000660 | 3.04% |
| **Toyota Motor** | 7203 | 2.16% |
| **Sony Group** | 6758 | 1.28% |
| **Mitsubishi UFJ Financial** | 8306 | 1.25% |
| **Commonwealth Bank** | CBA | 1.22% |
| **BHP Group** | BHP | 1.05% |
| **Hitachi** | 6501 | 1.02% |
| **Recruit Holdings** | 6098 | 0.95% |
| **Keyence** | 6861 | 0.89% |

## Distribución por Sector

| Sector | % |
|--------|---|
| **Technology** | ~22% |
| **Financials** | ~18% |
| **Industrials** | ~17% |
| **Consumer Discretionary** | ~13% |
| **Healthcare** | ~7% |
| **Otros** | ~23% |

## ¿Por Qué Nos Gusta?

1. **Diversificación Asia-Pacífico** — la región de mayor crecimiento económico global
2. **Samsung + SK Hynix** — ~7.7% del fondo en los 2 líderes de memoria/semiconductores. Exposición directa al boom de AI
3. **Japón reformándose** — Tokyo Stock Exchange está forzando mejores returns a accionistas. Corporate governance mejorando
4. **Australia = commodities** — BHP, Rio Tinto. Exposición a minerales críticos para transición energética
5. **Expense ratio 0.07%** — casi gratis
6. **Corea del Sur** — Samsung, SK Hynix, Hyundai. Potencias tecnológicas a valuaciones de mercado emergente
7. **Complemento perfecto a VGK** — VGK cubre Europa, VPL cubre Asia-Pacífico. Juntos diversifican globalmente fuera de EUA

## Riesgos

1. **Concentración en Japón (53%)** — economía con deflación histórica, población envejeciente
2. **Tensiones geopolíticas** — China/Taiwan, Corea del Norte, disputas comerciales
3. **Riesgo divisa** — yen japonés altamente volátil
4. **No incluye China continental** — pierde el mercado de consumo más grande de Asia

---

*Research fecha: 9 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "N/A (ETF)",
    analyst_target: null,
    analyst_upside: null,
    status: "active",
    first_researched_at: "2026-03-09T00:00:00Z",
    last_updated_at: "2026-03-09T00:00:00Z",
    next_review_at: "2026-09-09T00:00:00Z",
  },
  {
    id: 8,
    ticker: "ARM",
    name: "ARM Holdings PLC",
    sector: "Technology",
    industry: "Semiconductors / Chip Design",
    country: "United Kingdom",
    region: "Europe",
    currency: "USD",
    price: 117.63,
    pe_ratio: 169.0,
    pe_forward: 64.66,
    dividend_yield: 0,
    market_cap_b: 134.76,
    eps: 0.74,
    summary_short:
      "Diseñan la arquitectura de procesadores que usan el 99% de smartphones, y ahora data centers, autos y PCs. Modelo asset-light puro: solo cobran licencias y regalías por cada chip vendido.",
    summary_what:
      "ARM no fabrica chips — diseña la arquitectura de procesadores y cobra licencias y regalías. Apple, Qualcomm, Samsung, Google, Amazon, Nvidia, todos pagan a ARM por usar sus diseños. 99%+ de smartphones corren ARM. Ahora expandiéndose a data centers (AWS Graviton), AI inference, automotive, y PCs.",
    summary_why:
      "Monopolio de facto en arquitectura de procesadores móviles. Revenue recurrente tipo SaaS — cada chip vendido paga regalías. AI tailwind masivo: hyperscalers migrando de x86 a ARM. 90% de analistas dicen Buy. Crecimiento ~20% YoY.",
    summary_risk:
      "Valuación cara: P/E trailing 169x, forward 65x. Necesita ejecutar impecablemente. Softbank controla ~90%. RISC-V podría erosionar market share a largo plazo.",
    research_full: `# ARM Holdings (ARM) — Research Completo

## Precio: $125.28 | P/E: 169 | P/E Forward: 64.7 | Div Yield: 0% | Market Cap: $134.8B

---

## ¿Qué es ARM?

ARM Holdings diseña la **arquitectura de procesadores más utilizada del mundo**. No fabrican chips — diseñan la "receta" y cobran licencias y regalías a todas las empresas que fabrican chips basados en ARM: Apple, Qualcomm, Samsung, Google, Amazon, Nvidia, y prácticamente todos los fabricantes de smartphones, IoT, y cada vez más data centers y PCs.

## Modelo de Negocio

| Segmento | Descripción | % Revenue |
|----------|-------------|-----------|
| **Royalties** | Cobran por cada chip vendido basado en ARM | ~65% |
| **Licensing** | Cobran por acceso a nuevos diseños de arquitectura | ~35% |

### Por Qué es Especial:
- **99%+ de smartphones** usan chips ARM
- **Cero fábricas** — modelo asset-light puro. Solo diseñan IP
- **Revenue recurrente** — cada chip vendido en el mundo les paga regalías
- **Margen operativo ~25%** y subiendo

## Resultados Financieros (FY2026 Q3, dic 2025)

- **Revenue trimestral: $983M** (+19% YoY)
- **Revenue anual estimado: $4.67B**
- **EPS: $0.39** (trimestral)
- **Guidance FY2027:** Revenue $4.8-5.2B (~20% growth)
- **Margen operativo:** Expandiéndose

## El Catalizador: AI y Data Centers

ARM está transitando de "la empresa de chips para celulares" a "la empresa de chips para TODO":

1. **Neoverse (Data Centers)** — Google, Microsoft, Amazon ya usan ARM en sus servidores. AWS Graviton (ARM) es ~40% más eficiente que x86
2. **AI Inference** — chips ARM son ideales para inferencia AI por su eficiencia energética
3. **Automotive** — ADAS, infotainment. ARM está en casi todos los coches nuevos
4. **PCs** — Apple M-series demostró que ARM puede dominar laptops. Qualcomm Snapdragon X ya compite con Intel/AMD
5. **IoT** — billones de dispositivos conectados, casi todos corren ARM

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Strong Buy** |
| % Buy | 90% |
| % Hold | 10% |
| % Sell | 0% |
| Price Target Promedio | **$160.63** |
| Price Target Alto | $210 |
| Price Target Bajo | $100 |
| **Upside al Target** | **+29%** |

## ¿Por Qué Nos Gusta?

1. **Monopolio de facto** — 99% de smartphones, creciendo en servers, autos, PCs, IoT
2. **Asset-light** — no necesitan fábricas de $20B como TSMC o Intel. Solo diseñan IP
3. **Revenue recurrente** — cada chip vendido les paga regalías. Modelo tipo SaaS pero para hardware
4. **AI tailwind masivo** — los hyperscalers están migrando de x86 a ARM. Esto apenas empieza
5. **90% de analistas dicen Buy** — consenso prácticamente unánime
6. **Crecimiento ~20% YoY** — guidance fuerte para FY2027
7. **No hay competencia real** — RISC-V es años atrás en ecosistema y madurez

## Riesgos

1. **Valuación cara** — P/E trailing de 169x. Cualquier miss en earnings castiga fuerte
2. **Concentración en clientes** — top 5 clientes representan porcentaje significativo de revenue
3. **RISC-V a largo plazo** — arquitectura open-source que podría erosionar market share en IoT/bajo costo
4. **Softbank ownership** — Softbank controla ~90%. Puede tomar decisiones que no favorezcan a minoritarios
5. **Geopolítica** — empresa británica, IP crítica. Sujeta a restricciones de exportación (China)
6. **Forward P/E de 65x** — necesita ejecutar impecablemente para justificar la valuación

---

*Research fecha: 9 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 160.63,
    analyst_upside: 29.0,
    status: "active",
    first_researched_at: "2026-03-09T00:00:00Z",
    last_updated_at: "2026-03-09T00:00:00Z",
    next_review_at: "2026-09-09T00:00:00Z",
  },
  {
    id: 9,
    ticker: "ASBFY",
    name: "Associated British Foods PLC",
    sector: "Consumer Staples",
    industry: "Diversified Consumer / Retail (Primark)",
    country: "United Kingdom",
    region: "Europe",
    currency: "USD",
    price: 25.13,
    pe_ratio: 13.23,
    pe_forward: 10.88,
    dividend_yield: 3.38,
    market_cap_b: 17.72,
    eps: 1.9,
    summary_short:
      "Conglomerado británico dueño de Primark (fast fashion #1 de Europa) + negocios de alimentos, azúcar e ingredientes. Están evaluando separar Primark del negocio de alimentos para desbloquear valor.",
    summary_what:
      "Associated British Foods es un conglomerado con 5 segmentos: Retail (Primark — £9.5B en ventas, 384 tiendas en 13 países), Grocery (marcas como Twinings, Ovaltine, Kingsmill), Ingredients (levaduras y enzimas), Sugar (Illovo en África, British Sugar en UK), y Agriculture. Primark es el negocio estrella — fast fashion de bajo costo sin tienda online.",
    summary_why:
      "P/E de 13x y forward de 11x — baratísima para lo que es. Dividend yield de 3.4%. La junta directiva anunció revisión estructural que podría resultar en spin-off de Primark (valorada en ~£13B). Si se separa, cada negocio se valoraría más individualmente. Primark sigue creciendo con ~4% en nuevas tiendas. Margen operativo de Primark de 11.9%.",
    summary_risk:
      "Primark no tiene tienda online — depende 100% de tráfico en tienda física. Europa continental con consumo débil. Segmento de azúcar en breakeven. Revenue total cayó 3% en 2025. La familia Weston controla la empresa vía Wittington Investments.",
    research_full: `# Associated British Foods (ASBFY) — Research Completo

## Precio: $25.13 | P/E: 13.2 | P/E Forward: 10.9 | Div Yield: 3.4% | Market Cap: $17.7B

---

## ¿Qué es ABF?

Associated British Foods es un **conglomerado diversificado** británico con operaciones en alimentos, ingredientes, azúcar, agricultura, y retail (Primark). Fundada en 1935, es controlada por la familia Weston a través de Wittington Investments.

## Segmentos de Negocio

| Segmento | Descripción | Revenue aprox |
|----------|-------------|---------------|
| **Retail (Primark)** | Fast fashion de bajo costo, 384 tiendas en 13 países | £9.5B (~49%) |
| **Grocery** | Twinings, Ovaltine, Kingsmill, Jordans, Dorset | ~20% |
| **Ingredients** | AB Mauri (levaduras), ABF Ingredients (enzimas) | ~12% |
| **Sugar** | Illovo (África), British Sugar (UK) | ~12% |
| **Agriculture** | AB Agri — nutrición animal | ~7% |

## Primark — El Negocio Estrella

Primark es el **retailer de fast fashion #1 en Europa por valor**:
- **384 tiendas** en 13 países (UK, Irlanda, España, Alemania, Francia, Italia, EE.UU., etc.)
- **Ventas: £9.5B** con margen operativo de **11.9%**
- **Operating profit: £1.1B** (+2% YoY)
- **Sin tienda online** — todo el negocio es tráfico en tienda
- Precios ultra-bajos: compite con Zara y H&M pero más barato
- Expansión: ~4% crecimiento por nuevas tiendas

## Resultados 2025

- **Revenue total: £19.5B** (-3% actual, -1% constante)
- **Operating Profit ajustado: £1.7B** (-12% constante)
- **EPS ajustado: 174.9p** (-11%)
- **Free Cash Flow: £648M**
- Primark sólida, Sugar y Grocery con presión

## El Catalizador: Spin-off de Primark

La junta directiva anunció una **revisión estructural** que podría resultar en la **separación de Primark del negocio de alimentos**:
- Primark sola podría valer **£13B+**
- El negocio de alimentos/ingredientes tendría valoración independiente
- **Sum-of-parts analysis** sugiere que ABF está infravalorada como conglomerado
- Si se separa, los inversores podrían valorar cada parte de forma más eficiente

## Valoración

| Métrica | Valor |
|---------|-------|
| P/E Trailing | **13.2x** |
| P/E Forward | **10.9x** |
| Dividend Yield | **3.4%** |
| Price/Sales | ~0.7x |
| EV/EBITDA | ~8x |

Esto es **muy barato** para una empresa con un retailer de £9.5B en ventas y marcas premium de alimentos.

## ¿Por Qué Nos Gusta?

1. **Primark es una máquina de cash flow** — £1.1B en operating profit, creciendo
2. **Valoración ridículamente baja** — P/E 13x con catalyst de spin-off
3. **Spin-off potencial** — desbloquearía valor significativo
4. **Dividendo de 3.4%** — te pagan por esperar
5. **Diversificación** — si Primark tiene un mal trimestre, los otros segmentos amortiguan
6. **Todos usan Primark** — los clientes de Primark se vuelven nuestros clientes

## Riesgos

1. **Sin ecommerce** — Primark no vende online. 100% dependiente de tráfico en tienda
2. **Europa débil** — consumo en Europa continental sigue presionado
3. **Azúcar en problemas** — segmento en breakeven, restructuración en curso
4. **Familia Weston controla** — pueden tomar decisiones que no favorezcan a minoritarios
5. **Revenue total cayendo** — -3% en 2025, necesita revertir tendencia
6. **Spin-off no garantizado** — la revisión puede no resultar en separación

---

*Research fecha: 10 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: null,
    analyst_upside: null,
    status: "active",
    first_researched_at: "2026-03-10T00:00:00Z",
    last_updated_at: "2026-03-10T00:00:00Z",
    next_review_at: "2026-09-10T00:00:00Z",
  },
  {
    id: 10,
    ticker: "AVGO",
    name: "Broadcom Inc.",
    sector: "Technology",
    industry: "Semiconductors / Networking",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 342.69,
    pe_ratio: 66.67,
    pe_forward: 19.54,
    dividend_yield: 0.76,
    market_cap_b: 1624.79,
    eps: 5.14,
    summary_short:
      "Gigante de semiconductores y software. Dueños de VMware, hacen los chips de Wi-Fi y networking que conectan el mundo. Crecimiento explosivo por AI — sus chips custom están en los data centers de Google, Meta y Apple.",
    summary_what:
      "Broadcom diseña chips semiconductores y software de infraestructura. Sus chips están en tu iPhone (Wi-Fi), en routers empresariales, en switches de data centers, y en servidores de AI. Compraron VMware en 2023 por $69B — ahora también son gigantes en software de virtualización y cloud. Clientes: Apple, Google, Meta, Amazon, Microsoft.",
    summary_why:
      "AI networking es el nuevo boom — Broadcom hace los chips que conectan GPUs de Nvidia en data centers. Revenue de AI se triplicó. VMware genera $13B+ anuales en software recurrente. Forward P/E de 19x es razonable para una empresa creciendo 40%+. Dividendo de 0.76% y creciendo.",
    summary_risk:
      "Apple está reemplazando chips Wi-Fi de Broadcom con sus propios chips (N1) en iPhone 17. Valuación trailing cara (P/E 67x). Dependencia alta de pocos clientes grandes. Deuda significativa por la compra de VMware.",
    research_full: `# Broadcom Inc. (AVGO) — Research Completo

## Precio: $342.69 | P/E: 66.7 | P/E Forward: 19.5 | Div Yield: 0.76% | Market Cap: $1,625B

---

## ¿Qué es Broadcom?

Broadcom es un **gigante de semiconductores y software de infraestructura** con sede en Palo Alto, California. Diseñan chips para networking, wireless, storage, y broadband. En 2023 compraron VMware por $69B, convirtiéndose también en una potencia de software empresarial.

## Segmentos de Negocio

| Segmento | Descripción | % Revenue aprox |
|----------|-------------|-----------------|
| **Semiconductor Solutions** | Chips de networking, wireless (Wi-Fi/Bluetooth), storage, broadband | ~55% |
| **Infrastructure Software** | VMware, CA Technologies, Symantec Enterprise | ~45% |

### Productos que Usas Sin Saberlo:
- **Wi-Fi de tu iPhone** — Broadcom hace los chips Wi-Fi y Bluetooth (hasta iPhone 16)
- **Tu router de casa** — probablemente tiene un chip Broadcom
- **Netflix/YouTube** — los data centers que los sirven usan switches Broadcom
- **VMware** — el 70% de empresas Fortune 500 virtualizan sus servidores con VMware

## Resultados Financieros (FY2025, oct 2025)

- **Revenue: $51.6B** (+44% YoY — incluye VMware full year)
- **AI Revenue: $12.2B** (triplicado vs año anterior)
- **Operating Income ajustado: ~$32B** (margen ~62%)
- **Free Cash Flow: ~$20B**
- **EPS: $5.14** (TTM)

## El Catalizador: AI Networking

Broadcom es el **proveedor #1 de chips de networking para data centers AI**:

1. **Custom AI chips (XPUs)** — diseñan chips custom para Google (TPU), Meta, y otros hyperscalers
2. **Ethernet switching** — sus Memory → chips Jericho y Ramon conectan clusters de miles de GPUs Nvidia
3. **VMware** — software recurrente de $13B+/año con margen altísimo. Transicionando a suscripción
4. **Revenue de AI triplicado** — de ~$4B a $12.2B en un año

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Strong Buy** |
| % Buy | 88% |
| % Hold | 12% |
| % Sell | 0% |
| Price Target Promedio | **$460** |
| Price Target Alto | $550 |
| Price Target Bajo | $350 |
| **Upside al Target** | **+34%** |

## ¿Por Qué Nos Gusta?

1. **AI networking líder** — conecta las GPUs que entrenan modelos de AI. Broadcom es el "plomero" de AI
2. **VMware = software recurrente** — $13B+ en revenue casi garantizado cada año
3. **Diversificación** — no depende de un solo producto. Semis + software
4. **Forward P/E de 19x** — razonable para una empresa creciendo 40%+
5. **Custom chips para hyperscalers** — Google, Meta diseñan sus propios chips... con Broadcom
6. **Free cash flow de $20B** — máquina de generar efectivo

## Riesgos

1. **Apple dejando Broadcom** — iPhone 17 usará chip Wi-Fi propio de Apple (~$2.7B revenue en riesgo)
2. **P/E trailing de 67x** — inflado por costos de integración de VMware
3. **Concentración de clientes** — top 5 clientes representan ~35% de revenue
4. **Deuda por VMware** — ~$40B en deuda, aunque la están pagando rápido
5. **Competencia en AI** — Marvell, Intel, y los propios hyperscalers podrían internalizar diseños
6. **Regulación** — restricciones de exportación a China pueden afectar

---

*Research fecha: 11 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 460.0,
    analyst_upside: 34.0,
    status: "active",
    first_researched_at: "2026-03-11T00:00:00Z",
    last_updated_at: "2026-03-11T00:00:00Z",
    next_review_at: "2026-09-11T00:00:00Z",
  },
  {
    id: 11,
    ticker: "ASML",
    name: "ASML Holding N.V.",
    sector: "Technology",
    industry: "Semiconductor Equipment / Lithography",
    country: "Netherlands",
    region: "Europe",
    currency: "USD",
    price: 1390.20,
    pe_ratio: 48.78,
    pe_forward: 31.91,
    dividend_yield: 0.64,
    market_cap_b: 545.87,
    eps: 28.5,
    summary_short:
      "ASML es un MONOPOLIO. Son la ÚNICA empresa en el mundo que fabrica las máquinas que hacen chips avanzados. Sin ASML, no hay iPhones, no hay Nvidia, no hay AI. Punto.",
    summary_what:
      "ASML fabrica las máquinas de litografía que los fabricantes de chips (TSMC, Samsung, Intel) necesitan para producir semiconductores. Su tecnología EUV (Extreme Ultraviolet) es la única en el mundo capaz de hacer chips de 5nm, 3nm y 2nm. Sin estas máquinas, no existen los chips modernos — ni para smartphones, ni para AI, ni para nada.",
    summary_why:
      "Monopolio literal — no hay competidor #2. Cada máquina EUV cuesta $380M+ y tienen backlog de años. Revenue de €32.7B en 2025 (+16% YoY). Net income de €9.6B. Guidance 2026: €34-39B. El boom de AI necesita más chips, y más chips = más máquinas ASML. Además €8.2B en servicio recurrente por mantenimiento.",
    summary_risk:
      "Valuación cara (P/E 49x). China representó 33% de revenue en 2025 pero las restricciones de exportación están reduciendo eso. Ciclos de semiconductores pueden crear volatilidad. Solo tienen un producto principal.",
    research_full: `# ASML Holding (ASML) — Research Completo

## Precio: $1,390.20 | P/E: 48.8 | P/E Forward: 31.9 | Div Yield: 0.64% | Market Cap: $545.9B

---

## ¿Qué es ASML?

ASML es una empresa holandesa que fabrica las **máquinas de litografía más avanzadas del mundo**. Estas máquinas son esenciales para producir semiconductores — los chips que están en tu teléfono, computadora, coche, y en los servidores que entrenan modelos de AI.

**Son un MONOPOLIO.** No existe otra empresa en el mundo que pueda fabricar máquinas EUV (Extreme Ultraviolet Lithography).

## Productos

| Producto | Descripción | Precio aprox |
|----------|-------------|-------------|
| **EUV (NXE:3800E)** | Litografía ultravioleta extrema para chips de 5nm/3nm | ~$380M por máquina |
| **High-NA EUV (EXE:5200)** | Siguiente generación para chips de 2nm y menores | ~$400M+ por máquina |
| **DUV** | Litografía deep ultraviolet para chips menos avanzados | ~$100M por máquina |
| **Installed Base Mgmt** | Servicio, mantenimiento y upgrades de máquinas instaladas | €8.2B/año |

### ¿Quiénes son sus clientes?
- **TSMC** (hace chips para Apple, Nvidia, AMD, Qualcomm)
- **Samsung** (hace chips para sí mismo y para otros)
- **Intel** (fabricante de chips de PC y servidor)
- **SK Hynix, Micron** (memoria)

## Resultados 2025

- **Revenue: €32.7B** (+16% YoY)
- **Net Income: €9.6B** (+26% YoY)
- **Gross Margin: 52.8%**
- **EPS: €24.73** (anual)
- **48 máquinas EUV** vendidas (incluyendo High-NA)
- **Bookings Q4: €13.2B** (€7.4B EUV + €5.8B DUV)
- **Installed Base Management: €8.2B** (+26% YoY) — revenue recurrente

## Distribución Geográfica (2025)

| Región | % Revenue |
|--------|-----------|
| **China** | ~33% (bajando por restricciones) |
| **Corea del Sur** | ~25% |
| **Taiwan** | ~22% |
| **EE.UU.** | ~10% |
| **Japón** | ~5% |
| **Europa** | ~5% |

## Guidance 2026

- **Revenue: €34B - €39B** (hasta +19% crecimiento)
- **Gross Margin: 51% - 53%**
- **Q1 2026: €8.2B - €8.9B**
- Nuevo programa de recompra de acciones anunciado

## ¿Por Qué Nos Gusta?

1. **MONOPOLIO** — no hay competidor #2 en EUV. Es imposible replicar esta tecnología en menos de 10-15 años
2. **AI = más chips = más máquinas ASML** — el boom de AI es directamente proporcional a más compras de ASML
3. **Revenue recurrente de €8.2B** — una vez instalada una máquina, el cliente paga servicio por décadas
4. **Margins brutales** — 52.8% gross margin, mejorando
5. **Backlog de años** — las máquinas están vendidas antes de fabricarse
6. **Dividendo creciente** — 0.64% pero lo aumentan cada año. Más recompras anunciadas

## Riesgos

1. **Valuación cara** — P/E de 49x. Cualquier miss en earnings castiga fuerte
2. **China** — 33% del revenue viene de China. Restricciones de exportación en aumento
3. **Ciclicidad** — la industria de semis tiene ciclos. Si los clientes reducen capex, ASML sufre
4. **Concentración de clientes** — TSMC + Samsung + Intel = casi todo el revenue
5. **Geopolítica** — empresa europea con tecnología estratégica. Sujeta a presiones de EE.UU. y Europa
6. **Un solo producto** — si alguien inventara una alternativa a litografía (improbable pero no imposible), ASML quedaría obsoleta

---

*Research fecha: 11 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 900.0,
    analyst_upside: null,
    status: "active",
    first_researched_at: "2026-03-11T00:00:00Z",
    last_updated_at: "2026-03-11T00:00:00Z",
    next_review_at: "2026-09-11T00:00:00Z",
  },
  {
    id: 12,
    ticker: "AWK",
    name: "American Water Works Company",
    sector: "Utilities",
    industry: "Water & Wastewater Utilities",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 138.25,
    pe_ratio: 21.76,
    pe_forward: 22.6,
    dividend_yield: 2.46,
    market_cap_b: 25.93,
    eps: 5.64,
    summary_short:
      "La empresa de agua más grande de EE.UU. Dueños de los tubos, plantas de tratamiento y infraestructura que lleva agua limpia a 14 millones de personas en 14 estados + 18 bases militares. Monopolio regulado con dividendo creciente 18 años consecutivos.",
    summary_what:
      "American Water Works es la utility de agua privada más grande de EE.UU. Poseen y operan la infraestructura de agua y alcantarillado: 80+ plantas de tratamiento de agua superficial, 520+ plantas de agua subterránea, 190+ plantas de aguas residuales, y 54,500 millas de tubería. También operan sistemas de agua en 18 bases militares del Departamento de Defensa con contratos de 50 años.",
    summary_why:
      "Monopolio regulado — sin competencia en cada territorio que sirven. El agua es la utilidad más esencial (nadie deja de usar agua). Dividendo creciendo ~8% anual por 18 años consecutivos. La infraestructura de agua de EE.UU. necesita $1.3 trillones en inversión — AWK es el mayor inversor privado. Fusión con Essential Utilities aprobada (cierre Q1 2027) expandirá a 17 estados.",
    summary_risk:
      "Depende de reguladores estatales para aprobar aumentos de tarifas — pueden recortar lo solicitado. Valuación premium para utility (P/E ~22x). Alta deuda necesaria para financiar $46-48B en inversión a 2035. Fusión con Essential Utilities aún pendiente de aprobaciones regulatorias.",
    research_full: `# American Water Works Company (AWK) — Research Completo

## Precio: $138.25 | P/E: 21.8 | P/E Forward: 22.6 | Div Yield: 2.46% | Market Cap: $25.9B

---

## ¿Qué es American Water Works?

American Water Works es la **utility de agua privada más grande de Estados Unidos**. En términos simples: son dueños de los tubos, plantas de tratamiento e infraestructura que llevan agua limpia a tu casa y se llevan las aguas residuales para tratarlas. En los territorios donde operan, son **monopolio** — si vives ahí, ellos son tu compañía de agua.

## Infraestructura que Poseen

- ~80 plantas de tratamiento de agua superficial
- ~520 plantas de tratamiento de agua subterránea
- ~190 plantas de tratamiento de aguas residuales
- ~54,500 millas de tubería
- ~1,200 pozos de agua subterránea
- ~1,800 estaciones de bombeo
- ~1,100 instalaciones de almacenamiento de agua tratada
- ~75 presas

## Segmentos de Negocio

| Segmento | Descripción | % Earnings aprox |
|----------|-------------|------------------|
| **Regulated Utilities** | Servicio de agua y alcantarillado regulado por estado | ~95% |
| **Military Services** | Contratos de 50 años con el Dept. de Defensa en 18 bases | ~5% |

El segmento militar tiene un backlog de **$7.4 mil millones** en obligaciones pendientes con un plazo promedio restante de 38 años.

## Subsidiarias por Estado (Las Marcas en tu Recibo de Agua)

| Subsidiaria | Estado |
|---|---|
| New Jersey American Water | New Jersey |
| Pennsylvania American Water | Pennsylvania |
| Missouri American Water | Missouri |
| Illinois American Water | Illinois |
| Indiana American Water | Indiana |
| California American Water | California |
| West Virginia American Water | West Virginia |
| Virginia American Water | Virginia |
| Kentucky American Water | Kentucky |
| Iowa American Water | Iowa |
| Maryland American Water | Maryland |
| Hawaii American Water | Hawaii |
| Tennessee American Water | Tennessee |

Sirven **14 millones de personas** a través de **~3.4 millones de conexiones** en ~1,700 comunidades.

## Resultados Financieros 2025

| Métrica | 2024 | 2025 | Cambio |
|---------|------|------|--------|
| **Revenue** | $4.68B | $5.14B | **+9.1%** |
| **Operating Income** | — | ~$1.88B | — |
| **Adjusted EPS** | $5.18 | $5.64 | **+8.9%** |
| **GAAP EPS** | $5.39 | $5.69 | +5.6% |
| **Capital Investment** | — | $3.2B | — |
| **Dividendo/Acción** | — | $3.31 anualizado | ~8% growth |

## Guidance 2026 y Objetivos a Largo Plazo

- **EPS 2026:** $6.02 - $6.12 (crecimiento ~7-8%)
- **Rate base growth:** 8-9% anual
- **Dividendo growth:** 7-9% anual
- **Capital investment:** $19-20B (2026-2030); $46-48B (2026-2035)

## Fusión con Essential Utilities

Fusión all-stock anunciada en octubre 2025:
- Combina las dos utilities de agua más grandes de EE.UU.
- Empresa combinada servirá **4.7+ millones de conexiones en 17 estados**
- Accionistas de ambas empresas aprobaron con ~99% (AWK) y ~95% (WTRG) de votos
- **Cierre esperado: Q1 2027** (pendiente aprobaciones regulatorias)
- Essential shareholders recibirán 0.305 acciones de AWK por cada acción de WTRG

## Dividendo — 18 Años Consecutivos de Crecimiento

- **Dividendo anual:** $3.31/acción ($0.83 trimestral)
- **Yield:** 2.46%
- **Growth rate promedio:** 8-9% anual en la última década
- **Payout ratio:** ~56%
- 18 años consecutivos de aumento

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Hold / Neutral** |
| Price Target Promedio | **~$140** |
| Price Target Alto | $157 |
| Price Target Bajo | $114 |
| Upside al Target | ~2% |
| Analistas | 11-18 |
| Split | ~3 Buy / 8-9 Hold / 3-4 Sell |

El consenso es que AWK es una utility de altísima calidad que ya está **justamente valorada** a precios actuales.

## ¿Por Qué Nos Gusta?

1. **Servicio esencial irreemplazable** — nadie deja de usar agua. Demanda estable sin importar la economía
2. **Monopolio regulado** — sin competencia en cada territorio. Ingresos predecibles y resistentes a recesión
3. **$1.3 trillones en inversión necesaria** — la infraestructura de agua de EE.UU. tiene 50-100+ años. AWK es el mayor inversor privado
4. **Dividendo creciente 18 años** — ~8% de crecimiento anual con payout ratio sostenible del 56%
5. **Fusión transformativa** — Essential Utilities expande a 17 estados y 4.7M+ conexiones
6. **Crecimiento por adquisiciones** — 19 adquisiciones bajo acuerdo ($267M, ~58,000 nuevas conexiones)

## Riesgos

1. **Riesgo regulatorio** — depende de comisiones estatales para aprobar aumentos de tarifas. West Virginia recortó un aumento solicitado de 22.5% a solo 8% en 2023
2. **Valuación premium** — P/E ~22x. No es barata, pero tampoco excesiva para una utility de esta calidad
3. **Intensiva en capital / Deuda** — necesita financiar $46-48B a 2035. Tasas de interés altas aumentan costos
4. **Riesgo de fusión** — pendiente aprobación de múltiples comisiones estatales (PA, NJ, y otras)
5. **Riesgo ambiental** — costos de limpieza de PFAS, regulaciones de calidad de agua, sequías, inundaciones
6. **Riesgo político** — la privatización del agua es políticamente sensible. Puede haber presión para municipalizar

---

*Research fecha: 12 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Hold",
    analyst_target: 140.0,
    analyst_upside: 2.0,
    status: "active",
    first_researched_at: "2026-03-12T00:00:00Z",
    last_updated_at: "2026-03-12T00:00:00Z",
    next_review_at: "2026-09-12T00:00:00Z",
  },
  {
    id: 13,
    ticker: "CAIXY",
    name: "CaixaBank S.A.",
    sector: "Financials",
    industry: "Retail Banking",
    country: "Spain",
    region: "Europe",
    currency: "USD",
    price: 3.69,
    pe_ratio: 11.7,
    pe_forward: 10.5,
    dividend_yield: 5.1,
    market_cap_b: 69.0,
    eps: 0.84,
    summary_short:
      "El banco #1 de España con 18 millones de clientes. Premiado como 'Mejor Banco para Consumidores en Europa' por Euromoney 2025. Dividendo del 5.1% — creciendo 15% anual. Absorbieron Bankia y son dueños de BPI en Portugal.",
    summary_what:
      "CaixaBank es el banco retail más grande de España. Con 18 millones de clientes, ofrece cuentas bancarias, hipotecas, seguros (VidaCaixa), fondos de inversión, y banca privada. Absorbieron Bankia en 2021 convirtiéndose en el líder indiscutible del mercado español. También operan en Portugal a través de BPI. La Fundación 'la Caixa' es la mayor fundación privada de Europa.",
    summary_why:
      "Banco #1 de España con escala masiva (€1.1 trillones en volumen de negocio). P/E de 11.7x — barato. Dividendo del 5.1% creciendo agresivamente (+15% en 2025). ROTE del 17.5% — rentabilidad excepcional. Cost/income de 39.4% — eficiencia bancaria de élite. Premiado como mejor banco de consumo en Europa.",
    summary_risk:
      "Concentrado en España (~90% de ingresos). Tasas de interés del BCE bajando podrían comprimir márgenes. ADR en OTC con menor liquidez que la acción principal en Madrid. Regulación bancaria europea en constante cambio.",
    research_full: `# CaixaBank S.A. (CAIXY) — Research Completo

## Precio ADR: $3.69 | Precio Madrid: €9.83 | P/E: 11.7 | Div Yield: 5.1% | Market Cap: €69B

---

## ¿Qué es CaixaBank?

CaixaBank es el **banco retail más grande de España** con más de **18 millones de clientes**. Nació de la fusión de dos instituciones financieras históricas y se consolidó como líder absoluto al absorber Bankia en 2021. Opera principalmente en España y Portugal (a través de BPI).

## Segmentos de Negocio

| Segmento | Descripción |
|----------|-------------|
| **Banca Retail** | Cuentas, tarjetas, hipotecas, préstamos personales — 18M+ clientes |
| **Banca Privada** | Gestión de patrimonio — €50B+ bajo asesoramiento independiente |
| **Seguros (VidaCaixa)** | Seguros de vida, pensiones, ahorro — líder en España |
| **Banca Empresarial** | Financiamiento a empresas y comercio exterior |
| **BPI (Portugal)** | Banco completo en Portugal |
| **Fundación "la Caixa"** | Mayor fundación privada de Europa (obra social) |

## Marcas que la Gente Reconoce

- **CaixaBank** — el banco en sí, sucursales por toda España
- **imagin** — banco digital para jóvenes (app gratuita)
- **VidaCaixa** — seguros y pensiones (#1 en España)
- **BPI** — banco en Portugal
- **Fundación "la Caixa"** — obra social, museos CaixaForum, CosmoCaixa
- **CaixaBank Payments & Consumer** — tarjetas y financiación al consumo

## Resultados 2025

| Métrica | 2025 | vs 2024 |
|---------|------|---------|
| **Net Profit** | €5.89B | **+1.8%** |
| **Gross Income** | €16.27B | **+2.5%** |
| **Pre-Impairment Income** | €9.86B | +0.9% |
| **ROTE** | 17.5% | — |
| **CET1 Ratio** | 12.25% | Sólido |
| **Cost/Income** | 39.4% | Eficiente |
| **Business Volume** | €1.1 trillion | **+6.9%** |

## Dividendo — Crecimiento Explosivo

| Año | Dividendo/Acción | Cambio |
|-----|-----------------|--------|
| 2022 | €0.2306 | — |
| 2023 | €0.3919 | **+70%** |
| 2024 | €0.4352 | **+11%** |
| 2025 | €0.5000 | **+15%** |

- **Payout ratio:** 59.4%
- **Total distribuido 2025:** €3.5 mil millones
- **Política 2026:** Mantener payout de 50-60%

## Premios y Reconocimientos (2025)

- **"Mejor Banco para Consumidores en Europa"** — Euromoney
- **"Mejor Banco de España"** — Euromoney
- **"Mejor Banco Digital de España"** — Euromoney
- **"Mejor Banco para Diversidad e Inclusión en Europa"** — Euromoney
- **"Mejor Banco Privado Digital en Europa"** — PWM (Financial Times)
- 8 premios Euromoney totales (5 CaixaBank + 3 BPI)

## Adquisición de Bankia (2021)

La fusión con Bankia en 2021 fue la mayor operación bancaria en España:
- Creó un banco con **€664B en activos** y **~20% de cuota de mercado**
- Sinergias de costos ya materializadas
- Consolidó posición como #1 indiscutible en banca retail española

## ¿Por Qué Nos Gusta?

1. **Banco #1 de España** — 18M clientes, escala masiva, posición dominante
2. **Dividendo del 5.1%** — de los más altos entre bancos europeos grandes
3. **Crecimiento de dividendo brutal** — de €0.23 en 2022 a €0.50 en 2025 (117% en 3 años)
4. **P/E de 11.7x** — barato para un banco tan rentable
5. **ROTE de 17.5%** — rentabilidad excepcional
6. **Cost/income de 39.4%** — eficiencia operativa de élite entre bancos europeos
7. **Premiado como mejor banco de consumo en Europa** — reconocimiento objetivo

## Riesgos

1. **Concentración en España** — ~90% del negocio depende de la economía española
2. **Tasas de interés bajando** — el BCE está reduciendo tasas, lo que comprime márgenes de interés
3. **ADR en OTC** — CAIXY tiene menor liquidez que CABK en Madrid. Spreads más amplios
4. **Regulación bancaria** — requerimientos de capital pueden aumentar
5. **Competencia fintech** — nuevos bancos digitales compiten por clientes jóvenes
6. **Riesgo divisa** — el ADR cotiza en USD pero los resultados son en EUR

---

*Research fecha: 16 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: null,
    analyst_upside: null,
    status: "active",
    first_researched_at: "2026-03-16T00:00:00Z",
    last_updated_at: "2026-03-16T00:00:00Z",
    next_review_at: "2026-09-16T00:00:00Z",
  },
  {
    id: 14,
    ticker: "ROL",
    name: "Rollins, Inc.",
    sector: "Industrials",
    industry: "Pest Control Services",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 55.33,
    pe_ratio: 50.76,
    pe_forward: 39.29,
    dividend_yield: 1.32,
    market_cap_b: 26.6,
    eps: 1.12,
    summary_short:
      "Dueños de Orkin — la marca #1 de control de plagas del mundo. 24 años consecutivos de crecimiento de revenue. Morningstar le da 'Wide Moat' (ventaja competitiva amplia). Servicio esencial: las cucarachas no entienden de recesiones.",
    summary_what:
      "Rollins es la segunda empresa de control de plagas más grande del mundo. Su marca principal es Orkin, pero también operan HomeTeam Pest Defense, Clark Pest Control, Northwest Exterminating, Western Pest Services, Critter Control, y más. Ofrecen control de plagas residencial y comercial, fumigación de termitas, control de vida silvestre, y servicios de mosquitos. Crecen comprando empresas pequeñas locales ('tuck-in acquisitions').",
    summary_why:
      "Servicio esencial que no depende de la economía — las plagas no desaparecen en recesión. 24 años consecutivos de crecimiento de revenue. Revenue de $3.8B (+11% YoY). EPS creciendo 13% anual. Morningstar 'Wide Moat' por ventajas de costo y marca Orkin. Su sistema BOSS optimiza rutas y reduce costos. 35 años pagando dividendo sin interrupción.",
    summary_risk:
      "Valuación cara: P/E de 51x (industria promedio 25x). Q4 2025 falló estimados por clima invernal temprano. Estacionalidad fuerte — gana más en verano. Necesita ejecutar impecablemente para justificar el precio.",
    research_full: `# Rollins, Inc. (ROL) — Research Completo

## Precio: $55.33 | P/E: 50.8 | P/E Forward: 39.3 | Div Yield: 1.32% | Market Cap: $26.6B

---

## ¿Qué es Rollins?

Rollins es la **segunda empresa de control de plagas más grande del mundo** (detrás de Rentokil Initial). Su marca estrella es **Orkin**, que es sinónimo de control de plagas en Estados Unidos — como Kleenex es a los pañuelos.

En términos simples: si tienes cucarachas, termitas, ratas, mosquitos, o cualquier bicho no deseado en tu casa o negocio, llamas a una de las marcas de Rollins y ellos lo resuelven.

## Marcas y Subsidiarias

| Marca | Especialidad |
|-------|-------------|
| **Orkin** | Control de plagas #1 en EE.UU. (residencial y comercial) |
| **HomeTeam Pest Defense** | Control de plagas en comunidades residenciales nuevas |
| **Clark Pest Control** | Líder en California |
| **Northwest Exterminating** | Sureste de EE.UU. |
| **Western Pest Services** | Noreste de EE.UU. |
| **Critter Control** | Control de vida silvestre (mapaches, ardillas, etc.) |
| **Trutech Wildlife Service** | Remoción de animales |
| **ABC Home & Commercial** | Texas y Florida |
| **Orkin Canada** | Operaciones canadienses |
| **Safeguard** | Australia |

## Modelo de Negocio

Rollins gana dinero de dos formas:
1. **Contratos recurrentes** — la mayoría de clientes pagan mensual o trimestralmente por servicio continuo de prevención. Revenue predecible.
2. **Servicios puntuales** — llamadas por infestaciones, tratamientos de termitas, fumigaciones.

~80% del revenue es recurrente. Las plagas no desaparecen — los clientes renuevan año tras año.

### Estrategia de Crecimiento: Tuck-in Acquisitions
Rollins crece comprando empresas locales pequeñas de pest control e integrándolas bajo sus marcas. Es un mercado muy fragmentado — miles de operadores locales. Rollins los compra, les da la tecnología y marca Orkin, y mejora sus márgenes.

## Resultados 2025

| Métrica | 2025 | vs 2024 |
|---------|------|---------|
| **Revenue** | $3.8B | **+11%** |
| **Operating Income** | $726M | **+10.5%** |
| **Adjusted EBITDA** | $854M | **+10.8%** |
| **Adjusted EPS** | $1.12 | **+13.1%** |

- **24 años consecutivos de crecimiento de revenue**
- Q4 2025 fue débil por clima invernal temprano que redujo demanda estacional

## Ventaja Competitiva (Wide Moat — Morningstar)

Morningstar otorga a Rollins un **"Wide Moat"** (ventaja competitiva amplia) por dos razones:

1. **Ventaja de costos por escala** — la densidad de rutas locales permite repartir costos fijos entre más clientes. Más clientes en un área = menos costo por visita.
2. **Marca Orkin** — reconocimiento de marca líder en la industria. La gente busca "Orkin" cuando tiene plagas, no "control de plagas". Esto reduce el costo de adquisición de clientes.

El sistema **BOSS** (Branch Operating Support System) optimiza rutas, programa técnicos, y gestiona costos — es su arma secreta operativa.

## Dividendo

- **Dividendo anual:** $0.73/acción
- **Yield:** 1.32%
- **35 años consecutivos** pagando dividendo (desde 1991)
- **6 años consecutivos** de aumentos
- Payout ratio: ~65%

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Hold / Mixed** |
| Price Target Promedio | ~$52-55 |
| Morningstar Rating | Wide Moat |
| Morningstar Fair Value | Overvalued a precios actuales |

Los analistas reconocen la calidad del negocio pero la valuación (P/E 51x) limita el upside.

## ¿Por Qué Nos Gusta?

1. **Servicio esencial** — las plagas no entienden de recesiones. Demanda estable siempre
2. **Revenue 80% recurrente** — contratos mensuales/trimestrales. Predecible
3. **24 años de crecimiento** — nunca ha tenido un año de revenue a la baja en 24 años
4. **Wide Moat de Morningstar** — ventaja competitiva reconocida por la mejor firma de análisis
5. **Marca Orkin** — la más reconocida en pest control del mundo
6. **Mercado fragmentado** — miles de empresas pequeñas por adquirir. Runway de crecimiento enorme
7. **35 años de dividendo** — consistencia probada

## Riesgos

1. **Valuación cara** — P/E de 51x es el doble del promedio de la industria (25x). Cualquier decepción castiga fuerte
2. **Estacionalidad** — gana mucho más en primavera/verano. Q1 y Q4 son débiles
3. **Clima** — un invierno temprano o verano frío reduce demanda. Q4 2025 ya lo demostró
4. **Competencia** — Rentokil (tras comprar Terminix) es más grande. Presión competitiva
5. **Dependencia de mano de obra** — necesitan miles de técnicos. Escasez de trabajadores puede presionar salarios
6. **Morningstar dice "overvalued"** — reconocen el moat pero dicen que el precio ya lo refleja

---

*Research fecha: 16 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Hold",
    analyst_target: 53.0,
    analyst_upside: -4.0,
    status: "active",
    first_researched_at: "2026-03-16T00:00:00Z",
    last_updated_at: "2026-03-16T00:00:00Z",
    next_review_at: "2026-09-16T00:00:00Z",
  },
  {
    id: 15,
    ticker: "GFI",
    name: "Gold Fields Limited",
    sector: "Materials",
    industry: "Gold Mining",
    country: "South Africa",
    region: "Africa / Global",
    currency: "USD",
    price: 47.72,
    pe_ratio: 12.11,
    pe_forward: 8.46,
    dividend_yield: 5.09,
    market_cap_b: 42.7,
    eps: 3.99,
    summary_short:
      "Minera de oro sudafricana con minas en 5 países. Profit se triplicó en 2025 a $3.57B. Dividendo del 5.1% + dividendo especial + recompra de acciones = $1.7B devueltos al accionista. El oro está en máximos históricos por demanda de bancos centrales.",
    summary_what:
      "Gold Fields extrae oro de minas en Sudáfrica, Ghana, Australia, Perú y Chile. Producen 2.44 millones de onzas al año. También están construyendo una nueva mina en Canadá (Windfall) que arranca a finales de 2026. El oro es el refugio universal contra inflación, incertidumbre y devaluación de monedas — los bancos centrales del mundo están comprando cantidades récord.",
    summary_why:
      "Profit se triplicó de $1.25B a $3.57B en 2025. Free cash flow de $2.97B (5x más que 2024). P/E de 12x con forward de 8.5x — baratísima. Dividendo del 5.1% más dividendo especial. Devolvieron $1.7B al accionista. Nueva mina Windfall en Canadá (300K oz/año a costo ultra bajo de $758/oz). Oro en máximos con JP Morgan proyectando $5,055/oz para Q4 2026.",
    summary_risk:
      "El precio del oro puede caer si la incertidumbre global disminuye. Riesgo geopolítico en Sudáfrica (electricidad, regulación) y Ghana. Minería es inherentemente peligrosa y costosa. Acción volátil: rango 52 semanas de $19 a $62.",
    research_full: `# Gold Fields Limited (GFI) — Research Completo

## Precio: $47.72 | P/E: 12.1 | P/E Forward: 8.5 | Div Yield: 5.1% | Market Cap: $42.7B

---

## ¿Qué es Gold Fields?

Gold Fields es una de las **mineras de oro más grandes del mundo**, con sede en Johannesburgo, Sudáfrica. Extraen oro de minas subterráneas y a cielo abierto en 5 países. Es simple: sacan oro de la tierra, lo refinan, y lo venden al precio de mercado.

## Minas y Operaciones

| Mina | País | Tipo | Producción aprox |
|------|------|------|-----------------|
| **South Deep** | Sudáfrica | Subterránea (3.2km profundidad) | ~280-305K oz/año |
| **Tarkwa** | Ghana | Cielo abierto | ~500K oz/año |
| **Damang** | Ghana | Cielo abierto | ~150K oz/año |
| **St Ives** | Australia | Mixta | ~400K oz/año |
| **Granny Smith** | Australia | Subterránea | ~300K oz/año |
| **Agnew** | Australia | Subterránea | ~200K oz/año |
| **Cerro Corona** | Perú | Cielo abierto (oro + cobre) | ~150K oz/año |
| **Salares Norte** | Chile | Cielo abierto (nueva) | Ramp-up en 2025 |
| **Windfall** | Canadá (Quebec) | Subterránea (en construcción) | ~300K oz/año (desde 2027) |

**Producción total 2025:** 2.44 millones de onzas (+18% YoY)
**AISC (costo todo incluido):** $1,645/oz

## Resultados 2025 — Récord Histórico

| Métrica | 2024 | 2025 | Cambio |
|---------|------|------|--------|
| **Profit** | $1.25B | $3.57B | **+186%** |
| **EPS** | ~$1.40 | $3.99 | **+185%** |
| **Free Cash Flow** | $605M | $2.97B | **+391%** |
| **Producción** | 2.07M oz | 2.44M oz | **+18%** |
| **AISC** | $1,629/oz | $1,645/oz | +1% |

## Capital Return — $1.7 Mil Millones al Accionista

Gold Fields anunció un programa de retorno de capital masivo:
- **Dividendo final:** 1,850 SA centavos/acción
- **Dividendo especial:** 450 SA centavos/acción
- **Recompra de acciones:** $100M
- **Total:** $1.7B (54% del free cash flow ajustado)

## El Catalizador: Oro en Máximos Históricos

El precio del oro está en niveles récord por múltiples factores:
- **Bancos centrales comprando récord** — 585 toneladas/trimestre en 2026
- **Incertidumbre geopolítica** — guerras, tensiones comerciales, deuda de EE.UU.
- **Inflación persistente** — el oro es la cobertura clásica contra inflación
- **JP Morgan proyecta $5,055/oz** para Q4 2026 (actualmente ~$2,900-3,000/oz)

## Proyecto Windfall (Canadá) — El Futuro

Gold Fields compró Osisko Mining en 2024 por C$1.93B, obteniendo 100% del proyecto Windfall en Quebec:
- **Reservas:** 3.2M oz a 8.1 g/t (grado altísimo — top 10 global)
- **Producción esperada:** ~300K oz/año
- **AISC esperado:** $758/oz (menos de la mitad del promedio de la empresa)
- **Inicio:** Finales de 2026 / inicio 2027
- **Alimentado por hidroelectricidad** — huella de carbono baja

## ¿Por Qué Nos Gusta?

1. **Profit se triplicó** — de $1.25B a $3.57B. Free cash flow 5x mayor
2. **Dividendo del 5.1%** + dividendo especial + recompras = $1.7B devueltos
3. **P/E de 12x, forward de 8.5x** — baratísima para lo que genera
4. **Oro en máximos** — bancos centrales comprando récord, JP Morgan ve $5,055/oz
5. **Diversificación geográfica** — 5 países, no depende de un solo lugar
6. **Windfall** — nueva mina en Canadá de bajo costo va a aumentar producción y bajar AISC
7. **Cobertura contra inflación** — el oro sube cuando todo lo demás baja

## Riesgos

1. **Dependencia del precio del oro** — si el oro cae, Gold Fields cae más fuerte (apalancamiento operativo)
2. **Sudáfrica** — problemas de electricidad (loadshedding), regulación minera, inestabilidad política
3. **Ghana** — riesgo geopolítico, regulación cambiante
4. **Volatilidad extrema** — rango 52 semanas de $19.21 a $61.64. No es para cardíacos
5. **Costos de minería suben** — energía, mano de obra, equipos. AISC puede aumentar
6. **Windfall capex alto** — C$1.7-1.9B de inversión, riesgo de sobrecostos
7. **Dividendo variable** — depende del precio del oro y del cash flow, no es fijo

---

*Research fecha: 16 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 55.0,
    analyst_upside: 15.0,
    status: "active",
    first_researched_at: "2026-03-16T00:00:00Z",
    last_updated_at: "2026-03-16T00:00:00Z",
    next_review_at: "2026-09-16T00:00:00Z",
  },
  {
    id: 16,
    ticker: "WAL",
    name: "Western Alliance Bancorporation",
    sector: "Financials",
    industry: "Regional Banking",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 68.16,
    pe_ratio: 7.81,
    pe_forward: 5.75,
    dividend_yield: 2.48,
    market_cap_b: 7.5,
    eps: 8.73,
    summary_short:
      "Banco comercial especializado en nichos de alto crecimiento (tech, startups, real estate). Sobrevivió la crisis de SVB en 2023 y reportó récord de ingresos en 2025 con EPS +23%. Forward P/E de 5.75x con ROE de 16.9% — baratísimo para la calidad que ofrece.",
    summary_what:
      "Western Alliance es un banco comercial regional de EE.UU. que opera diferente a los bancos tradicionales: en lugar de sucursales, se especializa en líneas de negocio verticales para industrias específicas — tecnología, startups, capital privado, legal, gaming, real estate y warehouse lending. Con $93B en activos, son el banco #1 para PYMEs en el suroeste de EE.UU.",
    summary_why:
      "Crecieron depósitos $15B en 2025 tras recuperarse de la crisis de SVB. Q4 2025: revenue +17% YoY, EPS $2.59 (+33% YoY), ROE de 16.9%. Proyectan +$6B en préstamos y +$8B en depósitos para 2026. Su modelo de banca especializada genera márgenes superiores (NIM 3.51%) y son líderes nacionales en warehouse lending.",
    summary_risk:
      "Van a cruzar los $100B en activos en 2-3 años, lo que trae regulación más estricta. Exposición a sectores cíclicos como tech y real estate. Memoria fresca de la crisis bancaria de 2023 cuando perdieron $9.5B en depósitos en días.",
    research_full: `# Western Alliance Bancorporation (WAL) — Research Completo

## Precio: $68.16 | P/E: 7.8 | P/E Forward: 5.75 | Div Yield: 2.48% | Market Cap: $7.5B

---

## ¿Qué es Western Alliance?

Western Alliance Bancorporation es un **banco comercial regional** con sede en Phoenix, Arizona, que opera de forma completamente diferente a los bancos tradicionales. En lugar de tener cientos de sucursales físicas, **se especializan en líneas de negocio verticales** dirigidas a industrias específicas: tecnología, startups financiadas por VCs, legal, gaming, hospitality, real estate construction, y warehouse lending (préstamos para originadores de hipotecas).

Con **$93 mil millones en activos** (Q4 2025) y presencia en mercados clave como California, Nueva York, Texas y Nevada, Western Alliance es el banco #1 para PYMEs en el suroeste de Estados Unidos según Global Finance.

## Modelo de Negocio — Banca Especializada

Western Alliance no compite por clientes retail ni tiene cajeros automáticos. Su modelo es **"banca de relación especializada"**:

- Loan Production Offices (LPOs) en lugar de sucursales retail
- Equipos especializados por industria con deep expertise
- Relaciones directas con CFOs, founders de startups, firmas legales y desarrolladores inmobiliarios

### Líneas de Negocio Especializadas

| Línea | Descripción |
|-------|-------------|
| **Tech & Innovation** | Banca para startups, VC-backed companies, fintech |
| **Mortgage Warehouse Lending** | Préstamos corto plazo para originadores de hipotecas — **líderes nacionales** |
| **Juris Banking** | Especializado en firmas legales |
| **Gaming Finance** | Casinos y hospitality |
| **Private Equity & VC** | Banking para fondos de inversión |
| **Real Estate Construction** | Préstamos para desarrollos comerciales y multifamily |
| **Healthcare & Life Sciences** | Biotech, dispositivos médicos |

## Resultados Q4 2025 y Full Year 2025

### Q4 2025

| Métrica | Q4 2025 | Q4 2024 | Cambio |
|---------|---------|---------|--------|
| **EPS** | $2.59 | $1.95 | **+33%** |
| **Revenue** | $976.2M | $833M | **+17%** |
| **Net Interest Income** | $766.2M | $666M | **+15%** |
| **NIM** | 3.51% | 3.48% | +3 bps |
| **ROA** | 1.23% | — | — |
| **ROTCE** | 16.9% | — | — |

### Full Year 2025 — Récords Históricos

- **Net Interest Income: $2.9B** — récord
- **Net Revenue: $3.5B** — récord
- **Full Year EPS: $8.73** (+23% vs 2024)
- **Activos Totales: $93B**
- **Deposit Growth: $15B+** desde los mínimos post-SVB

## La Crisis de SVB y la Recuperación Épica

### Marzo 2023: La Pesadilla

Cuando Silicon Valley Bank (SVB) colapsó, Western Alliance fue golpeado por el pánico:

- **$9.5B en fuga de depósitos** en 48 horas
- Acción cayó -75% en días
- El mercado lo daba por muerto

### 2024-2025: La Recuperación

- **$15B+ en nuevos depósitos** recuperados
- Management demostró que el modelo es sólido
- El pánico fue irracional — los fundamentales nunca estuvieron en riesgo

## Guidance 2026

- **Loan Growth: +$6B** (lidera el peer group)
- **Deposit Growth: +$8B**
- **Net Charge-offs: 25-30 bps** (elevados en H1, mejorando en H2)
- Management espera "otro año de fuerte momentum en earnings"

## Ventajas Competitivas

1. **Especialización en nichos** — warehouse lending (top 3 nacional), tech banking (llenaron vacío de SVB), legal banking
2. **Márgenes superiores** — NIM de 3.51% vs promedio de 3.2% en bancos regionales
3. **Modelo de bajo costo** — sin red de sucursales costosas
4. **ROE de 16.9%** — top tier, promedio del sector es 10-12%

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Strong Buy** |
| # Analistas Buy | 15 |
| # Analistas Hold | 0 |
| # Analistas Sell | 1 |
| Price Target Promedio | **$101** |
| Price Target Alto | $118 |
| Price Target Bajo | $85 |
| **Upside al Target** | **+49%** |

## ¿Por Qué Nos Gusta?

1. **Recuperación post-crisis** — sobrevivió pérdida de $9.5B en depósitos y salió más fuerte
2. **Crecimiento líder** — $6B en loans + $8B en deposits proyectados para 2026
3. **ROE de 16.9%** — uno de los más altos del sector bancario
4. **Forward P/E de 5.75x** — absurdamente barato para esta calidad
5. **EPS creciendo +23%** — momentum fuerte en earnings
6. **Upside de +49%** — analistas ven target de $101 vs precio actual de $68
7. **Dividendo de 2.48%** — income mientras esperas el crecimiento

## Riesgos

1. **Umbral de $100B** — al cruzar esa cifra en 2-3 años, entra regulación más estricta (stress tests CCAR)
2. **Sectores cíclicos** — exposición a tech, real estate y startups que pueden sufrir en recesión
3. **Memoria de SVB** — cualquier señal de estrés en depósitos puede causar pánico
4. **Net charge-offs elevados** — 25-30 bps proyectados en 2026
5. **Competencia en tech banking** — tras SVB, todos quieren este nicho (JPM, First Republic)

---

*Research fecha: 17 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 101.0,
    analyst_upside: 49.0,
    status: "active",
    first_researched_at: "2026-03-17T00:00:00Z",
    last_updated_at: "2026-03-17T00:00:00Z",
    next_review_at: "2026-09-17T00:00:00Z",
  },
  {
    id: 17,
    ticker: "SIEGY",
    name: "Siemens AG",
    sector: "Industrials",
    industry: "Industrial Automation / Infrastructure",
    country: "Germany",
    region: "Europe",
    currency: "USD",
    price: 126.60,
    pe_ratio: 22.02,
    pe_forward: 17.28,
    dividend_yield: 2.50,
    market_cap_b: 197.6,
    eps: 5.75,
    summary_short:
      "Gigante industrial alemán de 177 años líder en automatización, infraestructura inteligente y trenes. Cartera récord de €120B en órdenes pendientes. Crecimiento de 35% en centros de datos por el boom de IA. Dividendo del 2.5% con alianzas con NVIDIA y Microsoft.",
    summary_what:
      "Siemens fabrica tecnología de automatización industrial, infraestructura inteligente para edificios y centros de datos, y sistemas de transporte ferroviario. Opera en tres segmentos: Digital Industries (software y automatización), Smart Infrastructure (edificios, data centers, redes eléctricas) y Mobility (trenes y metros). Con $198B de market cap, es uno de los industriales más grandes del mundo.",
    summary_why:
      "Posicionada para el boom de IA e infraestructura digital — Smart Infrastructure creció 35% en centros de datos con €1,800M en contratos en EE.UU. Cartera récord de €120B en órdenes garantiza ingresos futuros. Q1 2026: órdenes +10%, revenue +8%, margen industrial 15.6%. Alianzas con NVIDIA y Microsoft para IA industrial. Elevaron guía de EPS para FY2026.",
    summary_risk:
      "Competencia intensa de Schneider Electric, ABB y gigantes tech entrando al mercado industrial. Efectos cambiarios adversos pesan sobre el crecimiento. El spin-off planeado del 30% de Siemens Healthineers puede generar volatilidad.",
    research_full: `# Siemens AG (SIEGY) — Research Completo

## Precio: $126.60 | P/E: 22.0 | P/E Forward: 17.3 | Div Yield: 2.5% | Market Cap: $197.6B

---

## ¿Qué es Siemens?

Siemens AG es una **potencia industrial alemana de 177 años** que se ha reinventado como líder en tecnología industrial digital. Desarrolla y fabrica sistemas de automatización, infraestructura inteligente para edificios y redes eléctricas, y tecnología de transporte ferroviario.

A diferencia de un fabricante industrial tradicional, Siemens combina equipos físicos con software avanzado, gemelos digitales e inteligencia artificial industrial.

## Segmentos de Negocio

| Segmento | Descripción | Crecimiento Guía FY2026 | Margen Esperado |
|----------|-------------|------------------------|-----------------|
| **Digital Industries** | Software de automatización, controladores, manufactura digital | 5% - 10% | 15% - 19% |
| **Smart Infrastructure** | Edificios inteligentes, centros de datos, redes eléctricas | 6% - 9% | 18% - 19% |
| **Mobility** | Trenes, metros, señalización ferroviaria | 8% - 10% | Sólido |

### Participaciones Estratégicas
- **Siemens Healthineers** — 67% de participación (plan de deconsolidar 30% en 2026)
- **Siemens Energy** — ya separada como empresa independiente

## Resultados FY2025 (terminó Sept 2025)

| Métrica | Valor |
|---------|-------|
| **Ingresos** | €78.9B (+4%) |
| **Órdenes** | €88.4B |
| **Utilidad Industrial** | €11.8B (+3%) — récord |
| **Free Cash Flow** | Récord histórico |
| **Book-to-bill** | 1.12 |

## Q1 FY2026 (Oct-Dic 2025)

| Métrica | Valor | Cambio |
|---------|-------|--------|
| **Órdenes** | €21.4B | **+10% comparable** |
| **Ingresos** | €19.1B | **+8% comparable** |
| **Utilidad Industrial** | €2.9B | — |
| **Margen** | 15.6% | Sólido |
| **Cartera de órdenes** | €120B | **Récord histórico** |

### Guía Elevada FY2026
- **EPS:** €10.70 - €11.10 (subida desde €10.40 - €11.00)
- **Crecimiento revenue:** 6% - 8%

## El Boom de Centros de Datos

Smart Infrastructure está en modo cohete:
- **+35% de crecimiento** en soluciones de centros de datos
- **€1,800M en contratos** en EE.UU. para infraestructura de IA y cloud
- La IA necesita data centers → data centers necesitan infraestructura eléctrica → Siemens provee eso

## Alianzas Estratégicas
- **NVIDIA** — integración de IA en procesos industriales
- **Microsoft** — gemelos digitales y automatización con Azure
- Desarrollando **fábricas autónomas** con IA como control central

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| # Analistas Buy | 16 |
| # Analistas Hold | 5 |
| # Analistas Sell | 3 |
| Price Target Promedio | **~$140** |
| **Upside al Target** | **+10.5%** |

## ¿Por Qué Nos Gusta?

1. **Boom de IA = boom para Siemens** — la infraestructura detrás de la IA es exactamente donde son fuertes
2. **Cartera récord de €120B** — órdenes pendientes garantizan ingresos para años
3. **Smart Infrastructure creciendo 35%** en data centers
4. **Alianzas con NVIDIA y Microsoft** — validan la estrategia de IA industrial
5. **Márgenes industriales de 15.6%** — negocio rentable y mejorando
6. **Dividendo del 2.5%** — income estable
7. **Diversificación global** — Europa, Asia, EE.UU.

## Riesgos

1. **Competencia intensa** — Schneider Electric, ABB, y gigantes tech atacan el mercado
2. **Efectos cambiarios** — Siemens advirtió sobre cargas sustanciales de tipo de cambio en FY2026
3. **Exposición geopolítica** — opera en todo el mundo, vulnerable a restricciones comerciales
4. **Spin-off de Healthineers** — deconsolidación del 30% es compleja, puede generar volatilidad
5. **P/E de 22x** — no es barata, necesita ejecutar bien
6. **Mobility más débil** — el segmento de trenes desaceleró

---

*Research fecha: 17 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 140.0,
    analyst_upside: 10.5,
    status: "active",
    first_researched_at: "2026-03-17T00:00:00Z",
    last_updated_at: "2026-03-17T00:00:00Z",
    next_review_at: "2026-09-17T00:00:00Z",
  },
  {
    id: 18,
    ticker: "AXAHY",
    name: "AXA SA",
    sector: "Financials",
    industry: "Insurance (Life, P&C, Health)",
    country: "France",
    region: "Europe",
    currency: "USD",
    price: 45.09,
    pe_ratio: 8.41,
    pe_forward: 8.70,
    dividend_yield: 5.39,
    market_cap_b: 94.3,
    eps: 5.36,
    summary_short:
      "Aseguradora global #1 de Europa con 92 millones de clientes en 50 países. P/E forward de solo 8.7x con dividendo del 5.4% y política de devolver 75% del profit al accionista. Plan estratégico 2024-2026 apunta al rango alto de crecimiento de EPS del 6-8%.",
    summary_what:
      "AXA es una de las aseguradoras más grandes del mundo. Opera en seguros de propiedad y casualidad (autos, hogar, responsabilidad), seguros de vida y ahorro, seguros de salud, y gestión de activos. AXA XL es su brazo de líneas comerciales/specialty a nivel global. Con 156,000 empleados y presencia en ~50 países, es un gigante financiero diversificado.",
    summary_why:
      "Cotiza a solo 8.7x forward P/E — absurdamente barata para una aseguradora global dominante. Dividendo del 5.4% respaldado por una política disciplinada de 75% de payout total (60% dividendo + recompras anuales). El plan 'Unlock the Future' 2024-2026 apunta al rango alto de crecimiento de EPS del 6-8%. ROE objetivo del 14-16% y beta de solo 0.65 — compounding defensivo con upside real.",
    summary_risk:
      "Catástrofes naturales por cambio climático pueden aumentar costos de siniestros significativamente, especialmente en AXA XL. Regulación compleja en 50+ jurisdicciones.",
    research_full: `# AXA SA (AXAHY) — Research Completo

## Precio: $45.09 | P/E: 8.4 | P/E Forward: 8.7 | Div Yield: 5.4% | Market Cap: $94.3B

---

## ¿Qué es AXA?

AXA SA es una de las **aseguradoras más grandes del mundo** y la **#1 de Europa**. Con sede en París, Francia, opera en ~50 países con 92 millones de clientes y 156,000 empleados. Ofrece seguros de propiedad, vida, salud, y gestión de activos.

## Segmentos de Negocio

| Segmento | Descripción | Presencia |
|----------|-------------|-----------|
| **France** | Seguros P&C, vida, salud — mercado doméstico | Francia |
| **Europe** | Operaciones en Alemania, Suiza, Bélgica, Italia, España, UK, Irlanda | Europa Continental + UK |
| **AXA XL** | Líneas comerciales y specialty (reaseguro, grandes riesgos) | Global (principalmente EE.UU.) |
| **Asia** | Seguros de vida, salud, P&C | Japón, Hong Kong, Tailandia |
| **Africa & EME-LATAM** | Mercados emergentes | África, Medio Oriente, Latam |
| **AXA Investment Managers** | Gestión de activos institucional | Global |

## Resultados 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | ~€110B+ |
| **Underlying Earnings** | Crecimiento sólido vs 2024 |
| **ROE** | ~15% (dentro del objetivo 14-16%) |
| **Solvency II Ratio** | ~220% (muy bien capitalizado) |
| **Free Cash Flow** | Fuerte generación orgánica |

## Plan Estratégico "Unlock the Future" 2024-2026

- **EPS CAGR objetivo:** 6-8% (guiando al rango alto para 2026)
- **ROE objetivo:** 14-16%
- **Payout total:** 75% del profit (60% dividendo + recompras)
- **Generación de caja orgánica:** €21B acumulados 2024-2026
- **Foco:** Crecimiento en P&C comercial, plataforma digital, salud y employee benefits

## Capital Return — Muy Generoso

- **Dividendo forward:** $2.44/acción (5.4% yield)
- **Política:** 75% de payout total
- **Recompras anuales** complementan el dividendo
- **Yield total al accionista:** ~7-8% anual estimado

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Strong Buy** |
| Price Target Promedio | **$49.34** |
| Price Target Alto | $58.26 |
| Price Target Bajo | $44.00 |
| **Upside al Target** | **+9.4%** |

## ¿Por Qué Nos Gusta?

1. **P/E forward de 8.7x** — ridículamente barata para la aseguradora #1 de Europa
2. **Dividendo del 5.4%** — uno de los más altos del portafolio, bien cubierto
3. **75% de payout total** — política disciplinada de devolver dinero al accionista
4. **Beta de 0.65** — menos volátil que el mercado, compounding defensivo
5. **ROE del 14-16%** — generación de valor superior
6. **Diversificación global** — 50 países, 92M clientes, múltiples líneas de negocio
7. **€21B en generación de caja** en 3 años — máquina de cash

## Riesgos

1. **Catástrofes naturales** — el cambio climático aumenta frecuencia y severidad de siniestros
2. **Regulación compleja** — opera en 50+ jurisdicciones con reglas diferentes
3. **Tasas de interés** — caídas en tasas pueden afectar rendimientos de inversión
4. **AXA XL volatilidad** — líneas comerciales/specialty son cíclicas
5. **Exposición a mercados emergentes** — riesgo político y cambiario

---

*Research fecha: 18 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 49.34,
    analyst_upside: 9.4,
    status: "active",
    first_researched_at: "2026-03-18T00:00:00Z",
    last_updated_at: "2026-03-18T00:00:00Z",
    next_review_at: "2026-09-18T00:00:00Z",
  },
  {
    id: 19,
    ticker: "B",
    name: "Barrick Mining",
    sector: "Materials",
    industry: "Gold Mining",
    region: "North America",
    country: "Canada",
    currency: "USD",
    price: 37.40,
    dividend_yield: 4.15,
    pe_ratio: 12.76,
    pe_forward: 8.61,
    eps: 2.93,
    market_cap_b: 63.0,
    summary_short: "Una de las mineras de oro y cobre más grandes del mundo. 3.26M oz de oro y 220K ton de cobre en 2025. Revenue de $16.96B.",
    summary_what: "Barrick Mining (antes Barrick Gold) extrae oro y cobre en 17 países. Opera Nevada Gold Mines (JV con Newmont), Pueblo Viejo (Rep. Dominicana), Loulo-Gounkoto (Mali), Lumwana (Zambia), y está construyendo el megaproyecto Reko Diq en Pakistán.",
    summary_why: "Márgenes enormes con oro a $5,000+/oz (AISC de $1,637/oz). Free cash flow creció 194% a $3.87B. Nueva política de dividendo: 50% del FCF. Pipeline de crecimiento único: Reko Diq (cobre-oro), Lumwana Super Pit, y Fourmile (Nevada). Producción +30% hacia 2030.",
    summary_risk: "100% expuesto al precio del oro sin cobertura. Opera en jurisdicciones de alto riesgo político (Mali, Pakistán, DRC). Disputa con Newmont por la IPO de activos norteamericanos podría bloquear un catalizador clave.",
    research_full: `# Barrick Mining Corporation (B) — Research Completo

## Precio: $37.40 | P/E: 12.8 | P/E Forward: 8.6 | Div Yield: 4.15% | Market Cap: $63B

---

## Qué es Barrick?

Barrick Mining Corporation (antes Barrick Gold, ticker GOLD; renombrada mayo 2025, nuevo ticker NYSE: B) es una de las **mineras de oro y cobre más grandes del mundo**. Opera minas en 17 países incluyendo EE.UU., Canadá, Zambia, Pakistán, Mali, Tanzania, y República Dominicana. Produjo 3.26 millones de onzas de oro y 220,000 toneladas de cobre en 2025 con revenue de $16.96 mil millones.

El cambio de nombre refleja la evolución de Barrick de una compañía puramente de oro a una minera diversificada con una creciente cartera de cobre.

## Minas y Operaciones Principales

| Operación | País | Producto | Notas |
|-----------|------|----------|-------|
| **Nevada Gold Mines** (61.5%) | EE.UU. | Oro | JV con Newmont (38.5%). Incluye Carlin, Cortez, Turquoise Ridge, Goldstrike |
| **Pueblo Viejo** | Rep. Dominicana | Oro | Record de throughput en 2025. Expansión en progreso |
| **Loulo-Gounkoto** | Mali | Oro | Resuelta disputa con gobierno de Mali (feb 2026). Producción 2026: 260-290K oz |
| **Lumwana** | Zambia | Cobre | Expansión "Super Pit" de $2B. Duplicará producción a 240K ton/año para 2027 |
| **Reko Diq** | Pakistán | Cobre + Oro | Megaproyecto. Fase 1 en 2028. Producirá 460K ton Cu + 520K oz Au al año |
| **Fourmile** | EE.UU. (Nevada) | Oro | 100% Barrick. Grados el doble que Goldrush. Potencial mina Tier One |

**Producción 2025:** 3.26M oz oro + 220K ton cobre
**Guía 2026:** 2.90-3.25M oz oro + 190-220K ton cobre
**AISC 2025:** $1,637/oz

## Resultados Financieros 2025 — Año Récord

| Métrica | 2024 | 2025 | Cambio |
|---------|------|------|--------|
| **Revenue** | $12.92B | $16.96B | **+31%** |
| **Net Earnings** | $2.14B ($1.22/acción) | $4.99B ($2.93/acción) | **+133%** |
| **Operating Cash Flow** | $4.49B | $7.69B | **+71%** |
| **Free Cash Flow** | $1.32B | $3.87B | **+194%** |
| **Operating Margin** | ~38% | **50%** | +12pp |

## Exposición al Precio del Oro

Barrick NO cubre (hedge) su producción — está 100% expuesto al precio spot del oro.

- **Precio actual del oro:** ~$5,000+/oz
- **AISC de Barrick:** $1,637/oz
- **Margen por onza:** ~$3,400+ (margen operativo enorme)
- **JP Morgan proyecta:** $6,300/oz para fin de 2026
- **Drivers:** Compra récord de bancos centrales, geopolítica, inflación, deuda de EE.UU.

Cada $100/oz de aumento en el precio del oro agrega ~$326M en revenue anual adicional.

## Dividendo — Política Nueva y Generosa

**Nueva política (desde Q4 2025):** Dividendo base fijo de $0.175/trimestre ($0.70/año) + componente de performance basado en 50% del FCF anual. A precios actuales del oro, el payout total podría ser significativamente mayor.

**Buybacks 2025:** $1.5B en recompras (51.9M acciones, ~3% del float).

## Catalizadores de Crecimiento

1. **Reko Diq (Pakistán)** — Megaproyecto cobre-oro. Primera producción 2028. Top 10 depósito de cobre del mundo.
2. **Lumwana Super Pit (Zambia)** — Expansión de $2B. Duplica producción de cobre para 2027.
3. **Fourmile (Nevada)** — 100% Barrick. Grados superiores a Goldrush. Potencial Tier One.
4. **IPO de activos norteamericanos** — Valoración potencial de ~$42B. Pero Newmont ejerce derechos de bloqueo.
5. **Loulo-Gounkoto reinicio** — Disputa con Mali resuelta. 260-290K oz adicionales en 2026.
6. **Objetivo +30% de producción para 2030.**

## Posición Competitiva

| Métrica | Barrick (B) | Newmont (NEM) | Gold Fields (GFI) |
|---------|-------------|---------------|-------------------|
| **Producción oro** | 3.26M oz | ~5.5M oz | 2.44M oz |
| **Market Cap** | $63B | ~$80B+ | $42.7B |
| **P/E** | 12.8x | ~15-16x | 12.1x |
| **Dividend Yield** | 4.15% | ~2-2.5% | 5.1% |
| **Cobre exposure** | SI (fuerte) | Limitada | Limitada |

**Ventaja principal de Barrick:** Única major con exposición significativa y creciente a cobre + mayor pipeline de crecimiento orgánico.

## Riesgos Principales

1. **Dependencia del precio del oro** — Sin hedge. Si el oro cae, los márgenes caen más fuerte
2. **Riesgo jurisdiccional** — Mali (confiscación previa), Pakistán, DRC
3. **Disputa con Newmont** — Podría bloquear la IPO de NewCo
4. **AISC guía 2026 más alta** — $1,760-1,950/oz, 7-19% más que 2025
5. **Ejecución de megaproyectos** — Reko Diq ($7B+) y Lumwana ($2B) con riesgo de sobrecostos

## Conclusión

Barrick Mining es una apuesta de alta convicción al oro y cobre con un pipeline de crecimiento que ningún otro major gold miner tiene. Márgenes enormes ($3,400+/oz), crecimiento de producción del 30% hacia 2030, diversificación hacia cobre, y política generosa de retorno al accionista (50% del FCF). Cotiza a 8.6x forward earnings — la más barata del portafolio. Consenso: Strong Buy, +47% upside.

---

*Research fecha: 19 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 55.25,
    analyst_upside: 47.7,
    status: "active",
    first_researched_at: "2026-03-19T00:00:00Z",
    last_updated_at: "2026-03-19T00:00:00Z",
    next_review_at: "2026-09-19T00:00:00Z",
  },
  {
    id: 20,
    ticker: "BABA",
    name: "Alibaba Group",
    sector: "Technology",
    industry: "E-Commerce / Cloud Computing",
    country: "China",
    region: "Asia",
    currency: "USD",
    price: 122.41,
    pe_ratio: 22.25,
    pe_forward: 15.87,
    dividend_yield: 0.83,
    market_cap_b: 298.6,
    eps: 5.62,
    summary_short:
      "El gigante del e-commerce y cloud de China. Taobao, Tmall, Alibaba Cloud, Alipay. 800M+ de usuarios activos y el cloud #1 de China con AI creciendo triple dígito.",
    summary_what:
      "Alibaba es la empresa de e-commerce más grande del mundo por volumen y el proveedor de cloud #1 de China. Opera Taobao (C2C), Tmall (B2C), Alibaba Cloud + DingTalk, AliExpress (internacional), Ele.me (delivery), y Cainiao (logística). Sus modelos de IA open-source Qwen tienen 600M+ descargas.",
    summary_why:
      "Cloud creciendo 36% con AI en triple dígito por 10 trimestres. Invirtiendo $52B en infraestructura AI en 3 años. Forward P/E de 16x — precio de value stock para la empresa de AI/cloud más grande de China. Analistas ven +35% de upside. Balance sólido: $52B en cash, deuda baja.",
    summary_risk:
      "Riesgo geopolítico China-EE.UU. siempre presente. Pentágono lo añadió brevemente a lista militar (luego lo retiró). FCF temporalmente negativo por el ciclo de inversión masivo en AI. Market share de e-commerce bajó de 52% a 41% por PDD y Douyin.",
    research_full: `# Alibaba Group (BABA) — Research Completo

## Precio: $122.41 | P/E: 22.3 | P/E Forward: 15.9 | Div Yield: 0.83% | Market Cap: $299B

---

## ¿Qué es Alibaba?

Alibaba Group es la **empresa de e-commerce más grande del mundo** por volumen de mercancía y el **proveedor de cloud #1 de China**. Fundada en 1999 por Jack Ma, opera las plataformas Taobao y Tmall que juntas tienen más de 800 millones de usuarios activos mensuales.

## Segmentos de Negocio

| Segmento | Descripción | Revenue Q3 FY2026 |
|----------|-------------|-------------------|
| **China Commerce (Taobao/Tmall)** | E-commerce B2C y C2C, #1 en China | RMB 159.3B (+6%) |
| **Cloud Intelligence** | Alibaba Cloud + DingTalk + AI | RMB 43.3B (+36%) |
| **International Commerce** | AliExpress, Lazada, Trendyol | RMB 6.9B (+10%) |
| **Local Services** | Ele.me (delivery), quick commerce | RMB 20.8B (+56%) |
| **Cainiao** | Logística — next-day en 90%+ de China | Incluido en otros |

Revenue total Q3 FY2026: RMB 284.8B. Crecimiento like-for-like: +9%.

## La Apuesta de $52B en AI

Este es el dato más importante: Alibaba está invirtiendo **$52 mil millones** en infraestructura de AI y cloud en 3 años — la mayor inversión de cualquier empresa tech china.

- **Cloud AI revenue:** Triple dígito de crecimiento por 10 trimestres consecutivos
- **Qwen (modelos open-source):** 600M+ descargas — el modelo open-source más usado del mundo
- **Token consumption:** 6x aumento en 3 meses
- **Objetivo:** $100B en revenue de AI/cloud para FY2031 (5x actual)

## Financieros Clave

| Métrica | Valor |
|---------|-------|
| **Revenue Q3 FY2026** | RMB 284.8B (~$40B) |
| **Non-GAAP Net Income Q3** | $2.39B |
| **FCF Anual FY2025** | $22.87B |
| **Cash** | $52.47B |
| **Deuda Total** | $42.55B |
| **Cash Neto** | $9.92B ($4.16/acción) |
| **Debt/Equity** | 0.23 (conservador) |
| **Forward EPS FY2027E** | $8.57 (+50% crecimiento) |

**Balance es una fortaleza:** $52B en cash, apalancamiento bajo.

## Dividendo y Retorno al Accionista

- **Dividendo anual:** $1.05/ADS (~0.83% yield)
- **Payout ratio:** 27% (muy sostenible, espacio para crecer)
- **Buyback yield:** 1.69%
- **Total shareholder yield:** ~2.5%
- **Crecimiento dividendo 3 años:** 25.6% CAGR

## Ventajas Competitivas (Moat)

1. **Efectos de red:** 800M+ usuarios + 10M vendedores = marketplace auto-reforzante
2. **Cloud #1 China:** Alibaba Cloud líder con ecosistema Qwen/AI creando lock-in
3. **Cainiao logística:** Next-day delivery en 90%+ del PIB de China
4. **Plataforma publicitaria:** Alto intent de compra = ROI fuerte para vendedores
5. **Alipay/Ant Group:** Infraestructura de pagos trusted

**Erosión del moat:** PDD demostró que social commerce puede capturar market share rápido. El moat de e-commerce es menos durable de lo que se creía. El moat de cloud/AI puede ser más defensible.

## Catalizadores

1. **Cloud 36% crecimiento y acelerando** — Esto solo podría justificar gran parte del market cap
2. **$52B inversión en AI** — All-in en la tecnología más importante de la generación
3. **Anti-Involution Law (AUCL)** — China limita guerras de precios destructivas, favorece a Alibaba
4. **Desinversiones estratégicas** — Vendió Sun Art y Intime para enfocarse en tech/commerce/cloud
5. **Forward P/E 16x** — Precio de value stock con crecimiento de growth stock

## Riesgos Principales

1. **Geopolítica China-EE.UU.** — Pentagon military list, posible delisting, restricciones de chips
2. **FCF temporalmente negativo** — El ciclo de capex de $52B comprime cash flow por 2-3 años
3. **Market share e-commerce bajando** — De 52% (2021) a 41% (2024) por PDD, JD, Douyin
4. **Macro China débil** — Sector inmobiliario, desempleo juvenil, presiones deflacionarias
5. **Regulación impredecible** — Aunque el crackdown tech aflojó, puede volver sin aviso

## Posición Competitiva

| Métrica | Alibaba | PDD | JD.com |
|---------|---------|-----|--------|
| **Market Share China** | ~41% | ~23% | ~18% |
| **Cloud** | #1 China | No | No |
| **AI Investment** | $52B/3 años | Limitado | Limitado |
| **Dividend Yield** | 0.83% | 0% | 2.1% |
| **Forward P/E** | 16x | 11x | 9x |

## Consenso de Analistas

- **Rating:** Strong Buy (8 Buy, 1 Hold, 0 Sell)
- **Price target promedio:** $197-$205
- **Upside implícito:** +60% desde $122
- **Rango targets:** $121 - $285

## Conclusión

Alibaba a $122 es una **compra contrarian de alta convicción** para inversores con horizonte de 2-3 años y tolerancia al riesgo geopolítico. El negocio de cloud/AI solo podría justificar una porción significativa del market cap en 2-3 años. El riesgo principal no es fundamental — es político. Si puedes tolerar el "China discount", el risk/reward está fuertemente sesgado al alza.

---

*Research fecha: 20 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 200.0,
    analyst_upside: 63.4,
    status: "active",
    first_researched_at: "2026-03-20T00:00:00Z",
    last_updated_at: "2026-03-20T00:00:00Z",
    next_review_at: "2026-09-20T00:00:00Z",
  },
  {
    id: 21,
    ticker: "BAC",
    name: "Bank of America",
    sector: "Financials",
    industry: "Diversified Banks",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 47.52,
    pe_ratio: 13.55,
    pe_forward: 10.86,
    dividend_yield: 2.37,
    market_cap_b: 384.0,
    eps: 3.81,
    summary_short:
      "El segundo banco más grande de EE.UU. con $384B de market cap. Consumer banking, wealth management (Merrill Lynch), trading y banca corporativa. Revenue de $113B en 2025, profit de $30.5B.",
    summary_what:
      "Bank of America es uno de los 'Big Four' de la banca estadounidense. Opera en 4 segmentos: Consumer Banking (depósitos, tarjetas, créditos), Wealth Management (Merrill Lynch, Private Bank), Global Markets (trading de equities y renta fija — año récord en 2025), y Global Banking (banca corporativa e investment banking). 66 millones de clientes consumer y small business.",
    summary_why:
      "EPS creció 19% en 2025 a $3.81. Forward P/E de 10.86x — el más barato de los Big Four después de Citi. NII guiado a crecer 5-7% en 2026. Devolvieron $30B al accionista en 2025. Payout ratio de solo 29% — mucho espacio para subir dividendo. Global Markets tuvo su mejor año de la historia.",
    summary_risk:
      "Sensible a tasas de interés — si la Fed corta más de lo esperado, NII se comprime. Riesgo crediticio si la economía desacelera. Propuestas de caps en tasas de tarjetas de crédito afectarían Consumer Banking.",
    research_full: `# Bank of America (BAC) — Research Completo

## Precio: $47.52 | P/E: 13.6 | P/E Forward: 10.9 | Div Yield: 2.37% | Market Cap: $384B

---

## ¿Qué es Bank of America?

Bank of America es el **segundo banco más grande de Estados Unidos** por activos y market cap, solo detrás de JPMorgan Chase. Con más de **66 millones de clientes** consumer y small business, es uno de los pilares del sistema financiero estadounidense.

## Segmentos de Negocio

| Segmento | Revenue FY2025 (est.) | Descripción |
|----------|----------------------|-------------|
| **Consumer Banking** | ~$44B (~39%) | Depósitos, tarjetas de crédito, préstamos, small business |
| **Wealth Management** | ~$25B (~22%) | Merrill Lynch, Private Bank — advisory, brokerage, retirement |
| **Global Markets** | ~$21B (~19%) | Trading de equities y FICC — año récord en 2025 |
| **Global Banking** | ~$23B (~20%) | Banca corporativa, investment banking, treasury services |

## Resultados 2025 (Full Year)

- **Revenue total: $113.1B** (+7% YoY)
- **Net Income: $30.5B** (+13% YoY)
- **EPS: $3.81** (+19% YoY)
- **Net Interest Income: $62B** (+8% YoY)
- **Operating Leverage Q4: +330 bps** — ingresos crecen más rápido que gastos
- **Return to shareholders: $30B** (dividendos + recompras)

### Q4 2025 Highlights:

- Revenue: $28.53B (+7.1% YoY)
- Net Income: $7.6B (+12%)
- EPS: $0.98 (beat estimado de $0.96)
- Investment banking fees: las más altas desde 2020

## Dividendo y Retorno al Accionista

- **Dividendo anual:** $1.12/acción (~2.37% yield)
- **Años consecutivos de aumento:** 13
- **Crecimiento dividendo 5 años:** 8.7% CAGR
- **Payout ratio:** ~29% (muy bajo = mucho espacio para crecer)
- **Total devuelto en 2025:** $30B entre dividendos y buybacks

## Ventajas Competitivas (Moat)

1. **Escala masiva:** 66M de clientes, $3.3T en activos — economías de escala imbatibles
2. **Franchise de depósitos:** Base de depósitos estable y barata — funding advantage vs bancos más chicos
3. **Merrill Lynch:** Brand premium en wealth management con décadas de relaciones
4. **Tecnología:** Uno de los mayores inversores en tech bancaria + AI entre los grandes bancos
5. **Diversificación:** 4 segmentos complementarios reducen ciclicidad

## Catalizadores

1. **NII guiado a crecer 5-7% en 2026** — Incluso con recortes de tasas esperados
2. **Forward P/E de 10.86x** — Más barato que JPM (13.5x), similar a WFC (11.1x)
3. **Operating leverage de ~200 bps guiado para 2026** — Eficiencia mejorando
4. **Global Markets en racha** — 15 trimestres consecutivos de mejora, récord en 2025
5. **EPS 2026 estimado: $4.38** (+15% crecimiento) — Compresión de múltiplo si entrega
6. **Buybacks agresivos** — Payout ratio de 29% deja mucho capital para recompras

## Riesgos Principales

1. **Sensibilidad a tasas** — Si la Fed corta más rápido de lo esperado, NII guidance de 5-7% no se cumple
2. **Calidad crediticia** — Desaceleración económica aumentaría pérdidas en consumer y commercial real estate
3. **Regulación** — Propuestas de caps en tasas de tarjetas de crédito presionarían Consumer Banking. Basel III endgame puede aumentar requerimientos de capital
4. **Ciclicidad de IB** — Investment banking fees dependen de deal activity (M&A, IPOs)
5. **Geopolítica** — Tensiones comerciales EE.UU.-China, aranceles pueden afectar capital markets

## Posición Competitiva (Big Four)

| Métrica | BAC | JPM | WFC | C |
|---------|-----|-----|-----|---|
| **Market Cap** | $384B | $801B | $264B | $192B |
| **P/E (TTM)** | 13.6x | 14.3x | 12.4x | 13.9x |
| **Forward P/E** | 10.9x | 13.5x | 11.1x | 10.6x |
| **Revenue FY2025** | $113B | $175B | $81.5B | $82B |
| **Dividend Yield** | 2.37% | 2.1% | 2.3% | 3.2% |

BAC ocupa el "sweet spot" — más barato que JPM en forward P/E, mejor calidad que WFC y C, dividend yield competitivo.

## Consenso de Analistas

- **Rating:** Buy (19-24 analistas)
- **Price target promedio:** $57.60
- **Rango targets:** $43.50 - $74.55
- **Upside implícito:** +21% desde $47.52

## Guía 2026

- **NII Growth:** 5-7% YoY (asume dos recortes de la Fed)
- **Operating Leverage:** ~200 bps
- **EPS Consenso:** $4.38 (+15% crecimiento)

## Conclusión

Bank of America a $47.52 es una **compra sólida de valor** en el sector financiero. A 10.9x forward earnings, estás comprando el segundo banco más grande de EE.UU. con 13 años consecutivos de aumento de dividendo, $30B devueltos al accionista, y un negocio de trading en su mejor momento histórico. El riesgo es cíclico (tasas, crédito), pero la diversificación de segmentos y la base de depósitos estable proporcionan un piso sólido.

---

*Research fecha: 23 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 57.60,
    analyst_upside: 21.2,
    status: "active",
    first_researched_at: "2026-03-23T00:00:00Z",
    last_updated_at: "2026-03-23T00:00:00Z",
    next_review_at: "2026-09-23T00:00:00Z",
  },
  {
    id: 22,
    ticker: "BDX",
    name: "Becton Dickinson",
    sector: "Healthcare",
    industry: "Medical Devices / Supplies",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 156.23,
    pe_ratio: 25.5,
    pe_forward: 12.5,
    dividend_yield: 2.69,
    market_cap_b: 44.4,
    eps: 5.82,
    summary_short:
      "El fabricante de dispositivos médicos más esencial del mundo. BD Vacutainer (tubos de sangre), jeringas, bombas de infusión BD Alaris, y dispensadores BD Pyxis. 54 años consecutivos subiendo dividendo — Dividend Aristocrat.",
    summary_what:
      "Becton Dickinson fabrica los dispositivos médicos que usan todos los hospitales del mundo. Opera en 4 segmentos: Medical Essentials (jeringas, agujas, Vacutainer — 34% revenue), Interventional (cirugía, urología, critical care — 28%), Connected Care (bombas BD Alaris, dispensadores BD Pyxis — 25%), y BioPharma Systems (jeringas prefabricadas para GLP-1s y biológicos — 13%). Presente en ~200 países.",
    summary_why:
      "Forward P/E de 12.5x — barato para medtech (sector cotiza a 18-25x). Dividend Aristocrat con 54 años de aumentos. Spin-off de Life Sciences completado en Feb 2026 generó $4B en cash para recompras y deuda. BD Alaris recibió aprobación FDA completa — desbloquea ciclo de upgrades. BioPharma se beneficia del boom de GLP-1 (Ozempic, Mounjaro).",
    summary_risk:
      "Aranceles impactan 370 puntos base en FY2026 por manufactura en México. China presiona precios con políticas de compra por volumen. Crecimiento orgánico Q1 fue solo 1.6%, necesita acelerar.",
    research_full: `# Becton Dickinson (BDX) — Research Completo

## Precio: $156.23 | P/E: 25.5 | P/E Forward: 12.5 | Div Yield: 2.69% | Market Cap: $44.4B

---

## ¿Qué es Becton Dickinson?

Becton Dickinson es el **fabricante de dispositivos médicos más esencial del mundo**. Cada vez que un doctor te saca sangre, usa un tubo BD Vacutainer. Cada vez que te ponen una inyección, probablemente es con una jeringa BD. Con 54 años consecutivos de aumento de dividendo, es uno de los **Dividend Aristocrats** más confiables del S&P 500.

## Segmentos de Negocio (Post Spin-Off, Feb 2026)

| Segmento | Revenue Est. | % Total | Descripción |
|----------|-------------|---------|-------------|
| **Medical Essentials** | ~$6.1B | 34% | Jeringas, agujas, BD Vacutainer, catéteres IV, acceso vascular |
| **Interventional** | ~$5.0B | 28% | Cirugía, urología, critical care, reparación de hernias |
| **Connected Care** | ~$4.5B | 25% | Bombas BD Alaris, dispensadores BD Pyxis, monitoreo de pacientes |
| **BioPharma Systems** | ~$2.3B | 13% | Jeringas prefabricadas para biológicos/GLP-1s, auto-inyectores |

Revenue total New BD (pro forma): ~$17.8B. TAM: $70B+ creciendo ~5%.

## Resultados Recientes

### FY2025 (año fiscal terminó Sep 30, 2025):
- **Revenue: $21.84B** (+8.24% YoY)
- **Net Income (GAAP): $1.68B**
- **EPS GAAP: $5.82** | **EPS Ajustado: ~$13.14**
- La diferencia GAAP vs ajustado refleja costos del spin-off y amortización de adquisiciones

### Q1 FY2026 (trimestre terminó Dic 31, 2025):
- Revenue: $5.25B (+1.6%)
- EPS ajustado: $2.91
- EPS GAAP: $1.34 (+28.8% YoY)

### Guía FY2026:
- Revenue growth: low single-digit
- EPS ajustado: $12.35 - $12.65 (~6% crecimiento)
- Impacto aranceles: ~370 bps headwind

## Dividendo y Retorno al Accionista

- **Dividendo anual:** $4.20/acción (~2.69% yield)
- **Años consecutivos de aumento:** 54 — Dividend Aristocrat
- **Crecimiento dividendo 5 años:** 5.4% CAGR
- **Payout ratio (sobre EPS ajustado):** ~34% (muy conservador)
- **Spin-off generó $4B** en cash para recompras de acciones y reducción de deuda

## Ventajas Competitivas (Moat)

1. **Dominio en blood collection:** BD Vacutainer tiene 80%+ de market share en EE.UU.
2. **Escala de manufactura:** Producen miles de millones de dispositivos desechables al año — costos imposibles de replicar
3. **BD Alaris:** Instalado en ~50% de camas de hospital en EE.UU. — alto switching cost
4. **BD Pyxis:** Dispensadores automáticos en farmacias hospitalarias — locked-in
5. **Regulación como barrera:** Aprobaciones FDA crean barreras de entrada de años para competidores
6. **BioPharma:** Las farmacéuticas dependen de BD para jeringas prefabricadas de biológicos — no cambias de proveedor fácilmente

## Catalizadores

1. **Spin-off completado (Feb 2026)** — BD recibió $4B en cash, empresa más enfocada en medtech puro
2. **BD Alaris aprobación FDA completa** — Desbloquea ciclo masivo de upgrades en hospitales
3. **Boom GLP-1** — Ozempic, Mounjaro, Zepbound todos necesitan jeringas prefabricadas que BD manufactura
4. **Forward P/E de 12.5x** — Medtech normalmente cotiza a 18-25x, BD está con descuento por transición
5. **$4B para recompras** — A estos precios deprimidos, las recompras son muy acretivas
6. **Integración Edwards Critical Care** — Monitoreo de pacientes con AI en 10,000+ hospitales

## Riesgos Principales

1. **Aranceles:** 370 bps de headwind en FY2026 por manufactura en México y otras localidades
2. **China VBP:** Políticas de compra por volumen presionan precios de Vacutainer y otros productos
3. **Crecimiento orgánico lento:** Q1 FY2026 fue solo +1.6%, necesita acelerar a mid-single-digit
4. **Deuda elevada:** Adquisiciones de C.R. Bard ($24B) y Edwards ($4.2B) dejaron deuda significativa
5. **Competencia en bombas de infusión:** ICU Medical y Baxter invierten en nueva generación de smart pumps

## Posición Competitiva

| Métrica | BDX | ABT | MDT | BAX |
|---------|-----|-----|-----|-----|
| **Market Cap** | $44B | $200B | $110B | $15B |
| **Dividend Yield** | 2.69% | 1.8% | 3.2% | 2.8% |
| **Años dividendo creciente** | 54 | 52 | 47 | 5 |
| **Forward P/E** | 12.5x | 22x | 15x | 10x |

BDX es el más barato de los Dividend Aristocrats en medtech.

## Consenso de Analistas

- **Rating:** Buy (Moderate Buy)
- **Price target promedio:** $200 - $212
- **Rango targets:** $183 - $270
- **Upside implícito:** +28% desde $156.23

## Conclusión

BDX a $156.23 es una **compra de valor en healthcare** con protección defensiva excepcional. A 12.5x forward earnings, estás comprando el fabricante dominante de dispositivos médicos esenciales — con 54 años de dividendo creciente, moats regulatorios fuertes, y múltiples catalizadores post spin-off. El riesgo principal es de corto plazo (aranceles, crecimiento lento), pero el negocio subyacente es casi inmune a recesiones — los hospitales no dejan de comprar jeringas y tubos de sangre.

---

*Research fecha: 23 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 200.0,
    analyst_upside: 28.0,
    status: "active",
    first_researched_at: "2026-03-23T00:00:00Z",
    last_updated_at: "2026-03-23T00:00:00Z",
    next_review_at: "2026-09-23T00:00:00Z",
  },
  {
    id: 23,
    ticker: "FCX",
    name: "Freeport-McMoRan",
    sector: "Materials",
    industry: "Copper Mining / Metals & Mining",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 56.48,
    pe_ratio: 37.0,
    pe_forward: 19.1,
    dividend_yield: 1.06,
    market_cap_b: 81.0,
    eps: 1.53,
    summary_short:
      "El productor de cobre #1 de EE.UU. y dueño del megayacimiento Grasberg en Indonesia (cobre + oro). Megatendencia: IA, data centers y EVs necesitan cantidades masivas de cobre.",
    summary_what:
      "Freeport-McMoRan mina cobre, oro y molibdeno en EE.UU. (Morenci, Arizona — la mina de cobre más grande de Norteamérica), Indonesia (Grasberg — uno de los mayores yacimientos de cobre y oro del mundo), Perú (Cerro Verde) y Chile (El Abra). Produce ~3.4 mil millones de libras de cobre y ~1 millón de onzas de oro al año.",
    summary_why:
      "Megatendencia secular del cobre: data centers de IA podrían consumir 1.1M toneladas anuales para 2030. Déficit de oferta proyectado 2026+. Grasberg reiniciando producción en Q2 2026 — catalizador fuerte de earnings. EPS 2026E de $2.95 (+93% vs 2025). JPMorgan proyecta cobre a $5.67/lb en Q2 2026.",
    summary_risk:
      "Mud rush en Grasberg (sept 2025) cortó producción ~35% y causó 7 fatalidades. Regulación Indonesia puede endurecer exportaciones de concentrado. Precio del cobre es volátil — cada $0.10/lb = ~$400M en EBITDA.",
    research_full: `# Freeport-McMoRan (FCX) — Research Completo

## Precio: $56.48 | P/E: 37.0 | P/E Forward: 19.1 | Div Yield: 1.06% | Market Cap: $81B

---

## ¿Qué es Freeport-McMoRan?

Freeport-McMoRan es el **mayor productor de cobre que cotiza en bolsa del mundo** y el **#1 de EE.UU.** Opera minas en cuatro países, siendo la más importante **Grasberg en Indonesia** — uno de los yacimientos de cobre y oro más grandes del planeta.

## Operaciones Principales

| Mina | País | Tipo | Notas |
|------|------|------|-------|
| **Grasberg Block Cave** | Indonesia | Subterránea cobre/oro | Mega yacimiento. Dañada por mud rush sept 2025. Reinicio Q2 2026 |
| **Morenci** | EE.UU. (Arizona) | Open-pit cobre | Mina de cobre más grande de Norteamérica (FCX 72%) |
| **Cerro Verde** | Perú | Open-pit cobre/molibdeno | FCX 53.56% |
| **Bagdad** | EE.UU. (Arizona) | Open-pit cobre/molibdeno | Expansión planeada |
| **Safford/Lone Star** | EE.UU. (Arizona) | Open-pit cobre | Producción creciendo |
| **El Abra** | Chile | Open-pit cobre | FCX 51% |

## Revenue por Producto (FY2025)

| Producto | Revenue | % Total |
|----------|---------|---------|
| **Cobre (cátodo)** | $8.1B | 31.5% |
| **Cobre (concentrado)** | $6.3B | 24.5% |
| **Cobre (refinado)** | $4.4B | 17.1% |
| **Oro** | $3.9B | 15.2% |
| **Molibdeno** | $2.0B | 7.8% |
| **Otros** | $1.0B | 3.9% |
| **Total** | ~$25.7B | 100% |

Cobre = 73% del revenue. Es fundamentalmente una apuesta al cobre.

## Producción (FY2025)

- **Cobre:** ~3.4 mil millones de libras (bajo guidance de 3.95B por Grasberg)
- **Oro:** ~1.0 millón de onzas (bajo guidance de 1.3M por Grasberg)
- **Molibdeno:** ~92 millones de libras (arriba de guidance)

## Resultados 2025 (Full Year)

- **Revenue: ~$25.7B**
- **Net Income: $2.20B** (+16.7% YoY)
- **EPS GAAP: $1.53** (+16.7%)

### Q4 2025:
- Revenue: $5.63B (beat estimado de $5.18B)
- EPS ajustado: $0.47 (beat estimado de $0.28 — +67.9% surprise)
- Net Income: $406M (+48.2% YoY)

## Incidente Grasberg — Mud Rush (Sept 8, 2025)

Este es el evento más importante para entender FCX hoy:
- ~800,000 toneladas de material húmedo entraron a la mina Grasberg Block Cave
- 7 fatalidades
- Producción de cobre en Indonesia cayó ~39%, oro cayó ~85%
- Acción cayó 20.4% inmediatamente
- DMLZ y Big Gossan reiniciaron en oct 2025
- Grasberg Block Cave reinicio por fases desde Q2 2026
- 85% de producción total a tasas normales esperado para H2 2026

## Dividendo

- **Dividendo anual:** $0.60/acción (~1.06% yield)
- **Política:** Ligado a precio del cobre y free cash flow
- **Historia:** Cortado en 2015-2020 por crisis de commodities y pandemia. Reinstalado 2021
- **NO es Dividend Aristocrat** — el dividendo es cíclico
- **Payout ratio:** ~39%

## La Megatendencia del Cobre

1. **IA y Data Centers:** Podrían consumir 500K-1.1M toneladas de cobre anuales para 2030
2. **Vehículos Eléctricos:** Usan 2.9x más cobre que autos convencionales
3. **Electrificación:** Modernización de redes, energía renovable, infraestructura limpia
4. **Demanda global:** +24% para 2035 (Wood Mackenzie)
5. **Déficit de oferta:** Se proyecta déficit de 150K-400K+ toneladas para 2026

## Catalizadores

1. **Reinicio Grasberg Q2 2026** — Earnings se disparan al normalizar producción
2. **Copper para IA** — Data centers, chips, cooling, todo requiere cobre masivamente
3. **Precio del cobre subiendo** — JPMorgan: $5.67/lb en Q2 2026. UBS: $5.90/lb a fin de 2026
4. **EPS 2026E: $2.95** — Casi el doble del 2025 ($1.53)
5. **Mayor productor de cobre en EE.UU.** — Beneficio de política de "minerales críticos"
6. **Déficit de oferta estructural** — Pocos proyectos nuevos de cobre en producción

## Riesgos Principales

1. **Volatilidad del cobre:** Cada $0.10/lb = ~$400M en EBITDA. Recesión global tumba el precio
2. **Indonesia:** Gobierno prohíbe exportación de concentrado. Nacionalismo de recursos
3. **Riesgo operacional Grasberg:** Mud rush demostró riesgo catastrófico. Timeline incierto
4. **China = 50% de demanda global:** Desaceleración china impacta cobre directamente
5. **P/E trailing alto (37x):** Solo tiene sentido si 2026E se materializa

## Posición Competitiva

| Métrica | FCX | SCCO | TECK | BHP |
|---------|-----|------|------|-----|
| **Market Cap** | $81B | $90B+ | $25B | $160B |
| **Producción cobre** | 3.4B lbs | 2.3B lbs | ~700M lbs | ~3.7B lbs |
| **Dividend Yield** | 1.06% | 6%+ | 0.8% | 5%+ |
| **Margen operativo** | ~25% | ~52% | ~30% | ~45% |

## Consenso de Analistas

- **Rating:** Buy / Strong Buy (15-16 analistas)
- **Price target promedio:** $56 - $63
- **Rango targets:** $42 - $72
- **Upside implícito:** +11% al target medio (~$63)

## Conclusión

FCX a $56.48 es una **apuesta directa a la megatendencia del cobre** — IA, data centers, EVs, y electrificación. El reinicio de Grasberg en Q2-H2 2026 es el catalizador principal que debería casi duplicar el EPS. El riesgo es real (Grasberg, Indonesia, volatilidad), pero si crees que el mundo necesita más cobre (y lo necesita), FCX es la forma más directa de apostar a eso.

---

*Research fecha: 24 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 63.0,
    analyst_upside: 11.5,
    status: "active",
    first_researched_at: "2026-03-24T00:00:00Z",
    last_updated_at: "2026-03-24T00:00:00Z",
    next_review_at: "2026-09-24T00:00:00Z",
  },
];

export const transactions = [
  {
    id: 1,
    stock_id: 1,
    ticker: "UBS",
    type: "new" as const,
    cycle_number: 1,
    price: 39.76,
    date: "2026-03-04",
    day_of_week: "wednesday",
    wa_message: "",
  },
  {
    id: 2,
    stock_id: 6,
    ticker: "VGK",
    type: "new" as const,
    cycle_number: 1,
    price: 84.64,
    date: "2026-03-09",
    day_of_week: "monday",
    wa_message: "",
  },
  {
    id: 3,
    stock_id: 7,
    ticker: "VPL",
    type: "new" as const,
    cycle_number: 1,
    price: 100.53,
    date: "2026-03-09",
    day_of_week: "monday",
    wa_message: "",
  },
  {
    id: 4,
    stock_id: 8,
    ticker: "ARM",
    type: "new" as const,
    cycle_number: 1,
    price: 117.63,
    date: "2026-03-09",
    day_of_week: "monday",
    wa_message: "",
  },
  {
    id: 5,
    stock_id: 9,
    ticker: "ASBFY",
    type: "new" as const,
    cycle_number: 1,
    price: 25.13,
    date: "2026-03-10",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #5* — Mar 10, 2026\n\n🏢 *Associated British Foods* (ASBFY) — $25.13\n\n🛍️ *Sus marcas*: Primark (ropa), Twinings (té), Ovaltine, Kingsmill (pan)\n\n🌍 *Presencia*: UK, Irlanda, España, Alemania, Francia, Italia, Países Bajos, Portugal, EE.UU. — 384 tiendas\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *3.38% anual* solo por ser dueño. Cada vez que alguien compra ropa en Primark, toma un Twinings o compra pan Kingsmill — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Primark no tiene tienda online — depende 100% de tráfico en tienda física.\n\n🆕 Posición #5\n🔗 https://vectorialdata.com/stocks/ASBFY\n\n💡 Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.`,
  },
  {
    id: 6,
    stock_id: 10,
    ticker: "AVGO",
    type: "new" as const,
    cycle_number: 2,
    price: 342.69,
    date: "2026-03-11",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #6* — Mar 11, 2026\n\n🏢 *Broadcom* (AVGO) — $342.69\n\n🛍️ *Sus productos*: Wi-Fi de tu iPhone, VMware (software empresarial), chips de networking para data centers de AI\n\n🌍 *Presencia*: EE.UU., con clientes globales — Apple, Google, Meta, Amazon, Microsoft\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.76% anual* de dividendo. Cada vez que alguien usa Wi-Fi, Netflix en un data center, o una empresa usa VMware — Broadcom gana. Y su revenue de AI se triplicó en un año.\n\n⚠️ *El riesgo*: Apple está empezando a hacer sus propios chips Wi-Fi para reemplazar a Broadcom.\n\n🆕 Posición #6\n🔗 https://vectorialdata.com/stocks/AVGO\n\n💡 Recuerda: tu presupuesto mensual ÷ 30 = lo que compras de cada pick. Siempre igual.`,
  },
  {
    id: 7,
    stock_id: 11,
    ticker: "ASML",
    type: "new" as const,
    cycle_number: 2,
    price: 1390.20,
    date: "2026-03-11",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #7* — Mar 11, 2026\n\n🏢 *ASML* (ASML) — $1,390.20\n\n🛍️ *Su producto*: Las ÚNICAS máquinas en el mundo que fabrican chips avanzados. Sin ASML no hay iPhones, no hay Nvidia, no hay AI.\n\n🌍 *Presencia*: Holanda (HQ), con clientes en Taiwan (TSMC), Corea (Samsung), EE.UU. (Intel), y todo el mundo\n\n💵 *Tu participación*: ASML paga *0.64% anual* de dividendo y sube cada año. Pero la verdadera ganancia es el crecimiento — cada nuevo chip de AI necesita sus máquinas de $380 millones. Es un monopolio literal.\n\n⚠️ *El riesgo*: La acción es cara y China (33% de sus ventas) enfrenta restricciones de exportación.\n\n🆕 Posición #7\n🔗 https://vectorialdata.com/stocks/ASML\n\n💡 Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.`,
  },
  {
    id: 8,
    stock_id: 12,
    ticker: "AWK",
    type: "new" as const,
    cycle_number: 2,
    price: 138.25,
    date: "2026-03-12",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #8* — Mar 12, 2026\n\n🏢 *American Water Works* (AWK) — $138.25\n\n🛍️ *Sus marcas*: New Jersey American Water, Pennsylvania American Water, California American Water, Missouri American Water — el nombre que ves en tu recibo de agua\n\n🌍 *Presencia*: 14 estados de EE.UU. + 18 bases militares del Departamento de Defensa\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.46% anual* solo por ser dueño. Cada vez que alguien paga su recibo de agua en cualquiera de los 14 estados donde operan — parte de ese dinero llega a ti como dividendo. Y lo llevan subiendo 18 años seguidos.\n\n⚠️ *El riesgo*: Depende de reguladores estatales para aprobar aumentos de tarifas.\n\n🆕 Posición #8\n🔗 https://vectorialdata.com/stocks/AWK\n\n💡 No importa si compras $3 o $50 de cada acción. Lo que importa es que sea lo mismo siempre y que lo puedas sostener.`,
  },
  {
    id: 9,
    stock_id: 13,
    ticker: "CAIXY",
    type: "new" as const,
    cycle_number: 2,
    price: 3.69,
    date: "2026-03-16",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #9* — Mar 16, 2026\n\n🏢 *CaixaBank* (CAIXY) — $3.69\n\n🛍️ *Sus marcas*: CaixaBank (banco #1 de España), imagin (banco digital para jóvenes), VidaCaixa (seguros), BPI (banco en Portugal), Fundación "la Caixa"\n\n🌍 *Presencia*: España (18 millones de clientes) + Portugal (via BPI). Premiado "Mejor Banco para Consumidores en Europa" por Euromoney 2025\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *5.1% anual* solo por ser dueño. Cada vez que alguien en España paga su hipoteca, usa su tarjeta, o contrata un seguro con CaixaBank — parte de ese dinero llega a ti como dividendo. Y el dividendo creció 117% en 3 años.\n\n⚠️ *El riesgo*: Concentrado en España — si la economía española baja, CaixaBank lo siente.\n\n🆕 Posición #9\n🔗 https://vectorialdata.com/stocks/CAIXY\n\n💡 Recuerda: tu presupuesto mensual ÷ 30 = lo que compras de cada pick. Siempre igual.`,
  },
  {
    id: 10,
    stock_id: 14,
    ticker: "ROL",
    type: "new" as const,
    cycle_number: 2,
    price: 55.33,
    date: "2026-03-16",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #10* — Mar 16, 2026\n\n🏢 *Rollins / Orkin* (ROL) — $55.33\n\n🛍️ *Sus marcas*: Orkin (#1 en control de plagas), HomeTeam Pest Defense, Clark Pest Control, Critter Control, Western Pest Services\n\n🌍 *Presencia*: EE.UU. (líder nacional), Canadá, Australia. 24 años consecutivos creciendo ventas.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.32% anual* de dividendo — 35 años sin fallar un solo pago. Cada vez que alguien llama a Orkin porque tiene cucarachas, termitas o ratones — parte de ese dinero llega a ti. Y las plagas no entienden de recesiones.\n\n⚠️ *El riesgo*: La acción es cara (P/E de 51x, el doble de su industria).\n\n🆕 Posición #10\n🔗 https://vectorialdata.com/stocks/ROL\n\n💡 Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.`,
  },
  {
    id: 11,
    stock_id: 15,
    ticker: "GFI",
    type: "new" as const,
    cycle_number: 3,
    price: 47.72,
    date: "2026-03-16",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #11* — Mar 16, 2026\n\n🏢 *Gold Fields* (GFI) — $47.72\n\n🛍️ *Su producto*: Oro. Extraen 2.44 millones de onzas al año de minas en Sudáfrica, Ghana, Australia, Perú y Chile. Están construyendo una nueva mina en Canadá.\n\n🌍 *Presencia*: 5 países — Sudáfrica, Ghana, Australia, Perú, Chile + nueva mina en Canadá (2027)\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *5.1% anual* de dividendo — más un dividendo especial este año. Su profit se TRIPLICÓ en 2025. Devolvieron $1.7 mil millones al accionista. Cada vez que el oro sube, tu inversión crece.\n\n⚠️ *El riesgo*: La acción es muy volátil (rango de $19 a $62 en un año). Si el oro baja, Gold Fields baja más fuerte.\n\n🆕 Posición #11\n🔗 https://vectorialdata.com/stocks/GFI\n\n💡 ¿Cuánto invertir? Lo que puedas mantener CADA MES. $90/mes = $3 por pick. $300/mes = $10 por pick.`,
  },
  {
    id: 12,
    stock_id: 16,
    ticker: "WAL",
    type: "new" as const,
    cycle_number: 3,
    price: 68.16,
    date: "2026-03-17",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #12* — Mar 17, 2026\n\n🏢 *Western Alliance Bank* (WAL) — $68.16\n\n🛍️ *Sus líneas*: Banca para startups tech, warehouse lending (#1 nacional), gaming, firmas legales, real estate — no es un banco de sucursales, es un banco de nichos especializados\n\n🌍 *Presencia*: EE.UU. — Arizona, California, Nueva York, Texas, Nevada. $93B en activos. Banco #1 para PYMEs en el suroeste de EE.UU.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.48% anual* de dividendo. Cada vez que una startup tech paga su línea de crédito, un casino refinancia, o un originador de hipotecas usa warehouse lending — parte de ese dinero llega a ti. Su profit creció 23% en 2025 y los analistas ven +49% de upside.\n\n⚠️ *El riesgo*: En 2023 perdieron $9.5B en depósitos en 48 horas por el pánico de SVB. Se recuperaron, pero el mercado tiene memoria.\n\n🆕 Posición #12\n🔗 https://vectorialdata.com/stocks/WAL\n\n💡 No importa si compras $3 o $50 de cada acción. Lo que importa es que sea lo mismo siempre y que lo puedas sostener.`,
  },
  {
    id: 13,
    stock_id: 17,
    ticker: "SIEGY",
    type: "new" as const,
    cycle_number: 3,
    price: 126.60,
    date: "2026-03-17",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #13* — Mar 17, 2026\n\n🏢 *Siemens* (SIEGY) — $126.60\n\n🛍️ *Sus productos*: Automatización de fábricas, infraestructura para centros de datos, trenes y metros. 177 años de historia. Alianzas con NVIDIA y Microsoft para IA industrial.\n\n🌍 *Presencia*: Global — Alemania (HQ), EE.UU., China, y prácticamente todo el mundo. €120 mil millones en órdenes pendientes.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.5% anual* de dividendo. Cada vez que se construye un centro de datos para IA, se automatiza una fábrica, o un metro nuevo opera — Siemens gana. Su negocio de infraestructura para data centers creció 35% el último trimestre.\n\n⚠️ *El riesgo*: No es barata (P/E de 22x). Competencia fuerte de Schneider Electric y ABB.\n\n🆕 Posición #13\n🔗 https://vectorialdata.com/stocks/SIEGY\n\n💡 Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.`,
  },
  {
    id: 14,
    stock_id: 18,
    ticker: "AXAHY",
    type: "new" as const,
    cycle_number: 3,
    price: 45.09,
    date: "2026-03-18",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #14* — Mar 18, 2026\n\n🏢 *AXA* (AXAHY) — $45.09\n\n🛍️ *Sus marcas*: AXA (seguros #1 de Europa), AXA XL (reaseguro comercial global), AXA Investment Managers, y operaciones en ~50 países con 92 millones de clientes\n\n🌍 *Presencia*: Francia (HQ), Alemania, Suiza, UK, España, Italia, Japón, EE.UU. y más. La aseguradora más grande de Europa.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *5.4% anual* solo por ser dueño — uno de los dividendos más altos del portafolio. Cada vez que alguien paga su seguro de auto, de casa, de salud, o de vida en cualquiera de los 50 países donde operan — parte de ese dinero llega a ti. Y devuelven 75% de su profit al accionista entre dividendos y recompras.\n\n⚠️ *El riesgo*: Catástrofes naturales por cambio climático pueden aumentar los costos de siniestros.\n\n🆕 Posición #14\n🔗 https://vectorialdata.com/stocks/AXAHY\n\n💡 Con 5.4% de dividendo, AXAHY duplica tu inversión solo en dividendos en ~13 años. Sin que suba de precio.`,
  },
  {
    id: 15,
    stock_id: 19,
    ticker: "B",
    type: "new" as const,
    cycle_number: 3,
    price: 37.40,
    date: "2026-03-19",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #15* — Mar 19, 2026\n\n🏢 *Barrick Mining* (B) — $37.40\n\n⛏️ *Su producto*: Oro y cobre. Extraen 3.26 millones de onzas de oro al año de minas en 17 países: EE.UU. (Nevada Gold Mines), Canadá, Rep. Dominicana, Mali, Zambia, Tanzania, y Pakistán.\n\n🌍 *Presencia*: 17 países — Canadá (HQ), EE.UU., Zambia, Pakistán, Mali, Tanzania, Rep. Dominicana y más. Antes se llamaba Barrick Gold.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *4.15% anual* solo por ser dueño. Su free cash flow creció 194% en 2025 a $3.87 mil millones. Nueva política: devuelven 50% de su cash flow al accionista. Con oro arriba de $5,000/oz y su costo de producción en $1,637/oz, el margen por onza es enorme.\n\n⚠️ *El riesgo*: 100% expuesto al precio del oro sin cobertura. Si el oro baja, Barrick baja más fuerte. Opera en países con riesgo político (Mali, Pakistán).\n\n🆕 Posición #15 — Cierra Ciclo 3\n🔗 https://vectorialdata.com/stocks/B\n\n💡 El dividendo de B se reinvierte → compra más fracciones → genera más dividendo → compra más fracciones. Eso es interés compuesto.`,
  },
  {
    id: 16,
    stock_id: 20,
    ticker: "BABA",
    type: "new" as const,
    cycle_number: 4,
    price: 122.41,
    date: "2026-03-20",
    day_of_week: "thursday",
    wa_message: `📊 *STOCK PICK #16* — Mar 20, 2026\n\n🏢 *Alibaba Group* (BABA) — $122.41\n\n🛍️ *Sus plataformas*: Taobao y Tmall (e-commerce #1 de China), Alibaba Cloud (#1 cloud de China), AliExpress (internacional), Ele.me (delivery)\n\n🌍 *Presencia*: China (HQ), con operaciones en 200+ países. 800M+ usuarios activos. La empresa tech más grande de China.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.83% anual* solo por ser dueño — modesto pero creciendo 26% al año. Cada vez que alguien compra en Taobao, usa Alibaba Cloud, o pide delivery por Ele.me — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: China — geopolítica, regulación impredecible, y el "China discount" siempre presente.\n\n🆕 Posición #16\n🔗 https://vectorialdata.com/stocks/BABA\n\n💡 El S&P 500 ha dado ~10% anual durante 100 años. Pero solo si NO vendiste en los días malos.`,
  },
  {
    id: 17,
    stock_id: 21,
    ticker: "BAC",
    type: "new" as const,
    cycle_number: 4,
    price: 47.52,
    date: "2026-03-23",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #17* — Mar 23, 2026\n\n🏢 *Bank of America* (BAC) — $47.52\n\n🛍️ *Sus líneas*: Consumer Banking (depósitos, tarjetas, small business), Merrill Lynch (wealth management), Global Markets (trading), Global Banking (banca corporativa e investment banking)\n\n🌍 *Presencia*: EE.UU. — 66 millones de clientes. El segundo banco más grande de Estados Unidos, solo detrás de JPMorgan.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.37% anual* solo por ser dueño — 13 años seguidos subiéndolo. Cada vez que alguien paga su tarjeta de crédito, invierte con Merrill Lynch, o una empresa usa sus servicios de treasury — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Sensible a tasas de interés — si la Fed corta más de lo esperado, su ingreso por intereses baja.\n\n🆕 Posición #17\n🔗 https://vectorialdata.com/stocks/BAC\n\n💡 No revises BAC todos los días. Bank of America no cambia de valor en 24 horas — tu ansiedad sí.`,
  },
  {
    id: 18,
    stock_id: 22,
    ticker: "BDX",
    type: "new" as const,
    cycle_number: 4,
    price: 156.23,
    date: "2026-03-23",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #18* — Mar 23, 2026\n\n🏢 *Becton Dickinson* (BDX) — $156.23\n\n🛍️ *Sus productos*: BD Vacutainer (tubos de sangre en cada hospital), jeringas BD (las más usadas del mundo), bombas de infusión BD Alaris, dispensadores automáticos BD Pyxis\n\n🌍 *Presencia*: EE.UU. (HQ), operaciones en ~50 países, productos en ~200 países. 80%+ del market share en tubos de sangre en EE.UU.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.69% anual* solo por ser dueño — 54 años seguidos subiéndolo, Dividend Aristocrat. Cada vez que un doctor te saca sangre, un hospital conecta una bomba de infusión, o una farmacéutica usa sus jeringas para Ozempic o Mounjaro — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Aranceles impactan 370 puntos base en FY2026 por manufactura en México.\n\n🆕 Posición #18\n🔗 https://vectorialdata.com/stocks/BDX\n\n💡 El mercado ha caído 50%+ varias veces en la historia. Y SIEMPRE se recuperó. Los que vendieron en pánico perdieron. Los que mantuvieron ganaron.`,
  },
  {
    id: 19,
    stock_id: 23,
    ticker: "FCX",
    type: "new" as const,
    cycle_number: 4,
    price: 56.48,
    date: "2026-03-24",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #19* — Mar 24, 2026\n\n🏢 *Freeport-McMoRan* (FCX) — $56.48\n\n⛏️ *Su producto*: Cobre, oro y molibdeno. La mina de cobre más grande de Norteamérica (Morenci, Arizona) y el megayacimiento Grasberg en Indonesia — uno de los más grandes del mundo.\n\n🌍 *Presencia*: EE.UU. (Arizona, Nuevo México), Indonesia, Perú, Chile. El mayor productor de cobre que cotiza en bolsa del mundo.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.06% anual* solo por ser dueño. Cada vez que se construye un data center para IA, se fabrica un auto eléctrico, o se moderniza una red eléctrica — se necesita cobre masivamente, y Freeport lo produce. Parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Mud rush en Grasberg (sept 2025) cortó producción ~35% y causó 7 fatalidades.\n\n🆕 Posición #19\n🔗 https://vectorialdata.com/stocks/FCX\n\n💡 Los ricos no invierten cuando les sobra. Invierten PRIMERO y viven con lo que queda.`,
  },
];

export const cycles = [
  {
    id: 1,
    cycle_number: 1,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 2,
    cycle_number: 2,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 3,
    cycle_number: 3,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 4,
    cycle_number: 4,
    type: "rebuy" as const,
    target_count: 5,
    current_count: 4,
    status: "active" as const,
  },
];
