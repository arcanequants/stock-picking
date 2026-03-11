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
    current_count: 2,
    status: "active" as const,
  },
];
