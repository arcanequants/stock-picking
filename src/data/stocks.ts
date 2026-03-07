import { Stock } from "@/lib/types";

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
    price: 41.53,
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
];

export const transactions = [
  {
    id: 1,
    stock_id: 1,
    ticker: "UBS",
    type: "new" as const,
    cycle_number: 1,
    price: 41.53,
    date: "2026-03-04",
    day_of_week: "tuesday",
    wa_message: "",
  },
];

export const cycles = [
  {
    id: 1,
    cycle_number: 1,
    type: "new" as const,
    target_count: 5,
    current_count: 1, // UBS is first
    status: "active" as const,
  },
];
