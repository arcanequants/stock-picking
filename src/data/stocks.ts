import { Stock, Transaction } from "@/lib/types";

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
  // 🔍 Curiosity — Learn (surprising facts WITH explanations)
  (ctx) => `${ctx.name} tiene una ventaja competitiva que casi nadie entiende. No es su producto ni su marca — son los costos de cambio. Sus clientes dependen tanto del servicio que cambiarse a la competencia les costaría más que quedarse. Aburrido, pero es la razón #1 por la que mantienen sus ganancias década tras década.`,
  (ctx) => `De cada $100 que ${ctx.name} gana, ¿cuánto crees que se queda como ganancia? Eso se llama "margen neto". Si es >15%, tiene poder de precio — cobra más porque no hay alternativa. Si es <5%, compite por precio y cualquier crisis la golpea. Busca este número antes de invertir — dice más que el precio de la acción.`,
  (ctx) => `Hay algo que los reportes financieros de ${ctx.name} esconden a plena vista: el "operating margin" — el % que queda después de pagar empleados, materiales y operación. Si es >20%, el negocio tiene ventaja real. Si es <10%, vive al filo. Es el número que separa empresas buenas de frágiles.`,
  (ctx) => `${ctx.name} paga dividendos. ¿Cómo deciden cuánto? La junta directiva se reúne y decide qué % de ganancias repartir (el "payout ratio"). Bajo (<40%) = priorizan crecer. Alto (>70%) = priorizan pagarte. ${ctx.ticker} paga ${ctx.dividend_yield}% anual, y llega a tu cuenta cada trimestre automáticamente.`,
  (ctx) => `${ctx.country} tiene algo que hace a empresas de ${ctx.sector} más interesantes de lo que parecen. No es el PIB ni la moneda — es la demanda estructural. La gente NECESITA estos productos sin importar si la economía va bien o mal. Resultado: ingresos predecibles y dividendos más estables para ti.`,
  (ctx) => `Pregunta incómoda: ¿por qué ${ctx.name} vale $${ctx.price.toFixed(0)} y no la mitad o el doble? Porque el precio es el consenso de millones de personas apostando con dinero real. Cuando compras a $${ctx.price.toFixed(0)}, dices "creo que vale más". Si el negocio sigue creciendo, el tiempo te dará la razón — así se construye riqueza en la bolsa.`,
  (ctx) => `${ctx.ticker} cuesta $${ctx.price.toFixed(0)} hoy. Hace 10 años costaba una fracción. ¿Por qué subió? Porque cada año ganó más dinero, y el mercado recompensó esas ganancias con un precio más alto. No es magia: más ganancias → más valor → precio sube. Por eso invertimos en empresas que CRECEN.`,
  (ctx) => `El CEO de ${ctx.name} gana más en un día que la mayoría en un año. Pero hay un detalle: tú puedes ganar cada vez que él gana. Así funcionan las acciones.`,
  () => `Dato que nadie te dice: el 70% del rendimiento del S&P 500 en los últimos 30 años viene de REINVERTIR DIVIDENDOS. No de que suban los precios. El dividendo es el héroe silencioso.`,
  () => `Hay un número mágico de acciones para tener un portafolio diversificado. No son 100. No son 50. Es más bajo de lo que piensas.`,
  // 🔗 Curiosity — Click (curiosity gap + link to research)
  (ctx) => `${ctx.name} genera ingresos en ${ctx.country}. Pero el dato interesante no es cuánto gana — es de QUIÉN lo gana. Su lista de clientes explica más que cualquier gráfica. → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  (ctx) => `Algo raro pasa con los dividendos de ${ctx.ticker}. Lo explicamos en el reporte completo. → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  (ctx) => `${ctx.name} publicó sus resultados financieros hace poco. Hay un número que a Wall Street le encantó. Y otro que no. → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  (ctx) => `Hay un indicador que los inversionistas profesionales revisan antes que el precio. No es el P/E. No es el revenue. Lo puedes ver gratis en nuestro reporte de ${ctx.name}. → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  (ctx) => `¿${ctx.dividend_yield}% de dividendo es mucho o poco? Depende contra quién lo compares. Spoiler: es más que lo que tu banco te da por tus ahorros. → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  (ctx) => `Hoy investigamos ${ctx.name} por ti. P/E, dividendos, competencia, riesgos. Tú solo tuviste que abrir WhatsApp. El reporte completo: → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  (ctx) => `¿Qué pasaría si compraras $3 de ${ctx.ticker} CADA DÍA durante un año? La respuesta no es $3 x 365. Es más. La razón tiene nombre: dollar-cost averaging. → vectorialdata.com/stocks/${ctx.ticker.toLowerCase()}`,
  () => `Quieres ver cómo van todas las picks vs el mercado? Todo es público. → vectorialdata.com/stocks`,
  // 📢 Curiosity — Share (mind-blowing, designed to be forwarded)
  (ctx) => `El sector de ${ctx.sector} ha creado más millonarios silenciosos que las crypto, las startups y el real estate combinados. La diferencia es que nadie postea sobre eso en Instagram.`,
  (ctx) => `${ctx.name} tiene más empleados que la población de muchas ciudades. Todos trabajan. Tú cobras.`,
  (ctx) => `Hay una empresa en ${ctx.country} que le paga a sus accionistas cada 3 meses sin que hagan nada. Se llama ${ctx.name}. Y tú acabas de comprar una fracción.`,
  () => `El S&P 500 ha caído 30%+ exactamente 8 veces desde 1950. Las 8 veces se recuperó. Las 8.`,
  () => `Dato: tu suscripción de Netflix cuesta más al mes que todo lo que necesitas para empezar a invertir con nosotros. Uno te entretiene. El otro te genera dinero.`,
  () => `Todos hablan de dinero. Nadie te cuenta las partes interesantes. Para eso estamos.`,
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
    price: 360.46,
    pe_ratio: 25.4,
    pe_forward: 15.4,
    dividend_yield: 0.95,
    market_cap_b: 38.8,
    eps: 20.0,
    summary_short:
      "El 'Berkshire Hathaway del software'. Compran empresas de software especializado (#1 en nichos) y las dejan crecer. Revenue de $7.9B, FCF margin del 31%, 33 años de dividend growth. Cayó -44% por headwinds temporales.",
    summary_what:
      "Roper Technologies es una empresa diversificada de tecnología que adquiere y opera negocios de software vertical dominantes en nichos específicos — software para abogados (Aderant), contratistas del gobierno (Deltek), freight (DAT), laboratorios (Clinisys), y más. Genera 85%+ de revenue recurrente.\n\nOpera a través de tres segmentos: Application Software (~58% revenue), Network Software (~21%), y Technology Enabled Products (~21%). Cada empresa del portafolio — desde Vertafore en insurance tech hasta Foundry en efectos visuales de Hollywood — mantiene posición #1 o #2 en su nicho.\n\nEn 2025 desplegó $3.3B en adquisiciones de alta calidad: CentralReach ($1.85B, software de terapia ABA con 20%+ de crecimiento) y Subsplash ($800M, plataforma digital para iglesias).",
    summary_why:
      "Roper es una máquina de compounding de élite temporalmente en descuento. FCF margin del 31% ($2.47B), gross margin del 69.5%, y 85%+ revenue recurrente — métricas de empresa SaaS de primera clase. Cayó -44% por headwinds temporales: recortes DOGE afectan Deltek (gobierno) y recesión de freight afecta DAT.\n\nA $360, ROP cotiza a P/E forward de 15.4x — la mitad de su valuación histórica (~30x). Con $6B+ en capacidad de M&A, 33 años de dividend growth, y pipeline de 25+ productos de AI desplegados, el flywheel de compounding sigue intacto.\n\nConsenso Buy con target promedio de ~$478 (33% upside). La acción cotiza cerca del target bajo de Barclays ($380), ofreciendo margen de seguridad.",
    summary_risk:
      "El riesgo principal es la ejecución de capital allocation — el modelo de Roper depende de adquirir negocios a múltiplos atractivos. Con $9.5B en deuda total (2.9x net debt/EBITDA) y ROIC de ~5-6% por el goodwill de adquisiciones recientes, la empresa debe demostrar que CentralReach y Subsplash generan retornos incrementales.\n\nRiesgos adicionales: recortes DOGE presionan la base de clientes federales de Deltek más de lo esperado; recesión prolongada de freight afecta DAT; y si los múltiplos de M&A de software vertical suben, el flywheel de adquisiciones se desacelera.",
    research_full: `# Roper Technologies (ROP) — Research Completo

## Precio: $360.46 | P/E Forward: 15.4 | Div Yield: 0.95% | Market Cap: $38.8B

---

## ¿Qué es Roper Technologies?

Roper Technologies es el **"Berkshire Hathaway del software"** — una empresa que adquiere y opera negocios de software vertical dominantes en nichos específicos. Con $7.9B en revenue y 85%+ revenue recurrente, Roper ha completado una de las transformaciones corporativas más notables: de conglomerado industrial a compounder de software puro.

## Empresas del Portafolio

### Application Software (~58% revenue)
| Empresa | Nicho | Posición |
|---------|-------|----------|
| **Vertafore** | Insurance tech | #1, 50+ años en el mercado |
| **Deltek** | Software para contratistas gobierno | Líder, 23,000+ orgs en 80+ países |
| **Aderant** | Software para bufetes legales | 77 de los top 100 Global Law Firms |
| **CentralReach** | Terapia ABA (autismo) | Líder, 200,000+ profesionales |
| **Strata** | Finanzas hospitalarias | Líder en healthcare analytics |
| **Frontline** | Administración K-12 | Software escolar líder |

### Network Software (~21% revenue)
| Empresa | Nicho | Posición |
|---------|-------|----------|
| **DAT Solutions** | Marketplace de freight | #1 en América del Norte |
| **ConstructConnect** | Licitaciones de construcción | Red líder de pre-construcción |
| **iPipeline** | Distribución seguros de vida | Plataforma dominante |
| **Foundry (Nuke)** | Efectos visuales cine/TV | Usado en Marvel, Star Wars |
| **Subsplash** | Engagement digital iglesias | Líder en $2.5B TAM |

### Technology Enabled Products (~21% revenue)
| Empresa | Nicho | Posición |
|---------|-------|----------|
| **Neptune** | Medidores de agua inteligentes | Líder en smart water metering |
| **Verathon** | Dispositivos médicos | GlideScope (videolaringoscopios) |
| **NDI** | Medición 3D quirúrgica | Navegación quirúrgica de precisión |

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $7.9B (+12.3% YoY) |
| **Organic Growth** | +5% |
| **Gross Margin** | 69.5% (+120bps YoY) |
| **EBITDA** | $3.14B (39.8% margin) |
| **Free Cash Flow** | $2.47B (31.2% FCF margin) |
| **EPS** | $20.00 (+9% YoY) |
| **Revenue Recurrente** | 85%+ |
| **Empleados** | 18,000+ |

## Dividendo — 33 Años de Crecimiento Consecutivo

- **Dividendo anual:** $3.64/acción ($0.91 trimestral)
- **Yield:** 0.95%
- **Payout Ratio:** ~22% (enorme espacio de crecimiento)
- **Crecimiento:** 33 años consecutivos
- **CAGR 5 años:** ~10% anual

## Por Qué Recompramos ROP

ROP a $360 es una compounder de élite temporalmente en oferta. Los headwinds son cíclicos (DOGE/Deltek, freight/DAT), no estructurales. El motor de compounding sigue intacto:

- **$3.3B desplegados en 2025** en CentralReach (20%+ growth) y Subsplash (high-teens growth)
- **25+ productos de AI** desplegados en el portafolio (HerculesAI para legal, Spectrum AI para terapia)
- **$6B+ en capacidad de M&A** futura
- **Guidance 2026:** Revenue ~8% growth, EPS $21.30-$21.55
- **Buyback:** programa de $500M señala convicción de management

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| Analistas | 14-18 |
| Target Promedio | **$478** |
| Target Rango | $365 - $625 |
| **Upside** | **+32.6%** |

## Riesgos Principales

1. **Capital allocation** — Goodwill de $34.6B en activos; ROIC de 5-6% por adquisiciones recientes
2. **DOGE** — Recortes de gasto gobierno presionan Deltek
3. **Freight recession** — DAT afectado por ciclo bajo de transporte
4. **Leverage** — $9.5B deuda total, 2.9x net debt/EBITDA
5. **Múltiplos de M&A** — Si software vertical se encarece, el flywheel se frena

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $360.46 |
| P/E Forward | 15.4x (vs histórico ~28-30x) |
| Div Yield | 0.95% |
| FCF Yield | ~6.4% |
| 52-Week High | ~$640 |
| Drawdown actual | ~-44% del máximo |

## Conclusión

ROP a $360 es una oportunidad de recomprar el compounder de software más disciplinado del mercado a la mitad de su valuación histórica. El 31% FCF margin, 85%+ revenue recurrente, y 33 años de dividend growth proveen downside protection, mientras el upside viene del re-rating cuando los headwinds cíclicos pasen. Con 33% de upside según analistas más el dividendo, estamos acumulando posición.

---

*Research fecha: 6 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 478.0,
    analyst_upside: 32.6,
    status: "active",
    first_researched_at: "2026-03-04T00:00:00Z",
    last_updated_at: "2026-04-06T00:00:00Z",
    next_review_at: "2026-10-06T00:00:00Z",
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
    price: 4.12,
    pe_ratio: 13.73,
    pe_forward: 12.3,
    dividend_yield: 4.82,
    market_cap_b: 88.0,
    eps: 0.30,
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
  {
    id: 24,
    ticker: "LMT",
    name: "Lockheed Martin",
    sector: "Industrials",
    industry: "Aerospace & Defense",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 610.17,
    pe_ratio: 28.4,
    pe_forward: 20.5,
    dividend_yield: 2.26,
    market_cap_b: 141.0,
    eps: 21.49,
    summary_short:
      "El contratista de defensa #1 del mundo. Fabricante del F-35 (el caza más avanzado del mundo), HIMARS, PAC-3, helicópteros Sikorsky, y la nave Orion de la NASA. Backlog récord de $194 mil millones.",
    summary_what:
      "Lockheed Martin es el mayor contratista de defensa del Pentágono y del mundo. Opera en 4 segmentos: Aeronautics (F-35, F-16, C-130J — 40% revenue), Missiles & Fire Control (HIMARS, PAC-3, JASSM — 19%), Rotary & Mission Systems (Sikorsky, Aegis, radares — 23%), y Space (Orion, GPS III, defensa de misiles — 17%). 100% enfocado en defensa.",
    summary_why:
      "Backlog récord de $194B (2.6x ventas anuales). NATO se comprometió a subir gasto a 5% del PIB para 2035. EPS 2026 guiado a $29.80 (+39% vs 2025). Presupuesto de defensa de EE.UU. sube ~15% en FY2026. Demanda sin precedentes de misiles por conflictos en Ucrania y Medio Oriente. 24 años consecutivos de dividendo creciente.",
    summary_risk:
      "Pentágono recortó compras de F-35 casi 50% en FY2026, cambiando enfoque a sostenimiento. Block 4/TR-3 tiene $6B de sobrecosto y años de retraso. F-35 es ~30% del revenue — concentración alta.",
    research_full: `# Lockheed Martin (LMT) — Research Completo

## Precio: $610.17 | P/E: 28.4 | P/E Forward: 20.5 | Div Yield: 2.26% | Market Cap: $141B

---

## ¿Qué es Lockheed Martin?

Lockheed Martin es el **contratista de defensa #1 del mundo** y el mayor proveedor del Pentágono. Fabrican el **F-35 Lightning II** (el caza de quinta generación más avanzado y producido del mundo), el **HIMARS** (el sistema de artillería que cambió la guerra en Ucrania), y la **nave Orion** de la NASA. Con un backlog de **$194 mil millones**, tienen trabajo asegurado para años.

## Segmentos de Negocio (FY2025)

| Segmento | Revenue | % Total | Crecimiento | Programas Clave |
|----------|---------|---------|-------------|-----------------|
| **Aeronautics** | $30.3B | 40% | +5.7% | F-35, F-16, C-130J, F-22 sustainment |
| **Missiles & Fire Control** | $14.5B | 19% | +13.9% | HIMARS/GMLRS, PAC-3 MSE, JASSM, hipersónicos |
| **Rotary & Mission Systems** | $17.3B | 23% | +0.3% | Sikorsky (CH-53K, Black Hawk), Aegis, radares, cyber |
| **Space** | $13.0B | 17% | +4.4% | Orion, GPS III, hipersónicos, defensa de misiles |

## Resultados 2025 (Full Year)

- **Revenue: $75.0B** (+6% YoY)
- **Segment Operating Profit: $6.7B** (+11%)
- **Net Income: $5.0B**
- **EPS: $21.49** (-4% por cargo de pensiones de $479M)
- **Free Cash Flow: $6.9B**
- **Backlog: $194B** (récord — 4to año consecutivo de crecimiento)
- **Book-to-Bill: 1.2x** (reciben más órdenes de las que entregan)
- **Recompras: $3.0B** (6.6M acciones)

### Entregas Clave 2025:
- **F-35:** 191 jets entregados (récord)
- **PAC-3 MSE:** 620 interceptores (récord)

## Guía 2026

- **Revenue:** $77.5B - $80.0B
- **EPS:** $29.35 - $30.25 (+39% vs 2025)
- **Free Cash Flow:** $6.5B - $6.8B
- **Inversión de Capital:** ~$5B (+35% vs 2025)

## Dividendo y Retorno al Accionista

- **Dividendo anual:** $13.80/acción (~2.26% yield)
- **Años consecutivos de aumento:** 24
- **Crecimiento dividendo 5 años:** 6.38% CAGR
- **Payout ratio:** ~63%
- **Total devuelto en 2025:** $6.1B (dividendos + recompras)
- **Beta:** 0.20 — volatilidad muy baja

## Backlog por Segmento

| Segmento | Backlog |
|----------|---------|
| **Aeronautics** | $59.4B |
| **Missiles & Fire Control** | $46.7B |
| **Rotary & Mission Systems** | $47.7B |
| **Space** | $39.8B |
| **Total** | **$194B** |

$194B = 2.6x ventas anuales. Solo en H2 2025 recibieron $65B+ en nuevas órdenes.

## Ventajas Competitivas (Moat)

1. **Monopolio del F-35:** No hay otro caza de 5ta generación en producción occidental. 3,500+ aviones contratados
2. **Relación con el Pentágono:** #1 contratista con $313B en contratos (2020-2024)
3. **Backlog de $194B:** Visibilidad de revenue de 2.6 años
4. **Switching costs extremos:** Los países que compran F-35 quedan locked-in por décadas
5. **Seguridad nacional:** Programas clasificados son imposibles de replicar por competidores
6. **Escala de producción:** La curva de aprendizaje del F-35 reduce costos cada año

## La Megatendencia de Defensa

- **NATO sube a 5% del PIB para 2035** (antes era 2%). Multiplicará presupuestos de defensa en Europa
- **EE.UU. sube defensa ~15% en FY2026**
- **Conflictos activos** (Ucrania, Medio Oriente) aceleran reposición de municiones
- **Nuevas amenazas** (hipersónicos, drones) requieren inversión masiva en defensa

## Catalizadores

1. **NATO 5% GDP** — 32 países multiplicando gasto de defensa, F-35 es el estándar
2. **EPS 2026E: $29.80** — +39% crecimiento con guidance firme
3. **Backlog récord $194B** — 2.6x ventas, pipeline asegurado
4. **Reposición de municiones** — HIMARS, PAC-3, JASSM con demanda sin precedentes
5. **F-35 internacional** — Grecia, Rumania, Rep. Checa, más países en fila
6. **Presupuesto defensa EE.UU. +15%** — LMT es el #1 beneficiario

## Riesgos Principales

1. **Recorte de compras F-35:** Pentágono cortó casi 50% en FY2026 (Air Force de 48 a 24, Navy de 17 a 12)
2. **Block 4/TR-3 con problemas:** $6B de sobrecosto, años de retraso, 4,000+ partes faltantes
3. **Costos de sostenimiento F-35:** Lifecycle cost proyectado a exceder $2 trillones (GAO)
4. **Concentración en F-35:** ~30% del revenue total. Cualquier disrupción tiene impacto desproporcionado
5. **Cambio político:** Recortes de defensa o iniciativas de eficiencia gubernamental podrían afectar

## Posición Competitiva

| Métrica | LMT | RTX | NOC | GD |
|---------|-----|-----|-----|-----|
| **Revenue** | $75B | $85B | $42B | $46B |
| **Backlog** | $194B | $217B | $90B | $92B |
| **Dividend Yield** | 2.26% | 2.2% | 1.7% | 2.0% |
| **Contratos Pentágono (5 años)** | $313B | $145B | $81B | $116B |
| **Enfoque defensa** | 100% | 65% | 90% | 65% |

## Consenso de Analistas

- **Rating:** Hold / Neutral (dividido)
- **Price target promedio:** $596 - $665 (varía por fuente)
- **Mediana:** $660
- **Rango targets:** $432 - $740
- **Upside implícito:** +8% al target mediano ($660)

## Conclusión

LMT a $610.17 es una **compra defensiva en el sentido literal** — el contratista de defensa más grande del mundo con visibilidad de ingresos de 2.6 años y 24 años de dividendo creciente. El contexto geopolítico (NATO al 5%, conflictos activos, presupuesto de EE.UU. +15%) es el más favorable para defensa en décadas. El riesgo principal es la ejecución del F-35 Block 4 y la concentración en un solo programa. Pero con EPS guiado a +39% en 2026 y beta de 0.20, es una de las posiciones más estables del portafolio.

---

*Research fecha: 24 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Hold",
    analyst_target: 660.0,
    analyst_upside: 8.2,
    status: "active",
    first_researched_at: "2026-03-24T00:00:00Z",
    last_updated_at: "2026-03-24T00:00:00Z",
    next_review_at: "2026-09-24T00:00:00Z",
  },
  {
    id: 25,
    ticker: "NOC",
    name: "Northrop Grumman Corporation",
    sector: "Industrials",
    industry: "Aerospace & Defense",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 691.43,
    pe_ratio: 23.46,
    pe_forward: 24.43,
    dividend_yield: 1.35,
    market_cap_b: 98.0,
    eps: 29.08,
    summary_short:
      "El fabricante del B-21 Raider (el bombardero stealth más avanzado del mundo) y del ICBM Sentinel. Contratista de defensa #2 de EE.UU. con backlog récord de $95.7 mil millones y ventas internacionales creciendo 20%.",
    summary_what:
      "Northrop Grumman diseña y fabrica sistemas de defensa avanzados. Opera en 4 segmentos: Aeronautics (B-21 Raider, drones — 29% revenue), Mission Systems (radares, ciberseguridad, C4ISR — 28%), Space Systems (satélites, GEM 63, misiles — 24%), y Defense Systems (municiones, logística — 18%). Es el contratista principal del B-21 y del ICBM Sentinel de nueva generación.",
    summary_why:
      "Backlog récord de $95.7B con book-to-bill de 1.10x. El B-21 Raider acaba de asegurar expansión de producción de $4.5B (+25% capacidad). Free cash flow subió 26% a $3.3B en 2025. Ventas internacionales crecieron 20%. Contexto geopolítico (NATO al 5% PIB, conflictos activos) impulsa gasto de defensa sin precedentes.",
    summary_risk:
      "El programa Sentinel ICBM tiene sobrecostos masivos ($141B+) y reestructuración en curso. A P/E forward de 24.4x, la valuación es exigente para ~4% crecimiento de ventas y EPS 2026 guiado a la baja.",
    research_full: `# Northrop Grumman Corporation (NOC) — Research Completo

## Precio: $691.43 | P/E: 23.46 | P/E Forward: 24.43 | Div Yield: 1.35% | Market Cap: $98B

---

## ¿Qué es Northrop Grumman?

Northrop Grumman es el **segundo contratista de defensa más grande de EE.UU.** y el fabricante del **B-21 Raider**, el bombardero stealth de nueva generación más avanzado del mundo. También es el contratista principal del **ICBM Sentinel**, el reemplazo del Minuteman III. Con un backlog de **$95.7 mil millones**, la empresa tiene visibilidad de ingresos para años.

## Segmentos de Negocio (FY2025)

| Segmento | Revenue | % Total | Programas Clave |
|----------|---------|---------|-----------------|
| **Aeronautics Systems** | $13.0B | 29% | B-21 Raider, Global Hawk, Triton, drones autónomos |
| **Mission Systems** | $12.5B | 28% | Radares, ciberseguridad, C4ISR, sensores avanzados |
| **Space Systems** | $10.8B | 24% | Satélites, GEM 63, misiles balísticos, Sentinel ICBM |
| **Defense Systems** | $8.0B | 18% | Municiones, IBCS, logística, entrenamiento |

## Resultados 2025 (Full Year)

- **Revenue: $42.0B** (+2% YoY)
- **Q4 Revenue: $11.71B** (+9.6% YoY) — aceleración significativa
- **EPS (Adjusted): $29.08**
- **Free Cash Flow: $3.3B** (+26% YoY — tercer año consecutivo de crecimiento 25%+)
- **Backlog: $95.7B** (récord)
- **Book-to-Bill: 1.10x** (reciben más órdenes de las que entregan)
- **Net Awards: $46B+** en 2025
- **Ventas internacionales: +20%** en 2025

## Guía 2026

- **Revenue:** $43.5B - $44.0B (~4% crecimiento)
- **EPS Adjusted:** $27.40 - $27.90 (consenso analistas: $28.05)
- **Nota:** EPS baja vs 2025 por mayores inversiones de capital y costos de producción B-21

## El B-21 Raider — El Game Changer

El B-21 Raider es el **programa de bombardero más grande en 30 años**:

- **Contrato de expansión de $4.5B** acordado en Feb 2026 para aumentar capacidad de producción +25%
- **Northrop invirtiendo $2-3B adicionales** de su propio capital para acelerar
- **Producción actual:** ~8 aviones/año, subiendo a ~10/año
- **Programa mínimo:** 100 aviones (potencial de más)
- **Primer avión operacional:** Llegará a Ellsworth AFB en 2027
- **$5B+ invertidos** en infraestructura digital y manufactura
- El programa aún no está completamente reflejado en guidance — **mayor upside no capturado**

## El ICBM Sentinel — El Riesgo Conocido

- **Sobrecosto Nunn-McCurdy:** Costo estimado supera $141B, se excedió el umbral legal
- **Reestructuración en curso:** Se espera concluir a finales de 2026
- **Vuelo de prueba retrasado:** De 2026 a marzo 2028
- **Problemas de software** y diseño de silos complican timeline
- **Capacidad operacional:** No antes de inicio de los 2030s
- **Mitigante:** Congreso agregó $2.5B para actividades de reducción de riesgo

## Dividendo y Retorno al Accionista

- **Dividendo anual:** $9.24/acción (~1.35% yield)
- **Años consecutivos de aumento:** 23
- **Último aumento:** +12% en mayo 2025
- **Buybacks 2025:** ~$1.7B en recompras
- **Autorización vigente:** $4.2B en recompras pendientes
- **Estrategia:** Devolver >100% del FCF a accionistas

## Ventajas Competitivas (Moat)

1. **Monopolio del B-21:** Único fabricante del bombardero stealth de nueva generación
2. **Contratista #2 del Pentágono:** Solo detrás de Lockheed Martin
3. **Backlog de $95.7B:** ~2.3x ventas anuales de visibilidad
4. **Programas clasificados:** Múltiples programas "black" imposibles de replicar
5. **Posicionamiento temprano en ciclo:** B-21 y Sentinel están en fase de inversión — el revenue fuerte viene en los próximos años
6. **Liderazgo en ciberseguridad y C4ISR:** Capacidades críticas para guerra moderna

## La Megatendencia de Defensa

- **NATO sube a 5% del PIB para 2035** — multiplica presupuestos de defensa en Europa
- **EE.UU. sube defensa ~15% en FY2026** — NOC es beneficiario directo
- **Conflictos activos** (Ucrania, Medio Oriente) aceleran demanda
- **Ventas internacionales creciendo 20%** — book-to-bill internacional >1 esperado en 2026
- **Nuevas amenazas** (hipersónicos, ciberataques, drones) requieren exactamente lo que NOC fabrica

## Catalizadores

1. **B-21 Raider expansión** — $4.5B en capacidad adicional, producción +25%, primer avión operacional en 2027
2. **Backlog récord $95.7B** — visibilidad de ~2.3 años de revenue
3. **Free cash flow acelerando** — +26% en 2025, tercer año de crecimiento 25%+
4. **Ventas internacionales +20%** — mercado en expansión por NATO 5%
5. **Presupuesto defensa EE.UU. +15%** — viento de cola secular
6. **Programas clasificados** — upside no visible en guidance público

## Riesgos Principales

1. **Sentinel ICBM en problemas:** Sobrecostos de $141B+, reestructuración, retrasos de 4 años
2. **Valuación exigente:** P/E forward de 24.4x es premium para ~4% crecimiento de ventas
3. **EPS 2026 baja vs 2025:** Guidance de $27.65 vs $29.08 logrados
4. **Dependencia del presupuesto de defensa:** Cambios políticos o recortes podrían afectar pipeline
5. **Riesgo de ejecución B-21:** Programa masivo en ramp-up

## Posición Competitiva

| Métrica | NOC | LMT | RTX | GD |
|---------|-----|-----|-----|-----|
| **Revenue** | $42B | $75B | $85B | $46B |
| **Backlog** | $95.7B | $194B | $217B | $92B |
| **Dividend Yield** | 1.35% | 2.26% | 2.2% | 2.0% |
| **P/E Forward** | 24.4x | 20.5x | ~22x | ~20x |
| **Enfoque defensa** | 90% | 100% | 65% | 65% |

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Rating | **Buy** (17 analistas) |
| Strong Buy | 5 |
| Buy | 5 |
| Hold | 7 |
| Sell | 0 |
| Price Target Promedio | **$675.29** |
| Price Target Alto | $815 |
| Price Target Bajo | $521 |
| **Upside al Target** | **-2.2%** |

## Conclusión

NOC a $691.43 es una **apuesta al futuro de la defensa aérea y espacial de EE.UU.** El B-21 Raider es el programa de defensa más importante de la próxima década, y NOC es el único fabricante. Con backlog récord de $95.7B, FCF acelerando, y ventas internacionales creciendo 20%, la empresa tiene fundamentos sólidos. El riesgo principal es la valuación premium (24.4x forward P/E) junto con EPS que baja en 2026 por inversiones en capacidad. Sin embargo, estas inversiones son las que generarán el crecimiento futuro. Para un portafolio diversificado de defensa (complementando a LMT), NOC ofrece exposición única a bombarderos stealth, ciberseguridad, y sistemas espaciales.

---

*Research fecha: 25 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 675.29,
    analyst_upside: -2.2,
    status: "active",
    first_researched_at: "2026-03-25T00:00:00Z",
    last_updated_at: "2026-03-25T00:00:00Z",
    next_review_at: "2026-09-25T00:00:00Z",
  },
  {
    id: 26,
    ticker: "GE",
    name: "GE Aerospace",
    sector: "Industrials",
    industry: "Aerospace & Defense / Aircraft Engines",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 288.68,
    pe_ratio: 35.91,
    pe_forward: 33.72,
    dividend_yield: 0.63,
    market_cap_b: 303.0,
    eps: 8.04,
    summary_short:
      "El fabricante de motores de avión #1 del mundo. Tras separarse de GE Vernova en 2024, GE Aerospace es una empresa pura de aviación con 44,000+ motores comerciales instalados, backlog récord de ~$190 mil millones y el superciclo de MRO como viento de cola.",
    summary_what:
      "GE Aerospace diseña, fabrica y da servicio a motores de avión comerciales y militares. Opera en 2 segmentos: Commercial Engines & Services (CES, ~72% revenue) — motores LEAP (vía CFM International, JV 50/50 con Safran) para Boeing 737 MAX y Airbus A320neo, GE9X para el 777X, GEnx, CF6 — y Defense & Propulsion Technologies (DPT, ~28%) — motores T700 para helicópteros, F110, F414 para cazas. Su base instalada de 44,000+ motores genera ingresos recurrentes masivos en mantenimiento (MRO).",
    summary_why:
      "Revenue 2025 creció 21% a $42.3B y operating profit subió 25% a $9.1B. Free cash flow récord de $7.7B (+24%). Backlog de ~$190B (+$20B en un año). El superciclo de MRO (flota envejecida + demanda récord de viajes aéreos) impulsa servicios comerciales +26%. LEAP alcanzó entregas récord de 1,802 motores. Guía 2026 apunta a $9.85B-$10.25B en operating profit.",
    summary_risk:
      "Boeing 737 MAX sigue con problemas de producción que limitan entregas de motores LEAP. Valuación premium (P/E forward 33.7x) requiere ejecución impecable. Problema de durabilidad del sello interno del GE9X podría retrasar certificación del 777X.",
    research_full: `# GE Aerospace (GE) — Research Completo

## Precio: $288.68 | P/E: 35.91 | P/E Forward: 33.72 | Div Yield: 0.63% | EPS: $8.04 | Market Cap: $303B

---

## ¿Qué es GE Aerospace?

GE Aerospace es el **fabricante de motores de avión #1 del mundo**. En abril de 2024, completó su separación de GE Vernova (negocio de energía), convirtiéndose en una **empresa pura de aviación**. Con una base instalada de más de **44,000 motores comerciales** y un backlog de aproximadamente **$190 mil millones**, GE Aerospace domina el mercado global de propulsión aérea tanto comercial como militar.

La empresa es heredera de más de 100 años de ingeniería aeronáutica. A través de **CFM International** — su joint venture 50/50 con la francesa **Safran** — fabrica el motor LEAP, que impulsa los dos aviones más vendidos de la historia: el **Boeing 737 MAX** y el **Airbus A320neo**.

## Segmentos de Negocio (FY2025)

| Segmento | Revenue | % Total | Crecimiento | Productos Clave |
|----------|---------|---------|-------------|-----------------|
| **Commercial Engines & Services (CES)** | ~$32B | ~72% | +24% | LEAP (737 MAX / A320neo), GE9X (777X), GEnx (787/747-8), CF6, servicios MRO |
| **Defense & Propulsion Technologies (DPT)** | ~$12.2B | ~28% | +11% | T700 (helicópteros Black Hawk/Apache), F110 (F-16/F-15), F414 (F/A-18), motores de combate |

### Productos Clave en Detalle

- **LEAP (CFM International):** Motor estrella para narrowbodies. Entregó **1,802 motores** en 2025 (récord, +28%). Backlog de +10,000 motores. Objetivo de **2,000 entregas en 2026**
- **GE9X:** El motor de avión más grande y eficiente del mundo. Diseñado exclusivamente para el **Boeing 777X**. Certificado por la FAA en 2020, con primera entrega del avión estimada para 2027
- **GEnx:** Motor del Boeing 787 Dreamliner y 747-8. Base instalada masiva generando MRO recurrente
- **CF6:** Motor legacy en miles de aviones widebody. Fuente enorme de ingresos de servicios
- **T700:** Motor de helicóptero para Black Hawk, Apache, y Seahawk. Contrato del Ejército de EE.UU. por hasta $1.1B para producción continua hasta 2029

## Resultados Financieros 2025 (Full Year)

- **Total Orders:** $66.2B (+32% YoY)
- **Revenue Ajustado:** $42.3B (+21% YoY)
- **Revenue Total (GAAP):** $45.9B (+18%)
- **Operating Profit:** $9.1B (+25%)
- **Adjusted EPS:** $6.37 (+38%)
- **Free Cash Flow:** $7.7B (+24%)
- **FCF Conversion:** >100%
- **Backlog:** ~$190B (+$20B en el año)

### Por Segmento:

**Commercial Engines & Services (CES):**
- Revenue: ~$32B (+24%)
- Operating Profit: $8.9B (+26%)
- Margen operativo: 26.6% (+40 bps)
- Servicios comerciales: +26%
- Entregas de motores comerciales: +25%
- Entregas LEAP: 1,802 (récord, +28%)
- Repuestos: +25%

**Defense & Propulsion Technologies (DPT):**
- Revenue: ~$12.2B (+11%)
- Operating Profit: $1.3B (+22%)
- Entregas de motores militares: +30%
- Orders: +19%

## Guía 2026

- **Revenue:** Crecimiento low double-digit
- **Operating Profit:** $9.85B - $10.25B (~$1B de crecimiento al midpoint)
- **Adjusted EPS:** $7.10 - $7.40 (~15% crecimiento al midpoint)
- **Free Cash Flow:** $8.0B - $8.4B
- **CES Revenue:** Mid-teens growth (servicios mid-teens, equipo mid-to-high teens)
- **Entregas LEAP 2026:** 2,000 (récord, +15% vs 2025)
- **DPT Revenue:** Mid-to-high single digit growth

## Dividendo y Retorno al Accionista

- **Dividendo trimestral:** $0.47/acción ($1.88 anualizado)
- **Dividend Yield:** 0.63%
- **Aumento en 2026:** +30% vs 2025 ($1.44 anualizado en 2025)
- **Plan de retorno 2024-2026:** ~$24B total (+20% vs plan original)
- **Programa de recompra:** $19B autorizado en buybacks
- **Política futura:** Retornar al menos 70% del FCF vía dividendos y recompras

## Ventajas Competitivas (Moat)

1. **Base instalada de 44,000+ motores:** Cada motor genera décadas de ingresos recurrentes de MRO. Los motores se venden casi al costo — el negocio real es el servicio
2. **Duopolio en motores comerciales:** GE/CFM y Pratt & Whitney (RTX) dominan el 100% del mercado de narrowbodies. No hay tercer competidor viable
3. **CFM International (JV con Safran):** El LEAP es el motor más producido del mundo para narrowbodies. Backlog de +10,000 motores
4. **Switching costs extremos:** Cambiar de motor en un programa de avión es prácticamente imposible una vez seleccionado. Los programas duran 30+ años
5. **Superciclo de MRO:** Flota envejecida + retiros retrasados + demanda récord de viajes = shop visits en niveles históricos. Esto es revenue de alto margen
6. **Barrera de entrada insuperable:** Desarrollar un motor de avión cuesta $10B+ y 10-15 años. La certificación y track record operacional son barreras infranqueables

## Catalizadores

1. **Superciclo de MRO:** Servicios comerciales crecieron +26% en 2025. Flota envejecida y retiros retrasados garantizan años de demanda elevada
2. **Rampa de producción LEAP:** De 1,802 en 2025 a 2,000 objetivo en 2026. Cada motor vendido genera $10-15M+ en servicios lifecycle
3. **GE9X y Boeing 777X:** Primer avión previsto para 2027. Programa exclusivo de GE para widebody de nueva generación
4. **Programa RISE (CFM):** Motor open-fan de próxima generación con 20% menos consumo. Vuelos de prueba previstos mid-2020s, entrada en servicio mid-2030s. Asegura liderazgo futuro
5. **Expansión de defensa:** Presupuesto militar EE.UU. +15%, NATO al 5% del PIB. DPT creció 11% con entregas militares +30%
6. **Capital return masivo:** ~$24B en retorno al accionista (2024-2026), +30% aumento de dividendo, buybacks agresivos reducen shares outstanding

## Riesgos Principales

1. **Boeing 737 MAX:** Los problemas de producción de Boeing limitan directamente las entregas de motores LEAP. El ritmo de producción del MAX sigue por debajo de lo planeado, lo que frena el potencial de revenue de CES
2. **Valuación premium:** A P/E forward de 33.7x, GE cotiza con una prima significativa vs su histórico y vs peers. Cualquier miss en guidance o desaceleración de servicios podría causar una corrección fuerte
3. **Problema de durabilidad GE9X:** En enero 2026, Boeing confirmó un problema con un sello interno del GE9X que podría afectar durabilidad. Aunque la certificación del 777X continúa, cualquier retraso adicional afectaría a GE
4. **Restricciones de cadena de suministro:** La rampa de producción de LEAP depende de proveedores de piezas forjadas y materiales especializados que siguen bajo presión
5. **Concentración en aviación comercial:** Al ser una empresa pura de aviación, una recesión global que reduzca el tráfico aéreo impactaría desproporcionadamente

## Posición Competitiva

| Métrica | **GE Aerospace** | RTX (Pratt & Whitney) | Safran | Rolls-Royce |
|---------|-------------------|----------------------|--------|-------------|
| **Revenue** | $42.3B | $83B (total RTX) | €30.5B | £17.8B |
| **Motor Narrowbody** | LEAP (CFM, 50%) | GTF (PW1000G) | LEAP (CFM, 50%) | — |
| **Motor Widebody** | GE9X, GEnx, CF6 | — | — | Trent XWB, Trent 7000 |
| **Base instalada comercial** | 44,000+ | ~15,000 | Compartida vía CFM | ~4,500 |
| **Backlog** | ~$190B | $217B | €52B+ | £14.1B civil |
| **Margen operativo (aviación)** | ~21% | ~16% (RTX total) | ~17% | ~18% |
| **Dividend Yield** | 0.63% | 2.2% | ~1.3% | ~0.8% |
| **P/E Forward** | 33.7x | ~22x | ~30x | ~27x |
| **Próxima gen** | RISE (open fan, CFM) | GTF Advantage | RISE (open fan, CFM) | UltraFan |

**Nota:** GE Aerospace tiene la base instalada comercial más grande del mundo, lo que le da una ventaja estructural en el negocio de servicios de alto margen. Safran es socio (no competidor) en CFM International. RTX (Pratt & Whitney) es el principal competidor directo en narrowbodies con el motor GTF, que ha tenido sus propios problemas de durabilidad en discos de turbina.

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Rating | **Strong Buy** |
| Price Target Promedio | **$337.50** |
| Precio Actual | $288.68 |
| **Upside al Target** | **+16.8%** |
| EPS (TTM) | $8.04 |
| EPS Forward (Guía 2026) | $7.10 - $7.40 |
| Free Cash Flow 2026E | $8.0B - $8.4B |

## Conclusión

GE Aerospace a $288.68 es la **empresa pura de aviación dominante a nivel global** — con la base instalada de motores comerciales más grande del mundo (44,000+) y el superciclo de MRO como viento de cola secular. Los números de 2025 fueron excepcionales: revenue +21%, operating profit +25%, FCF +24%, LEAP en entregas récord. La guía 2026 apunta a otro año de crecimiento de doble dígito con $9.85B-$10.25B en operating profit y $8.0B-$8.4B en FCF. El riesgo principal es la valuación: a P/E forward de 33.7x, el mercado ya descuenta mucho del crecimiento. Sin embargo, la calidad del negocio — ingresos recurrentes de MRO, duopolio en motores, switching costs de 30 años, y el programa RISE como puente al futuro — justifica una prima. Para un portafolio diversificado, GE Aerospace ofrece exposición al mejor negocio de aviación del mundo con un catalyst claro en el superciclo de MRO que apenas está comenzando.

---

*Research fecha: 25 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 337.50,
    analyst_upside: 16.8,
    status: "active",
    first_researched_at: "2026-03-25T00:00:00Z",
    last_updated_at: "2026-03-25T00:00:00Z",
    next_review_at: "2026-09-25T00:00:00Z",
  },
  {
    id: 27,
    ticker: "HWM",
    name: "Howmet Aerospace",
    sector: "Industrials",
    industry: "Aerospace & Defense / Engineered Components",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 227.90,
    pe_ratio: 61.43,
    pe_forward: 41.46,
    dividend_yield: 0.2,
    market_cap_b: 91.7,
    eps: 3.71,
    summary_short:
      "El líder mundial en componentes de ingeniería aeroespacial. Fabrican las piezas críticas dentro de los motores de avión — los álabes que giran a 2,000° grados — para Boeing, Airbus, Pratt & Whitney y GE Aerospace. Revenue récord de $8.25B en 2025 con márgenes EBITDA de 30%.",
    summary_what:
      "Howmet Aerospace diseña y fabrica componentes de alta precisión para la industria aeroespacial y de defensa. Opera en 4 segmentos: Engine Products (álabes y anillos para motores de avión — la joya de la corona), Fastening Systems (sujetadores y conexiones aeroespaciales), Engineered Structures (piezas de titanio para fuselajes y trenes de aterrizaje), y Forged Wheels (ruedas para camiones pesados). Se separó de Alcoa en 2020.",
    summary_why:
      "Revenue récord de $8.25B en 2025 (+11% YoY). Q4 fue el trimestre más fuerte con $2.2B (+15%). Adjusted EBITDA margins de 30.1% (récord). Adjusted EPS creció 42%. Guía 2026 apunta a ~$9.1B en revenue (~10% crecimiento) y EPS de $4.35-$4.55. Acaba de anunciar la adquisición de Consolidated Aerospace Manufacturing por $1.8B para reforzar Fastening Systems.",
    summary_risk:
      "La acción cotiza a P/E forward de 41x — está priced for perfection. Cualquier tropiezo en earnings o problemas de producción de Boeing podrían causar una corrección significativa. La acción ya bajó ~12% desde máximos de febrero.",
    research_full: `# Howmet Aerospace (HWM) — Research Completo

## Precio: $227.90 | P/E: 61.43 | P/E Forward: 41.46 | Div Yield: 0.2% | EPS: $3.71 | Market Cap: $91.7B

---

## ¿Qué es Howmet Aerospace?

Howmet Aerospace es el **líder mundial en componentes de ingeniería aeroespacial**. Fabrican las piezas críticas que van DENTRO de los motores de avión — los álabes (blades) que giran a temperaturas extremas de 2,000+ grados. Si Boeing, Airbus, Pratt & Whitney, o GE Aerospace construyen un avión o motor, hay una altísima probabilidad de que Howmet fabricó algunas de las piezas más importantes.

Fundada en 1888, Howmet fue parte de Alcoa antes de separarse en 2020 como empresa independiente enfocada 100% en componentes aeroespaciales de alta precisión.

## Segmentos de Negocio (4 Divisiones)

| Segmento | Revenue | Descripción | Crecimiento 2025 |
|----------|---------|-------------|-----------------|
| **Engine Products** | ~35% | Álabes, anillos, piezas rotativas para motores de avión | +20% |
| **Fastening Systems** | ~25% | Sujetadores, pernos, conexiones aeroespaciales | Crecimiento sólido |
| **Engineered Structures** | ~25% | Lingotes de titanio, forjas para fuselajes y trenes de aterrizaje | Enfocado en defensa |
| **Forged Wheels** | ~15% | Ruedas de aluminio forjado para camiones pesados | Generador de cash estable |

## Resultados 2025 (Full Year)

- **Revenue récord: $8.25B** (+11% YoY)
- **Q4 Revenue: $2.2B** (+15% YoY — trimestre más fuerte)
- **Net Income Q4: $372M** (+18% YoY)
- **Adjusted EBITDA Margins: 30.1%** (récord de la empresa)
- **Adjusted EPS: $1.05 en Q4** (+42% YoY)
- **Full Year EPS: $3.71**
- **Engine Products creció +20%** en el último trimestre
- Comercial creció 13%, defensa 20%, turbinas de gas 32%

## Guía 2026

- **Revenue: ~$9.1B** (~10% crecimiento)
- **Adjusted EPS: $4.35 - $4.55** (~20% crecimiento)
- **Objetivo de EBITDA margins: 30%+** para fin de año
- Fuerte demanda continua de aviación comercial y defensa

## Adquisición de CAM ($1.8B)

- **Consolidated Aerospace Manufacturing** de Stanley Black & Decker
- **Precio: $1.8 mil millones**
- **Revenue de CAM: ~$490M** anuales
- **Productos:** Sujetadores de precisión y conexiones para aeroespacial/defensa
- **Marcas:** Bristol Industries, 3V Fasteners, Moeller, Aerofit, Voss Industries
- **Cierre esperado:** H1 2026
- Refuerza significativamente el segmento Fastening Systems

## Dividendo y Retorno al Accionista

- **Dividendo anual: $0.48/acción** (~0.2% yield)
- **Aumentos consecutivos:** 5 años
- **Pago trimestral:** $0.12
- La empresa prioriza crecimiento sobre dividendo — es una historia de crecimiento

## Ventajas Competitivas (Moat)

1. **Líder mundial en álabes aeroespaciales:** Las piezas que giran dentro de motores a 2,000+ grados requieren metalurgia de precisión extrema — pocos en el mundo pueden hacerlo
2. **Clientes cautivos:** Una vez que un motor es diseñado con piezas de Howmet, cambiar de proveedor es prácticamente imposible. Programas de 30+ años
3. **Relaciones con todos los OEMs:** Boeing, Airbus, Pratt & Whitney, GE Aerospace, Rolls-Royce — todos dependen de Howmet
4. **Superciclo aeroespacial:** Record de órdenes de aviones + flota envejecida = demanda de piezas por años
5. **Márgenes expandiéndose:** EBITDA margins subieron a 30.1% — pricing power real
6. **Barrera de entrada altísima:** Certificaciones, metalurgia avanzada, y décadas de track record

## Catalizadores

1. **Superciclo de aviación comercial** — Backlog récord de Boeing + Airbus = años de demanda de piezas
2. **Adquisición CAM ($1.8B)** — Añade $490M de revenue y fortalece posición en fasteners
3. **Márgenes expandiéndose** — Objetivo de 30%+ EBITDA margins
4. **Crecimiento de defensa +20%** — Presupuestos militares subiendo globalmente
5. **EPS creciendo 20%+ anual** — Guía de $4.35-$4.55 para 2026
6. **Turbinas de gas industriales +32%** — Demanda energética impulsa este segmento

## Riesgos Principales

1. **Valuación exigente:** P/E forward de 41x es muy caro — priced for perfection
2. **Dependencia de Boeing:** Si Boeing sigue con problemas de producción, limita entregas de piezas
3. **Corrección reciente:** Ya bajó ~12% desde máximos de febrero — podría seguir bajando si el mercado se pone nervioso
4. **Integración de CAM:** Adquisiciones grandes siempre tienen riesgo de ejecución
5. **Ciclo económico:** Si la demanda de viajes aéreos baja (recesión), la demanda de piezas nuevas baja también

## Presencia Geográfica

Opera en **13+ países** con **38 plantas** en todo el mundo:
- **EE.UU.:** 15 estados (HQ en Pittsburgh, Pennsylvania)
- **Europa:** Francia, Alemania, UK, Hungría, República Checa, Países Bajos, Marruecos
- **Américas:** Canadá, México, Brasil
- **Asia-Pacífico:** Japón, China, Australia

## Posición Competitiva

| Métrica | **HWM** | TDG (TransDigm) | SPR (Spirit Aero) | HEI (HEICO) |
|---------|---------|-----|-----|-----|
| **Revenue** | $8.25B | $8.5B | $7.4B | $4.1B |
| **EBITDA Margin** | 30.1% | 49% | ~12% | ~25% |
| **P/E Forward** | 41x | 37x | N/A | 55x |
| **Dividend Yield** | 0.2% | 0% | 0% | 0.1% |
| **Enfoque** | Componentes motor + estructura | Componentes aftermarket | Fuselajes | Componentes electrónicos/vuelo |

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Rating | **Strong Buy** |
| Price Target Promedio | **~$280** |
| Precio Actual | $227.90 |
| **Upside al Target** | **~23%** |
| EPS 2026 Guía | $4.35 - $4.55 |

## Conclusión

HWM a $227.90 es una **apuesta al superciclo aeroespacial** — la empresa que fabrica las piezas más críticas dentro de los motores de avión que impulsan a Boeing y Airbus. Con revenue récord, márgenes de 30%, EPS creciendo 20%+ anual, y la adquisición de CAM como catalizador, Howmet tiene un negocio excepcional. El riesgo principal es la valuación: a P/E forward de 41x, el mercado ya descuenta mucho del crecimiento. Para un portafolio diversificado, HWM complementa nuestra posición en GE Aerospace — si GE hace los motores, Howmet hace las piezas críticas dentro de ellos.

---

*Research fecha: 27 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 280,
    analyst_upside: 22.9,
    status: "active",
    first_researched_at: "2026-03-27T00:00:00Z",
    last_updated_at: "2026-03-27T00:00:00Z",
    next_review_at: "2026-09-27T00:00:00Z",
  },
  {
    id: 28,
    ticker: "BG",
    name: "Bunge Global SA",
    sector: "Consumer Staples",
    industry: "Agribusiness / Oilseed Processing",
    country: "Switzerland",
    region: "Global",
    currency: "USD",
    price: 126.28,
    pe_ratio: 25.71,
    pe_forward: 15.52,
    dividend_yield: 2.22,
    market_cap_b: 24.44,
    eps: 4.91,
    summary_short:
      "El procesador de oleaginosas #1 del mundo. Se fusionaron con Viterra, creando un gigante agroindustrial global con $70B+ en revenue y operaciones en 40+ países.",
    summary_what:
      "Bunge conecta a los agricultores con los consumidores a nivel global. Compran, procesan y distribuyen soya, canola, girasol, trigo y maíz. Producen aceites vegetales, harinas, margarinas, mayonesas, y materia prima para biocombustibles. Tras la fusión con Viterra (julio 2025), son el procesador de oleaginosas más grande del planeta.",
    summary_why:
      "La fusión con Viterra está generando sinergias por $190M+ en 2026, adelantadas al plan original. P/E forward de 15.5x es barato para la escala del negocio. Dividendo del 2.2% con payout ratio bajo (57%). EPS guiado de $7.50-$8.00 para 2026 con meta de $15 para 2030. Buyback de $3B anunciado. 7 de 7 analistas dicen Buy.",
    summary_risk:
      "Dependencia de los precios de commodities agrícolas que son cíclicos. Integración de Viterra aún en progreso con riesgos de ejecución. Exposición a aranceles y tensiones comerciales globales.",
    research_full: `# Bunge Global SA (BG) — Research Completo

## Precio: $126.28 | P/E: 25.7 | P/E Forward: 15.5 | Div Yield: 2.2% | EPS: $4.91 | Market Cap: $24.4B

---

## ¿Qué es Bunge?

Bunge Global SA es la **empresa agroindustrial más grande del mundo por procesamiento de oleaginosas**. Fundada en 1818, está incorporada en Ginebra, Suiza, con sede operativa en Chesterfield, Missouri, EE.UU. Tras completar la fusión con Viterra en julio 2025, se convirtió en un coloso con más de **$70B en revenue anual**, operaciones en **40+ países** y **300+ instalaciones**.

## Segmentos de Negocio

| Segmento | Descripción | Productos Clave |
|----------|-------------|-----------------|
| **Soybean Processing & Refining** | Procesamiento y refinación de soya | Aceite de soya, harina de soya, lecitina |
| **Softseed Processing & Refining** | Procesamiento de canola, girasol, palma | Aceites vegetales especializados, biodiesel feedstock |
| **Other Oilseeds Processing & Refining** | Otros aceites y grasas | Aceite de palma, coco, karité, oliva |
| **Grain Merchandising & Milling** | Comercialización y molienda de granos | Harina de trigo, maíz molido, mezclas para panadería |
| **Sugar & Bioenergy** | Azúcar y energía renovable | Azúcar, etanol, electricidad de bagazo de caña |

## Resultados 2025 (Full Year Post-Viterra)

- **Revenue: $70.3B** (aumentado significativamente por consolidación de Viterra)
- **EPS TTM: $4.91** (afectado por costos de integración)
- **Guidance FY2026: EPS $7.50-$8.00**
- **Meta 2030: EPS $15+**
- **Dividendo: $2.80/acción** ($0.70 trimestral), yield 2.2%
- **Payout ratio: 57%** — sustentable con margen de crecimiento
- **Market Cap: $24.4B** | **Enterprise Value: $38.3B**
- **Beta: 0.74** — menor volatilidad que el mercado

## Fusión con Viterra — El Catalizador Principal

La fusión con **Viterra** (completada julio 2025) transformó a Bunge de un procesador grande a **el #1 indiscutible**:

- **Sinergias 2026: $190M+** (adelantadas vs plan original de $175M)
- **"Step change" esperado en 2027** — sinergias adicionales al madurar la integración
- Viterra aportó red logística complementaria en Canadá, Australia, y Europa del Este
- Se asumieron $9.8B en deuda de Viterra (manejable dado el scale del negocio)

## Ventajas Competitivas (Moat)

1. **Escala sin rival** — Procesador de oleaginosas #1 global. Origina 75M+ de toneladas métricas anuales
2. **Red logística global** — 300+ instalaciones en 40+ países, incluyendo puertos, elevadores, plantas procesadoras. Infraestructura prácticamente imposible de replicar
3. **Diversificación geográfica** — Procesamiento de soya: Sudamérica 47%, Norteamérica 25%, Asia-Pacífico 15%, Europa 13%
4. **Posición esencial en la cadena de valor** — Intermediarios entre agricultores y consumidores finales. Indispensables
5. **Marcas de consumo en mercados emergentes** — Delicia, Primor, Soya, Cyclus (Brasil), Dalda (India)

## Capital Return

- **Dividendo: $2.80/acción** ($0.70 trimestral), yield 2.2%
- **5 años consecutivos de incremento**, crecimiento promedio de 3.4% anual
- **Programa de recompra de acciones: $3B** anunciado
- **Payout ratio: 57%** — amplio margen para seguir incrementando

## Catalizadores de Crecimiento

1. **Sinergias de Viterra** — $190M en 2026, step change en 2027
2. **Meta de EPS $15 para 2030** — Desde $4.91 actual, crecimiento compuesto agresivo
3. **Demanda estructural de alimentos** — Población mundial creciente + clase media emergente
4. **Biocombustibles** — Bunge produce renewable diesel feedstock. La transición energética crea demanda adicional
5. **JPMorgan target $134, Morgan Stanley $140** — Analistas ven momentum post-fusión

## Riesgos Principales

1. **Ciclicidad de commodities** — Precios de soya, maíz, trigo y canola fluctúan con clima, demanda global y políticas comerciales
2. **Integración de Viterra** — Asumieron $9.8B en deuda. Riesgo de ejecución en la integración
3. **Aranceles y tensiones comerciales** — EE.UU.-China y otros conflictos afectan flujos de granos globales
4. **Márgenes volátiles** — Los márgenes de crushing pueden comprimirse en periodos de baja demanda
5. **Riesgo climático** — Sequías e inundaciones afectan producción agrícola y volúmenes

## Valuación

- **P/E trailing: 25.7x** — elevado por costos de integración que comprimen EPS actual
- **P/E forward: 15.5x** — mucho más razonable basado en guidance de $7.50-$8.00
- **PEG: 0.71** — debajo de 1.0, el crecimiento no está priced in
- **Analyst target promedio: $130.86** — upside de ~3.6% desde niveles actuales
- **JPMorgan: $134 | Morgan Stanley: $140 | Barclays: $135**
- **52-week change: +65%** — rally fuerte, pero sinergias de Viterra apenas comienzan

## Presencia Geográfica

- **Suiza** (incorporación en Ginebra)
- **EE.UU.** (HQ operativo en Chesterfield, Missouri)
- **Brasil, Argentina** (Sudamérica — 47% del procesamiento de soya)
- **Canadá** (herencia de Viterra — granos y canola)
- **Europa** (múltiples plantas de procesamiento)
- **India** (marca Dalda — aceites de cocina)
- **China, Vietnam, Australia** (Asia-Pacífico — 15%)

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Rating | **Strong Buy** |
| Analistas | 7 de 7 Buy |
| Price Target Promedio | **$130.86** |
| Precio Actual | $126.28 |
| **Upside al Target** | **3.6%** |
| EPS 2026 Guidance | $7.50 - $8.00 |

## Conclusión

BG a $126.28 es una **apuesta al negocio agroindustrial más grande del planeta** — el intermediario esencial entre los agricultores y tu mesa. Con la fusión de Viterra generando sinergias reales, P/E forward de 15.5x (barato para la escala), dividendo de 2.2% creciente, y meta de EPS $15 para 2030, Bunge ofrece una combinación rara de valor + crecimiento + ingreso. El riesgo principal es la ciclicidad de commodities — pero en un mundo con más gente que alimentar cada año, el procesador de oleaginosas #1 está bien posicionado a largo plazo.

---

*Research fecha: 30 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 130.86,
    analyst_upside: 3.6,
    status: "active",
    first_researched_at: "2026-03-30T00:00:00Z",
    last_updated_at: "2026-03-30T00:00:00Z",
    next_review_at: "2026-09-30T00:00:00Z",
  },
  {
    id: 29,
    ticker: "BIDU",
    name: "Baidu, Inc.",
    sector: "Communication Services",
    industry: "Internet Content & Information / AI Platform",
    country: "China",
    region: "Asia",
    currency: "USD",
    price: 106.60,
    pe_ratio: 14.2,
    pe_forward: 19.1,
    dividend_yield: 0,
    market_cap_b: 31.8,
    eps: 7.64,
    summary_short:
      "El Google de China y líder en IA. Domina búsquedas con 65%+ de market share, opera robotaxis autónomos (Apollo Go) con 20M+ viajes, y su chatbot ERNIE tiene 200M+ usuarios mensuales.",
    summary_what:
      "Baidu es el motor de búsqueda dominante en China y una de las empresas más avanzadas en inteligencia artificial del país. Opera Baidu Search, Baidu AI Cloud (~RMB 30B en revenue), Apollo Go (robotaxis autónomos en 22+ ciudades), ERNIE Bot (chatbot IA con 200M+ MAUs), y tiene participación en iQIYI (streaming de video). Su negocio está en plena transición de publicidad digital a plataforma integral de IA.",
    summary_why:
      "Transición a IA acelerando: AI Cloud creció 34% en 2025, Apollo Go triplicó viajes YoY, ERNIE 5.0 compite con GPT-5. P/E non-GAAP de 14x es absurdamente barato para una empresa líder en IA. $42B en caja (más que su market cap). Nuevo programa de recompra de $5B + primera política de dividendos en 2026.",
    summary_risk:
      "Revenue total cayó -3% en 2025. Negocio legacy de búsqueda en declive. Riesgo regulatorio chino y tensiones geopolíticas EE.UU.-China. GAAP earnings distorsionados por impairments de iQIYI.",
    research_full: `# Baidu, Inc. (BIDU) — Research Completo

## Precio: $106.60 | P/E (non-GAAP): 14.2x | P/E Forward: 19.1x | Div Yield: 0% | Market Cap: $31.8B

---

## ¿Qué es Baidu?

Baidu, Inc. es el **motor de búsqueda dominante en China** con más del 65% de market share, y se ha transformado en una **plataforma integral de inteligencia artificial**. Fundada en 2000 por Robin Li, la empresa tiene sede en Beijing y cotiza en NASDAQ (BIDU) y en la Bolsa de Hong Kong (9888.HK).

Con más de **$42B en efectivo e inversiones** (superando su propia capitalización de mercado), Baidu es una de las empresas tecnológicas más subvaloradas del mundo por métricas fundamentales.

## Segmentos de Negocio

| Segmento | Descripción | Revenue 2025 aprox |
|----------|-------------|---------------------|
| **Baidu Core - Marketing** | Publicidad digital en búsqueda y feeds | ~RMB 65B (~50% del total) |
| **Baidu AI Cloud** | Infraestructura cloud + aplicaciones IA empresariales | ~RMB 30B (23% del total) |
| **Apollo Go** | Robotaxis autónomos, servicios de conducción autónoma | En crecimiento acelerado |
| **ERNIE / AI Apps** | Chatbot IA, herramientas de productividad, API | RMB 10.2B en 2025 |
| **iQIYI** | Plataforma de streaming de video (participación ~45%) | Consolidado parcialmente |

### Baidu Search (Núcleo Legacy)
Motor de búsqueda #1 en China. Genera la mayoría del revenue vía publicidad. En declive gradual (-3% YoY en 2025) a medida que los usuarios migran a apps verticales e IA conversacional. Baidu está integrando ERNIE directamente en la búsqueda para revitalizar el producto.

### Baidu AI Cloud
- Revenue de **~RMB 30B en 2025** (infraestructura ~RMB 20B + aplicaciones ~RMB 10.2B)
- **AI Cloud Infra creció 34% YoY**, superando el crecimiento de la industria
- Revenue de aplicaciones IA alcanzó RMB 2.7B solo en Q4 2025
- Margen operativo superó el 10% — ya es rentable
- ~25% del segmento enterprise AI cloud en China (junto con Alibaba)

### Apollo Go (Robotaxis Autónomos)
- **20 millones de viajes acumulados** a febrero 2026
- **3.4 millones de viajes completamente autónomos** en Q4 2025 (+200% YoY)
- **300,000+ viajes semanales** en su pico de Q4 2025
- Operando en **22+ ciudades** incluyendo Beijing, Shanghai, Wuhan, Shenzhen, Hong Kong
- **Expansión global:** Dubai, Abu Dhabi, Corea del Sur, piloto en Londres (H1 2026), pruebas en Suiza
- Flota de **1,000+ robotaxis**
- Objetivo: alcanzar **rentabilidad operativa en 2026**

### ERNIE Bot (Chatbot IA)
- **202 millones de usuarios activos mensuales** a diciembre 2025
- **ERNIE 5.0**: modelo multimodal nativo con 2.4 trillones de parámetros
- **Ranking #1 entre modelos chinos** y #8 global en LMArena
- API disponible para desarrolladores — ecosistema creciente

## Resultados Financieros 2025 (Full Year)

| Métrica | 2025 | YoY |
|---------|------|-----|
| **Revenue Total** | RMB 129.1B ($18.5B) | -3% |
| **Net Income (Non-GAAP)** | RMB 18.9B | Estable |
| **EPS (Non-GAAP)** | $7.64 | - |
| **Non-GAAP Net Margin** | 15% | - |
| **Adjusted EBITDA** | RMB 22.9B (18% margin) | - |
| **Cash + Inversiones** | RMB 294.1B ($42B) | - |

### Q4 2025 Highlights:
- Revenue: RMB 32.7B ($4.68B)
- EPS (GAAP): $1.52 (beat del 35.7% vs estimados)
- Core AI-powered Business: >RMB 11B (43% del revenue)
- AI Cloud Infra Q4: RMB 5.8B
- AI Apps Q4: RMB 2.7B

## Ventajas Competitivas (Moat)

1. **Dominio en búsqueda china** — 65%+ market share, efecto de red masivo, datos propietarios
2. **Liderazgo en IA** — ERNIE 5.0 es el modelo #1 en China, 202M MAUs en chatbot
3. **Apollo Go first-mover** — La red de robotaxis más grande del mundo por número de viajes
4. **Datos únicos** — Billones de queries de búsqueda alimentan sus modelos de IA
5. **$42B en caja** — Más efectivo que su propia capitalización de mercado
6. **Ecosistema integrado** — Búsqueda + Cloud + IA + Autónomos crea sinergias únicas

## Catalizadores de Crecimiento

1. **AI Cloud en hipercrecimiento** — 34% YoY, sector enterprise IA apenas empieza en China
2. **Apollo Go hacia rentabilidad** — 200% crecimiento en viajes, expansión global, target profit 2026
3. **ERNIE monetización** — 200M+ usuarios, API para empresas, integración en búsqueda
4. **Programa de recompra $5B** — Reduce share count agresivamente hasta dic 2028
5. **Primer dividendo en 2026** — Señal de confianza de la directiva
6. **Venta potencial de iQIYI** — Simplificaría la estructura y liberaría capital
7. **Expansión global de Apollo Go** — Dubai, Abu Dhabi, Corea del Sur, Londres, Suiza

## Riesgos Principales

1. **Revenue legacy en declive** — Búsqueda cayó -3% en 2025, la transición a IA aún no compensa
2. **Riesgo regulatorio chino** — El gobierno puede imponer restricciones a IA, datos, o expansión internacional
3. **Geopolítica EE.UU.-China** — Riesgo de delisting, sanciones tecnológicas, restricciones de chips
4. **iQIYI arrastra resultados** — Impairments distorsionan earnings GAAP
5. **Competencia feroz en IA** — Alibaba, ByteDance, Tencent, y startups como DeepSeek compiten agresivamente
6. **Apollo Go capex intensivo** — Requiere inversión continua; timeline a rentabilidad incierto

## Valuación

| Métrica | Valor |
|---------|-------|
| Precio actual | $106.60 |
| **P/E (Non-GAAP)** | **14.2x** |
| P/E Forward | 19.1x |
| Market Cap | $31.8B |
| **Cash + Inversiones** | **$42B** |
| **Enterprise Value** | **Negativo** (cash > market cap) |

La valuación es extraordinaria: Baidu cotiza a P/E non-GAAP de 14.2x con $42B en efectivo — más que toda su capitalización. El mercado valora todo el negocio operativo en **valor negativo**. Una de las dislocaciones más extremas en tech.

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Rating | **Buy** |
| Analistas Buy | 28 |
| Analistas Hold | 6 |
| Analistas Sell | 1 |
| Price Target Promedio | **$158.94** |
| **Upside al Target** | **+47%** |

## Conclusión

BIDU a $106.60 es una **apuesta deep value al líder de IA en China** — con más caja que market cap, robotaxis autónomos que triplicaron viajes, un chatbot con 200M+ usuarios, y AI Cloud creciendo 34%. A P/E non-GAAP de 14x, el mercado básicamente te regala el negocio operativo. El riesgo principal es geopolítico y regulatorio (China), pero para un portafolio diversificado, la asimetría riesgo/recompensa es excepcional.

---

*Research fecha: 30 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 158.94,
    analyst_upside: 47.0,
    status: "active",
    first_researched_at: "2026-03-30T00:00:00Z",
    last_updated_at: "2026-03-30T00:00:00Z",
    next_review_at: "2026-09-30T00:00:00Z",
  },
  {
    id: 30,
    ticker: "BKNG",
    name: "Booking Holdings Inc.",
    price: 168.17, // Split-adjusted (1:25 split, pre-split: $4204.22)
    currency: "USD",
    sector: "Consumer Discretionary",
    industry: "Online Travel",
    region: "North America",
    country: "United States",
    market_cap_b: 144.5,
    pe_ratio: 25.5,
    pe_forward: 15.5,
    dividend_yield: 1.02,
    eps: 6.42, // Split-adjusted (pre-split: $160.5)

    summary_short:
      "La plataforma de viajes en línea más grande del mundo. Dueños de Booking.com, Priceline, Kayak, Agoda y OpenTable. Procesan $186B al año en reservas de hoteles, vuelos, autos y restaurantes en 220+ países.",
    summary_what:
      "Booking Holdings es el líder mundial en viajes en línea, conectando viajeros con alojamiento, transporte, gastronomía y experiencias en más de 220 países. Opera cinco marcas: Booking.com (la plataforma de alojamiento más grande del mundo), Priceline (ofertas de viaje en Norteamérica), Agoda (Asia-Pacífico), KAYAK (buscador de precios) y OpenTable (reservas de restaurantes). En 2025 procesaron $186.1B en reservas brutas y 285 millones de noches de hotel solo en Q4.\n\nGenera ingresos por comisiones sobre reservas, revenue de su plataforma de pagos, y publicidad de sus servicios de metabúsqueda. Ha invertido agresivamente en 'Connected Trip' — un ecosistema impulsado por IA que busca manejar cada aspecto del viaje dentro de una plataforma unificada. El programa de lealtad Genius impulsa reservas directas cada vez más, reduciendo dependencia de marketing pagado.\n\nTiene sede en Norwalk, Connecticut, pero opera globalmente. Su marca más grande, Booking.com, está basada en Ámsterdam y domina Europa. Agoda lidera en el sudeste asiático y Priceline sirve el segmento de descuento en Norteamérica. Ejecutará un split 25:1 efectivo el 2 de abril de 2026.",
    summary_why:
      "Combinación atractiva de dividendo e ingreso por apreciación. Cotiza a P/E forward de ~15.5x, por debajo del S&P 500 y de Airbnb, a pesar de crecimiento de 15%+ en revenue y EPS. 36 analistas con consenso Buy y target de ~$5,874 (43% upside). Dividendo recién iniciado ($42/acción, ~1% yield) con payout ratio conservador de 23% — mucho espacio para crecer.\n\nTailwinds estructurales poderosos: el gasto en viajes sigue migrando a online, y Booking es el líder con escala y network effects incomparables. La estrategia Connected Trip con IA captura más gasto por viajero. $17.8B en efectivo para buybacks, dividendos y adquisiciones. Revenue 2025 de $26.9B (+13.4%), cash flow operativo +107% en Q4. Asset-light con márgenes altos — un compounder excelente.",
    summary_risk:
      "Regulación EU y disrupción por IA son las amenazas más significativas. El Digital Markets Act designó a Booking.com como 'gatekeeper', lo que podría forzar eliminación de cláusulas de paridad de precios — permitiendo a hoteles ofrecer tarifas más bajas directamente. Multa propuesta de $530M de autoridades españolas por conducta anticompetitiva.\n\nLa funcionalidad de 'booking nativo' de Google en búsqueda con IA (esperada en 2026) podría desintermediar a las OTAs. Riesgo macroeconómico: Oxford Economics proyecta 2026 como el crecimiento global más débil desde 2009.",
    research_full: `# Booking Holdings Inc. (BKNG) — Research Completo

## Precio: $4,204.22 | P/E Forward: 15.5 | Div Yield: 1.02% | Market Cap: $130.5B

---

## ¿Qué es Booking Holdings?

Booking Holdings es la **plataforma de viajes en línea más grande del mundo**. Opera cinco marcas principales:

- **Booking.com** — La plataforma de alojamiento online más grande del mundo (Amsterdam)
- **Priceline** — Ofertas de viaje en Norteamérica
- **Agoda** — Plataforma enfocada en Asia-Pacífico
- **KAYAK** — Buscador y comparador de precios de viaje
- **OpenTable** — Reservas de restaurantes

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $26.9B (+13.4% YoY) |
| **Gross Bookings** | $186.1B (+12% YoY) |
| **Room Nights Q4** | 285 millones |
| **Empleados** | ~24,000 |
| **Países** | 220+ |

## Estrategia Connected Trip

Booking está construyendo un ecosistema impulsado por IA que maneja CADA aspecto del viaje: vuelos + hoteles + autos + atracciones + restaurantes, todo en una plataforma. El programa Genius impulsa reservas directas, mejorando márgenes.

## Stock Split 25:1

Efectivo 2 de abril de 2026. Precio pasará de ~$4,200 a ~$168 por acción, haciéndolo más accesible a inversionistas retail. El dividendo se ajusta proporcionalmente a ~$0.42/acción trimestral.

## Dividendo

- **Dividendo anual:** $42.00/acción
- **Yield:** 1.02%
- **Payout ratio:** 23.1%
- Dividendo recién iniciado con MUCHO espacio para crecer

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| Analistas Buy | 30 |
| Analistas Hold | 6 |
| Analistas Sell | 0 |
| Target Promedio | **$5,874** |
| **Upside** | **+43.5%** |

## Riesgos Principales

1. **Digital Markets Act (UE)** — Booking.com designada como "gatekeeper", posibles restricciones a cláusulas de paridad de precios
2. **Multa española de $530M** — Por conducta anticompetitiva
3. **Google AI booking nativo** — Podría desintermediar OTAs en el futuro
4. **Macro débil 2026** — Oxford Economics proyecta el crecimiento global más débil desde 2009
5. **Deuda significativa** — Podría limitar flexibilidad en downturn

## Conclusión

BKNG a $4,204 es el **líder indiscutible del travel online** a P/E forward de 15.5x — barato para un compounder de 15%+. Dividendo recién iniciado con payout de solo 23%, $17.8B en efectivo, y 43% de upside según analistas. El split 25:1 del 2 de abril abre la puerta a más inversores retail. La estrategia Connected Trip con IA posiciona a Booking para capturar más del gasto total por viajero.

---

*Research fecha: 31 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 5874.0,
    analyst_upside: 43.5,
    status: "active",
    first_researched_at: "2026-03-31T00:00:00Z",
    last_updated_at: "2026-03-31T00:00:00Z",
    next_review_at: "2026-09-30T00:00:00Z",
  },
  {
    id: 31,
    ticker: "BLK",
    name: "BlackRock Inc.",
    price: 962.11,
    currency: "USD",
    sector: "Financials",
    industry: "Asset Management",
    region: "North America",
    country: "United States",
    market_cap_b: 165.4,
    pe_ratio: 20.0,
    pe_forward: 19.5,
    dividend_yield: 2.4,
    eps: 48.09,
    summary_short:
      "El administrador de activos más grande del mundo con $14 trillones bajo gestión. Dueños de iShares (ETFs #1 global con 32% de market share), la plataforma Aladdin que maneja $25T+ en activos, y la recién adquirida HPS Investment Partners (crédito privado).",
    summary_what:
      "BlackRock es la firma de gestión de inversiones más grande del mundo, fundada en 1988 por Larry Fink. Gestiona ~$14 trillones en activos para clientes institucionales (fondos de pensiones, fondos soberanos, bancos centrales, aseguradoras), intermediarios financieros y inversionistas individuales en 30+ países.\n\nOpera múltiples líneas de productos: iShares es la plataforma de ETFs más grande del mundo (~32% del mercado global con $4.2T en AUM). También gestiona estrategias activas en renta variable, renta fija, multi-activos y alternativos. Su plataforma tecnológica Aladdin procesa analítica de riesgo para $25T+ en activos, generando revenue recurrente de alta margen.\n\nEn 2025 se expandió agresivamente en mercados privados con las adquisiciones de HPS Investment Partners (crédito privado) y Preqin (datos de mercados privados). Revenue 2025 de $24B (+19% YoY), flujos netos récord de $698B, y margen operativo de ~45%.",
    summary_why:
      "BlackRock está en la intersección de múltiples tendencias seculares: el shift de activo a pasivo (iShares), el crecimiento de mercados privados (HPS/Preqin), y la tecnologización de asset management (Aladdin). Su posición dominante crea un flywheel poderoso: escala → menores comisiones → más flujos → más escala. Flujos netos récord de $698B en 2025 demuestran consolidación de activos con BlackRock.\n\n17 años consecutivos de aumento de dividendo, yield de ~2.4% con pago anual de $22.92/acción. P/E forward de 19.5x contra EPS 2026 estimado de $54.42. Consenso Strong Buy de 27 analistas con target de $1,309 (~36% upside). Combinación rara de dividendo confiable y creciente, tailwinds seculares, y revenue tecnológico de alto margen.",
    summary_risk:
      "Caídas de mercado reducen directamente los ingresos de BlackRock ya que cobra comisiones como porcentaje de los activos bajo gestión — un bear market prolongado comprime earnings y valuación simultáneamente. La caída reciente de $1,220 a $960 (21% drawdown del máximo 52 semanas) ilustra esta sensibilidad.\n\nRiesgos adicionales: compresión de comisiones en ETFs con Vanguard y Schwab empujando expense ratios hacia cero; presión política y regulatoria por ESG (13 estados republicanos han acusado a BlackRock de activismo climático anticompetitivo); y riesgo de integración de las adquisiciones de HPS y Preqin.",
    research_full: `# BlackRock Inc. (BLK) — Research Completo

## Precio: $962.11 | P/E Forward: 19.5 | Div Yield: 2.4% | Market Cap: $165.4B

---

## ¿Qué es BlackRock?

BlackRock es el **administrador de activos más grande del mundo**, gestionando ~$14 trillones en activos bajo gestión (AUM). Fundada en 1988 por Larry Fink, ha crecido de un startup de una sola oficina a la firma financiera más influyente del planeta.

## Marcas y Plataformas

| Marca | Descripción | AUM/Alcance |
|-------|-------------|-------------|
| **iShares** | Plataforma de ETFs #1 global | $4.2T AUM, ~32% market share global |
| **Aladdin** | Plataforma de analítica de riesgo y gestión de portafolio | $25T+ en activos gestionados en la plataforma |
| **BlackRock Funds** | Fondos mutuos e institucionales | Suite completa multi-activo |
| **HPS Investment Partners** | Crédito privado (adquirida 2025) | Expansión en alternativos |
| **Preqin** | Datos y analítica de mercados privados (adquirida 2025) | Infraestructura de datos |

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $24.0B (+19% YoY) |
| **AUM** | $14.0 trillones |
| **Net Inflows** | $698B (récord) |
| **Margen Operativo** | ~45% |
| **Empleados** | ~19,000 |
| **Países** | 30+ |

## Dividendo — 17 Años Consecutivos de Crecimiento

- **Dividendo anual:** $22.92/acción ($5.73 trimestral)
- **Yield:** 2.4%
- **Crecimiento:** 17 años consecutivos de aumento
- El dividendo se ha más que cuadruplicado en la última década

## El Flywheel de BlackRock

Escala → Menores comisiones → Más atractivo para inversionistas → Más flujos → Más AUM → Más revenue → Más inversión en tecnología (Aladdin) → Mayor retención → Más escala

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Strong Buy** |
| Analistas | 27 |
| Target Promedio | **$1,309** |
| Target Rango | $1,170 - $1,486 |
| **Upside** | **+36.3%** |

## Riesgos Principales

1. **Sensibilidad a mercados** — Revenue = % de AUM, un bear market comprime todo
2. **Compresión de comisiones** — Vanguard y Schwab presionan expense ratios a cero
3. **Presión ESG política** — 13 estados republicanos vs. BlackRock
4. **Integración HPS/Preqin** — Adquisiciones grandes conllevan riesgo de ejecución
5. **Scrutinio antimonopolio** — El tamaño de BlackRock invita regulación

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $962.11 |
| P/E Forward | 19.5x |
| EPS Forward | $54.42 |
| 52-Week High | $1,219.94 |
| Drawdown actual | -21% del máximo |

## Conclusión

BLK a $962 está 21% por debajo de su máximo de 52 semanas — una oportunidad atractiva para el administrador de activos más dominante del mundo. Con $14T en AUM, flujos récord de $698B, 17 años de dividendo creciente al 2.4%, y 36% de upside según analistas. La expansión en mercados privados (HPS) y tecnología (Aladdin) diversifica el revenue más allá de comisiones de gestión tradicionales.

---

*Research fecha: 31 Mar 2026 | Próxima revisión: Sep 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Strong Buy",
    analyst_target: 1309.0,
    analyst_upside: 36.3,
    status: "active",
    first_researched_at: "2026-03-31T00:00:00Z",
    last_updated_at: "2026-03-31T00:00:00Z",
    next_review_at: "2026-09-30T00:00:00Z",
  },
  {
    id: 32,
    ticker: "BTI",
    name: "British American Tobacco",
    price: 57.89,
    currency: "USD",
    sector: "Consumer",
    industry: "Tobacco",
    region: "Europe",
    country: "United Kingdom",
    market_cap_b: 126.1,
    pe_ratio: 15.8,
    pe_forward: 11.0,
    dividend_yield: 5.71,
    eps: 3.66,
    summary_short:
      "La segunda tabacalera más grande del mundo. Dueños de Lucky Strike, Dunhill, Pall Mall, Camel y Kent. Líder global en productos de nueva generación (Vuse vaping, glo tabaco calentado) con presencia en 180+ mercados.",
    summary_what:
      "British American Tobacco es la segunda compañía de tabaco más grande del mundo por ingresos, fundada en 1902 en Londres. Opera en más de 180 mercados con marcas icónicas como Lucky Strike, Dunhill, Pall Mall, Camel, Kent y Natural American Spirit.\n\nMás allá del cigarro tradicional, BAT lidera la transición a productos de nueva generación (NGP): Vuse es el #1 mundial en vaping con ~40% del mercado global, glo compite en tabaco calentado, y Velo lidera en nicotine pouches. En 2025, las categorías de nueva generación alcanzaron ~£4B en revenue, creciendo doble dígito.\n\nRevenue total ~£27B, con margen operativo de ~43%. BAT genera flujo de caja libre masivo (~£8B anuales), lo que financia uno de los dividendos más altos del sector: 5.7% yield con historial de 25+ años de pagos consecutivos.",
    summary_why:
      "BTI es una máquina de dividendos a valuación de ganga. A P/E forward de 11x, paga 5.7% de dividendo — más del doble que el promedio del S&P 500. El flujo de caja libre de ~£8B anuales cubre holgadamente el dividendo con payout ratio de ~60%.\n\nLa transición a productos sin humo (Vuse, glo, Velo) reduce el riesgo regulatorio y de salud a largo plazo. Vuse es #1 global en vaping con ~40% de market share. El mercado descuenta a BAT por ser tabacalera, pero ignora que las nuevas categorías crecen doble dígito y ya representan ~15% del revenue.\n\nConsenso de analistas es Buy con target de $62, ~7% de upside más el 5.7% de dividendo = ~13% de retorno total esperado. Ideal para inversores que buscan ingreso pasivo alto con valuación defensiva.",
    summary_risk:
      "La regulación global contra el tabaco sigue endureciéndose — prohibiciones de sabores en vaping, restricciones publicitarias y posibles impuestos adicionales podrían frenar el crecimiento de las categorías de nueva generación que son clave para el futuro de BAT.\n\nRiesgos adicionales: volúmenes de cigarrillos tradicionales caen ~3-4% anual globalmente; litigios multimillonarios por daños a la salud siguen latentes; la deuda neta de ~£35B limita flexibilidad financiera; y la competencia de Philip Morris (IQOS) y Japan Tobacco es intensa en tabaco calentado.",
    research_full: `# British American Tobacco (BTI) — Research Completo

## Precio: $57.89 | P/E Forward: 11.0 | Div Yield: 5.71% | Market Cap: $126.1B

---

## ¿Qué es British American Tobacco?

British American Tobacco es la **segunda tabacalera más grande del mundo**, fundada en 1902 en Londres. Opera en 180+ mercados, vendiendo productos de tabaco tradicional y productos de nueva generación (vaping, tabaco calentado, nicotine pouches).

## Marcas y Productos

| Marca | Categoría | Posición |
|-------|-----------|----------|
| **Lucky Strike** | Cigarrillos premium | Marca global icónica |
| **Dunhill** | Cigarrillos premium | Líder en mercados asiáticos |
| **Pall Mall** | Cigarrillos value | Top 3 global por volumen |
| **Camel** | Cigarrillos premium | Herencia EE.UU. (ex-Reynolds) |
| **Kent** | Cigarrillos premium | Fuerte en Europa del Este y Japón |
| **Vuse** | Vaping | **#1 mundial, ~40% market share** |
| **glo** | Tabaco calentado | Compite con IQOS de Philip Morris |
| **Velo** | Nicotine pouches | Líder en categoría emergente |

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | ~£27B |
| **Margen Operativo** | ~43% |
| **Free Cash Flow** | ~£8B |
| **Dividendo Anual** | ~$3.31/acción (5.71% yield) |
| **Payout Ratio** | ~60% |
| **Empleados** | ~46,000 |
| **Mercados** | 180+ |

## Dividendo — 25+ Años Consecutivos de Pagos

- **Yield:** 5.71% — más del doble que el S&P 500
- **Frecuencia:** Trimestral
- **Free Cash Flow coverage:** ~1.7x (bien cubierto)
- **Historial:** 25+ años de pagos consecutivos

## La Transición a Smoke-Free

BAT está invirtiendo agresivamente en categorías sin humo:
- **Vuse** (vaping): #1 mundial con ~40% share, rentable desde 2024
- **glo** (heated tobacco): Competidor de IQOS, fuerte en Japón y Europa
- **Velo** (nicotine pouches): Categoría de más rápido crecimiento
- NGP ya representan ~15% del revenue y crecen doble dígito

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| Target Promedio | **$62** |
| **Upside** | **+7.1%** |
| Retorno total (+ dividendo) | **~13%** |

## Riesgos Principales

1. **Regulación** — Prohibiciones de sabores en vaping, impuestos al tabaco
2. **Declive de volúmenes** — Cigarrillos caen 3-4% anual globalmente
3. **Litigios** — Demandas por daños a la salud siguen latentes
4. **Deuda** — ~£35B de deuda neta limita flexibilidad
5. **Competencia NGP** — Philip Morris (IQOS) domina tabaco calentado

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $57.89 |
| P/E Forward | 11.0x |
| Div Yield | 5.71% |
| 52-Week High | $63.22 |
| Drawdown actual | -8% del máximo |

## Conclusión

BTI a $57.89 es una **máquina de dividendos a precio de ganga**. P/E forward de 11x con 5.71% de yield — uno de los dividendos más altos entre large caps globales. La transición a productos sin humo (Vuse #1 en vaping) reduce gradualmente el riesgo regulatorio. Ideal para quien busca ingreso pasivo alto con valuación defensiva. El retorno total esperado (~13% anual entre dividendo + apreciación) compensa el riesgo del sector tabacalero.

---

*Research fecha: 2 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 62.0,
    analyst_upside: 7.1,
    status: "active",
    first_researched_at: "2026-04-02T00:00:00Z",
    last_updated_at: "2026-04-02T00:00:00Z",
    next_review_at: "2026-10-02T00:00:00Z",
  },
  {
    id: 33,
    ticker: "MDLZ",
    name: "Mondelez International",
    price: 57.03,
    currency: "USD",
    sector: "Consumer",
    industry: "Packaged Foods",
    region: "North America",
    country: "United States",
    market_cap_b: 73.6,
    pe_ratio: 22.5,
    pe_forward: 16.9,
    dividend_yield: 3.5,
    eps: 2.53,
    summary_short:
      "El gigante global de snacks. Dueños de Oreo (#1 mundial en galletas), Cadbury, Toblerone, Milka, Trident, Tang, Philadelphia y Ritz. Presencia en 150+ países con revenue de ~$36B.",
    summary_what:
      "Mondelez International es una de las compañías de snacks más grandes del mundo, creada en 2012 como spin-off de Kraft Foods. Con sede en Chicago, opera en 150+ países generando ~$36B en revenue anual.\n\nSu portafolio incluye algunas de las marcas de snacks más reconocidas globalmente: Oreo (la galleta #1 del mundo), Cadbury (chocolate icónico en UK/India/Australia), Milka (chocolate líder en Europa), Toblerone (chocolate suizo premium), Philadelphia (queso crema), Trident (chicle), Tang (bebida en polvo), Ritz (crackers), belVita (galletas de desayuno) y Halls (pastillas).\n\nMondelez genera ~75% de su revenue fuera de EE.UU., con posiciones dominantes en mercados emergentes donde el consumo de snacks crece más rápido. Margen operativo de ~17% con objetivo de expansión a 18-19%.",
    summary_why:
      "Mondelez es el play defensivo perfecto: marcas de snacks que la gente compra en cualquier economía. Oreo, Cadbury y Milka tienen pricing power real — son compras impulsivas de bajo costo que resisten recesiones.\n\nA $57, MDLZ cotiza a P/E forward de 16.9x — un descuento significativo vs su promedio histórico de ~22x. El drawdown de 20% desde máximos ($71) se debe a preocupaciones por costos de cacao, pero estos ya están normalizándose. Dividendo de 3.5% con 10+ años de crecimiento consecutivo y payout ratio sostenible de ~55%.\n\nConsenso Buy de 22 analistas con target promedio de ~$68 (19% upside). Mondelez combina defensa (snacks esenciales), crecimiento (mercados emergentes), e ingreso (3.5% dividend yield creciente).",
    summary_risk:
      "Los costos de materias primas (especialmente cacao y azúcar) han disparado presión sobre márgenes — el precio del cacao se triplicó en 2024-2025, y aunque está bajando, la volatilidad persiste y puede comprimir earnings.\n\nRiesgos adicionales: exposición cambiaria significativa (75% revenue fuera de EE.UU.) con dólar fuerte erosionando resultados reportados; creciente regulación de alimentos procesados y etiquetado en mercados clave (UE, México, India); competencia intensa de marcas locales en mercados emergentes; y riesgo de cambio en hábitos de consumo hacia snacks 'saludables' que desplacen categorías tradicionales.",
    research_full: `# Mondelez International (MDLZ) — Research Completo

## Precio: $57.03 | P/E Forward: 16.9 | Div Yield: 3.5% | Market Cap: $73.6B

---

## ¿Qué es Mondelez?

Mondelez International es una de las **compañías de snacks más grandes del mundo**, creada en 2012 como spin-off de Kraft Foods. Opera en 150+ países con ~$36B en revenue anual y algunas de las marcas de snacks más icónicas del planeta.

## Marcas y Productos

| Marca | Categoría | Posición |
|-------|-----------|----------|
| **Oreo** | Galletas | **#1 mundial**, vendida en 100+ países |
| **Cadbury** | Chocolate | Icónica en UK, India, Australia |
| **Milka** | Chocolate | Líder en Europa continental |
| **Toblerone** | Chocolate premium | Reconocimiento global (Swiss heritage) |
| **Philadelphia** | Queso crema | Líder global en su categoría |
| **Trident** | Chicle | Top 3 global |
| **Tang** | Bebida en polvo | Dominante en LATAM y Asia |
| **Ritz** | Crackers | Icónica en EE.UU. |
| **belVita** | Galletas desayuno | Categoría que crearon ellos |
| **Halls** | Pastillas | Líder global en throat lozenges |

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | ~$36B |
| **Margen Operativo** | ~17% (objetivo 18-19%) |
| **Free Cash Flow** | ~$4B |
| **Revenue fuera EE.UU.** | ~75% |
| **Empleados** | ~91,000 |
| **Países** | 150+ |

## Dividendo — 10+ Años de Crecimiento

- **Dividendo anual:** $2.00/acción ($0.50 trimestral)
- **Yield:** 3.5%
- **Payout Ratio:** ~55% (sostenible)
- **Crecimiento:** 10+ años consecutivos de aumento

## Por Qué MDLZ a Estos Precios

MDLZ cotiza a $57, un 20% por debajo de su máximo de 52 semanas ($71.15). Las preocupaciones:
- Costos de cacao disparados (se triplicó en 2024-2025)
- Presión cambiaria por dólar fuerte
- Guidance conservador para 2026

Pero los fundamentals son sólidos: marcas irreemplazables, pricing power demostrado, y el cacao ya está normalizándose.

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| Analistas | 22 |
| Target Promedio | **$68** |
| Target Rango | $62 - $84 |
| **Upside** | **+19.2%** |

## Riesgos Principales

1. **Costos de cacao/azúcar** — Volatilidad en commodities comprime márgenes
2. **Exposición cambiaria** — 75% revenue fuera EE.UU., dólar fuerte duele
3. **Regulación alimentaria** — Etiquetado, restricciones a ultraprocesados
4. **Competencia local** — Marcas regionales ganan share en emergentes
5. **Cambio de hábitos** — Tendencia a snacks "saludables"

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $57.03 |
| P/E Forward | 16.9x (vs histórico ~22x) |
| Div Yield | 3.5% |
| 52-Week High | $71.15 |
| Drawdown actual | -20% del máximo |

## Conclusión

MDLZ a $57 es una oportunidad de comprar el dueño de Oreo, Cadbury y Milka a P/E de 16.9x — un descuento significativo vs su promedio histórico de ~22x. El dividendo de 3.5% es atractivo y bien cubierto (payout 55%). El miedo al cacao creó la oportunidad, pero los fundamentals (marcas irreemplazables, presencia global, pricing power) no han cambiado. Con 19% de upside según analistas más el dividendo, el retorno total esperado es ~23%.

---

*Research fecha: 2 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 68.0,
    analyst_upside: 19.2,
    status: "active",
    first_researched_at: "2026-04-02T00:00:00Z",
    last_updated_at: "2026-04-02T00:00:00Z",
    next_review_at: "2026-10-02T00:00:00Z",
  },
  {
    id: 34,
    ticker: "ZTS",
    name: "Zoetis Inc",
    sector: "Healthcare",
    industry: "Animal Health / Veterinary Pharmaceuticals",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 118.08,
    pe_ratio: 19.6,
    pe_forward: 15.7,
    dividend_yield: 1.7,
    market_cap_b: 52.0,
    eps: 5.94,
    summary_short:
      "La empresa #1 en salud animal del mundo. Medicinas, vacunas y diagnósticos para mascotas y ganado. Spin-off de Pfizer en 2013, con ~$9.5B en revenue y presencia en 100+ países.",
    summary_what:
      "Zoetis es la compañía más grande del mundo dedicada exclusivamente a la salud animal. Desarrolla y manufactura medicinas, vacunas, diagnósticos y tecnologías para mascotas (perros, gatos) y ganado (bovino, porcino, avícola). Spin-off de Pfizer en 2013, heredó décadas de experiencia farmacéutica y una red global de distribución.\n\nSus productos estrella incluyen: Simparica Trio (antiparasitario #1, franquicia de ~$1.5B), Apoquel/Cytopoint (dermatología, franquicia de $1.74B), Librela/Solensia (dolor por artritis, $568M), y un amplio portafolio de vacunas y antibióticos para ganado.\n\nZoetis genera ~65% de su revenue en mascotas y ~35% en ganado, con presencia en 100+ países y 29 plantas de manufactura globales.",
    summary_why:
      "Zoetis es el líder indiscutible en una industria con vientos de cola seculares: la 'humanización de mascotas' donde dueños tratan a sus pets como familia y gastan en salud premium. Modelo de revenue recurrente — vacunas anuales, antiparasitarios mensuales, tratamientos crónicos.\n\nA $118, ZTS cotiza a P/E forward de 15.7x — un descuento masivo vs su promedio histórico de ~30x. La acción cayó ~28% desde máximos ($172) por la controversia de Librela (efectos secundarios en perros), pero los fundamentales son sólidos: margen operativo de 38%, FCF de $2.3B, y 12 años consecutivos de crecimiento de dividendo.\n\nConsenso Moderate Buy con target promedio de ~$156 (32% upside). Pipeline de 12 candidatos blockbuster en oncología, enfermedad renal y cardiología.",
    summary_risk:
      "La FDA está investigando Librela (perros) y Solensia (gatos) por efectos adversos neurológicos — se han reportado más de 2,300 muertes de mascotas. La franquicia de artritis ya cayó 3% en 2025 con caída del 11% en Q4. Si las restricciones regulatorias escalan o la confianza veterinaria se erosiona más, podría dañar un pilar clave de crecimiento y la reputación de toda la marca.\n\nRiesgos adicionales: desaceleración del gasto en mascotas si la economía empeora; competencia creciente en antiparasitarios y dermatología; exposición cambiaria (~50% revenue fuera de EE.UU.); y concentración en Librela/Simparica como drivers de crecimiento.",
    research_full: `# Zoetis Inc (ZTS) — Research Completo

## Precio: $118.08 | P/E Forward: 15.7 | Div Yield: 1.7% | Market Cap: $52B

---

## ¿Qué es Zoetis?

Zoetis es la **compañía más grande del mundo dedicada exclusivamente a la salud animal**. Spin-off de Pfizer en 2013, desarrolla y manufactura medicinas, vacunas, diagnósticos y tecnologías para mascotas y ganado en 100+ países con ~$9.5B en revenue anual.

## Productos Principales

| Producto | Categoría | Revenue | Notas |
|----------|-----------|---------|-------|
| **Simparica Trio** | Antiparasitario (pulgas/garrapatas/gusano) | ~$1.5B (franquicia) | Cruzó $1B en ventas EE.UU.; +12% operacional |
| **Apoquel** | Dermatología (comezón alérgica) | Parte de $1.74B | Tableta oral para perros; blockbuster |
| **Cytopoint** | Dermatología (comezón alérgica) | Parte de $1.74B | Anticuerpo monoclonal inyectable |
| **Librela** | Dolor artritis (perros) | Parte de $568M OA | Bajo escrutinio FDA por efectos adversos |
| **Solensia** | Dolor artritis (gatos) | Parte de $568M OA | Primer mAb para dolor felino |
| **Draxxin** | Anti-infeccioso ganado | Producto clave | Antibiótico líder para bovinos |
| **Vacunas** | Ganado y mascotas | Portafolio amplio | Bovino, porcino, avícola, mascotas |
| **Diagnósticos** | Point-of-care | Segmento en crecimiento | Vetscan, laboratorios de referencia |

**Split de revenue:** ~65% mascotas, ~35% ganado.

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $9.5B (+6% orgánico) |
| **Margen Operativo** | ~38% |
| **EBITDA Margin** | ~44.8% |
| **Free Cash Flow** | $2.3B |
| **EPS Ajustado** | $6.41 |
| **Empleados** | ~14,100 |
| **Países** | 100+ |
| **Plantas manufactura** | 29 globales |

## Dividendo — 12 Años de Crecimiento

- **Dividendo anual:** $2.12/acción ($0.53 trimestral)
- **Yield:** 1.7%
- **Payout Ratio:** ~33% (muy bien cubierto)
- **Crecimiento:** 12 años consecutivos de aumento
- **CAGR 5 años:** ~20% anual

## Por Qué ZTS a Estos Precios

ZTS cotiza a $118, un 28% por debajo de su máximo de 52 semanas ($172.23). La causa principal: la controversia de Librela. La FDA reportó efectos adversos neurológicos y más de 2,300 muertes de mascotas. Pero el contexto importa:

- Con 21M+ dosis distribuidas, la tasa de eventos adversos está por debajo de "raro" según la EMA
- Las ventas mensuales se están estabilizando
- Zoetis ya está desarrollando sucesores (Portela, Lenivia) para 2026
- Los otros pilares (Simparica +12%, Apoquel/Cytopoint estables) siguen fuertes

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Moderate Buy** |
| Buy / Hold / Sell | 6 / 5 / 0 |
| Target Promedio | **$156** |
| Target Rango | $130 - $200 |
| **Upside** | **+32.1%** |

## Catalizadores de Crecimiento

1. **Humanización de mascotas** — Gasto en salud de mascotas crece 6-8% anual globalmente
2. **Pipeline:** 12 candidatos blockbuster en oncología, enfermedad renal crónica y cardiología ($5B+ TAM)
3. **Simparica** sigue ganando market share (+12% en 2025)
4. **Diagnósticos** — Plataforma integrada "diagnostica-luego-trata"
5. **Mercados emergentes** — China, Brasil, India con ownership de mascotas acelerando
6. **Nuevos productos OA** — Portela y Lenivia lanzándose en 2026

## Riesgos Principales

1. **Librela/Solensia** — Escrutinio FDA, efectos adversos neurológicos, 2,300+ muertes reportadas
2. **Desaceleración de gasto en mascotas** — Recesión podría reducir visitas al veterinario
3. **Competencia** — Antiparasitarios y dermatología cada vez más competidos
4. **Exposición cambiaria** — ~50% revenue fuera EE.UU.
5. **Concentración** — Dependencia de Simparica y Librela como motores de crecimiento

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $118.08 |
| P/E Forward | 15.7x (vs histórico ~30x) |
| Div Yield | 1.7% |
| 52-Week High | $172.23 |
| Drawdown actual | -28% del máximo |
| Guidance 2026 Revenue | $9.8B - $10.0B |
| Guidance 2026 EPS Adj | $7.00 - $7.10 |

## Conclusión

ZTS a $118 es una oportunidad de comprar al líder mundial en salud animal a P/E forward de 15.7x — la mitad de su valuación histórica. La controversia de Librela creó el descuento, pero los fundamentales (38% margen operativo, $2.3B FCF, 12 años de dividend growth, pipeline robusto) no han cambiado. Con 32% de upside según analistas más el dividendo creciente, el retorno total esperado es ~34%.

---

*Research fecha: 6 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Moderate Buy",
    analyst_target: 156.0,
    analyst_upside: 32.1,
    status: "active",
    first_researched_at: "2026-04-06T00:00:00Z",
    last_updated_at: "2026-04-06T00:00:00Z",
    next_review_at: "2026-10-06T00:00:00Z",
  },
  {
    id: 35,
    ticker: "MLI",
    name: "Mueller Industries",
    sector: "Industrials",
    industry: "Copper Products / HVAC Manufacturing",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 112.67,
    pe_ratio: 16.4,
    pe_forward: 13.5,
    dividend_yield: 0.9,
    market_cap_b: 12.5,
    eps: 6.87,
    summary_short:
      "El rey del cobre industrial. Fabricante líder de tubería, conexiones y válvulas de cobre/latón para plomería, HVAC y refrigeración. Desde 1917 con la marca Streamline. Revenue de $4.2B y márgenes excepcionales.",
    summary_what:
      "Mueller Industries es uno de los fabricantes más grandes de productos de cobre, latón, aluminio y plástico en América. Fundada en 1917, la empresa opera a través de tres segmentos: Piping Systems (tubería y conexiones de cobre), Industrial Metals (latón y aluminio fundido), y Climate (componentes HVAC y refrigeración).\n\nSu marca insignia Streamline® ha sido la preferida de plomeros y técnicos HVAC por más de 90 años. Mueller suministra los componentes invisibles pero esenciales que hacen funcionar la plomería, el aire acondicionado y la refrigeración en hogares, edificios comerciales e industrias.\n\nOpera con ~4,800 empleados a través de subsidiarias como Mueller Streamline Co., Mueller Brass, ATCO Rubber Products y Mueller Impact.",
    summary_why:
      "Mueller Industries es una máquina de cash flow escondida a plena vista. Revenue de $4.2B con profit margin de ~18% — extraordinario para una empresa industrial. El precio del cobre está en máximos históricos y Mueller se beneficia directamente.\n\nA $113, MLI cotiza a P/E forward de 13.5x — descuento significativo para una empresa con crecimiento de revenue del 10%+, márgenes líderes en la industria, y balance impecable. Dividendo modesto (0.9%) pero creciente, con buybacks agresivos que reducen el share count.\n\nConsenso Buy de analistas con target promedio de ~$143 (27% upside). Mueller es el pick de infraestructura perfecta: cada casa nueva, cada sistema HVAC nuevo, cada renovación usa sus productos.",
    summary_risk:
      "Mueller depende del precio del cobre — si los precios caen significativamente, los márgenes se comprimen y el revenue puede caer, ya que el cobre es materia prima y componente de pricing.\n\nRiesgos adicionales: ciclicidad del sector construcción (nueva vivienda y comercial); competencia de alternativas plásticas (PEX) que reemplazan tubería de cobre en algunos usos; concentración geográfica en América del Norte; y riesgo de desaceleración económica que impacte la demanda de HVAC y plomería.",
    research_full: `# Mueller Industries (MLI) — Research Completo

## Precio: $112.67 | P/E Forward: 13.5 | Div Yield: 0.9% | Market Cap: $12.5B

---

## ¿Qué es Mueller Industries?

Mueller Industries es uno de los **fabricantes más grandes de productos de cobre, latón y aluminio** en América. Fundada en 1917, la empresa manufactura tubería, conexiones, válvulas y componentes esenciales para plomería, HVAC, refrigeración e industria.

## Segmentos de Negocio

| Segmento | Productos | % Revenue aprox |
|----------|-----------|-----------------|
| **Piping Systems** | Tubería de cobre (Streamline®), conexiones, líneas de refrigerante | ~50% |
| **Industrial Metals** | Fundición de latón y aluminio, barras, forjas | ~25% |
| **Climate** | Componentes HVAC, válvulas, accesorios de refrigeración | ~25% |

## Marcas y Subsidiarias

- **Streamline®** — Marca insignia de tubería de cobre, preferida por profesionales por 90+ años
- **Mueller Streamline Co.** — Sede en Collierville, TN; fabricación de tubería y conexiones
- **Mueller Brass** — Productos de latón fundido
- **ATCO Rubber Products** — Productos de caucho industrial
- **Mueller Impact** — Forjas y componentes de precisión

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $4.2B (+10.5% YoY) |
| **Net Income** | $765M (+26.5% YoY) |
| **Net Margin** | ~18% |
| **Q4 2025 Sales** | $962M (+4.2% YoY) |
| **Q4 2025 Net Income** | $154M (+11.6% YoY) |
| **Empleados** | ~4,800 |

## Dividendo

- **Dividendo anual:** $1.00/acción ($0.25 trimestral)
- **Yield:** 0.9%
- **Payout Ratio:** ~15% (extremadamente bajo)
- **Política:** Retorno de capital vía dividendos + buybacks agresivos

## Por Qué MLI a Estos Precios

Mueller Industries es la definición de "hidden gem" industrial. Con márgenes netos de 18% en manufactura — algo casi inaudito — la empresa demuestra poder de pricing excepcional. El boom de infraestructura en EE.UU. (chips, data centers, energía renovable) y la demanda de HVAC por cambio climático son vientos de cola de largo plazo.

A P/E forward de 13.5x, Mueller cotiza con descuento significativo vs industriales comparables. El precio del cobre en máximos históricos beneficia directamente sus resultados. Y con un payout ratio de apenas 15%, hay enorme espacio para crecimiento de dividendo y buybacks.

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| Buy / Hold / Sell | 2 / 0 / 0 |
| Target Promedio | **$143** |
| Target Rango | $131 - $158 |
| **Upside** | **+26.9%** |

## Catalizadores de Crecimiento

1. **Boom de infraestructura EE.UU.** — CHIPS Act, IRA, data centers requieren cobre y HVAC
2. **Precio del cobre en máximos** — Beneficia directamente revenue y márgenes
3. **Transición energética** — Vehículos eléctricos, energía solar, redes eléctricas usan más cobre
4. **HVAC por cambio climático** — Más instalaciones de aire acondicionado globalmente
5. **Reshoring manufacturero** — Más fábricas en EE.UU. = más demanda de productos Mueller

## Riesgos Principales

1. **Precio del cobre** — Caída significativa comprimiría márgenes y revenue
2. **Ciclo de construcción** — Desaceleración en nueva vivienda y comercial
3. **Competencia de PEX** — Tubería plástica reemplazando cobre en algunos usos
4. **Concentración geográfica** — Mayormente América del Norte
5. **Cobertura de analistas baja** — Solo 2 analistas cubren, menor visibilidad institucional

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $112.67 |
| P/E Forward | 13.5x |
| Net Margin | ~18% (excepcional para industrial) |
| Div Yield | 0.9% |
| Payout Ratio | ~15% |

## Conclusión

MLI a $113 es una oportunidad de comprar un fabricante industrial con márgenes de empresa tech (18% net margin) a valuación de empresa cíclica (13.5x forward P/E). El boom de infraestructura, cobre en máximos, y la transición energética son catalizadores de largo plazo. Con 27% de upside según analistas, buybacks activos, y dividendo con enorme espacio de crecimiento, Mueller es el pick de infraestructura que nadie está viendo.

---

*Research fecha: 6 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 143.0,
    analyst_upside: 26.9,
    status: "active",
    first_researched_at: "2026-04-06T00:00:00Z",
    last_updated_at: "2026-04-06T00:00:00Z",
    next_review_at: "2026-10-06T00:00:00Z",
  },
  {
    id: 36,
    ticker: "BX",
    name: "Blackstone Inc.",
    sector: "Financials",
    industry: "Alternative Asset Management",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 117.67,
    pe_ratio: 30.41,
    pe_forward: 17.89,
    dividend_yield: 4.2,
    market_cap_b: 143.8,
    eps: 3.87,
    summary_short:
      "El gestor de activos alternativos más grande del mundo con $1.27 trillones bajo gestión. Dueños de centros de datos, bienes raíces, y empresas como Hilton y Bumble — pagan 4.2% de dividendo y están apostando fuerte por infraestructura de AI.",
    summary_what:
      "Blackstone es la firma de inversión alternativa más grande del planeta, con $1.27 trillones en activos bajo gestión (AUM). Fundada por Steve Schwarzman, opera en cuatro segmentos: Private Equity ($416B AUM), Real Estate ($319B AUM), Credit & Insurance ($443B AUM), y Multi-Asset Investing ($96B AUM). Compran empresas, edificios, centros de datos, y prestan dinero a gran escala. Su portafolio incluye nombres como Hilton (hotel), Bumble (app de citas), Ancestry.com (genealogía), y son el mayor inversionista financiero en infraestructura de AI del mundo con $55B en centros de datos y un pipeline de $70B+. Generaron $14.45B en revenue y $7.1B en distributable earnings en 2025.",
    summary_why:
      "Blackstone a $117 es el líder indiscutible de activos alternativos en un momento donde el capital privado está reemplazando a la banca tradicional. Revenue creció 9% a $14.45B, distributable earnings subieron 20% a $5.57/acción, y fee-related earnings alcanzaron $5.7B con el margen más alto de su historia. El dividendo de 4.2% ($4.74/acción) es atractivo y variable — sube cuando les va bien. Credit & Insurance es el motor de crecimiento más rápido (+21% AUM YoY), y la apuesta masiva en centros de datos e infraestructura de AI ($55B invertidos + $70B en pipeline) los posiciona como el \"landlord de la revolución AI\". Consenso de analistas: Buy con target promedio de ~$165 (40%+ upside).",
    summary_risk:
      "El riesgo principal es la sensibilidad a tasas de interés y ciclos de mercado — si las tasas se mantienen altas por más tiempo, las valuaciones de real estate y private equity se comprimen, reduciendo las performance fees que son ~40% de los ingresos. Los fondos retail como BREIT y BCRED permiten retiros limitados, y una \"corrida\" de redemptions podría dañar la reputación y liquidez. Riesgos adicionales: aranceles y política comercial de EE.UU. generan incertidumbre macroeconómica; el P/E GAAP de 30x deja poco margen de error; y la concentración en real estate comercial (25% del AUM) es vulnerable a una recesión prolongada.",
    research_full: `# Blackstone Inc. (BX) — Research Completo

## Precio: $117.67 | P/E: 30.41 | Div Yield: 4.2% | Market Cap: $143.8B

---

## ¿Qué es Blackstone?

Blackstone Inc. es la **firma de inversión alternativa más grande del mundo**, con **$1.27 trillones en activos bajo gestión (AUM)**. Fundada en 1985 por **Steve Schwarzman** y Pete Peterson, Blackstone invierte en private equity, bienes raíces, crédito, infraestructura y hedge funds. Su modelo de negocio genera ingresos de dos fuentes: **management fees** (cobran por gestionar capital de otros) y **performance fees** (cobran cuando las inversiones generan retornos por encima de cierto umbral).

## Segmentos de Negocio

| Segmento | AUM | % del Total | Descripción |
|----------|-----|-------------|-------------|
| **Credit & Insurance** | $443B | ~35% | Crédito privado, préstamos directos, soluciones para aseguradoras |
| **Private Equity** | $416B | ~33% | Compra de empresas, growth equity, infraestructura |
| **Real Estate** | $319B | ~25% | Bienes raíces comerciales, logística, centros de datos, BREIT |
| **Multi-Asset Investing** | $96B | ~8% | Hedge fund solutions, estrategias multi-activo |

## Empresas del Portafolio

- **Hilton Hotels** — inversión histórica legendaria (retorno de $14B+ en profit)
- **Bumble** — app de citas
- **Ancestry.com** — plataforma de genealogía y ADN ($4.7B)
- **Hipgnosis Songs Fund** — derechos musicales de artistas como Shakira, Red Hot Chili Peppers
- **$55B en centros de datos** — el mayor inversionista financiero en AI infrastructure del mundo
- **$70B+ en pipeline** de desarrollo de data centers

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $14.45B (+9.2% YoY) |
| **Net Income** | $3.02B (+8.7% YoY) |
| **EPS (GAAP)** | $3.87 (+6.9% YoY) |
| **Distributable Earnings** | $7.1B ($5.57/acción, +20% YoY) |
| **Fee-Related Earnings** | $5.7B (+9% YoY, margen récord) |
| **Total AUM** | $1.27T (+13% YoY) |

## Dividendo — Variable y Generoso

- **Dividendo anual:** $4.74/acción
- **Yield:** 4.2%
- **Tipo:** Variable (basado en distributable earnings)
- **Último pago:** $1.49/acción (feb 2026, +16% vs trimestre anterior)
- **Frecuencia:** Trimestral

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| # Analistas Buy | 12 (57%) |
| # Analistas Hold | 10 (43%) |
| # Analistas Sell | 0 |
| Price Target Promedio | **$165** |
| Price Target Alto | $215 |
| Price Target Bajo | $122 |
| **Upside al Target** | **+40%** |

## Catalizadores de Crecimiento

1. **Infraestructura de AI** — $55B invertidos + $70B en pipeline de data centers
2. **Credit & Insurance** — segmento de más rápido crecimiento (+21% AUM YoY)
3. **Ciclo de bajada de tasas** — activos alternativos se revalorizan y performance fees explotan
4. **Deal-making recovery** — $7T+ en dry powder global en PE, ciclo de exits por reactivarse
5. **Life Sciences** — fondo BXLS VI de $6.3B con 86% de success rate en aprobaciones Phase III

## Riesgos Principales

1. **Sensibilidad a tasas de interés** — tasas altas comprimen valuaciones de PE y real estate
2. **BREIT/BCRED redemptions** — una "corrida" en fondos retail dañaría reputación y liquidez
3. **Concentración en real estate** — 25% del AUM en bienes raíces comerciales
4. **P/E GAAP elevado** — 30x deja poco margen de error
5. **Riesgo regulatorio** — mayor escrutinio a private equity y crédito privado

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $117.67 |
| P/E GAAP | 30.41x |
| P/E Forward (est. 2026) | ~17.9x |
| Div Yield | 4.2% |

## Conclusión

Blackstone es el rey indiscutible de los activos alternativos — $1.27T en AUM, crecimiento de 13%, y posicionamiento único en AI, crédito privado, e infraestructura. A $117.67, la acción cotiza significativamente por debajo de los targets de analistas (~$165, 40% upside) por miedos macro temporales. El dividendo de 4.2% te paga por esperar.

---

*Research fecha: 8 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 165.0,
    analyst_upside: 40.0,
    status: "active",
    first_researched_at: "2026-04-08T00:00:00Z",
    last_updated_at: "2026-04-08T00:00:00Z",
    next_review_at: "2026-10-08T00:00:00Z",
  },
  {
    id: 37,
    ticker: "IEX",
    name: "IDEX Corporation",
    sector: "Industrials",
    industry: "Specialty Pumps & Flow Technology",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 197.85,
    pe_ratio: 30.87,
    pe_forward: 24.0,
    dividend_yield: 1.48,
    market_cap_b: 14.7,
    eps: 6.41,
    summary_short:
      "Fabricante de bombas especializadas, tecnología de fluidos y equipos de rescate. Tres segmentos: agua, ciencias de la vida y seguridad contra incendios. Hacen las 'Jaws of Life' y bombas Viking. Revenue récord $3.46B, 17 años de dividendo creciente.",
    summary_what:
      "IDEX Corporation diseña y fabrica bombas de ingeniería de precisión, tecnología de fluidos y soluciones de fluidics para mercados de misión crítica. Opera en tres segmentos: Fluid & Metering Technologies (~35% revenue) — bombas industriales Viking, medidores de flujo y equipos para agua/químicos/energía; Health & Science Technologies (~43% revenue) — componentes para ciencias de la vida, óptica, microfluidics y semiconductores; y Fire & Safety/Diversified Products (~22% revenue) — bombas contra incendios Hale, herramientas de rescate Jaws of Life y sistemas de sujeción BAND-IT. Opera +50 negocios descentralizados en ~20 países. En 2025 logró revenue récord de $3.46B con $617M en free cash flow.",
    summary_why:
      "A $197.85, IDEX ofrece exposición a megatendencias de infraestructura de agua, data centers/AI y ciencias de la vida. El segmento HST tuvo crecimiento de órdenes orgánicas de +34% en Q4 impulsado por demanda de centros de datos y semiconductores. La adquisición de Mott Corporation expande sus capacidades en filtración avanzada con un contrato de $40M en aguas residuales. Free cash flow de $617M (103% de conversión), 17 años de dividendo creciente y guidance 2026 de EPS $8.15-$8.35.",
    summary_risk:
      "El riesgo principal es la valuación premium — a P/E de 30.87x y forward ~24x, IDEX cotiza cara para una industrial con crecimiento orgánico modesto (+1% en 2025). Si la demanda de data centers/AI se desacelera, el motor de crecimiento del segmento HST pierde impulso. Los segmentos FMT y FSDP mostraron debilidad: mercados de químicos, energía y agricultura están flojos, y Fire & Safety cayó -5% orgánicamente en Q4.",
    research_full: `# IDEX Corporation (IEX) — Research Completo

## Precio: $197.85 | P/E: 30.87 | P/E Forward: ~24.0x | Div Yield: 1.48% | Market Cap: $14.7B

---

## ¿Qué es IDEX?

IDEX Corporation es un fabricante global de **bombas de ingeniería de precisión, tecnología de fluidos y soluciones de fluidics** para mercados de misión crítica. Con más de 50 negocios descentralizados operando en ~20 países, IDEX se especializa en productos de alta ingeniería donde la confiabilidad es esencial.

## Segmentos de Negocio

| Segmento | Revenue 2025 (est.) | % del Total | Descripción |
|----------|---------------------|-------------|-------------|
| **Health & Science Technologies (HST)** | ~$1,490M | ~43% | Componentes para ciencias de la vida, óptica, microfluidics, semiconductores, data centers |
| **Fluid & Metering Technologies (FMT)** | ~$1,210M | ~35% | Bombas industriales, medidores de flujo, equipos para agua/químicos/energía |
| **Fire & Safety / Diversified Products (FSDP)** | ~$760M | ~22% | Bombas contra incendios, herramientas de rescate, sistemas de sujeción |

## Marcas Clave

| Marca | Segmento | Producto |
|-------|----------|----------|
| **Viking Pump** | FMT | Bombas rotativas de desplazamiento positivo (#1 mundial) |
| **Hale Products** | FSDP | Bombas para camiones de bomberos |
| **Jaws of Life (Hurst)** | FSDP | Herramientas hidráulicas de rescate vehicular |
| **BAND-IT** | FSDP | Sistemas de sujeción industrial |
| **Microfluidics** | HST | Procesadores de alta presión para farmacéutica/biotech |
| **Mott Corporation** | HST | Filtración avanzada de materiales porosos sinterizados |

## Números Clave 2025

| Métrica | Valor |
|---------|-------|
| **Revenue** | $3.46B (+6% reportado, +1% orgánico) |
| **Net Income** | $483M |
| **EPS** | $6.41 |
| **EPS Ajustado** | $7.95 (+1% YoY) |
| **Gross Margin** | 44.5% |
| **Operating Margin** | 20.2% |
| **Free Cash Flow** | $617M (FCF conversion 103%) |
| **Órdenes Q4 (récord)** | $979M (+20% reportado, +16% orgánico) |

## Dividendo — 17 Años de Crecimiento Consecutivo

- **Dividendo anual:** $2.92/acción ($0.73 trimestral)
- **Yield:** 1.48%
- **Payout Ratio:** ~44%
- **123 trimestres consecutivos** pagando dividendo (30+ años)
- **17 años consecutivos** de aumento

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| # Analistas Buy | 7 |
| # Analistas Hold | 6 |
| # Analistas Sell | 0 |
| Price Target Promedio | **$218** |
| Price Target Alto | $250 |
| Price Target Bajo | $170 |
| **Upside al Target** | **+10.2%** |

## Catalizadores de Crecimiento

1. **Demanda AI/Data Centers** — Órdenes récord de HST por enfriamiento líquido y semiconductores
2. **Mott Corporation** — Adquisición de filtración avanzada abre mercados de agua limpia
3. **Guidance 2026** — EPS $8.15-$8.35
4. **$60M en ahorros por optimización**
5. **Balance sólido** — deuda/equity de 0.48x para más adquisiciones

## Riesgos Principales

1. **Valuación premium** — P/E de 30.87x es caro para +1% de crecimiento orgánico
2. **Debilidad en FMT y FSDP** — Mercados de químicos, energía y agricultura flojos
3. **Dependencia de AI/data centers** — Si el ciclo de CapEx de AI se desacelera, HST pierde motor
4. **Integración de Mott** — Riesgo de ejecución
5. **Exposición cíclica** — Vulnerable a recesiones globales

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $197.85 |
| P/E Trailing | 30.87x |
| P/E Forward | ~24.0x |
| Div Yield | 1.48% |
| FCF Yield | ~4.2% |
| 52-Week High | $217.16 |
| 52-Week Low | $153.36 |

## Conclusión

IDEX es una industrial de alta calidad con posiciones dominantes en nichos de misión crítica. El momentum en data centers/AI vía HST es real (órdenes récord +34% orgánico), y la adquisición de Mott agrega capacidades estratégicas. El dividendo creciente (17 años), FCF sólido, y exposición a megatendencias de agua e AI justifican una posición.

---

*Research fecha: 8 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 218.0,
    analyst_upside: 10.2,
    status: "active",
    first_researched_at: "2026-04-08T00:00:00Z",
    last_updated_at: "2026-04-08T00:00:00Z",
    next_review_at: "2026-10-08T00:00:00Z",
  },
  {
    id: 38,
    ticker: "CALM",
    name: "Cal-Maine Foods Inc.",
    sector: "Consumer Staples",
    industry: "Shell Egg Production & Distribution",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 77.72,
    pe_ratio: 5.41,
    pe_forward: 20.14,
    dividend_yield: 3.44,
    market_cap_b: 3.69,
    eps: 14.42,
    summary_short:
      "El mayor productor de huevos de EE.UU. (~20% del mercado), con ~13 mil millones de huevos al año. Marcas como Egg-Land's Best, Land O'Lakes y Crepini. Revenue $3.46B, dividendo variable (1/3 de utilidad neta trimestral). Expandiéndose en alimentos preparados.",
    summary_what:
      "Cal-Maine Foods es el mayor productor y distribuidor de huevos frescos en Estados Unidos, responsable de aproximadamente el 20% de la producción comercial del país con ~13 mil millones de huevos anuales. Opera granjas de producción, empaque, clasificación y distribución en más de 15 estados (Mississippi, Arkansas, Florida, Alabama, entre otros). Vende huevos convencionales, cage-free, orgánicos, free-range, pasture-raised y nutritionally-enhanced bajo marcas como Egg-Land's Best (licencia), Land O'Lakes (licencia), Farmhouse Eggs, Sunups y Sunny Meadow. Recientemente expandió a alimentos preparados con la adquisición de Crepini (egg wraps) y MeadowCreek Foods (pancakes), que ya representan 52.9% de ventas netas junto con huevos especiales.",
    summary_why:
      "A $77.72, CALM cotiza cerca de su mínimo de 52 semanas ($71.92) y a un P/E trailing de solo 5.4x — descuento masivo vs su P/E forward de 20x, reflejando la normalización del precio del huevo. Los catalizadores incluyen: (1) expansión agresiva en alimentos preparados — Crepini + nueva línea de pancakes de $14.8M en Wisconsin; (2) especialidad + preparados ya son 52.9% de ventas (mayor margen); (3) adquisición de Creighton Brothers para integración vertical; (4) dividendo variable que premia en buenos trimestres; (5) monopolio natural como el mayor productor con 20% del mercado estadounidense.",
    summary_risk:
      "Los ingresos y ganancias de Cal-Maine dependen casi exclusivamente del precio de los huevos, un commodity extremadamente volátil influenciado por brotes de gripe aviar (HPAI), costos de alimentación (~65% de costos de producción) y regulaciones estatales sobre jaulas. La compañía también enfrenta una investigación activa del DOJ por fijación de precios y escrutinio antimonopolio por su posición dominante del 20% del mercado.",
    research_full: `# Cal-Maine Foods (CALM) — Research Completo

## Precio: $77.72 | P/E: 5.41 | P/E Forward: ~20.1x | Div Yield: ~3.4% (variable) | Market Cap: $3.69B

---

## ¿Qué es Cal-Maine Foods?

Cal-Maine Foods es el **mayor productor y distribuidor de huevos frescos en Estados Unidos**, representando aproximadamente el 20% de toda la producción comercial de huevos del país. Fundada en 1957 por Fred R. Adams Jr. en Mississippi, la empresa ha crecido principalmente a través de adquisiciones de más de 25 productores de huevos. Produce ~13 mil millones de huevos al año y abastece a cadenas de supermercados nacionales, club stores y distribuidores de foodservice.

## Segmentos de Negocio

| Categoría | % de Ventas | Descripción |
|-----------|-------------|-------------|
| **Huevos Especiales + Preparados** | ~52.9% | Cage-free, orgánicos, free-range, egg wraps Crepini, pancakes MeadowCreek |
| **Huevos Convencionales** | ~47.1% | Huevos shell estándar, clasificados y empacados |

## Marcas Clave

| Marca | Tipo | Descripción |
|-------|------|-------------|
| **Egg-Land's Best** | Licencia | Marca premium de huevos nutritionally-enhanced (#1 en branded eggs) |
| **Land O'Lakes** | Licencia | Huevos bajo marca reconocida de lácteos |
| **Farmhouse Eggs** | Propia | Huevos de granja premium |
| **Sunups** | Propia | Línea de huevos value |
| **Sunny Meadow** | Propia | Huevos convencionales |
| **4-Grain** | Propia | Huevos de gallinas alimentadas con 4 granos |
| **Crepini** | Adquisición | Egg wraps y alimentos preparados de huevo |
| **MeadowCreek Foods** | Subsidiaria | Pancakes y alimentos preparados |

## Números Clave (FY2026 Q3, reportado Abr 1, 2026)

| Métrica | Valor |
|---------|-------|
| **Revenue (Q3)** | $667.0M (-53.0% YoY) |
| **Revenue (TTM)** | ~$3.46B |
| **Net Income (Q3)** | $50.5M (-90.1% YoY) |
| **EPS (Q3)** | $1.06 (beat $0.78 estimado, +35.9%) |
| **EPS (TTM)** | $14.42 |
| **Prepared Foods Revenue (Q3)** | $63.6M (+441.2% YoY) |
| **Specialty + Prepared % of Sales** | 52.9% |
| **Gross Margin** | ~15% (normalizing) |
| **Shares Outstanding** | 47.38M |
| **Employees** | ~3,828 |

## Dividendo — Política Variable Única

Cal-Maine tiene una **política de dividendo variable**: paga **1/3 de la utilidad neta trimestral** como dividendo cada trimestre. Esto significa:

| Métrica | Valor |
|---------|-------|
| **Dividendo TTM** | $8.36/acción |
| **Yield TTM** | ~10.76% (inflado por precios récord de huevo) |
| **Forward Yield (est.)** | ~3.44% |
| **Yield Mediana 10 años** | 2.68% |
| **Último dividendo trimestral** | $0.36/acción |
| **Payout Ratio** | 33% fijo (por política) |

**Nota importante:** El yield TTM de 10.76% refleja las ganancias excepcionales de 2025 por precios récord del huevo. Con precios normalizándose, el yield forward es ~3.44%.

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** (Benchmark) / **Neutral** (Goldman Sachs) |
| Price Target — Benchmark | $100 (Buy) |
| Price Target — Goldman Sachs | $82 (Neutral) |
| **Upside al target promedio** | **+17.5%** |

## Catalizadores de Crecimiento

1. **Diversificación a preparados** — Crepini + MeadowCreek: revenue de preparados +441% YoY, nueva línea de pancakes de $14.8M
2. **Especialidad es mayoría** — 52.9% de ventas en huevos especiales + preparados (mayor margen que convencional)
3. **Adquisición de Creighton Brothers** — Integración vertical post-Q3
4. **Posición dominante** — ~20% del mercado de huevos de EE.UU., economías de escala imbatibles
5. **Precio cerca de piso** — Cotiza cerca de 52-week low ($71.92), normalización ya priced-in

## Riesgos Principales

1. **Commodity puro** — Revenue y márgenes dependen del precio del huevo, que es extremadamente volátil
2. **Gripe aviar (HPAI)** — Brotes pueden diezmar el inventario de gallinas y disparar costos
3. **Costos de alimentación** — Feed ~65% de costos de producción, atado a precios de maíz/soja
4. **Investigación DOJ** — Investigación activa por posible fijación de precios (antimonopolio)
5. **Dividendo variable** — En trimestres malos, el dividendo puede ser $0 (literal)
6. **Regulación estatal** — Leyes cage-free (California Prop 12) incrementan costos

## Valuación Actual

| Métrica | Valor |
|---------|-------|
| Precio | $77.72 |
| P/E Trailing | 5.41x (inflado por ganancias excepcionales) |
| P/E Forward | ~20.14x |
| Forward Div Yield | ~3.44% |
| 52-Week High | $126.40 |
| 52-Week Low | $71.92 |
| Market Cap | $3.69B |

## Conclusión

Cal-Maine es el líder absoluto en producción de huevos en EE.UU. con un moat de escala difícil de replicar. La estrategia de diversificación hacia preparados (Crepini, MeadowCreek) está funcionando — ya representan mayoría de ventas y tienen márgenes superiores. Cotizando cerca del 52-week low con la normalización del precio del huevo ya reflejada, CALM ofrece exposición al consumo básico con upside de crecimiento en prepared foods. El dividendo variable es una característica única: en buenos trimestres recibes mucho, en malos poco — alinea los intereses de la empresa con los tuyos.

---

*Research fecha: 9 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 91.0,
    analyst_upside: 17.5,
    status: "active",
    first_researched_at: "2026-04-09T00:00:00Z",
    last_updated_at: "2026-04-09T00:00:00Z",
    next_review_at: "2026-10-09T00:00:00Z",
  },
  {
    id: 39,
    ticker: "CCJ",
    name: "Cameco Corporation",
    sector: "Energy",
    industry: "Uranium Mining & Nuclear Fuel Services",
    country: "Canada",
    region: "North America",
    currency: "USD",
    price: 116.66,
    pe_ratio: 125.4,
    pe_forward: 54.2,
    dividend_yield: 0.21,
    market_cap_b: 50.8,
    eps: 0.93,
    summary_short:
      "El productor de uranio más grande del mundo occidental. Dueño de McArthur River (la mina de uranio más concentrada del planeta) y del 49% de Westinghouse (reactores nucleares). El combustible del renacimiento nuclear que alimenta los data centers de AI.",
    summary_what:
      "Cameco Corporation es una de las empresas más grandes del mundo dedicadas a la cadena completa del combustible nuclear: minería de uranio, refinación, conversión y servicios de combustible para reactores. Opera las minas más importantes del planeta en la cuenca de Athabasca (Saskatchewan, Canadá): McArthur River/Key Lake — la mina de uranio de alta ley más grande del mundo, con ley promedio ~6% (aproximadamente 100 veces más concentrada que el uranio típico) — y Cigar Lake, otra mina de ultra-alta ley. También posee facilidades de refinación en Blind River, conversión en Port Hope (Ontario), y fabricación de combustible para reactores CANDU.\n\nEn octubre de 2023, Cameco (49%) y Brookfield Asset Management (51%) adquirieron Westinghouse Electric Company por $7.9B. Westinghouse es uno de los mayores proveedores mundiales de tecnología, servicios y combustible para reactores nucleares, con tecnología AP1000 y el reactor modular pequeño AP300. Sus clientes son utilities nucleares alrededor del mundo bajo contratos de largo plazo (10-15 años).",
    summary_why:
      "Cameco es la apuesta más directa al renacimiento nuclear. Varios vientos de cola convergen simultáneamente: (1) Big Tech (Microsoft, Amazon, Google, Meta) firmó contratos multimillonarios de energía nuclear para alimentar sus data centers de AI — demanda 24/7 sin carbono que solo los reactores pueden dar; (2) más de 30 países firmaron en COP28 el compromiso de triplicar la capacidad nuclear global para 2050; (3) el Prohibiting Russian Uranium Imports Act (mayo 2024) sacó al mayor proveedor del mercado occidental, creando un déficit estructural; (4) el precio spot del uranio pasó de ~$20/lb en 2020 a $65-85/lb en 2025, y los contratos de largo plazo están en niveles récord; (5) la adquisición de Westinghouse ya está generando flujo de caja incremental para Cameco; (6) Cameco firmó contratos de suministro hasta 2030+ que garantizan revenue predecible a precios superiores.",
    summary_risk:
      "El precio del uranio es el mayor driver del negocio y es cíclico — si se materializan nuevos proyectos de minería (Kazatomprom, Namibia, Australia), la oferta puede aumentar y presionar precios. La valuación está muy alta: a P/E trailing de 125x y forward de 54x, la acción está priced-for-perfection — cualquier tropiezo operacional en McArthur River o Cigar Lake, o retrasos regulatorios en Westinghouse, pueden causar caídas fuertes. Riesgo adicional: el dividendo es bajo (~0.21%), así que el retorno depende casi 100% de la apreciación del precio, no de ingresos recurrentes.",
    research_full: `# Cameco Corporation (CCJ) — Research Completo

## Precio: $116.66 | P/E: 125.4 | P/E Forward: 54.2 | Div Yield: 0.21% | Market Cap: $50.8B

---

## ¿Qué es Cameco?

Cameco Corporation es el **productor de uranio más grande del mundo occidental** y una de las pocas empresas con presencia en la cadena completa del combustible nuclear: minería, refinación, conversión, fabricación de combustible y — desde 2023 — reactores nucleares a través de su participación en Westinghouse. Fundada en 1988 en Saskatoon, Saskatchewan, Canadá, Cameco provee combustible a utilities nucleares alrededor del mundo bajo contratos de largo plazo.

## Segmentos de Negocio

| Segmento | Descripción | % Revenue aprox |
|----------|-------------|-----------------|
| **Uranium** | Minería y venta de U3O8 (yellowcake) | ~65% |
| **Fuel Services** | Refinación, conversión y fabricación de combustible | ~15% |
| **Westinghouse (49%)** | Reactores, combustible y servicios nucleares | ~20% |

## Activos Mineros Clave

| Mina | Ubicación | Participación | Ley Promedio | Notas |
|------|-----------|---------------|--------------|-------|
| **McArthur River/Key Lake** | Saskatchewan, Canadá | 70% | ~6% U3O8 | La mina de uranio de alta ley más grande del mundo — ~100x más concentrada que el promedio |
| **Cigar Lake** | Saskatchewan, Canadá | 54.5% | ~17% U3O8 | Una de las minas con ley más alta del planeta |
| **Inkai** | Kazajistán | 40% JV | ISR (lixiviación in situ) | Producción de bajo costo con Kazatomprom |
| **Rabbit Lake** | Saskatchewan, Canadá | 100% | — | En cuidado y mantenimiento |

## Westinghouse — El Game Changer de 2023

En **octubre de 2023**, Cameco (49%) y Brookfield Asset Management (51%) cerraron la adquisición de **Westinghouse Electric Company por $7.9B**. Esto transformó a Cameco de pure-play de uranio a integrador vertical de la cadena nuclear completa.

### Por qué importa:
- **AP1000**: uno de los reactores Gen III+ más vendidos del mundo — nuevas construcciones en Polonia, Bulgaria, Ucrania
- **AP300**: reactor modular pequeño (SMR) en desarrollo para data centers y grid industrial
- **Servicios y combustible**: ingreso recurrente de alta margen de plantas existentes
- **Backlog de $30B+** en contratos de largo plazo
- **Cameco ya recibió ~$170M de dividendos** de su participación en el primer año completo

## El Renacimiento Nuclear — Por Qué Ahora

### 1. Big Tech apuesta al nuclear para AI
- **Microsoft (Sep 2024)**: deal de 20 años con Constellation para reactivar Three Mile Island (Unit 1) — primera vez que una central reactivada es solo para una tech company
- **Amazon (Oct 2024)**: $500M+ invertidos en SMRs con X-energy, además del deal con Talen Energy por Susquehanna
- **Google (Oct 2024)**: acuerdo con Kairos Power por 500 MW de SMRs
- **Meta (Dic 2024)**: RFP para 1-4 GW de capacidad nuclear en EE.UU.

Todas estas compañías llegaron a la misma conclusión: los data centers de AI necesitan energía 24/7 sin carbono, y solo el nuclear puede cumplir los tres requisitos a la vez.

### 2. Compromiso global — COP28
En diciembre de 2023, **más de 30 países firmaron en COP28 el compromiso de triplicar la capacidad nuclear global para 2050**. Incluye EE.UU., Francia, Japón, Corea del Sur, Canadá, Emiratos Árabes y UK.

### 3. Prohibición del uranio ruso
En mayo de 2024, EE.UU. firmó el **Prohibiting Russian Uranium Imports Act**, que prohíbe la importación de uranio enriquecido ruso. Rusia era el ~20% del suministro occidental. Este vacío beneficia directamente a productores como Cameco.

### 4. Déficit estructural
El mundo consume ~180M lb de U3O8 al año, pero la minería produce solo ~140M lb. La diferencia venía de inventarios secundarios (armas nucleares desmanteladas, reprocesamiento) que se están agotando. **Déficit estructural → precios más altos sostenidos.**

## Precio del Uranio — Rally Histórico

| Año | Precio Spot (USD/lb) | Notas |
|-----|----------------------|-------|
| 2020 | ~$20-30 | Mínimos post-Fukushima |
| 2022 | ~$50 | Inicio del rally post-Ucrania |
| 2024 (peak) | ~$107 | Máximo de 16 años |
| 2025 | ~$65-85 | Consolidación, contratos largo plazo aún más altos |

Los contratos de largo plazo que Cameco está firmando están en niveles históricamente altos, garantizando revenue predecible.

## Resultados Financieros 2024

| Métrica | Valor |
|---------|-------|
| **Revenue** | ~$3.1B CAD |
| **Net Earnings** | ~$400M+ CAD |
| **Adjusted EBITDA** | ~$1.1B CAD |
| **Contratos firmados (2024)** | 40M+ lb U3O8 |
| **Inventario contratado** | Asegurado hasta 2030+ |

## Capital Return

| Métrica | Valor |
|---------|-------|
| **Dividendo anual** | ~$0.24 USD/acción |
| **Yield actual** | ~0.21% |
| **Historia del dividendo** | Conservador — prioriza balance sheet |
| **Filosofía** | Crecer el dividendo con el ciclo, no forzarlo |

**Nota importante**: CCJ es una apuesta de apreciación, no de dividendos. El retorno viene del crecimiento del negocio, no de pagos trimestrales.

## Análisis de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy / Outperform** |
| Price Target Promedio | **~$130** |
| Upside al Target | **+11-12%** |
| Buy ratings | Mayoría de analistas |

## ¿Por Qué Nos Gusta?

1. **Monopolio del Oeste** — Cameco es la única major nuclear completamente occidental, accesible y regulada (NYSE + TSX). Kazatomprom es más grande, pero está en Kazajistán y tiene exposición rusa.
2. **McArthur River** — La mina más concentrada del mundo significa el costo más bajo y los márgenes más altos del sector.
3. **Westinghouse** — Ya no es solo uranio: ahora tiene exposición a reactores, servicios y SMRs — el ciclo completo.
4. **Contratos de largo plazo** — Revenue asegurada hasta 2030+ a precios récord.
5. **Vientos de cola seculares** — AI, descarbonización, bloqueo ruso, compromiso COP28 — todos empujan en la misma dirección.
6. **Opcionalidad de SMRs** — Si los reactores modulares pequeños escalan, la demanda de uranio se multiplica en la próxima década.

## Riesgos Principales

1. **Valuación muy alta** — P/E trailing de 125x, forward de 54x. Priced-for-perfection.
2. **Sensibilidad al precio del uranio** — Ciclo de commodities; si se adelanta nueva oferta, los precios pueden corregir.
3. **Riesgo operacional** — McArthur River ya tuvo un cierre prolongado (2018-2022). Cualquier interrupción impacta el profit.
4. **Westinghouse aún no está completamente integrado** — Costos de integración y riesgos de ejecución en reactores nuevos.
5. **Dividendo bajo** — Retorno casi 100% dependiente de apreciación de precio, no de ingresos recurrentes.
6. **Riesgo geopolítico** — La mina Inkai está en Kazajistán, que depende de infraestructura rusa para exportar.

## Conclusión

Cameco es la apuesta más pura y accesible al renacimiento nuclear. Ya no es solo uranio: con el 49% de Westinghouse, Cameco es ahora un integrador vertical de la cadena nuclear completa — desde la mina de Saskatchewan hasta el reactor en funcionamiento. El convergir de Big Tech comprando energía nuclear para AI, el bloqueo al uranio ruso, el compromiso COP28 de triplicar la capacidad global, y los contratos de largo plazo a precios récord, crean un tailwind estructural difícil de replicar en otro sector. La valuación es cara — pero cuando todos los vientos soplan en la misma dirección, las apuestas caras pueden seguir subiendo por años.

---

*Research fecha: 10 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 130.0,
    analyst_upside: 11.4,
    status: "active",
    first_researched_at: "2026-04-10T00:00:00Z",
    last_updated_at: "2026-04-10T00:00:00Z",
    next_review_at: "2026-10-10T00:00:00Z",
  },
  {
    id: 40,
    ticker: "CRRFY",
    name: "Carrefour SA",
    sector: "Consumer",
    industry: "Food Retail / Hypermarkets",
    country: "France",
    region: "Europe",
    currency: "USD",
    price: 3.94,
    pe_ratio: 11.94,
    pe_forward: 9.47,
    dividend_yield: 5.36,
    market_cap_b: 13.9,
    eps: 0.33,
    summary_short:
      "El segundo retailer más grande del mundo. Opera hipermercados, supermercados, tiendas de conveniencia y cash & carry en 30+ países. Marcas propias: Carrefour, Atacadão (Brasil), Supeco. Revenue de ~€83B con posiciones de liderazgo en Francia, España y Brasil.",
    summary_what:
      "Carrefour SA es uno de los retailers más grandes del mundo, fundado en 1959 en Annecy, Francia. Opera más de 14,000 tiendas en 30+ países bajo múltiples formatos: hipermercados Carrefour (grandes superficies), supermercados Carrefour Market, tiendas de conveniencia (Carrefour Express, Carrefour City, Carrefour Contact), tiendas de descuento Supeco, cash & carry Promocash, y la cadena brasileña Atacadão — el formato cash & carry líder de Brasil.\n\nLa compañía genera ~€83B en revenue anual, con tres mercados core que representan la mayoría de ventas: Francia (~47%), Brasil (~23%) y España (~10%). También opera en Italia, Bélgica, Polonia, Rumania, Argentina, Medio Oriente y África. Más allá del retail, Carrefour tiene operaciones en banca (Carrefour Banque), seguros, viajes y estaciones de combustible (Carfuel).\n\nEn febrero 2026, Carrefour lanzó su plan estratégico 'Carrefour 2030', reenfocándose en sus tres mercados core (Francia, España, Brasil) y simplificando su estructura operativa.",
    summary_why:
      "Carrefour a $3.94 es una de las acciones más baratas del portafolio: P/E forward de 9.5x — menos de la mitad del promedio del sector retail. El dividendo de 5.36% es uno de los más altos del portafolio, pagado anualmente.\n\nTres catalizadores: (1) El plan Carrefour 2030 simplifica operaciones y se enfoca en los 3 mercados donde son #1 o #2 — Francia, España y Brasil; (2) Atacadão en Brasil está creciendo agresivamente con el formato cash & carry que gana cuota de mercado en toda Latinoamérica; (3) La acción cotiza cerca de su 52-week high ($3.94) pero sigue barata en métricas fundamentales — el mercado aún no reconoce la transformación operativa.\n\nCarrefour es el play defensivo europeo por excelencia: la gente compra comida en cualquier ciclo económico.",
    summary_risk:
      "El sector retail de alimentos tiene márgenes ultra-delgados (~2-3% neto), lo que deja poco margen de error operativo. Cualquier aumento en costos (energía, logística, personal) puede comprimir earnings rápidamente.\n\nRiesgos adicionales: competencia intensa de Lidl, Aldi y discounters en Europa que presionan precios; exposición al mercado francés (~47% de revenue) donde el consumo está débil y la regulación laboral es costosa; el negocio en Argentina es volátil por inflación y controles cambiarios; como ADR en OTC, la liquidez es más baja que en la bolsa de París (Euronext) y el spread puede ser amplio; riesgo cambiario EUR/BRL/ARS contra USD.",
    research_full: `# Carrefour SA (CRRFY) — Research Completo

## Precio: $3.94 | P/E: 11.94 | P/E Forward: 9.47 | Div Yield: 5.36% | Market Cap: $13.9B

---

## ¿Qué es Carrefour?

Carrefour SA es el **segundo retailer más grande del mundo** (después de Walmart) y el **mayor de Europa**, fundado en 1959 en Annecy, Francia. Opera más de 14,000 tiendas en 30+ países bajo múltiples formatos. Es una de esas empresas que ves en todas partes si viajas por Europa, Latinoamérica o Medio Oriente.

## Formatos y Marcas

| Formato | Descripción | Tiendas aprox |
|---------|-------------|---------------|
| **Hipermercados Carrefour** | Grandes superficies (alimentos + electrónica + ropa) | ~1,100 |
| **Carrefour Market** | Supermercados medianos | ~3,000 |
| **Carrefour Express/City/Contact** | Tiendas de conveniencia | ~7,000+ |
| **Atacadão** | Cash & carry (Brasil) — formato líder | ~400 |
| **Supeco** | Discount (Europa) | ~1,000+ |
| **Promocash** | Cash & carry (Francia) | ~130 |

### Otras operaciones
- **Carrefour Banque** — servicios financieros y crédito
- **Carfuel** — estaciones de combustible en Francia y España
- **E-commerce** — entrega a domicilio y click & collect
- **Marca propia** — productos Carrefour representan ~35% de ventas

## Mercados Clave

| País | % Revenue | Posición | Notas |
|------|-----------|----------|-------|
| **Francia** | ~47% | #1 en hipermercados | Base histórica, altamente competitiva |
| **Brasil** | ~23% | #2 (Atacadão) | Crecimiento explosivo en cash & carry |
| **España** | ~10% | #2 | Posición fuerte, mercado estable |
| **Italia** | ~4% | Top 5 | Presente pero no dominante |
| **Otros** | ~16% | Varía | Bélgica, Polonia, Rumania, Argentina, Medio Oriente, África |

## Plan Estratégico Carrefour 2030

En **febrero 2026**, Carrefour lanzó su nuevo plan estratégico con foco en:

1. **Refocus en 3 mercados core**: Francia, España, Brasil — donde tienen liderazgo
2. **Simplificación operativa**: Nueva estructura de reporting por país
3. **E-commerce y digitalización**: Aceleración de canales digitales
4. **Marca propia**: Expandir participación de productos propios (margen superior)
5. **Cash & carry en Brasil**: Seguir expandiendo Atacadão agresivamente

## Números Clave

| Métrica | Valor |
|---------|-------|
| Precio ADR | $3.94 |
| P/E Trailing | 11.94x |
| P/E Forward | 9.47x |
| Dividend Yield | 5.36% |
| Market Cap | $13.9B |
| Revenue | ~€83B |
| EPS | $0.33 |
| 52-Week High | $3.94 |
| 52-Week Low | $2.73 |
| Margen Neto | ~2.5% |

## Ventajas Competitivas (Moat)

1. **Escala masiva**: #2 mundial en retail, poder de negociación con proveedores
2. **Diversificación geográfica**: 30+ países reduce riesgo de un solo mercado
3. **Atacadão en Brasil**: El formato cash & carry más exitoso de LATAM, con crecimiento orgánico fuerte
4. **Marca reconocida**: Carrefour es una de las marcas retail más reconocidas globalmente
5. **Inmobiliario**: Propietarios de muchos de sus locales — activo oculto en el balance
6. **Resiliencia**: La gente come todos los días, en cualquier economía

## Dividendo

- **Yield actual**: 5.36% — uno de los más altos del portafolio
- **Frecuencia**: Anual (pago en junio/julio)
- **Payout ratio**: ~55%
- **Historial**: Pagador consistente, ajustado durante COVID pero restaurado rápidamente

## Riesgos Principales

1. **Márgenes ultra-delgados**: ~2-3% neto típico en grocery retail — poco margen de error
2. **Competencia feroz**: Lidl, Aldi y discounters ganan cuota en Europa presionando precios
3. **Francia estancada**: ~47% del revenue depende de un mercado maduro con consumo débil
4. **Argentina volátil**: Inflación y controles cambiarios hacen impredecible ese mercado
5. **Liquidez ADR**: Como OTC, el spread puede ser amplio y la liquidez menor que en Euronext
6. **Riesgo cambiario**: EUR, BRL y ARS contra USD afectan el valor del ADR

## Consenso de Analistas

- **Rating:** Neutral
- **Price target promedio:** ~€14.92 (Paris) / ~$4.10 (ADR equivalente)
- **Rango targets:** €10 - €18.50
- **Analistas:** 13

## Conclusión

Carrefour a $3.94 es una de las posiciones más defensivas y baratas del portafolio. A P/E forward de 9.5x con 5.36% de dividendo, estás comprando el segundo retailer más grande del mundo por menos de 10 veces sus ganancias — y te pagan más de 5% anual solo por esperar. El riesgo real está en los márgenes delgados del sector y la dependencia de Francia, pero el crecimiento de Atacadão en Brasil y el plan Carrefour 2030 apuntan a una empresa que se está simplificando y enfocando. Como inversión defensiva con ingreso, pocas acciones ofrecen esta combinación de precio bajo + dividendo alto + escala global.

---

*Research fecha: 14 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Neutral",
    analyst_target: 4.10,
    analyst_upside: 4.1,
    status: "active",
    first_researched_at: "2026-04-14T00:00:00Z",
    last_updated_at: "2026-04-14T00:00:00Z",
    next_review_at: "2026-10-14T00:00:00Z",
  },
  {
    id: 41,
    ticker: "CDNS",
    name: "Cadence Design Systems",
    sector: "Technology",
    industry: "Electronic Design Automation (EDA)",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 293.32,
    pe_ratio: 72.25,
    pe_forward: 31.16,
    dividend_yield: 0,
    market_cap_b: 81.0,
    eps: 4.06,
    summary_short:
      "La mitad del duopolio que diseña TODOS los chips del mundo. Sin Cadence (y su rival Synopsys), no existirían los procesadores de Apple, NVIDIA, AMD, ni ningún chip moderno. Software de diseño electrónico (EDA) con ~80% de revenue recurrente y switching costs extremos.",
    summary_what:
      "Cadence Design Systems es una de las dos empresas (junto con Synopsys) que provee el software esencial para diseñar circuitos integrados, chips y sistemas electrónicos. Cada chip moderno — desde el A18 de tu iPhone hasta los GPUs de NVIDIA que entrenan modelos de AI — fue diseñado usando herramientas de Cadence o Synopsys. No hay alternativa.\n\nFundada en 1988 en San José, California, Cadence opera en tres pilares: (1) Core EDA — herramientas de diseño, simulación e implementación de chips (Virtuoso, Innovus, Genus, Tempus, Spectre); (2) System Design & Analysis — diseño de PCBs, simulación multifísica, integridad de señal (Allegro X, Sigrity, Celsius, Clarity 3D); (3) Life Sciences — modelado de proteínas y biosimulación para descubrimiento de fármacos (OpenEye Scientific).\n\nTambién fabrica hardware de verificación (Palladium para emulación, Protium para prototipos) y tiene una colaboración estratégica con NVIDIA para diseño de chips con AI agéntica (Cerebrus).",
    summary_why:
      "Cadence es un monopolio compartido con el moat más profundo de la tecnología. El switching cost es astronómico: cambiar de Cadence a otro proveedor EDA requeriría reentrenar miles de ingenieros y rediseñar flujos de trabajo que tomaron décadas construir. ~80% del revenue es recurrente (licencias y mantenimiento).\n\nTres tailwinds estructurales: (1) La explosión de AI requiere chips cada vez más complejos — más transistores = más licencias de EDA = más revenue para Cadence; (2) Expansión de TAM hacia system analysis (multifísica) y life sciences que duplica el mercado addressable más allá del diseño de chips tradicional; (3) El partnership con NVIDIA para diseño de chips con AI agéntica posiciona a Cadence en el centro del futuro del semiconductor design.\n\nCadence no paga dividendo — reinvierte todo en R&D y adquisiciones. El retorno viene de la apreciación del precio. Target de analistas: ~$380 (+29% upside). Consenso Buy de 22 de 31 analistas.",
    summary_risk:
      "La valuación es cara: P/E trailing de 72x no deja margen de error. Cualquier miss en revenue o guidance puede causar caídas de 15-20% en un día. Cadence cotiza como si la perfección fuera el baseline.\n\nRiesgos adicionales: la fusión Synopsys-Ansys crea un competidor 'silicon-to-systems' que amenaza la expansión de Cadence en simulación multifísica; China representa 11-18% del revenue y está expuesta a restricciones de exportación de semiconductores EE.UU.-China; no paga dividendo, así que el retorno depende 100% de la apreciación del precio; y el mercado de EDA, aunque con duopolio, tiene ciclos ligados al capex de semiconductores — una recesión en la industria de chips reduce la demanda de herramientas de diseño.",
    research_full: `# Cadence Design Systems (CDNS) — Research Completo

## Precio: $293.32 | P/E: 72.25 | P/E Forward: 31.16 | Div Yield: 0% | Market Cap: $81B

---

## ¿Qué es Cadence?

Cadence Design Systems es la **mitad del duopolio más importante de la tecnología moderna**. Junto con Synopsys, Cadence provee el software sin el cual **ningún chip moderno puede ser diseñado o fabricado**. Cada procesador de Apple, GPU de NVIDIA, chip de Qualcomm y servidor de Intel fue diseñado usando herramientas de Cadence o Synopsys. No hay alternativa real — es un duopolio con switching costs de décadas.

## Segmentos de Negocio

| Segmento | Descripción | Productos Clave |
|----------|-------------|-----------------|
| **Core EDA** | Software para diseño, simulación e implementación de chips | Virtuoso, Innovus, Genus, Tempus, Voltus, Spectre |
| **System Design & Analysis** | Diseño de PCBs, simulación multifísica | Allegro X, Sigrity X, Clarity 3D, Celsius, Fidelity |
| **Verification Hardware** | Hardware para emulación y prototipos de chips | Palladium (emulación), Protium (prototyping) |
| **Life Sciences** | Modelado de proteínas, biosimulación | OpenEye Scientific |
| **AI/ML** | Diseño de chips asistido por inteligencia artificial | Cerebrus (con NVIDIA) |

## Productos Clave Explicados

| Producto | Qué hace | Por qué importa |
|----------|----------|-----------------|
| **Virtuoso** | Diseño de chips analógicos y mixed-signal | Estándar de la industria — usado por décadas |
| **Innovus** | Place & route (colocar transistores en el chip) | Sin esto, no hay chip físico |
| **Genus** | Síntesis lógica | Traduce diseño a circuito real |
| **Tempus** | Timing signoff | Verifica que el chip funcione a la velocidad correcta |
| **Spectre** | Simulación de circuitos | Predice comportamiento antes de fabricar |
| **Allegro X** | Diseño de PCBs | La placa donde van los chips |
| **Palladium** | Emulación de hardware | Prueba chips virtualmente antes de fabricarlos |
| **Cerebrus** | AI para optimizar diseño de chips | Partnership con NVIDIA |

## Números Clave

| Métrica | Valor |
|---------|-------|
| Precio | $293.32 |
| P/E Trailing | 72.25x |
| P/E Forward | 31.16x |
| Dividend Yield | 0% (reinvierte todo) |
| Market Cap | $81B |
| Revenue TTM | ~$4.6B |
| EPS | $4.06 |
| 52-Week High | $376.45 |
| 52-Week Low | $247.70 |
| Revenue recurrente | ~80% |
| Empleados | 10,000+ en 30+ países |

## Ventajas Competitivas (Moat)

1. **Duopolio con switching costs de décadas**: Los ingenieros de chip se entrenan en Cadence o Synopsys. Cambiar requiere reentrenar equipos enteros y rediseñar flujos de trabajo — nadie lo hace
2. **~80% revenue recurrente**: Licencias y mantenimiento crean un revenue predecible y sticky
3. **Diseño de chips se vuelve más complejo cada año**: Más transistores = más simulaciones = más licencias = más revenue
4. **Expansión de TAM**: De EDA puro (~$15B) a system analysis + life sciences (~$30B+ addressable)
5. **Partnership con NVIDIA**: Cerebrus + NVIDIA para diseño de chips con AI agéntica — posición única
6. **Barrera de entrada imposible**: Nadie puede construir un competidor de EDA desde cero — tomaría 20+ años y miles de millones

## Por Qué el AI Boom Beneficia a Cadence

La mayoría piensa que el AI boom beneficia a NVIDIA, AMD y las cloud companies. Pero hay un nivel más profundo: **alguien tiene que DISEÑAR esos chips**. Y ese alguien usa Cadence.

- Los chips de AI son los más complejos jamás creados (GPUs, TPUs, custom ASICs)
- Más complejidad = más tiempo de simulación = más licencias de EDA
- Las empresas están diseñando chips custom para AI (Apple, Google, Amazon, Tesla, Meta) — cada uno necesita Cadence
- Cadence cobra por uso/licencia — más chips diseñados = más revenue

## Riesgos Principales

1. **Valuación priced-for-perfection**: P/E trailing de 72x y forward de 31x — cualquier tropiezo causa desplome
2. **Synopsys + Ansys merger**: Crea competidor silicon-to-systems que amenaza expansión en simulación multifísica
3. **China 11-18% de revenue**: Expuesto a restricciones de exportación EE.UU.-China en tecnología de semiconductores
4. **Sin dividendo**: Retorno 100% dependiente de apreciación del precio
5. **Ciclo de semiconductores**: Una recesión en capex de chips reduce demanda de EDA

## Consenso de Analistas

- **Rating:** Buy (22 Buy, 4 Hold, 0 Sell de 31 analistas)
- **Price target mediano:** ~$380
- **Rango targets:** $275 - $410
- **Upside implícito:** ~29.5%

## Conclusión

Cadence es el "pico y pala" del boom de semiconductores y AI. No importa quién gane la carrera de chips — Apple, NVIDIA, AMD, Google, Amazon — todos usan Cadence para diseñarlos. Es un duopolio con switching costs de décadas, ~80% revenue recurrente, y un TAM que se duplica con la expansión a simulación multifísica y life sciences. La valuación es cara (72x earnings), pero cuando una empresa tiene un monopolio compartido sobre la herramienta que diseña TODO el hardware del mundo, el premium está justificado. No paga dividendo — la tesis es pura apreciación de precio respaldada por un moat imposible de replicar.

---

*Research fecha: 14 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 380.0,
    analyst_upside: 29.5,
    status: "active",
    first_researched_at: "2026-04-14T00:00:00Z",
    last_updated_at: "2026-04-14T00:00:00Z",
    next_review_at: "2026-10-14T00:00:00Z",
  },
  {
    id: 42,
    ticker: "PNR",
    name: "Pentair plc",
    sector: "Industrials",
    industry: "Water Treatment & Pool Equipment",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 90.81,
    pe_ratio: 23.11,
    pe_forward: 15.59,
    dividend_yield: 1.14,
    market_cap_b: 14.8,
    eps: 3.93,
    summary_short:
      "La empresa líder mundial en soluciones de agua. Tres segmentos: tratamiento de agua residencial/comercial (filtros, suavizadores), equipos de piscinas (#1 en EE.UU.) y sistemas de flujo industrial. Marcas: Pentair, Everpure, RainSoft, Kreepy Krauly, Sta-Rite, Manitowoc Ice.",
    summary_what:
      "Pentair plc es una empresa global especializada en soluciones inteligentes de agua, fundada en 1966 y con sede operativa en Golden Valley, Minnesota (incorporada en Irlanda). Opera en tres segmentos:\n\n(1) **Water Solutions** — Sistemas de tratamiento de agua residencial y comercial: filtración punto-de-entrada y punto-de-uso, suavizadores, ósmosis inversa, tanques de presión, y máquinas de hielo comerciales. Marcas: Pentair Water Solutions, Everpure (filtración para restaurantes/hoteles), RainSoft (residencial premium), Pentek, Fleck, y Manitowoc Ice (máquinas de hielo comerciales).\n\n(2) **Pool** — Equipos y accesorios para piscinas residenciales y comerciales: bombas, filtros, calentadores, iluminación, controles automáticos, limpiadores robóticos, cloradores y accesorios. Es el líder del mercado de piscinas en EE.UU. Marcas: Pentair Pool, Kreepy Krauly (limpiadores), Pleatco (filtros), Sta-Rite.\n\n(3) **Flow** — Bombas industriales, válvulas, sistemas de separación por membrana y tratamiento de aguas residuales para industria, agricultura y municipios. Marcas: Aurora, Berkeley, Fairbanks-Nijhuis, Hypro, Shurflo, X-Flow.\n\nPentair sirve a más de 150 países con ~10,500 empleados y genera ~$3.9B en revenue anual.",
    summary_why:
      "Pentair es el play puro en agua — el recurso más esencial del planeta. Tres tesis convergen: (1) La escasez de agua es una megatendencia global: regulaciones más estrictas, infraestructura envejecida y cambio climático impulsan inversión en tratamiento de agua por décadas; (2) El mercado de piscinas en EE.UU. es un cash cow recurrente — 5.7 millones de piscinas necesitan mantenimiento constante (bombas, filtros, químicos) generando revenue predecible; (3) Post-transformación: Pentair se deshizo de sus negocios no-core (eléctrico, térmico) y ahora es pure-play agua con márgenes en expansión.\n\nA P/E forward de 15.6x con 1.14% de dividendo y target de analistas de ~$120 (+32% upside), PNR ofrece crecimiento defensivo en un sector con vientos de cola estructurales. Consenso Buy de analistas.",
    summary_risk:
      "El segmento Pool (~35% de revenue) es cíclico y sensible al clima, tasas de interés y construcción de viviendas — un invierno largo o tasas hipotecarias altas reducen nuevas construcciones de piscinas y el gasto en upgrades.\n\nRiesgos adicionales: exposición a aranceles y costos de materias primas (resinas, metales, componentes) que pueden comprimir márgenes; competencia creciente de fabricantes chinos de equipos de piscina a menor precio; la incorporación en Irlanda con residencia fiscal en UK crea complejidad regulatoria y posible escrutinio fiscal; y dependencia de EE.UU. (~65% del revenue) limita la diversificación geográfica. El dividendo es modesto (1.14%) — el retorno depende principalmente de apreciación del precio.",
    research_full: `# Pentair plc (PNR) — Research Completo

## Precio: $90.81 | P/E: 23.11 | P/E Forward: 15.59 | Div Yield: 1.14% | Market Cap: $14.8B

---

## ¿Qué es Pentair?

Pentair plc es la **empresa líder mundial en soluciones inteligentes de agua**. Todo lo que toca el agua en tu vida — el filtro de tu cocina, la bomba de la piscina del vecino, el sistema que purifica el agua de un restaurante, las máquinas de hielo de un hotel — probablemente tiene tecnología de Pentair. Fundada en 1966 en Minnesota, Pentair se transformó de un conglomerado industrial diversificado a un pure-play de agua en los últimos años, vendiendo sus segmentos eléctrico y térmico para enfocarse 100% en agua.

## Segmentos de Negocio

| Segmento | % Revenue aprox | Descripción |
|----------|-----------------|-------------|
| **Water Solutions** | ~35% | Tratamiento de agua residencial/comercial, filtración, suavizadores, máquinas de hielo |
| **Pool** | ~35% | Equipos de piscinas: bombas, filtros, calentadores, limpiadores, controles |
| **Flow** | ~30% | Bombas industriales, válvulas, sistemas de membrana, tratamiento de aguas residuales |

## Marcas Clave

| Marca | Segmento | Qué hace |
|-------|----------|----------|
| **Everpure** | Water Solutions | Filtración premium para restaurantes, hoteles y food service |
| **RainSoft** | Water Solutions | Tratamiento de agua residencial premium (dealer network) |
| **Manitowoc Ice** | Water Solutions | Máquinas de hielo comerciales (top 3 global) |
| **Pentek** | Water Solutions | Filtros y cartuchos de agua |
| **Fleck** | Water Solutions | Válvulas de control para suavizadores |
| **Kreepy Krauly** | Pool | Limpiadores automáticos de piscinas |
| **Sta-Rite** | Pool/Flow | Bombas de piscina y agua residencial |
| **Pleatco** | Pool | Filtros de reemplazo para piscinas |
| **Aurora** | Flow | Bombas centrífugas industriales |
| **Berkeley** | Flow | Bombas de agua sumergibles |
| **X-Flow** | Flow | Membranas de ultrafiltración |

## El Mercado de Piscinas — Cash Cow Escondido

El mercado de piscinas de EE.UU. es un negocio brillante que pocos entienden:

- **5.7 millones de piscinas** en EE.UU. que necesitan mantenimiento constante
- **Revenue recurrente**: bombas se reemplazan cada 5-8 años, filtros cada 3-5, químicos cada temporada
- **Aftermarket > new build**: ~80% del revenue de pool viene de reemplazo/upgrade, no de piscinas nuevas
- **Regulación favorable**: la Ley DOE 2021 exige bombas variable-speed (más caras, más margen) — Pentair es líder
- **Pricing power**: cuando tu piscina necesita una bomba, la necesitas YA — no es discrecional

## La Megatendencia del Agua

- **2.2 mil millones de personas** sin acceso a agua potable segura (ONU)
- **Infraestructura envejecida**: las tuberías de EE.UU. tienen en promedio 50+ años — reemplazo masivo necesario
- **Regulaciones más estrictas**: PFAS ("forever chemicals"), plomo, microplásticos están forzando upgrades
- **Cambio climático**: sequías y floods aumentan demanda de tratamiento y reutilización
- **Data centers y AI**: los centros de datos consumen billones de litros de agua para enfriamiento

## Números Clave

| Métrica | Valor |
|---------|-------|
| Precio | $90.81 |
| P/E Trailing | 23.11x |
| P/E Forward | 15.59x |
| Dividend Yield | 1.14% |
| Market Cap | $14.8B |
| Revenue | ~$3.9B |
| EPS | $3.93 |
| 52-Week High | $113.95 |
| 52-Week Low | $77.71 |
| Empleados | ~10,500 |
| Países | 150+ |

## Transformación Pure-Play

Pentair completó una transformación significativa:
- **2018**: Spin-off de nVent Electric (segmento eléctrico)
- **2019-2023**: Venta/simplificación de negocios no-core
- **2023-2024**: Adquisición de Manitowoc Ice, expansión en water solutions
- **Resultado**: Pure-play agua con márgenes en expansión y menor complejidad

## Ventajas Competitivas (Moat)

1. **Aftermarket recurrente**: ~60-70% del revenue viene de reemplazo/servicio — predecible
2. **Regulación como tailwind**: Leyes de eficiencia (bombas variable-speed) y calidad de agua (PFAS) impulsan upgrades
3. **Red de distribución**: Relaciones establecidas con dealers, pool builders y plomeros — difícil de replicar
4. **Portafolio completo**: Cubre toda la cadena del agua: residencial, comercial, industrial, piscinas
5. **Marca en nichos**: Everpure es el estándar en food service, Kreepy Krauly en limpieza de piscinas
6. **Megatendencia secular**: El agua no es opcional — la demanda solo crece

## Dividendo

- **Yield actual**: 1.14%
- **Frecuencia**: Trimestral
- **Años consecutivos de aumento**: 47 — es un **Dividend Aristocrat**
- **Crecimiento dividendo 5 años**: ~5% CAGR
- **Payout ratio**: ~26% — muy sostenible con amplio margen de crecimiento

## Riesgos Principales

1. **Ciclicidad del pool**: Sensible a clima, construcción residencial y tasas de interés
2. **Aranceles y costos**: Materias primas (resinas, metales) y aranceles pueden comprimir márgenes
3. **Competencia china**: Fabricantes de bajo costo en equipos de piscina presionando precios
4. **Concentración en EE.UU.**: ~65% del revenue — limitada diversificación geográfica
5. **Complejidad corporativa**: Incorporada en Irlanda, residencia fiscal UK, operaciones en EE.UU.

## Consenso de Analistas

- **Rating:** Buy
- **Price target promedio:** ~$120
- **Rango targets:** $95 - $135
- **Upside implícito:** ~32%
- **Analistas:** 19-23

## Conclusión

Pentair es la apuesta más pura y accesible a la megatendencia del agua. Con 47 años consecutivos de aumento de dividendo (Dividend Aristocrat), un aftermarket recurrente que genera ~65% del revenue, y vientos de cola regulatorios (PFAS, eficiencia energética, infraestructura), PNR ofrece la combinación rara de crecimiento defensivo + ingreso creciente. A P/E forward de 15.6x cotiza con descuento vs su promedio histórico, y el target de analistas de $120 implica +32% de upside. El riesgo principal es la ciclicidad del segmento de piscinas, pero el aftermarket recurrente y la diversificación hacia water treatment y flow suavizan los ciclos.

---

*Research fecha: 14 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 120.0,
    analyst_upside: 32.2,
    status: "active",
    first_researched_at: "2026-04-14T00:00:00Z",
    last_updated_at: "2026-04-14T00:00:00Z",
    next_review_at: "2026-10-14T00:00:00Z",
  },
  {
    id: 43,
    ticker: "MCD",
    name: "McDonald's Corporation",
    sector: "Consumer Discretionary",
    industry: "Restaurants / Quick-Service",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 306.26,
    pe_ratio: 25.48,
    pe_forward: 23.19,
    dividend_yield: 2.43,
    market_cap_b: 215.45,
    eps: 11.95,
    summary_short:
      "La cadena de restaurantes más grande del mundo con 45,000+ ubicaciones en 100+ países. Modelo de franquicias (95% franquiciado) que genera flujo de caja predecible a través de rentas y regalías. 50 años consecutivos de aumento de dividendo (Dividend Aristocrat).",
    summary_what:
      "McDonald's no es realmente un negocio de hamburguesas — es un negocio de bienes raíces y franquicias. La empresa posee o arrienda la mayoría de los terrenos e inmuebles donde operan sus 45,356 restaurantes, y los sub-arrienda a franquiciatarios. Solo ~5% de los restaurantes son operados directamente por McDonald's. Gana dinero de tres formas: (1) rentas fijas y variables sobre los inmuebles, (2) regalías del ~4% sobre ventas de cada franquiciatario, y (3) ventas directas de los pocos restaurantes propios. Este modelo de 'cobrar renta' es la razón de sus márgenes operativos de ~46% — extraordinarios para la industria de alimentos. Su ventaja competitiva es su escala global incomparable, su poder de negociación con proveedores, y el reconocimiento de marca #1 en fast food.",
    summary_why:
      "McDonald's está en un punto de inflexión digital. Su programa de lealtad MyMcDonald's Rewards ya tiene ~210 millones de usuarios activos (19% más que el año anterior), generando $40B en ventas digitales a nivel global. Los ingresos 2025 crecieron 4% a $26.9B con margen operativo expandido a 46.1%. La empresa abrió 2,276 restaurantes nuevos en 2025 y apunta a 50,000 totales para 2027. Además, está lanzando bebidas energéticas y refrescos artesanales para competir con Starbucks en el segmento de bebidas de alto margen. Free cash flow creció 8% a $7.2B, y la empresa devolvió $7.1B a accionistas entre dividendos y recompras.",
    summary_risk:
      "El riesgo principal es la presión sobre el consumidor de bajos ingresos: el CEO advirtió de una 'economía de dos niveles' donde el tráfico de clientes de menores ingresos ha caído ~10%, y los aranceles están elevando costos de insumos. Si la debilidad del consumidor se extiende a la clase media, los volúmenes podrían caer significativamente. Riesgos adicionales: guerra de precios intensificándose en fast food, inflación salarial presionando márgenes de franquiciatarios, exposición a ~100 países con riesgos geopolíticos variados, y equity negativo por las recompras masivas de acciones que limita flexibilidad financiera en caso de crisis.",
    research_full: `# McDonald's Corporation (MCD) — Research Completo

## Precio: $306.26 | P/E: 25.5 | P/E Forward: 23.2 | Div Yield: 2.43% | Market Cap: $215B

---

## Qué Es

McDonald's es la **cadena de restaurantes más grande del mundo**, con **45,356 ubicaciones en más de 100 países**. Pero definirla como "restaurante de hamburguesas" sería incorrecto — es fundamentalmente un **negocio de bienes raíces y franquicias**. El 95% de sus restaurantes son operados por franquiciatarios que pagan rentas y regalías a McDonald's.

La marca es reconocida por prácticamente cualquier persona en el planeta. Los Golden Arches son uno de los símbolos comerciales más poderosos de la historia.

## Modelo de Negocio

McDonald's gana dinero de **tres fuentes principales**:

| Fuente | Descripción | % Revenue aprox |
|--------|-------------|-----------------|
| **Rentas de franquicias** | Rentas fijas y variables sobre inmuebles que McDonald's posee/arrienda | ~40% |
| **Regalías (royalties)** | ~4% sobre ventas brutas de cada franquiciatario | ~25% |
| **Restaurantes propios** | Ventas directas del ~5% de ubicaciones operadas por la empresa | ~35% |

Lo brillante del modelo: las rentas y regalías son **ingreso de altísimo margen** (no pagan ingredientes, empleados ni operación). Por eso el margen operativo consolidado es de **46.1%** — extraordinario para cualquier industria, y absurdo para el sector de alimentos.

McDonald's también posee o arrienda la mayoría de los terrenos donde operan los restaurantes. Esto le da **doble leverage**: cobra renta Y regalías. Si un franquiciatario falla, McDonald's mantiene el inmueble y pone otro operador.

## Por Qué Ahora

**1. Revolución Digital:**
- MyMcDonald's Rewards: **210 millones de usuarios activos** (+19% YoY)
- Ventas digitales: **$40B** a través de 70 mercados
- Meta: 30% de pedidos de delivery originando en la app para 2027

**2. Expansión Acelerada:**
- 2,276 restaurantes nuevos abiertos en 2025
- Meta: **50,000 restaurantes** para 2027 (faltan ~4,644)

**3. Innovación de Bebidas:**
- Lanzamiento de energy drinks, refrescos artesanales y refreshers
- Probados en 500+ restaurantes en 2025
- Compiten directamente con Starbucks en un segmento de **altísimo margen**

**4. Resultados 2025 Sólidos:**
- Revenue: $26.9B (+4%, +2% en moneda constante)
- Operating income: $12.4B (+6%)
- EPS: $11.95 (+5%)
- FCF: $7.2B (+8%)
- $7.1B devueltos a accionistas

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| Revenue (2025) | $26.9B |
| Net Income (2025) | $8.56B |
| Operating Margin | 46.1% |
| Net Profit Margin | 31.85% |
| Free Cash Flow | $7.2B |
| FCF Yield | ~3.3% |
| Revenue Growth (2025) | +4% |
| EPS Growth (2025) | +5% |
| Dividend/Share | $7.44 anual |
| Dividend Yield | 2.43% |
| Payout Ratio | ~60% |
| Años consecutivos de aumento de dividendo | **50 años** (Dividend Aristocrat) |
| P/E TTM | 25.5x |
| P/E Forward | 23.2x |

**Nota sobre equity negativo:** McDonald's ha recomprado tantas acciones que su shareholders' equity es negativo. Esto NO significa que la empresa esté en problemas — es consecuencia de devolver agresivamente capital a accionistas. El free cash flow de $7.2B demuestra la solidez del negocio.

## Riesgos Principales

1. **Economía de dos niveles:** El tráfico de consumidores de bajos ingresos ha caído ~10%. Si la debilidad se extiende a clase media, los volúmenes se ven afectados.

2. **Guerra de precios en fast food:** Competidores como Burger King, Wendy's y Chick-fil-A están intensificando promociones de valor. Esto puede erosionar márgenes de franquiciatarios.

3. **Inflación salarial:** Aumentos de salario mínimo en múltiples estados/países presionan costos de operación para franquiciatarios.

4. **Exposición geopolítica:** Operar en 100+ países implica riesgo cambiario, regulatorio, y político.

5. **Apalancamiento financiero:** El equity negativo y la deuda elevada limitan flexibilidad en caso de crisis prolongada.

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| # Analistas Buy | 20 |
| # Analistas Hold | 15 |
| # Analistas Sell | 2 |
| Price Target Promedio | **$342** |
| Price Target Alto | $407 |
| Price Target Bajo | $260 |
| **Upside al Target** | **+11.7%** |

---

*Research fecha: 15 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 342.0,
    analyst_upside: 11.7,
    status: "active",
    first_researched_at: "2026-04-15T00:00:00Z",
    last_updated_at: "2026-04-15T00:00:00Z",
    next_review_at: "2026-10-15T00:00:00Z",
  },
  {
    id: 44,
    ticker: "WFAFY",
    name: "Wesfarmers Ltd",
    sector: "Consumer Discretionary",
    industry: "Diversified Retail / Conglomerate",
    country: "Australia",
    region: "Asia-Pacific",
    currency: "USD",
    price: 26.73,
    pe_ratio: 31.9,
    pe_forward: 33.1,
    dividend_yield: 3.5,
    market_cap_b: 60.8,
    eps: 0.84,
    summary_short:
      "El conglomerado más grande de Australia. Dueño de Bunnings (el 'Home Depot' australiano), Kmart, Officeworks, Priceline farmacias, y una división de litio en crecimiento. Revenue de A$45.7B, profit subió 14.4% en 2025. 39 años pagando dividendos.",
    summary_what:
      "Wesfarmers es el conglomerado diversificado más grande de Australia, fundado en 1914. Opera un imperio retail que incluye Bunnings (ferretería y hogar, el 'Home Depot' australiano con A$23.4B en ventas), Kmart Group (ropa y hogar, A$10.5B), Officeworks (oficina y tecnología, A$3.6B), y Wesfarmers Health/Priceline (farmacia y belleza, A$3.3B). Fuera del retail, tiene WesCEF — una división de químicos, energía, fertilizantes y litio (A$3.0B) que opera el proyecto Mt Holland, una mina de litio en joint venture con SQM que ya produce espodumeno y está arrancando una refinería de hidróxido de litio. También tiene Industrial & Safety (Blackwoods, A$2.0B) y OneDigital, una plataforma de datos con 12.5 millones de perfiles de consumidores. El 85%+ de sus ingresos viene de retail.",
    summary_why:
      "Wesfarmers acaba de reportar resultados sólidos en H1 2026: revenue de A$24.2B (+3.1%) y NPAT de A$1.6B (+9.3%), liderado por Bunnings y Kmart. El catalizador de largo plazo es la división de litio — Mt Holland ya produce 98,000 toneladas de concentrado y la refinería de Kwinana arrancó en julio 2025, posicionando a Wesfarmers como productor integrado de litio justo cuando la demanda de baterías EV crece. FY2025 completo mostró revenue de A$45.7B (+3.4%), NPAT de A$2.9B (+14.4%) y EBIT de A$4.5B (+11.9%). La plataforma OneDigital con 12.5M de perfiles crea ventaja competitiva en retail analytics. Dividendo subió a A$3.56 (+80%) con yield del 3.5%. ROE del 33% demuestra uso eficiente del capital.",
    summary_risk:
      "El riesgo principal es la valuación elevada: P/E forward de 33x es caro para un conglomerado retail, lo que limita el upside y amplifica las caídas si los resultados decepcionan. Riesgos adicionales: la economía australiana bajo presión por inflación persistente y costos de vida elevados reduce el gasto del consumidor; competencia creciente de Amazon (~12% del e-commerce australiano) y Temu (~4%) presiona precios; la refinería de litio en Kwinana tiene retrasos por problemas técnicos; y la concentración geográfica en Australia/NZ limita la diversificación.",
    research_full: `# Wesfarmers Ltd (WFAFY) — Research Completo

## Precio ADR: $26.73 | P/E: 31.9 | P/E Forward: 33.1 | Div Yield: 3.5% | Market Cap: $60.8B

---

## Qué Es

Wesfarmers Limited es el **conglomerado más grande de Australia**, fundado en 1914 como cooperativa de granjeros en Western Australia. Hoy opera un imperio diversificado que abarca retail, químicos, litio, salud, y servicios industriales, con **A$45.7 billones en revenue** y más de **120,000 empleados**.

Cotiza como WES.AX en la bolsa de Sydney (ASX) y como WFAFY en OTC Markets de EE.UU. (1 ADR = 0.5 acciones ordinarias).

## Modelo de Negocio

| División | Revenue FY2025 | % del Total | Descripción |
|----------|----------------|-------------|-------------|
| **Bunnings** | A$23.4B | ~51% | Ferretería y hogar — el "Home Depot" de Australia y NZ. 390+ tiendas. |
| **Kmart Group** | A$10.5B | ~23% | Kmart + Target — ropa, hogar, juguetes. Marca propia Anko. |
| **Officeworks** | A$3.6B | ~8% | Artículos de oficina, tecnología, impresión. 170+ tiendas. |
| **Wesfarmers Health** | A$3.3B | ~7% | Priceline Pharmacy (490+ farmacias), InstantScripts (telehealth). |
| **WesCEF** | A$3.0B | ~7% | Químicos, fertilizantes, gas natural, y **litio** (Mt Holland). |
| **Industrial & Safety** | A$2.0B | ~4% | Blackwoods, Workwear Group — suministros industriales. |

## Por Qué Ahora

**1. Litio en rampa:**
- La mina Mt Holland (JV 50/50 con SQM) produjo 98,000 toneladas de espodumeno en H1 2026
- La refinería de Kwinana ya produce hidróxido de litio desde julio 2025
- Wesfarmers será un productor integrado de litio cuando complete el ramp-up

**2. H1 2026 sólido:**
- Revenue A$24.2B (+3.1%), NPAT A$1.6B (+9.3%)
- Bunnings creció en todas las categorías
- Kmart subió 3.3%, WesCEF mejoró por litio

**3. FY2025 record:**
- Revenue A$45.7B, NPAT A$2.9B (+14.4%), EBIT A$4.5B (+11.9%)

**4. OneDigital:**
- Plataforma de datos cross-divisional con 12.5M de perfiles únicos
- Construyendo una red de retail media — otro flujo de ingresos de alto margen

## Métricas Financieras

| Métrica | Valor (FY2025) |
|---------|-------|
| Revenue | A$45.7B (~US$32.6B) |
| Revenue Growth | +3.4% YoY |
| EBIT | A$4,465M (+11.9% YoY) |
| EBIT Margin | 9.8% |
| NPAT | A$2,926M (+14.4% YoY) |
| Net Margin | 6.4% |
| ROE | 33% |
| Free Cash Flow | A$3.4B (~US$2.4B) |
| Dividend FY2025 | A$3.56/acción (+80%) |
| Dividend Yield | 3.5% |
| P/E TTM | 31.9x |
| P/E Forward | 33.1x |
| Market Cap | A$85B (~US$60.8B) |

## Riesgos Principales

1. **Valuación alta** — P/E forward de 33x es premium para un conglomerado retail.

2. **Economía australiana** — CPI del 3.6%, costos de vida altos. El consumidor australiano está apretado.

3. **Competencia digital** — Amazon (~12% del e-commerce australiano), Temu (~4%) presionan precios.

4. **Riesgos del litio** — La refinería de Kwinana tiene retrasos técnicos. Precios del litio volátiles.

5. **Concentración geográfica** — 95%+ del revenue viene de Australia/NZ.

## Consenso de Analistas (WES.AX)

| Métrica | Valor |
|---------|-------|
| Consenso | **Hold** |
| # Analistas Buy | 2 |
| # Analistas Hold | 5 |
| # Analistas Sell | 6 |
| Target Promedio (WES.AX) | **A$81.24** |
| Target WFAFY (USD) | **~$29.00** |
| **Upside al Target** | **+8.5%** |

Nota: 1 WFAFY ADR = 0.5 acciones WES.AX. Conversión AUD/USD ~0.714.

---

*Research fecha: 15 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Hold",
    analyst_target: 29.0,
    analyst_upside: 8.5,
    status: "active",
    first_researched_at: "2026-04-15T00:00:00Z",
    last_updated_at: "2026-04-15T00:00:00Z",
    next_review_at: "2026-10-15T00:00:00Z",
  },
  {
    id: 45,
    ticker: "ESLOY",
    name: "EssilorLuxottica",
    sector: "Consumer Discretionary",
    industry: "Eyewear / Luxury Goods",
    country: "France",
    region: "Europe",
    currency: "USD",
    price: 122.75,
    pe_ratio: 41.89,
    pe_forward: 25.56,
    dividend_yield: 1.87,
    market_cap_b: 112.9,
    eps: 2.93,
    summary_short:
      "El monopolio global de los lentes. Dueños de Ray-Ban, Oakley, Persol, LensCrafters y Sunglass Hut — controlan ~60% del mercado de eyewear en EE.UU. Además fabrican las Ray-Ban Meta, los smart glasses con AI más vendidos del mundo (7M unidades en 2025).",
    summary_what:
      "EssilorLuxottica es el gigante franco-italiano que domina TODA la cadena de valor del eyewear. Fabrican los lentes (Essilor: Varilux, Transitions, Crizal, Kodak Lens), diseñan y producen las monturas (Luxottica: Ray-Ban, Oakley, Persol, Oliver Peoples, Vogue Eyewear, Arnette, Costa Del Mar, Alain Mikli), tienen licencias exclusivas de marcas de lujo (Prada, Chanel, Tiffany, Versace, Burberry, Dolce & Gabbana, Michael Kors, Coach, Ralph Lauren, Giorgio Armani) y son dueños de las tiendas donde los compras (LensCrafters, Sunglass Hut, Pearle Vision, Target Optical, Apex). También son dueños de EyeMed, la aseguradora de vista #2 en EE.UU., cerrando el ciclo: te aseguran, te examinan, te venden la montura, te fabrican los lentes, te los entregan. Vertical integration total. El gran motor nuevo de crecimiento son las Ray-Ban Meta — los smart glasses con AI que desarrollan con Meta. Vendieron 7 millones de unidades en 2025 (vs 2M acumuladas 2023+2024). En 2026 lanzan versiones Oakley y Prada ampliando la apuesta.",
    summary_why:
      "FY2025 fue récord: revenue €28.5B (+11.2% YoY, primer double-digit growth en la historia de la empresa a tipo de cambio constante), Q4 acelerando a +18.4%, operating margin ajustado 16.0%, free cash flow récord de €2.8B a pesar de tarifas y divisa. Las Ray-Ban Meta son el 'dominant driver' del crecimiento wholesale — y el mercado de smart glasses se proyecta de 6M unidades en 2025 a 20M en 2026 (valor de $1.2B a $5.6B). La acción cayó del 52w high $186.81 a $122.75 (-34%) por miedo a competencia de Apple (smart glasses de Apple no llegan hasta 2027) y tarifas de Trump — headwinds temporales en un negocio con casi-monopolio estructural. Consenso de analistas: 19-22 Buy / 1-2 Hold / 0-1 Sell, con targets que implican upside significativo. Eyewear no es moda — es un gasto recurrente no-discrecional: 2.5B personas en el mundo usan lentes correctivos, y reemplazan lentes cada 2-3 años. Demanda estable, pricing power brutal, y ahora una patada de crecimiento vía AI wearables.",
    summary_risk:
      "La competencia de Apple en smart glasses (producción prevista diciembre 2026, lanzamiento 2027) amenaza la ventaja actual de Ray-Ban Meta — fue el detonante principal de la caída del 34% desde máximos. Si Apple captura share con un producto 'mejor hecho' (según filtraciones de Bloomberg), EssilorLuxottica pierde el premium que hoy tiene su mejor historia de crecimiento. Otros riesgos: tarifas de Trump de hasta 20% sobre imports europeos y 36% sobre Tailandia golpean márgenes en EE.UU. (40% del revenue); una class action fue presentada en febrero 2026 por subidas de precio post-tarifas; Warby Parker y DTC erosionan share en óptica entry-level. La valuación de P/E TTM 41.89x deja poco margen si earnings decepcionan.",
    research_full: `# EssilorLuxottica (ESLOY) — Research Completo

## Precio: $122.75 | P/E: 41.89 | P/E Forward: 25.56 | Div Yield: 1.87% | Market Cap: $112.9B

*Nota: ESLOY es el ADR OTC. La acción primaria cotiza en Euronext Paris como EL.PA (1 ESLOY ≈ 0.25 EL.PA).*

---

## Qué Es

EssilorLuxottica es el **monopolio global del eyewear** — el resultado de la fusión en 2018 entre Essilor (lentes franceses, #1 mundial en ophthalmic lenses) y Luxottica (monturas italianas, #1 mundial en frames). El grupo controla **~60% del mercado de eyewear en EE.UU.** y tiene una cuota comparable globalmente. En lentes correctivos específicamente, 42% de market share mundial.

No es una empresa de lentes. Es un ecosistema vertical completo: diseñan, fabrican, licencian, distribuyen, venden al menudeo y aseguran. Si tienes lentes en tu cara, probablemente salieron de alguna parte de esta compañía.

## Modelo de Negocio — Vertical Integration Total

### Marcas Propias (Luxottica)
| Marca | Segmento |
|-------|----------|
| **Ray-Ban** | Icónica, mass-premium, smart glasses |
| **Oakley** | Deporte, performance, nueva línea Meta AI |
| **Persol** | Premium italiano, hecho a mano |
| **Oliver Peoples** | Luxury Californiano |
| **Vogue Eyewear** | Fashion femenino accesible |
| **Arnette** | Juvenil, action sports |
| **Costa Del Mar** | Pesca, outdoor premium |
| **Alain Mikli** | Haute couture |

### Licencias de Lujo
Licencias exclusivas con **Prada, Chanel, Tiffany, Versace, Burberry, Dolce & Gabbana, Michael Kors, Coach, Ralph Lauren, Giorgio Armani, Brunello Cucinelli, Miu Miu, Tory Burch** y más. La renovación con Prada en diciembre 2025 fue por 10 años.

### Lentes (Essilor)
| Marca | Especialidad |
|-------|--------------|
| **Varilux** | Progresivos #1 mundial |
| **Transitions** | Fotocromáticos (adaptan al sol) |
| **Crizal** | Anti-reflejo premium |
| **Kodak Lens** | Marca masiva licenciada |

### Retail Propio
| Cadena | Alcance |
|--------|---------|
| **LensCrafters** | ~1,300 tiendas en EE.UU. |
| **Sunglass Hut** | ~2,700 tiendas globales |
| **Pearle Vision** | ~500 tiendas EE.UU. |
| **Target Optical** | Within-Target |
| **Apex by Sunglass Hut** | Premium sunglasses |
| **Ray-Ban Stores** | Flagship stores globales |

### Seguros
**EyeMed** — segunda aseguradora de visión más grande en EE.UU. Cierra el loop: te asegura, te examina, te vende la montura, te fabrica los lentes, cobra seguro.

## El Catalizador: Ray-Ban Meta (Smart Glasses)

Partnership con **Meta Platforms** — renovado y ampliado en 2024 por $5B y 10 años adicionales.

### Números Impresionantes
- **7 millones de unidades vendidas en 2025** (Ray-Ban Meta + Oakley Meta)
- vs 2 millones acumuladas en 2023+2024 → **+250% YoY**
- Descrito por la empresa como "el driver dominante" del crecimiento wholesale

### Mercado en Explosión
- 2025: 6M unidades / $1.2B mercado
- 2026 proyectado: **20M unidades / $5.6B mercado**
- EssilorLuxottica + Meta tienen la delantera técnica y de distribución

### Expansión 2026
- **Oakley Meta HSTN** — versión deportiva, ~$360, resistente a clima (ya lanzada)
- **Prada Meta** — primera marca fashion de lujo en smart glasses (filtrada 2026)
- Próximas generaciones con display integrado (rumor Bloomberg 2026)

## Resultados FY2025 — Récord Histórico

| Métrica | Valor | vs 2024 |
|---------|-------|---------|
| **Revenue** | €28,491M | **+11.2%** (constant FX) |
| **Q4 Revenue growth** | +18.4% | Aceleración |
| **Adj. Operating Margin** | 16.0% | — |
| **Adj. Operating Profit** | €4.5B | Récord |
| **Free Cash Flow** | €2.796B | Récord histórico |
| **Net Income** | ~€2.4B | — |

> **Primer año en la historia de EssilorLuxottica con double-digit growth anual** a tipo de cambio constante.

## Por Qué Ahora

### 1. La Caída es un Regalo
- 52w High: **$186.81**
- Precio actual: **$122.75** → **-34% desde máximos**
- Razón de la caída: miedo a Apple smart glasses + tarifas Trump + rotación fuera de luxury europeo
- **Apple no lanza hasta 2027** — EssilorLuxottica tiene 18+ meses de ventaja

### 2. Monopolio Real con Pricing Power
- 60% share EE.UU., 42% global en lentes correctivos
- Pueden pasar tarifas al consumidor sin perder clientes
- 2.5B personas en el mundo usan lentes — demanda no-discrecional

### 3. Ray-Ban Meta es un Negocio Nuevo
- Margen alto, crecimiento triple-dígito
- Meta paga R&D; EssilorLuxottica pone distribución y marca
- Oakley y Prada extensions multiplican el TAM en 2026

### 4. Guidance 2026 Sólido
- Revenue: **€27-28B**
- Operating margin: **19-20%** (mejora desde 16% en 2025)
- Mid-single-digit growth confirmado a pesar de tarifas

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| **Precio ADR (ESLOY)** | $122.75 |
| **Market Cap** | $112.9B |
| **P/E TTM** | 41.89x |
| **P/E Forward** | 25.56x |
| **EPS TTM** | $2.93 |
| **Dividend Yield** | 1.87% |
| **Dividend Rate** | $2.25 |
| **52w High** | $186.81 |
| **52w Low** | $109.00 |
| **Drawdown desde high** | -34% |

## Consenso de Analistas

| Métrica | Valor |
|---------|-------|
| Consenso | **Buy** |
| Analistas Buy | 19-22 |
| Analistas Hold | 1-2 |
| Analistas Sell | 0-1 |
| Target promedio (EL.PA) | €318-326 |
| Target ADR estimado | **~$165** |
| **Upside ADR desde $122.75** | **+34.4%** |

## Riesgos

### 1. Apple Smart Glasses (el big bear case)
- Producción dic 2026, lanzamiento spring/summer 2027
- Pricing rumoreado: $499-$799 (premium vs Ray-Ban Meta)
- Filtración Bloomberg: "similar al producto Meta pero mejor construido"

### 2. Tarifas Trump
- Hasta 20% sobre imports europeos, 36% Tailandia, 145% China
- Class action Feb 2026 por subidas de precio post-tarifas
- Mitigación: considerando mover producción parcial a EE.UU.

### 3. Warby Parker & DTC Erosión
- Warby Parker ha ganado share en rangos entry-level
- Amenaza más al segmento mass que al premium

### 4. Valuación Premium
- P/E TTM 41.89x deja poco margen de error

### 5. Divisa EUR/USD
- Empresa reporta en EUR; ADR en USD

## Conclusión

ESLOY a $122.75 es una oportunidad de comprar el monopolio global del eyewear con 34% de descuento desde máximos, justo cuando:
1. Acaban de reportar su mejor año en la historia (+11.2% revenue)
2. Tienen la categoría más caliente de hardware nuevo (Ray-Ban Meta, 7M unidades vendidas)
3. El mercado los castiga por miedos de 2027 (Apple) — 18+ meses de ventaja estructural
4. Dividendo 1.87% + pricing power para mitigar tarifas
5. Consenso analyst Buy con upside ~34% al target

El negocio aburrido (lentes correctivos para 2.5B personas) ancla la tesis defensiva. El negocio emocionante (smart glasses con AI) da el upside.

---

*Research fecha: 15 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 165.0,
    analyst_upside: 34.4,
    status: "active",
    first_researched_at: "2026-04-15T00:00:00Z",
    last_updated_at: "2026-04-15T00:00:00Z",
    next_review_at: "2026-10-15T00:00:00Z",
  },
  {
    id: 46,
    ticker: "CEG",
    name: "Constellation Energy Corporation",
    sector: "Utilities",
    industry: "Electric Power Generation / Nuclear",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 295.49,
    pe_ratio: 39.99,
    pe_forward: 21.51,
    dividend_yield: 0.57,
    market_cap_b: 107.05,
    eps: 7.39,
    summary_short:
      "La mayor productora de electricidad de EE.UU. tras comprar Calpine en enero 2026 — 55 GW, ~10% de toda la electricidad sin carbono del país. Firmó con Microsoft un contrato de 20 años para restart de Three Mile Island dedicado a entrenar AI. La acción cayó 28% desde máximos por retrasos en ese restart.",
    summary_what:
      "Constellation Energy es la utility #1 de EE.UU. medida por generación eléctrica. Opera la flota nuclear más grande del país (~22 GW — Byron, Braidwood, Clinton, Dresden, LaSalle, Limerick, Peach Bottom, Quad Cities, Salem, Nine Mile Point, FitzPatrick, Ginna y el reactor Unit 1 de Three Mile Island rebautizado como Crane Clean Energy Center). Tras la adquisición de Calpine (cerrada el 7 de enero de 2026) suma 33 GW adicionales de gas natural, eólica, solar e hidráulica — total combinado 55 GW, suficiente para ~27 millones de hogares. También venden electricidad al menudeo a hogares y empresas bajo la marca Constellation. El gran catalizador es el contrato con Microsoft firmado en septiembre 2024: una PPA de 20 años por TODA la producción del reactor Unit 1 de TMI (835 MW), dedicada a alimentar data centers de AI — el primer acuerdo de su tipo en la historia. El restart tiene $1B de garantía de préstamo del DOE.",
    summary_why:
      "FY2026 guidance: EPS ajustado $11–$12 (midpoint +55% vs 2025), apenas debajo del consenso de analistas de $11.60. El mercado castigó la acción un 28% desde el máximo de $412.70 por: (1) retraso del restart de TMI-Crane — técnicamente listo en 2027 pero con bottlenecks de transmisión de PJM que podrían empujar la conexión a la red hasta 2031; (2) la valuación al momento de firmar Calpine. Pero la tesis estructural no cambia: CEG es el único proveedor de EE.UU. con nuclear + gas peakers + renovables a esta escala — exactamente la combinación que necesitan los data centers de AI (baseload limpio 24/7, que solar y viento no pueden dar). Microsoft ya firmó 20 años, Amazon y Meta firmaron con otros operadores nucleares siguiendo el mismo patrón. El IRA tiene un Production Tax Credit para nuclear que pone piso al revenue. La acción a $295.49 te deja comprar la utility #1 de EE.UU. con 28% de descuento y exposición directa al gasto de AI capex.",
    summary_risk:
      "El retraso del restart de Three Mile Island (Crane Clean Energy Center) hasta 2031 por cuellos de botella en la transmisión de PJM decepcionó al mercado — fue el detonante de la caída del 28% desde máximos. Otros riesgos: guidance 2026 de $11–$12 EPS apenas debajo del consenso de $11.60; integración de Calpine (compra de $16.4B cerrada hace 3 meses) todavía en curso; valuación P/E forward 21.5x es rica para una utility tradicional aunque baja si la apuestas a AI se materializa; riesgo político del Production Tax Credit nuclear en el IRA bajo nuevo Congreso; precios del gas natural pueden comprimir márgenes del fleet de Calpine; sensibilidad a tasas de interés como toda utility intensiva en capital.",
    research_full: `# Constellation Energy Corporation (CEG) — Research Completo

## Precio: $295.49 | P/E TTM: 40.0 | P/E Forward: 21.5 | Div Yield: 0.57% | Market Cap: $107B

---

## Qué Es

Constellation Energy es la **productora #1 de electricidad de Estados Unidos** desde que cerró la compra de Calpine el **7 de enero de 2026** por $16.4B. Opera 55 GW de capacidad combinada — **~10% de toda la electricidad sin carbono del país**, suficiente para alimentar aproximadamente 27 millones de hogares.

Fue spin-off de Exelon en febrero de 2022 (CEG se llevó la generación; Exelon se quedó con la distribución regulada). HQ en Baltimore, Maryland.

## Mix de Generación Post-Calpine

| Fuente | Capacidad | % del fleet |
|--------|-----------|-------------|
| **Nuclear** | ~22 GW | 40% |
| **Gas Natural** (ex-Calpine) | ~27 GW | 49% |
| **Eólica / Solar / Hidro** | ~6 GW | 11% |

## Flota Nuclear — la mayor de EE.UU.

Opera 13 sitios nucleares con 21 reactores. Los principales:

- **Crane Clean Energy Center** (ex-Three Mile Island Unit 1) — 835 MW, restart en proceso, PPA 20 años con **Microsoft**
- Byron, Braidwood, Clinton (Illinois)
- Dresden, LaSalle, Quad Cities (Illinois)
- Peach Bottom, Limerick (Pennsylvania)
- Nine Mile Point, FitzPatrick, Ginna (New York)
- Salem, Hope Creek (New Jersey — joint ownership)

## El Catalizador: Microsoft + AI

En septiembre 2024, Constellation firmó con Microsoft una **PPA (Power Purchase Agreement) de 20 años** por toda la producción del reactor Unit 1 de Three Mile Island (ahora Crane Clean Energy Center). Primera vez en la historia que una hyperscaler firma un contrato de este tamaño para reactivar un reactor nuclear retirado.

### Por Qué Importa
Los data centers de AI necesitan **baseload limpio 24/7**. Solar + viento no sirven porque son intermitentes. Nuclear es la única fuente que:
1. No emite CO2 (objetivos net-zero de Microsoft para 2030)
2. Produce energía constante día y noche
3. Tiene factor de capacidad >90% (vs 25% solar, 35% eólico)

### El Patrón se Expande
- **Amazon** compró un data center junto a la planta nuclear Susquehanna (Talen Energy) por $650M
- **Meta** firmó con Constellation en junio 2025 una extensión de 20 años para el reactor Clinton de Illinois
- **Google** está en negociaciones avanzadas con varios operadores

CEG es el líder obvio de este tema por tamaño de fleet nuclear.

## Resultados FY2025 y Guidance 2026

| Métrica | FY2025 | FY2026 guidance |
|---------|--------|-----------------|
| **Adjusted EPS** | ~$7.39 | **$11.00 – $12.00** |
| **Midpoint growth** | — | **+55%** YoY |
| **Consenso analistas** | — | $11.60 |
| **Free Cash Flow** | ~$2.5B | Creciente |

Guidance midpoint (\$11.50) quedó marginalmente debajo del consenso (\$11.60) — una de las razones del sell-off reciente.

## Calpine Acquisition — Closed Jan 7, 2026

- **Precio**: $16.4B (cash + stock)
- **Aporta**: 33 GW de gas natural + renovables
- **Ubicación**: Texas, California, Mid-Atlantic
- **Lógica estratégica**: gas peakers complementan nuclear baseload — necesario para equilibrar picos de demanda de data centers
- **Integración**: en curso durante 2026

## Por Qué Ahora

### 1. La Caída es Técnica, no Estructural
- 52w High: **$412.70**
- Precio actual: **$295.49** → **-28% desde máximos**
- Razón de la caída:
  - Retraso de restart TMI-Crane a ~2031 por bottlenecks de transmisión PJM
  - Guidance 2026 marginalmente debajo de consenso
  - Digestión de la adquisición de Calpine
- **La tesis de AI + nuclear sigue intacta** — Microsoft no canceló el contrato, solo se empuja la fecha de entrega

### 2. Posición Estructural Irrepetible
- 22 GW de nuclear ya operando (imposible construir nuevo en <10 años)
- 55 GW totales post-Calpine = #1 del país
- Mix único: nuclear + gas peakers + renovables = exactamente lo que los data centers necesitan

### 3. Demanda de AI es Real y Creciente
- Gasto global en data centers proyectado: $500B+ en 2026
- Hyperscalers (MSFT, GOOGL, AMZN, META) están firmando contratos nucleares de 20 años
- EE.UU. tiene déficit estructural de baseload limpio

### 4. Piso del DOE y el IRA
- $1B de garantía de préstamo del DOE para el restart de Crane
- Production Tax Credit nuclear del Inflation Reduction Act pone piso al revenue

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| **Precio** | $295.49 |
| **Market Cap** | $107.05B |
| **P/E TTM** | 39.99x |
| **P/E Forward** | 21.51x |
| **EPS TTM** | $7.39 |
| **EPS Forward** | $13.74 |
| **Dividend Yield** | 0.57% |
| **Dividend Rate** | $1.551 |
| **52w High** | $412.70 |
| **52w Low** | $188.00 |
| **Drawdown desde high** | -28% |
| **Shares Outstanding** | 362M |

## Riesgos

### 1. Retraso de TMI-Crane hasta 2031
Bottlenecks de transmisión en PJM pueden empujar la fecha de conexión a la red del reactor. Microsoft sigue firmado, pero el flujo de ingresos se retrasa.

### 2. Integración de Calpine
Adquisición de $16.4B cerrada hace 3 meses. Sinergias prometidas todavía por materializarse.

### 3. Valuación
P/E forward 21.5x es alto para una utility tradicional. Solo se justifica si la historia de AI se materializa.

### 4. Riesgo Político del PTC Nuclear
El Production Tax Credit para nuclear del IRA es revisable. Un Congreso que lo elimine o reduzca golpea el floor de revenue.

### 5. Precios del Gas Natural
El fleet de Calpine es principalmente gas. Volatilidad en gas afecta márgenes.

### 6. Tasas de Interés
Utility intensiva en capital — sensible a subidas de tasas. Deuda neta significativa post-Calpine.

## Conclusión

CEG a $295.49 te permite comprar la utility #1 de EE.UU. con 28% de descuento desde máximos, cuando:
1. Acaban de convertirse en la mayor productora de electricidad del país (55 GW post-Calpine)
2. Tienen el contrato nuclear más comentado de la historia con Microsoft (PPA 20 años)
3. La caída es por timing (TMI restart retrasado a 2031) no por tesis rota
4. El mix nuclear + gas + renovables es exactamente lo que los data centers de AI necesitan
5. $1B de garantía del DOE + PTC nuclear = piso estructural de revenue

El negocio aburrido (electricidad para 27M de hogares) ancla. El negocio emocionante (combustible para la era de AI) da el upside.

---

*Research fecha: 17 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 380.0,
    analyst_upside: 28.6,
    status: "active",
    first_researched_at: "2026-04-17T00:00:00Z",
    last_updated_at: "2026-04-17T00:00:00Z",
    next_review_at: "2026-10-17T00:00:00Z",
  },
  {
    id: 47,
    ticker: "CNI",
    name: "Canadian National Railway Company",
    sector: "Industrials",
    industry: "Railroads",
    country: "Canada",
    region: "North America",
    currency: "USD",
    price: 110.26,
    pe_ratio: 20.01,
    pe_forward: 17.33,
    dividend_yield: 2.38,
    market_cap_b: 67.5,
    eps: 5.51,
    summary_short:
      "El único ferrocarril de Norteamérica que conecta los 3 océanos — Atlántico, Pacífico y Golfo de México. 19,500 millas de vía mueven granos, potasa, petróleo, autos y contenedores. Dividend aristocrat canadiense con 29 años subiendo dividendo. A 2.5% del máximo de 52 semanas — el mercado reconoce la calidad.",
    summary_what:
      "Canadian National Railway opera la red ferroviaria más integrada de Norteamérica: desde Halifax y Montréal en el Atlántico, pasando por Chicago y Memphis en el Midwest, hasta Vancouver y Prince Rupert en el Pacífico, y con acceso directo al Golfo de México vía New Orleans y Mobile. ~19,500 millas de vía, mueve más de 300 millones de toneladas al año. Mix de volumen: intermodal/contenedores (25%), granos y fertilizantes (19%), productos forestales (13%), petroquímicos (13%), metales y minerales (12%), autos (6%), carbón (5%), otros (7%). Principales clientes: Cargill, Suncor, Ford, Toyota, Nutrien, ExxonMobil, productores de potasa de Saskatchewan. Oligopolio ferroviario regulado en Canadá por la Canadian Transportation Agency y en EE.UU. por la Surface Transportation Board — las barreras de entrada son infranqueables (permisos ambientales, acuerdos con pueblos indígenas, zonificación). HQ en Montreal, Quebec. CEO Tracy Robinson desde 2022.",
    summary_why:
      "CNI a $110.26 está a solo 2.5% del máximo de 52 semanas ($113.09) — eso NO es un descuento, es una validación. El mercado reconoce un turnaround operacional: Tracy Robinson ha estabilizado el operating ratio después del descalabro regulatorio con la fallida compra de KCS por CP Rail, Q4 2025 mostró volumen creciendo en grano + intermodal, y el guidance 2026 apunta a expansión de márgenes. La pieza estructural: el corredor Pacífico vía Prince Rupert crece en importancia para exportaciones a Asia (LNG Canada enviando desde Kitimat, potasa de Saskatchewan, granos canadienses). Dividend aristocrat — ha subido dividendo 29 años consecutivos, yield actual 2.38% con payout ratio sostenible. P/E forward 17.3x está en línea con el historical average del sector ferroviario. El moat es de los más duraderos en equity — Buffett tiene BNSF por la misma razón: no puedes construir nuevas vías transcontinentales hoy. CN es el único ferrocarril Clase I con acceso a los 3 océanos, y ese moat solo se profundiza con el tiempo.",
    summary_risk:
      "El riesgo principal es la exposición cíclica a commodities canadienses — una recesión en precios de granos, potasa o productos forestales comprime volúmenes y márgenes. Otros riesgos: disrupciones operacionales recurrentes (incendios forestales en British Columbia, huelgas del sindicato Teamsters Canada Rail como la de agosto 2024, descarrilamientos); sensibilidad a precios del petróleo (crude-by-rail solo es económico cuando el diferencial WCS-WTI es amplio); competencia de trucking intermodal (especialmente en rutas cortas); riesgo de tipo de cambio CAD/USD para inversores en dólares; regulación emergente sobre emisiones y seguridad ferroviaria post-East Palestine (2023); aranceles Canadá-EE.UU. bajo la revisión del USMCA en 2026 podrían reducir volúmenes transfronterizos.",
    research_full: `# Canadian National Railway (CNI) — Research Completo

## Precio: $110.26 | P/E TTM: 20.0 | P/E Forward: 17.3 | Div Yield: 2.38% | Market Cap: $67.5B

---

## Qué Es

Canadian National Railway es el **único ferrocarril Clase I de Norteamérica que conecta los 3 océanos** — Atlántico, Pacífico y Golfo de México. HQ en Montreal, Quebec. Opera ~19,500 millas de vía atravesando 8 provincias canadienses y 16 estados estadounidenses. Mueve más de 300 millones de toneladas al año.

Fue privatizada en 1995 (IPO en Toronto + NYSE). Desde entonces ha sido una de las máquinas de compounding más consistentes del mercado canadiense.

## Red de 3 Océanos

| Costa | Puertos principales |
|-------|---------------------|
| **Atlántico** | Halifax (Nova Scotia), Montreal |
| **Pacífico** | Vancouver, Prince Rupert (British Columbia) |
| **Golfo de México** | New Orleans, Mobile |

Prince Rupert es estratégico: es el puerto de aguas profundas más cercano a Asia en Norteamérica (2-3 días más rápido que Los Ángeles). Para exportaciones canadienses a China, Japón y Corea del Sur, el corredor CN-Prince Rupert es la ruta óptima.

## Mix de Carga (2025)

| Segmento | % del revenue |
|----------|---------------|
| **Intermodal (contenedores)** | 25% |
| **Granos y fertilizantes** | 19% |
| **Productos forestales** | 13% |
| **Petróleo y químicos** | 13% |
| **Metales y minerales** | 12% |
| **Autos** | 6% |
| **Carbón** | 5% |
| **Otros** | 7% |

## Tesis: Moat Geográfico Irrepetible

### Por Qué No Se Puede Construir un Nuevo Ferrocarril
1. **Permisos ambientales** — décadas para aprobar una nueva vía transcontinental
2. **Pueblos indígenas (First Nations)** — derecho de consulta obligatorio, negociaciones largas
3. **Zonificación** — las vías actuales fueron trazadas cuando los centros urbanos eran pequeños; hoy pasan por medio de ciudades
4. **Costo de capital** — trillones de dólares en 2026 para replicar la red

Resultado: CN, CP (Canadian Pacific), UP (Union Pacific), BNSF y NS (Norfolk Southern) operan en un **oligopolio de 5 jugadores** con poder de precio estructural.

### Warren Buffett Tiene BNSF por esta Razón
Berkshire compró BNSF en 2010 por $44B (la compra más grande de Buffett en ese momento). La lógica: ferrocarril = activo monopolístico regional + bajo capex de mantenimiento + flujos de efectivo predecibles + imposible de disruptar. CN es el equivalente canadiense.

## Turnaround Operacional con Tracy Robinson (CEO desde 2022)

### Operating Ratio Estabilizado
- OR 2022: 61.8% (antes de Robinson)
- OR 2023: 59.4%
- OR 2024: 58.1%
- OR Q4 2025: 57.2%

Cada punto de OR ≈ $150M de operating income adicional.

### Volumen Creciendo
- Intermodal: +8% YoY (Q4 2025)
- Grano: +6% YoY
- Autos: +12% YoY (cruce Ontario ↔ México / EE.UU.)

### Guidance 2026
- EPS growth: +7% a +9% YoY
- Free cash flow: $4.5B+ (vs $4.1B en 2025)
- Dividend increase: +5% anunciado para Q1 2026 (año #30 consecutivo)

## Dividend Aristocrat

| Año | Dividendo anual (USD) |
|-----|------------------------|
| 1996 | $0.12 |
| 2006 | $0.53 |
| 2016 | $1.22 |
| 2026 (proyectado) | $2.63 |

**29 años consecutivos subiendo dividendo.** Solo 3 empresas canadienses tienen ese récord.

## Por Qué Ahora

### 1. El Precio Cerca de 52w High es Señal, no Problema
- 52w Low: $90.74
- 52w High: $113.09
- Actual: $110.26 (-2.5% del high)

El mercado está validando el turnaround. Los compradores de calidad entran en momentum positivo, no esperan "el bottom".

### 2. Exposición Estructural a Asia
- LNG Canada (Kitimat, BC) empezó exportaciones en 2025 — flujo ferroviario de insumos y productos crece
- Granos canadienses a China, Japón, Corea (~$8B anuales)
- Potasa de Saskatchewan (Nutrien) → Asia vía Prince Rupert
- Autos japoneses importados vía Vancouver → distribución en Norteamérica

### 3. Diversificación Sectorial
Mix equilibrado: una caída en carbón no te mata porque solo es 5%. Una recesión en autos se compensa con grano. El conjunto es menos volátil que cualquier comparable.

### 4. Capital Return Disciplinado
- Buyback $4B activo
- Dividend yield 2.38% con payout ratio ~45%
- ROIC > WACC consistente desde 2000

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| **Precio** | $110.26 |
| **Market Cap** | $67.5B |
| **P/E TTM** | 20.0x |
| **P/E Forward** | 17.3x |
| **EPS TTM** | $5.51 |
| **Dividend Yield** | 2.38% |
| **52w High** | $113.09 |
| **52w Low** | $90.74 |
| **Operating Ratio Q4 2025** | 57.2% |
| **FCF 2025** | ~$4.1B |

## Riesgos

### 1. Commodities Canadienses Cíclicos
Una recesión de granos, potasa o productos forestales golpea volúmenes. En 2020 (COVID), revenue cayó 10%.

### 2. Disrupciones Operacionales
- Incendios forestales en British Columbia (2021, 2023): vías interrumpidas por semanas
- Huelga Teamsters Canada Rail (Agosto 2024): 9 días de paro completo
- Descarrilamientos (riesgo regulatorio post-East Palestine)

### 3. Competencia del Trucking Intermodal
En rutas cortas (<500 millas), trucks son más flexibles. CN compensa con precios de combustible: cada $1/barril de diesel hace al ferrocarril más competitivo.

### 4. Riesgo de Divisas
CNI cotiza en USD pero genera revenue en CAD + USD. CAD débil reduce el valor reportado.

### 5. USMCA Review 2026
El acuerdo comercial Canadá-México-EE.UU. entra en revisión. Aranceles nuevos reducirían volúmenes transfronterizos.

### 6. Regulación Emergente
Canadá propuso en 2025 emisiones más estrictas para locomotoras. Capex de compliance ~$800M en próximos 5 años.

## Conclusión

CNI a $110.26 te permite comprar el único ferrocarril Norteamericano con acceso a 3 océanos, en medio de:
1. Un turnaround operacional validado (OR bajando, volumen subiendo)
2. Un moat geográfico imposible de replicar en 2026
3. Un track record de 29 años subiendo dividendo
4. Exposición estructural a exportaciones asiáticas desde Prince Rupert
5. Valuación razonable (P/E forward 17.3x en línea con historial)

No es un "value play" — es calidad a precio justo. En ferrocarriles, eso es todo lo que se puede pedir.

---

*Research fecha: 20 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 125.0,
    analyst_upside: 13.4,
    status: "active",
    first_researched_at: "2026-04-20T00:00:00Z",
    last_updated_at: "2026-04-20T00:00:00Z",
    next_review_at: "2026-10-20T00:00:00Z",
  },
  {
    id: 48,
    ticker: "CICHY",
    name: "China Construction Bank Corporation",
    sector: "Financials",
    industry: "Banks — Diversified",
    country: "China",
    region: "Asia",
    currency: "USD",
    price: 22.66,
    pe_ratio: 5.95,
    pe_forward: null,
    dividend_yield: 4.89,
    market_cap_b: 304.4,
    eps: 3.81,
    summary_short:
      "El segundo banco más grande del mundo por activos (~$4 trillones USD). A P/E 6x cotiza como si fuera a quebrar — pero paga 4.89% de dividendo, está respaldado por el estado chino, y sus ganancias crecen 3–5% al año. Sistémico para Beijing. El descuento es geopolítico, no fundamental.",
    summary_what:
      "China Construction Bank (建设银行) es uno de los \"Big Four\" bancos estatales chinos. Fundado en 1954, hoy opera más de 14,000 sucursales en China + ~30 oficinas internacionales. Controlado por Central Huijin Investment (~57%), el brazo soberano del estado chino. Tres líneas: (1) Banca corporativa — financiamiento de infraestructura, PYMEs, grandes empresas estatales y gobierno central/provincial; (2) Banca retail — el banco #1 en hipotecas residenciales en China, además de cuentas, tarjetas de crédito, gestión patrimonial; (3) Tesoro y mercado de capitales. El ADR CICHY cotiza en OTC Markets (OTCPK) como ADR Level I unsponsored — 1 ADR representa 25 H-shares (Hong Kong, ticker 00939.HK). HQ en Beijing. CEO: Zhang Jinliang (desde 2022). Payout ratio: ~30% — reparte aproximadamente un tercio de utilidades como dividendo anual.",
    summary_why:
      "A P/E 5.95x y dividendo 4.89% pagado en USD, CICHY cotiza como si el sistema bancario chino fuera a colapsar. Pero la realidad es más matizada: (1) el regulador chino (NFRA) y el PBOC ya obligaron a los bancos a aprovisionar agresivamente las pérdidas del sector inmobiliario (Evergrande, Country Garden, Sunac) durante 2022–2024 — lo peor del ciclo ya está en los balances; (2) NIM (net interest margin) estabilizándose en 1.5–1.6% después de tres años de caídas; (3) Beijing ha señalado explícitamente que NO dejará quebrar a los bancos sistémicos — el respaldo soberano es estructural, no hipotético; (4) utilidades crecen 3–5% al año incluso en desaceleración económica; (5) payout ratio conservador (~30%) deja margen para sostener el dividendo incluso si la utilidad cae. El contraste con peers: JPMorgan gana $50B al año y cotiza a P/E 12x. CCB gana ~$58B al año y cotiza a P/E 6x. La diferencia es 100% geopolítica — si CCB estuviera listado en Frankfurt cotizaría al doble. El mercado sobredescuenta el riesgo de delisting de ADRs chinos, cuando la vía alternativa (convertir CICHY en H-shares de Hong Kong) es técnicamente posible para la mayoría de brokers.",
    summary_risk:
      "El riesgo principal es geopolítico — una escalada de tensiones EE.UU.-China podría resultar en delisting de ADRs chinos de bolsas estadounidenses (como ocurrió con DIDI en 2022) o sanciones secundarias que congelen la liquidez del ADR OTC. Otros riesgos: exposición residual al sector inmobiliario chino vía hipotecas y préstamos a desarrolladores; NIM presionado por tasas bajas del PBOC; riesgo regulatorio del estado chino que podría forzar dividendos a la baja o exigir préstamos subsidiados a empresas estratégicas; transparencia contable limitada (ADR unsponsored, sin reporting formal SEC); riesgo cambiario CNY/USD; liquidez limitada del ADR en OTC Markets (bid/ask spreads amplios en momentos de estrés); riesgo de sanción individual del banco bajo listas OFAC si entran en tensión con Taiwan.",
    research_full: `# China Construction Bank (CICHY) — Research Completo

## Precio: $22.66 | P/E TTM: 5.95 | Div Yield: 4.89% | Market Cap: $304B

---

## Qué Es

China Construction Bank (建设银行, "Jiàn Shè Yín Háng") es uno de los **"Big Four" bancos estatales de China**:

1. Industrial and Commercial Bank of China (ICBC) — #1 por activos
2. **China Construction Bank (CCB)** — #2
3. Agricultural Bank of China (ABC)
4. Bank of China (BOC)

Activos totales: **~$4 trillones USD** (más que JPMorgan + Bank of America combinados).

Fundado en 1954 como banco estatal para financiar infraestructura. Privatizado parcialmente con IPO dual en Hong Kong (2005) y Shanghai (2007). Central Huijin Investment (brazo soberano del estado) mantiene ~57% de las acciones.

## El ADR CICHY

- **Ticker**: CICHY
- **Exchange**: OTC Markets (OTCPK) — Pink Sheets
- **Tipo**: ADR Level I **unsponsored**
- **Ratio**: 1 ADR = 25 H-shares (00939.HK)
- **Custodio**: Citibank N.A.

"Unsponsored" significa que CCB no emitió directamente el ADR — un banco custodio lo creó agrupando H-shares compradas en Hong Kong. **Implicación**: CCB no reporta a la SEC bajo 20-F. Los reportes oficiales vienen de Hong Kong/Shanghai bajo HKEX/SSE.

## Líneas de Negocio

| Segmento | % del revenue | Notas |
|----------|---------------|-------|
| **Banca corporativa** | ~50% | Infraestructura, SOEs, PYMEs |
| **Banca retail** | ~35% | Hipotecas (#1 en China), cuentas, tarjetas |
| **Tesoro / mercado** | ~15% | Trading, gestión patrimonial |

## El Contexto: Por Qué Está Barato

### El Overhang Inmobiliario (2021–2024)
- Evergrande quiebra técnica en 2021
- Country Garden, Sunac, Fantasia, Shimao — todos con default o reestructuración
- Ventas de vivienda nueva en China: -50% vs peak (2021 → 2024)

### Cómo Impactó a CCB
- Provisiones por préstamos inmobiliarios: +$40B en 2022–2024
- NPL ratio (préstamos non-performing): subió de 1.4% a 1.8%
- Hipotecas residenciales: exposición ~$1.2T USD (la más grande entre bancos chinos)
- Acciones inmobiliarias del mercado chino: -70% en ese período

### El Reset Regulatorio
El regulador chino (NFRA, antes CBIRC) forzó a los Big Four a:
1. Aprovisionar agresivamente (coverage ratio NPL >200%)
2. Refinanciar hipotecas existentes a tasas más bajas (~100 bps reducción promedio)
3. Incrementar capital Tier 1 para buffer
4. Participar en fondos de rescate (Baotou, Tianjin, Guizhou LGFVs)

### Resultado 2025
- NIM estabilizado en 1.52% (vs 1.82% en 2022)
- Utilidad neta 2025: ~$58B USD (vs $55B en 2024 → +5.4%)
- NPL ratio cayó a 1.35%
- Provisiones normalizándose

## Tesis de Inversión

### 1. El Peor Escenario Ya Está Priceado
P/E 5.95x con div yield 4.89% implica:
- O el banco está a punto de quebrar (no lo está — es sistémico)
- O el mercado exige una prima de riesgo geopolítico de 50-60% vs bancos occidentales

### 2. Beijing NO Deja Caer a CCB
- Central Huijin posee 57% — es el estado
- Los Big Four son vehículos de política monetaria del PBOC
- "Too big to fail" con carácter chino: el estado chino literalmente ES el mayor accionista

### 3. Dividendos Pagados en USD
- CCB distribuye dividendo anual, pagado en CNY pero convertido a USD para ADR
- En 2025: $1.11 por ADR → yield 4.89% a $22.66
- Payout ratio: ~30% (conservador)
- Consistencia: 19 años consecutivos pagando dividendo

### 4. Valuación Comparativa

| Banco | P/E | Div Yield | ROE |
|-------|-----|-----------|-----|
| **JPMorgan (JPM)** | 12x | 2.1% | 17% |
| **Bank of America (BAC)** | 11x | 2.5% | 11% |
| **HSBC (HSBC)** | 7x | 6.8% | 13% |
| **Santander (SAN)** | 7x | 4.1% | 13% |
| **CCB (CICHY)** | **6x** | **4.9%** | **11%** |

CCB cotiza 50% más barato que JPM con ROE similar y dividendo 2x más alto.

### 5. Catalizadores Potenciales
- Estabilización del mercado inmobiliario chino (Q1 2026 mostró primer +YoY en 3 años)
- Políticas de estímulo fiscal de Beijing (ya activas desde Q4 2025)
- Relajación de tensiones comerciales post-elecciones EE.UU. 2026
- Conversión voluntaria de ADR a H-shares para inversores que quieran eliminar el riesgo OTC

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| **Precio ADR** | $22.66 |
| **Market Cap** | $304B |
| **P/E TTM** | 5.95x |
| **EPS TTM** | $3.81 (por ADR) |
| **Dividend Yield** | 4.89% |
| **Dividendo ADR** | $1.11 |
| **Activos totales** | ~$4.0T |
| **Préstamos totales** | ~$2.6T |
| **NPL Ratio** | 1.35% |
| **NIM** | 1.52% |
| **ROE** | 11.1% |
| **Tier 1 Capital** | 14.2% |
| **52w High** | $22.73 |
| **52w Low** | $16.30 |

## Riesgos

### 1. Riesgo Geopolítico (Principal)
- Tensiones EE.UU.-China podrían llevar a **delisting de ADRs chinos** (como DIDI en 2022)
- Sanciones secundarias OFAC contra bancos chinos si hay tensión sobre Taiwán
- Mitigación: los ADRs se pueden convertir a H-shares en Hong Kong (requiere corredor con acceso a Hong Kong)

### 2. Exposición Inmobiliaria Residual
- Aún ~15% del libro de préstamos vinculado a real estate
- Si el rebote inmobiliario chino falla, nuevo ciclo de provisiones

### 3. Transparencia Contable
- ADR unsponsored: no reporta 20-F a la SEC
- Reportes oficiales en mandarín + inglés desde HKEX — 2x al año (interim + annual)
- Riesgo de window dressing contable típico de bancos chinos (la "provisión dinámica" puede inflar utilidades)

### 4. Liquidez del ADR
- Volume promedio diario: ~200,000 ADRs = ~$4.5M
- Bid/ask spread: 10–20 bps en condiciones normales, 50+ bps en estrés
- No apto para trades grandes rápidos — hay que usar órdenes limit

### 5. Riesgo Cambiario (CNY → USD)
- Dividendo se paga en CNY, convertido a USD al momento del pago
- CNY débil reduce el dividendo en USD
- PBOC tiene banda de fluctuación dirigida — menos volátil que EM típico

### 6. Riesgo Regulatorio Chino
- Beijing puede forzar:
  - Préstamos a empresas estratégicas sin retorno comercial
  - Reducción de dividendos para preservar capital
  - Fusiones o reestructuraciones forzadas

### 7. NIM Presionado por Tasas
- PBOC está bajando LPR (Loan Prime Rate) para estimular economía
- NIM de CCB compresión ~20 bps anuales desde 2022
- Ya tocando piso estructural pero sin viento de cola en próximos 2 años

## Cómo Funciona el ADR OTC

- Compras CICHY en tu corredor (Schwab, Fidelity, IBKR, TD — todos lo listan)
- Citibank como custodio tiene H-shares reales en Hong Kong respaldando cada ADR
- Cotización durante horario NY 9:30–16:00 ET
- Precio del ADR = H-share price × 25 × (CNY→USD FX) — menos spread OTC
- Dividendo: pagado por CCB en CNY a Citibank → Citibank convierte a USD → deposita en tu cuenta

## Conclusión

CICHY a $22.66 te permite comprar el segundo banco más grande del mundo con:
1. P/E 6x (50% descuento vs peers occidentales con fundamentales similares)
2. Dividendo 4.89% pagado en USD, sostenido por payout ratio 30%
3. Respaldo soberano explícito del estado chino (Huijin 57%)
4. Utilidades creciendo 3–5% anual incluso en desaceleración
5. El peor escenario inmobiliario ya priceado

El descuento NO es por fundamentales — es geopolítico. Si la tesis es "China no colapsa y Beijing no deja caer a CCB", a este precio la matemática es asimétrica. Si la tesis es "Taiwán escala, CICHY se delistea", entonces existe escenario binario de pérdida — pero incluso en ese caso, convertir a H-shares preserva la exposición.

**No es una acción para todos.** Es para quien entiende el trade-off entre valuación barata y riesgo de cola geopolítico.

---

*Research fecha: 20 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Hold",
    analyst_target: 25.0,
    analyst_upside: 10.3,
    status: "active",
    first_researched_at: "2026-04-20T00:00:00Z",
    last_updated_at: "2026-04-20T00:00:00Z",
    next_review_at: "2026-10-20T00:00:00Z",
  },
  {
    id: 49,
    ticker: "COIN",
    name: "Coinbase Global, Inc.",
    sector: "Financial Services",
    industry: "Capital Markets / Crypto Exchange",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 208.58,
    pe_ratio: 46.98,
    pe_forward: 40.61,
    dividend_yield: 0,
    market_cap_b: 56.2,
    eps: 4.44,
    summary_short:
      "El exchange de crypto más grande y regulado de EE.UU. — custodia el Bitcoin de 8 de los 11 ETFs spot aprobados por la SEC (BlackRock, Fidelity, Invesco, ARK, etc.). Diversificó sus ingresos: comisiones de trading, intereses de reservas USDC (~$900M anuales), staking, custodia institucional y Coinbase One. Cotiza -53% desde máximos ($444) — el mercado asume el peor escenario de precio de crypto, no el mejor escenario de infraestructura regulada.",
    summary_what:
      "Coinbase Global es la única exchange de crypto listada en Nasdaq bajo regulación completa de SEC, CFTC y FinCEN. Opera cuatro líneas: (1) Transaction revenue — comisiones de compra/venta de ~250 cryptoactivos para 110M+ usuarios verificados; (2) Subscription & services — intereses ganados sobre reservas de USDC (Circle comparte ~50% del interés con Coinbase, generando ~$900M al año a tasas actuales), staking (ETH, SOL, ADA), Coinbase One ($29.99/mes con trades ilimitados), Coinbase Prime (custodia institucional), Coinbase Custody (usado por los ETFs spot de BTC y ETH); (3) Blockchain rewards — ingresos de validación en redes proof-of-stake; (4) Corporate interest — rendimiento sobre su balance de efectivo y crypto. Su moat principal es regulación: conseguir licencias BitLicense en NY, Money Transmitter en 50 estados, MiCA en UE requirió 5+ años y ~$1B en gastos legales. Fundada en 2012 por Brian Armstrong (CEO) y Fred Ehrsam. HQ completamente remoto (sin oficina central desde 2021). IPO directa en Nasdaq en 2021 a $381.",
    summary_why:
      "COIN a $208 cotiza -53% del 52w high de $444 — el mercado está priceando un escenario donde el precio de crypto cae brutal y el volumen de trading desaparece. Pero la tesis no depende del precio de BTC, depende de la adopción: (1) Custodia el Bitcoin de 8 de 11 ETFs spot aprobados por la SEC — BlackRock IBIT solo tiene $60B+ en AUM y todo su BTC está en Coinbase. Cada dólar que entra a esos ETFs genera fees de custodia recurrentes para COIN; (2) USDC interest income: Circle comparte con Coinbase ~50% del interés ganado sobre las reservas de USDC (~$60B de supply) — a tasas de 4-5%, eso son $900M anuales de ingreso recurrente tipo SaaS, independiente del volumen de trading; (3) Coinbase One y staking construyen ingresos suscripción previsibles; (4) Moat regulatorio: son la ÚNICA exchange US con todas las licencias, lo que los hace el partner default para toda institución financiera que quiera exposición regulada a crypto (BlackRock, Fidelity, Grayscale, ARK, Invesco, Franklin Templeton); (5) El GENIUS Act firmado 2025 legitimó stablecoins y aceleró adopción institucional; (6) Base — su L2 de Ethereum — procesa más transacciones diarias que Ethereum mainnet. El bear case es 'crypto muere'; el bull case es 'Coinbase se convierte en el Nasdaq/DTCC del cripto'.",
    summary_risk:
      "No paga dividendo — es apuesta 100% por crecimiento y apreciación del precio. El ingreso depende críticamente de: (1) Volumen de trading de retail — que cae ~60% en bear markets de crypto (2022 fue brutal); (2) Precio del Bitcoin y Ethereum — aunque Coinbase ha diversificado, todavía ~45% del revenue es transaccional, por lo que un invierno crypto comprime utilidades; (3) Regulación cambiante — la SEC demandó a Coinbase en 2023 acusándolos de operar un exchange de valores no registrado; aunque Coinbase ganó el caso en 2024, nuevas administraciones pueden reabrir frentes; (4) Competencia de Binance, Kraken, Robinhood Crypto, e incluso TradFi entrando (Fidelity Crypto, Charles Schwab); (5) Dependencia de Circle para USDC — si Circle cambia los términos del acuerdo de reservas o USDC pierde market share vs Tether, ese ~$900M anual de SaaS-like revenue está en riesgo; (6) Valuación: P/E 47x y forward 40x son caros — cualquier miss de earnings en un quarter malo de crypto puede tumbar la acción 30%+ en un día; (7) Hacks o fallas operacionales — aunque nunca ha sido hackeada a nivel custodia, un evento de este tipo sería existencial.",
    research_full: `# Coinbase Global, Inc. (COIN) — Research Completo

## Precio: $208.58 | P/E TTM: 47.0 | P/E Forward: 40.6 | Div Yield: 0% | Market Cap: $56.2B

---

## Qué Es

Coinbase Global es **la exchange de criptoactivos más grande y regulada de EE.UU.** — la única listada en Nasdaq (COIN) y con licencias completas de SEC, CFTC, FinCEN, NYDFS (BitLicense) y en los 50 estados de EE.UU. Fundada en 2012 por Brian Armstrong y Fred Ehrsam. IPO directa en abril 2021 a $381 por acción.

Más de 110 millones de usuarios verificados. ~$200B+ de activos custodiados. Custodia el Bitcoin de **8 de los 11 ETFs spot de Bitcoin** aprobados por la SEC.

## Líneas de Negocio

| Segmento | % del revenue | Descripción |
|----------|---------------|-------------|
| **Transaction revenue** | ~45% | Comisiones por trades en spot market (retail + pro) |
| **Subscription & services** | ~40% | USDC interest, staking, Coinbase One, Prime, Custody |
| **Blockchain rewards** | ~8% | Validación proof-of-stake (ETH, SOL, ADA, ATOM) |
| **Corporate interest** | ~5% | Rendimiento sobre cash y crypto en balance |
| **Other** | ~2% | Base (L2), venture investments |

### El Shift Crítico: De Exchange a Infraestructura

Históricamente, Coinbase era ~85% transaccional — cuando el precio de crypto caía, el volumen caía, y COIN se desplomaba. Desde 2023 ese perfil cambió drásticamente:

1. **USDC interest**: Coinbase tiene un acuerdo con Circle (emisor de USDC) que le da ~50% del interés ganado sobre las reservas del stablecoin. Con USDC supply ~$60B y tasas del 4-5%, eso son ~$900M/año de ingreso recurrente INDEPENDIENTE del precio de crypto.
2. **Custody fees**: Los 8 ETFs de BTC (BlackRock IBIT, Fidelity FBTC, Ark ARKB, Invesco BTCO, etc.) y los 5 ETFs de ETH cotizan ~$90B+ AUM total. Coinbase cobra ~0.05-0.10% anual de custodia → ~$50-90M/año recurrentes.
3. **Coinbase One**: Suscripción $29.99/mes con trades ilimitados, mayor rendimiento en staking, y prioridad de soporte. 1M+ suscriptores → ~$360M/año.

## El Moat Regulatorio

Conseguir las licencias que Coinbase tiene hoy cuesta **5+ años y $1B+ en legal y compliance**:

- NY BitLicense (otorgada 2017)
- Money Transmitter License en 50 estados
- SEC registration como Alternative Trading System
- CFTC registration como Derivatives Clearing Organization
- MiCA authorization en UE (2025)
- Licencias en Singapur, Canadá, Reino Unido, Irlanda, Brasil

Esto hace a Coinbase el **default partner regulado** para toda institución que quiera exposición a crypto:

- **BlackRock** eligió Coinbase para custodiar IBIT (el mayor ETF de BTC con ~$60B AUM)
- **Fidelity** custodia FBTC con Coinbase
- **Invesco, ARK, Franklin Templeton, Bitwise, Hashdex, WisdomTree** — todos usan Coinbase
- **PayPal** usa Coinbase Crypto API para ofrecer BTC/ETH a sus usuarios
- **Stripe** usa Coinbase para liquidar pagos en USDC

## USDC y el Acuerdo con Circle

En 2018, Coinbase y Circle co-fundaron el Centre Consortium para emitir USDC. En 2023 el consortium se disolvió y Circle asumió emisión directa, pero el acuerdo comercial sigue vigente:

- Circle gestiona las reservas de USDC (bonos del Tesoro a corto plazo)
- Circle gana intereses sobre esas reservas (~4-5% anual actualmente)
- **Circle paga ~50% de ese interés a Coinbase** por distribuir y promover USDC

USDC supply actual: ~$60B
Interés anual agregado: ~$2.4-3B
Share de Coinbase: **~$900M-1.2B/año**

Esto es el equivalente a ingresos tipo SaaS — no depende del precio de crypto, solo del supply de USDC en circulación.

## Base — La L2 de Coinbase

En 2023 Coinbase lanzó **Base**, su L2 de Ethereum construida con Optimism OP Stack. Base hoy:

- **1M+ transacciones diarias** (más que Ethereum mainnet la mayoría de los días)
- **$5B+ TVL** (Total Value Locked)
- Token COIN captura fees de secuenciador (~$100M anuales ya)
- Es la L2 preferida de grandes proyectos como Farcaster, Aerodrome, y proyectos onchain de consumer

Base convierte a Coinbase de "exchange" a "infraestructura de rails de crypto" — similar al pivot de AWS desde "hosting" a "cloud computing".

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| **Precio** | $208.58 |
| **Market Cap** | $56.2B |
| **P/E TTM** | 47.0x |
| **P/E Forward** | 40.6x |
| **EPS TTM** | $4.44 |
| **Dividend Yield** | 0% |
| **52w High** | $444.65 |
| **52w Low** | $139.36 |
| **Drawdown desde high** | -53% |
| **Revenue 2025** | ~$7.1B |
| **Adjusted EBITDA 2025** | ~$2.8B |
| **Cash + crypto en balance** | ~$8B |
| **Activos custodiados** | ~$200B |

## Tesis: El Nasdaq/DTCC de Crypto

La visión de 10 años de Coinbase no es ser la exchange de crypto más grande — es ser **la infraestructura regulada sobre la que se construye toda la economía onchain en Occidente**.

### Analogía: DTCC + Nasdaq + Visa
- **DTCC** custodia los $88T+ de valores en EE.UU. — cobra fees pequeños por cada transacción → negocio durable, no ciclico
- **Nasdaq** opera el mercado de trading y cobra fees de listing + trading
- **Visa** conecta bancos y comerciantes y cobra ~0.1% de cada swipe

Coinbase quiere esa combinación aplicada a crypto. Y ya está en camino:
- Custody (DTCC) ✓
- Exchange (Nasdaq) ✓
- Settlement + USDC rails (Visa) ✓
- L2 (Base) — nueva pieza

## Por Qué Ahora

### 1. Precio con -53% Descuento
El 52w high fue $444. Hoy cotiza $208. La caída no fue por fundamentals — fue por: (a) rotación de growth a value en Q1 2026; (b) miedos a recesión; (c) correction del BTC a $78K desde $108K. Los fundamentos del negocio no cambiaron.

### 2. GENIUS Act Firmado (2025)
La ley que creó el framework regulatorio federal para stablecoins pasó en noviembre 2025. Eso legitima a USDC (y por extensión, el revenue stream de Coinbase).

### 3. ETFs de ETH Aprobados (Julio 2024)
Coinbase custodia el ETH de todos los ETFs spot de Ethereum. AUM combinado: ~$12B y creciendo.

### 4. Expansión Internacional
Lanzamientos recientes en UE (MiCA), Australia, Brasil, Singapur agregando geografías con crecimiento crypto rápido.

### 5. Earnings Crecientes
Q4 2025: EPS $1.26 vs $1.05 consensus. Revenue $1.92B (+44% YoY).
Q1 2026: proyectado $1.45B revenue, EPS $0.89.

## Riesgos

### 1. Volumen de Trading Cíclico
En bear markets de crypto (2022 fue brutal), volumen cayó 60% y Coinbase reportó pérdidas trimestrales. Aunque el mix ahora es más defensivo, ~45% del revenue sigue siendo transaccional.

### 2. Dependencia de USDC / Circle
Si Circle renegocia el split de interés, cambia el custodio de reservas, o USDC pierde market share vs Tether/PYUSD/RLUSD → el ~$900M/año está en riesgo.

### 3. Precio del Bitcoin
A pesar de la diversificación, si BTC cae a $40K, las valuaciones de todos los ETFs bajan, las fees de custodia caen proporcionalmente, y el sentimiento se rompe.

### 4. Competencia
- **Binance** sigue siendo el #1 global por volumen
- **Robinhood Crypto** y **Kraken** compiten en retail US
- **Fidelity Crypto, Schwab** entrarán fuerte en 2026
- **Revolut, Cash App** dominan mobile-first

### 5. Regulación Imprevisible
Aunque Coinbase ganó el caso SEC v. Coinbase en 2024, nuevas administraciones pueden reabrir frentes. Riesgo real si el próximo Congreso pasa legislación más restrictiva.

### 6. Valuación Cara
P/E 47x TTM, Forward 40x. Para una empresa con volatilidad trimestral de crypto, cualquier miss tumba la acción 20-30%.

### 7. Hack o Falla Operacional
Nunca ha sido hackeada a nivel custodia principal (solo incidentes menores en hot wallets). Un evento de este tipo sería existencial — todos los ETFs moverían AUM a otros custodios.

## Conclusión

COIN a $208 te permite comprar:
1. La única exchange de crypto regulada completa en EE.UU. (moat regulatorio de $1B+ y 5 años)
2. ~$900M anuales de ingreso recurrente tipo SaaS (USDC interest)
3. Custodia monopolística del 80%+ del AUM de ETFs spot de BTC y ETH
4. Una L2 (Base) que ya procesa más que Ethereum mainnet
5. -53% descuento desde el high, con earnings en crecimiento trimestre a trimestre

**El bear case es "crypto muere" (improbable dado adopción institucional). El bull case es "Coinbase se convierte en el DTCC/Nasdaq/Visa de crypto" (probable dado su posición regulatoria y de custody).**

Esta no es una apuesta por el precio de BTC — es una apuesta por la adopción regulada de blockchain como infraestructura financiera. Y esa adopción ya está pasando, con o sin el precio de BTC en $150K.

No paga dividendo. El rendimiento viene de la apreciación del precio si la tesis se materializa.

---

*Research fecha: 21 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 280.0,
    analyst_upside: 34.2,
    status: "active",
    first_researched_at: "2026-04-21T00:00:00Z",
    last_updated_at: "2026-04-21T00:00:00Z",
    next_review_at: "2026-10-21T00:00:00Z",
  },
  {
    id: 50,
    ticker: "COST",
    name: "Costco Wholesale Corporation",
    sector: "Consumer Defensive",
    industry: "Discount Stores / Membership Warehouse",
    country: "United States",
    region: "North America",
    currency: "USD",
    price: 994.87,
    pe_ratio: 51.65,
    pe_forward: 44.27,
    dividend_yield: 0.59,
    market_cap_b: 441.6,
    eps: 19.26,
    summary_short:
      "El club de compras más grande del mundo — 73M+ miembros pagando $65-130/año solo para poder comprar. Renovación 92.9% en EE.UU./Canadá. Más del 70% del profit viene de las membresías, no de los productos. Kirkland Signature factura más que la mayoría del Fortune 500. Paga dividendo regular + especiales multimillonarios cada 3-4 años.",
    summary_what:
      "Costco Wholesale opera 890+ warehouses en 14 países — EE.UU., Canadá, México, UK, Japón, Corea del Sur, Taiwán, Australia, España, Francia, China (Shanghai, Suzhou), Islandia, Nueva Zelanda, Suecia. Modelo de negocio único: es el ÚNICO retailer donde necesitas PAGAR para poder comprar. Dos tipos de membresía: Gold Star ($65/año) y Executive ($130/año con 2% cashback). ~73M+ hogares con membresía pagada. Revenue 2025: ~$275B. Mix: 85% merchandise (comida fresca, abarrotes, electrónicos, ropa, combustible), 12% services (farmacia, óptica, llantas, travel, seguros), 3% membership fees. El insight contable clave: las membership fees son revenue puro con ~100% de margen — eso genera ~$5.4B/año de operating income sin costos asociados. Costco vende productos a margen ~11% (vs Walmart ~24%) porque NO busca ganar con los productos — busca que las membresías renueven. Fundada 1983, fusionada con Price Club 1993. HQ en Issaquah, Washington. CEO: Ron Vachris (desde enero 2024, reemplazando a Craig Jelinek).",
    summary_why:
      "COST a $994.87 es una de las tesis de inversión más sólidas en equities: (1) Negocio de ingresos recurrentes disfrazado de tienda — 92.9% de renovación en EE.UU./Canadá y 90.5% global es mejor que muchas SaaS empresariales. Cuando un cliente paga $65-130 al año automáticamente sin pensar, es un revenue stream SaaS-tier; (2) Margen de membresía: ~$5.4B anuales de fee income va directo al bottom line con ~100% gross margin. Eso solo paga casi todo el G&A corporativo; (3) Poder de negociación brutal — Costco es top-3 comprador de casi todo producto consumer en EE.UU. (leche, pollo, vino, electrónicos, ropa). Exige 3-5% menos que Walmart; (4) Kirkland Signature: la marca propia de Costco factura ~$85B/año — más que Kellogg's, Hershey's, Ford Motor Company, o Nike. Es la tercera marca de consumer goods más grande del mundo; (5) Pricing power anclado: el combo de hot dog + soda sigue costando $1.50 desde 1985; la pizza entera $9.99; el pollo rostizado $4.99. Jim Sinegal (co-fundador) amenazó con 'matar' a cualquier ejecutivo que los subiera. Son anclas psicológicas que los miembros renueven solo para 'sentir que ganan'; (6) 30 años consecutivos pagando dividendos + 18 subidas consecutivas + dividendos especiales ($7 en 2012, $10 en 2017, $10 en 2020, $15 en 2023); (7) Resistencia a Amazon probada — COST creció 14% en el peor año de Amazon (2023), porque la experiencia física de 'descubrimiento' en warehouse no se puede replicar online. Recurrente, defensivo, pricing power, moat cultural — 4 de las 5 cualidades que Buffett busca.",
    summary_risk:
      "El riesgo principal es la valuación: P/E TTM 51.65x y forward 44.3x están entre los más altos de su historia — el mercado ya reconoce la calidad del negocio, lo que limita el margen de seguridad. Otros riesgos: (1) Cualquier quarter con renovación debajo del 92% en EE.UU. causaría caída brutal (el mercado asume ~92%+ perpetuo); (2) Costo de commodities: inflación de carne, dairy, combustibles comprime el margen operativo — Costco absorbe porque no quiere subir precios visibles; (3) Dependencia regional: ~75% del revenue viene de EE.UU./Canadá — cualquier shock macro local pega fuerte; (4) Expansión internacional costosa: cada warehouse nuevo cuesta ~$75-100M y tarda 3-5 años en alcanzar break-even; (5) Competencia emergente de Sam's Club (Walmart) que ha acelerado digital + same-day; (6) Shrinkage (robo) creciendo en California y ciudades con relajación de enforcement; (7) Dividendo yield 0.59% es bajo — esto NO es una acción de ingresos pasivos, es growth + capital appreciation + dividendos especiales esporádicos; (8) Sucesión: Ron Vachris es nuevo CEO desde 2024 — transiciones pueden desestabilizar cultura operacional única de Costco.",
    research_full: `# Costco Wholesale Corporation (COST) — Research Completo

## Precio: $994.87 | P/E TTM: 51.7 | P/E Forward: 44.3 | Div Yield: 0.59% | Market Cap: $441.6B

---

## Qué Es

Costco Wholesale es **el club de compras más grande del mundo** — 890+ warehouses en 14 países, 73M+ hogares con membresía pagada, y ~$275B de revenue anual. Fundada en 1983 en Seattle. Fusionada con Price Club en 1993. HQ en Issaquah, Washington.

El modelo de negocio es contraintuitivo: **pagas para poder comprar**. Gold Star $65/año, Executive $130/año (con 2% cashback de hasta $1,250). Aprox 130M+ cardholders individuales (miembros + agregados).

## El Ingrediente Secreto: Membership Fees

Esta es la línea que la mayoría de análisis pasa por alto:

| Año | Membership Fee Revenue | % del Operating Income |
|-----|------------------------|------------------------|
| 2020 | $3.54B | 72% |
| 2021 | $3.88B | 68% |
| 2022 | $4.22B | 71% |
| 2023 | $4.58B | 68% |
| 2024 | $4.83B | 69% |
| 2025 | $5.40B | 71% |

**Las membership fees tienen ~100% gross margin** (no hay costo asociado a una renovación anual). Esto significa que **~70% del operating income de Costco viene de un stream de ingresos recurrentes tipo SaaS**.

Si separas los negocios:
- Merchandise retail: revenue $266B, margen ~2.5% → OpInc ~$6.6B
- Membership fees: revenue $5.4B, margen ~100% → OpInc ~$5.4B

Vende productos casi AT COST (el nombre "Costco" viene de Cost + Co.). El negocio real son las membresías.

## Renovación — El Métrico Clave

Costco reporta renewal rate cada trimestre:

| Región | Renovación |
|--------|------------|
| **EE.UU./Canadá** | 92.9% |
| **Global** | 90.5% |

Para contexto:
- Netflix USA: ~60% renovación anual
- Amazon Prime USA: ~93% renovación anual
- Costco: 92.9% — **tier de Amazon Prime**

Cada subida de fee (última vez fue septiembre 2024: Gold $60→$65, Exec $120→$130) genera $800M+ de revenue adicional con cero costo incremental y **sin caída en renovación**. Eso es pricing power puro.

## Kirkland Signature — La Tercera Marca Consumer más Grande del Mundo

Kirkland Signature (la marca propia de Costco) factura **~$85B/año**:

| Marca | Revenue 2024 |
|-------|--------------|
| Coca-Cola (la marca, no la empresa) | ~$95B |
| Pepsi (la marca) | ~$87B |
| **Kirkland Signature** | **~$85B** |
| Nike | ~$51B |
| Kellogg's | ~$13B |
| Hershey's | ~$11B |

Kirkland representa ~30% del revenue de Costco. Miembros la prefieren por un motivo simple: Costco NO pone un producto Kirkland a menos que sea demostrablemente superior o igual a la mejor marca del mercado **a 20-30% menos precio**.

Esa promesa construye tanta confianza que Costco es el ÚNICO retailer donde los consumidores asumen que el producto genérico es mejor que el branded.

## Pricing Power Anclado — Los Precios Mágicos

Costco mantiene deliberadamente varios precios **sin subir durante décadas** como anclas psicológicas:

| Producto | Precio | Desde |
|----------|--------|-------|
| Hot dog + soda combo | $1.50 | 1985 |
| Pizza entera | $9.99 | ~2000 |
| Pollo rostizado | $4.99 | ~2009 |
| Muffins paquete 12 | $8.99 | ~2015 |

Jim Sinegal (co-fundador, CEO hasta 2011) famosamente le dijo a Craig Jelinek cuando sugirió subir el hot dog: *"If you raise the fucking hot dog, I will kill you."*

Esto NO es sentimentalismo — es ciencia del pricing:

1. Los miembros entran a Costco, ven el hot dog a $1.50 y se sienten "ganando"
2. Ese sentimiento de valor se transfiere a TODO el resto de la compra
3. Renuevan la membresía al año siguiente para repetir la sensación

Es el "loss leader" más efectivo en retail history.

## Resistencia a Amazon — El Test Real

Durante 2020-2023, Amazon se comió el almuerzo de toda tienda física (Walmart, Kroger, Walgreens, CVS, etc.). Costco:

| Año | COST revenue growth |
|-----|---------------------|
| 2020 | +9% |
| 2021 | +17% |
| 2022 | +16% |
| 2023 | +7% (mal año general retail) |
| 2024 | +9% |
| 2025 | +8% |

Costco creció EN el mejor momento de Amazon. Razones:

1. **Experiencia**: La gente va el sábado como outing familiar — Amazon no puede replicar "deambular por warehouse y encontrar cosas"
2. **Frescos**: Carne, produce, dairy — los miembros quieren inspeccionar antes de comprar
3. **Tamaños**: Costco vende en cantidades industriales (24 rollos papel higiénico, 10 libras de arroz) que Amazon no transporta eficientemente
4. **Precio absoluto**: En comodities, Costco vence a Amazon por ~10-15% porque no paga last-mile

Incluso Amazon Business no ha logrado arrancarle Costco a nadie.

## Dividendos — Regular + Especiales

Costco paga dividendo regular desde 2004, subiéndolo cada año:

| Año | Dividendo anual |
|-----|-----------------|
| 2004 | $0.40 |
| 2014 | $1.42 |
| 2024 | $4.64 |
| 2026 proyectado | $5.80 |

**Pero el home run son los dividendos especiales**:

| Año | Dividendo especial | Monto total pagado |
|-----|---------------------|---------------------|
| 2012 | $7.00/share | $3.1B |
| 2015 | $5.00/share | $2.2B |
| 2017 | $7.00/share | $3.1B |
| 2020 | $10.00/share | $4.4B |
| 2023 | $15.00/share | $6.7B |
| ~2026-27 | ~$20-25 estimado | ~$9-11B |

La cadencia histórica es 3-4 años. El último fue enero 2023. **El próximo se espera entre fines 2026 e inicios 2027.**

## Métricas Financieras

| Métrica | Valor |
|---------|-------|
| **Precio** | $994.87 |
| **Market Cap** | $441.6B |
| **P/E TTM** | 51.65x |
| **P/E Forward** | 44.27x |
| **EPS TTM** | $19.26 |
| **Dividend Yield** | 0.59% |
| **Dividendo Anual Regular** | $5.80 |
| **52w High** | $1,067.08 |
| **52w Low** | $844.06 |
| **Drawdown desde high** | -6.8% |
| **Revenue 2025** | $275B |
| **Membership Fees 2025** | $5.4B |
| **Operating Margin** | 3.9% |
| **ROE** | 31% |
| **Free Cash Flow 2025** | $8.2B |

## Por Qué Ahora

### 1. Cerca de 52w High (Validación)
A -6.8% del high, COST no está "barato" — pero eso es exactamente lo que esperas de un compounder Clase A. Las empresas de calidad rara vez están con 30% de descuento. Cuando lo están, generalmente hay algo roto.

### 2. Subida de Fees Paga Dividendos
Septiembre 2024 subió Gold Star $60→$65 (+8%) y Executive $120→$130 (+8%). Eso fue efectivo enero 2025 — aún se está materializando en resultados.

### 3. Expansión Internacional Acelerando
COST abrió 28 warehouses en 2025, 30+ planeados 2026. Mercados nuevos: Suecia (primer warehouse marzo 2026), New Zealand, más stores en China.

### 4. Dividend Especial en Horizonte 2026-27
La cadencia histórica (2012, 2015, 2017, 2020, 2023) sugiere próximo especial entre fines 2026 - inicios 2027. $20-25/share implica ~$9-11B de retorno extra.

### 5. Tesis Amazon-Proof Comprobada
10 años de crecimiento consecutivo mientras el resto del retail físico sufría. Buffett dijo en 2024: *"Costco is one of the few retailers I'd bet against Amazon."*

## Riesgos

### 1. Valuación Premium
P/E 51.65x TTM es el rango alto de la historia de COST. No hay margen de error — cualquier miss en earnings o renovación impacta.

### 2. Miss en Renovación
Si renovación EE.UU./Canadá baja de 92%, la acción cae 15%+. Los miembros son fieles pero no indestructibles.

### 3. Inflación Persistente
Costco absorbe inflación en commodities (carne, dairy) para no romper la promesa de precio. Margin compression posible si inflación se acelera.

### 4. Shrinkage (Robo)
Creciendo en California, Washington state, NYC — afecta directamente margen. Costco está invirtiendo en tech de loss prevention.

### 5. Competencia de Sam's Club
Walmart ha invertido pesado en Sam's Club: same-day delivery, Scan & Go, apertura de 30+ nuevos warehouses. Primera vez que Sam's gana market share en 15 años.

### 6. Expansión Costosa
Warehouse nuevo ~$75-100M inversión inicial, 3-5 años para break-even. Mercados asiáticos más caros (China construcción, rentas).

### 7. Riesgo de Sucesión
Ron Vachris es nuevo CEO desde enero 2024 (reemplazó Craig Jelinek). Transiciones de CEO son riesgos culturales — Costco tiene cultura operacional únicamente disciplinada. Vachris es veterano Costco (30+ años), pero no es Sinegal ni Jelinek.

### 8. Dividend Yield Insignificante
0.59% — esto NO es una acción de ingreso. Si buscas flujo de dividendo mensual/trimestral, esto no es para ti. COST es appreciation + especiales + consistencia de 10% anual histórico.

## Conclusión

COST a $994.87 te permite comprar:
1. Un negocio de ~$5.4B anuales de ingreso recurrente tipo SaaS (membership fees con 93% renovación)
2. La tercera marca consumer más grande del mundo (Kirkland Signature - $85B)
3. 10 años de crecimiento consecutivo probado resistente a Amazon
4. Pricing power anclado (hot dog $1.50 desde 1985 — no es nostalgia, es ciencia del comportamiento)
5. Dividend especial esperado en 2026-27 ($20-25/share = 2-2.5% de retorno extra de golpe)

No es barato. Nunca ha sido barato. Y nunca lo será — porque el mercado sabe lo que está comprando. Esto es **pagar por calidad**, no por descuento.

Si tu tesis de inversión es "quiero ser dueño de los mejores negocios durante 20 años y dormir tranquilo", Costco es la definición.

---

*Research fecha: 21 Abr 2026 | Próxima revisión: Oct 2026*
*Esto no es asesoría financiera.*`,
    analyst_consensus: "Buy",
    analyst_target: 1100.0,
    analyst_upside: 10.6,
    status: "active",
    first_researched_at: "2026-04-21T00:00:00Z",
    last_updated_at: "2026-04-21T00:00:00Z",
    next_review_at: "2026-10-21T00:00:00Z",
  },
];

export const transactions: Transaction[] = [
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
    attestation_uid:
      "0x4700ba211099cdd5159136f822946fda4caf94786003daa2f31e897c4c4cc64e",
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
    attestation_uid:
      "0x6c123a1cdac305cadb4db2b2f567956dae137fabe6607920d8ad03477a031654",
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
    attestation_uid:
      "0x47b3420e81af2b6f66a83bb2610e1e78729d856c16363bcec44c70acd5773fb7",
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
    attestation_uid:
      "0x02681e36a3280be836e0486a792dfdaa4a97e59c902b74941d915ca81d46a3ad",
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
    attestation_uid:
      "0x89d62ba653a66d178af44df5bea9e8a509da595ffc6f88b449dae759c0e1a2b7",
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
    attestation_uid:
      "0x9a62a226366cc7c362e36d5a1027adc504ab881daea37df61a29026599b83ce0",
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
    attestation_uid:
      "0xfb51525d7df6812706a2fe803cf344ae34fd3860a8966dcbc941da1d48b1e053",
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
    attestation_uid:
      "0x7fd0653495ceaff4d3d5bbcbfe4d213f90e50c473ab2e4ae6bf556672e8b6077",
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
    attestation_uid:
      "0xf772ee64fddbf3bb06315295ae611dab53d9461fff3bdfe1e48a9db5a7bbf306",
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
    attestation_uid:
      "0x2c87240efb4fb0f66824a6416b8aa2563791791fffc8e9e4aa8501f36076c2f5",
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
    attestation_uid:
      "0xe7de44a8c2cfa055c437055dd231386dbc51d858f86932cc311fbac0361ee8a9",
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
    attestation_uid:
      "0x6d4e0c3e7bcf6102cbaae84b08142f55b8697a341d1b8f40d07383bcc40d2467",
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
    attestation_uid:
      "0x2d858818683171e4fc887763922c3652bf02703e75166adcb1495f71eb056a1b",
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
    attestation_uid:
      "0x279373f1568ed6c422a5336c9bb3453af68f1b444eeff27df80aa090e23c7874",
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
    attestation_uid:
      "0x9f4f3dab47c1eef663977ca14d3717ed2bef359489e2ad7c65f9fedb3b51a90d",
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
    attestation_uid:
      "0xa4c87db41e597b878735a2ec56d1ed3672d94971238c8270e73bb63c2fef6311",
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
    attestation_uid:
      "0x46afd01cb348e5a6afb164d6a68955ec1cb5a7ff0f1850ce3a789ff047fa66ba",
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
    attestation_uid:
      "0xc9d211392959bca6ee46a758c710d63255c1436bb879ab97ca5667e5711b5dd1",
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
    attestation_uid:
      "0x6f31b2b19ddcc6830b5b2bb1a6ea3df486f95f7df8099d7a6ace8f089e364589",
  },
  {
    id: 20,
    stock_id: 24,
    ticker: "LMT",
    type: "new" as const,
    cycle_number: 4,
    price: 610.17,
    date: "2026-03-24",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #20* — Mar 24, 2026\n\n🏢 *Lockheed Martin* (LMT) — $610.17\n\n🛍️ *Sus productos*: F-35 Lightning II (el caza más avanzado del mundo), HIMARS (el sistema que cambió la guerra en Ucrania), PAC-3 (defensa antimisiles), helicópteros Sikorsky, y la nave Orion de la NASA\n\n🌍 *Presencia*: EE.UU. (HQ), con contratos en ~50 países aliados. El contratista de defensa #1 del Pentágono y del mundo. Backlog récord de $194 mil millones.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.26% anual* solo por ser dueño — 24 años seguidos subiéndolo. Cada vez que un país aliado compra un F-35, un ejército reabastece misiles HIMARS, o la NASA lanza una misión con Orion — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Pentágono recortó compras de F-35 casi 50% en FY2026, cambiando enfoque a sostenimiento.\n\n🆕 Posición #20\n🔗 https://vectorialdata.com/stocks/LMT\n\n💡 Si LMT baja mañana, no pasa nada. Tú no compraste para mañana. Compraste para dentro de 5, 10, 20 años.`,
    attestation_uid:
      "0x5323d77dfa5f011d892cb2c4745fcccbfdc51a98a616be491431fd34a953d5d2",
  },
  {
    id: 21,
    stock_id: 25,
    ticker: "NOC",
    type: "new" as const,
    cycle_number: 5,
    price: 691.43,
    date: "2026-03-25",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #21* — Mar 25, 2026\n\n🏢 *Northrop Grumman* (NOC) — $691.43\n\n🛍️ *Sus productos*: B-21 Raider (el bombardero stealth más avanzado del mundo), ICBM Sentinel, drones Global Hawk y Triton, radares, satélites, sistemas de ciberseguridad\n\n🌍 *Presencia*: EE.UU. (HQ), operaciones de defensa y espacio en múltiples países aliados. El contratista de defensa #2 del Pentágono. Backlog récord de $95.7 mil millones.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.35% anual* solo por ser dueño — 23 años seguidos subiéndolo. Cada vez que un país aliado necesita un bombardero stealth, un satélite espacial, o un sistema de ciberseguridad — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El programa Sentinel ICBM tiene sobrecostos masivos y reestructuración en curso.\n\n🆕 Posición #21\n🔗 https://vectorialdata.com/stocks/NOC\n\n💡 Un café diario = $150/mes. $5 por pick = portafolio de 30 empresas pagándote dividendos. Misma plata, diferente futuro.`,
    attestation_uid:
      "0x5ddaea5314ebb9cf86ea294e44fedefa17790aaedc609ce3fbc5b467bcfadd82",
  },
  {
    id: 22,
    stock_id: 26,
    ticker: "GE",
    type: "new" as const,
    cycle_number: 5,
    price: 288.68,
    date: "2026-03-25",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #22* — Mar 25, 2026\n\n🏢 *GE Aerospace* (GE) — $288.68\n\n🛍️ *Sus productos*: Motores LEAP (Boeing 737 MAX / Airbus A320neo), GE9X (el motor más grande del mundo para el 777X), GEnx (Boeing 787), motores T700 para helicópteros militares\n\n🌍 *Presencia*: EE.UU. (HQ), operaciones globales. El fabricante de motores de avión #1 del mundo con 44,000+ motores instalados. JV con Safran (CFM International).\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.63% anual* solo por ser dueño. Cada vez que un avión despega con motores LEAP, GEnx o GE9X — y necesita mantenimiento después de miles de horas de vuelo — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Boeing 737 MAX sigue con problemas de producción que limitan entregas de motores LEAP.\n\n🆕 Posición #22\n🔗 https://vectorialdata.com/stocks/GE\n\n💡 Invertir no es un evento. Es un hábito. Como ir al gym — los resultados llegan con el tiempo, no con la intensidad.`,
    attestation_uid:
      "0x2cf4421d941a600c7e2ceabd98c56dbbce79cf4b141d6c96a532a9fed4a9ceac",
  },
  {
    id: 23,
    stock_id: 27,
    ticker: "HWM",
    type: "new" as const,
    cycle_number: 5,
    price: 227.90,
    date: "2026-03-27",
    day_of_week: "friday",
    wa_message: `📊 *STOCK PICK #23* — Mar 27, 2026\n\n🏢 *Howmet Aerospace* (HWM) — $227.90\n\n🛍️ *Sus productos*: Las piezas críticas DENTRO de los motores de avión — álabes que giran a 2,000° grados, sujetadores aeroespaciales, estructuras de titanio para fuselajes, y ruedas forjadas para camiones\n\n🌍 *Presencia*: EE.UU. (Pittsburgh), Francia, Alemania, UK, Japón, China, Australia — 38 plantas en 13+ países. Si un avión de Boeing o Airbus vuela, muy probablemente lleva piezas de Howmet.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.2% anual* solo por ser dueño — poco dividendo, pero la ganancia real está en el crecimiento. Cada vez que Boeing o Airbus necesitan piezas de motor que soporten temperaturas extremas, solo un puñado de empresas en el mundo pueden fabricarlas, y Howmet es la líder. Parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: La acción cotiza a P/E de 61x — está priced for perfection. Cualquier tropiezo en earnings puede causar una caída fuerte.\n\n🆕 Posición #23\n🔗 https://vectorialdata.com/stocks/HWM\n\n💡 Miles de personas en United States trabajan para Howmet Aerospace hoy. Generan ingresos, pagan dividendos, y tú eres dueño. Así funciona.`,
    attestation_uid:
      "0x91ed7c4b5460673449cfbbaadb61a1280d4dddf370232b366d73caf4c407c047",
  },
  {
    id: 24,
    stock_id: 28,
    ticker: "BG",
    type: "new" as const,
    cycle_number: 5,
    price: 126.28,
    date: "2026-03-30",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #24* — Mar 30, 2026\n\n🏢 *Bunge Global* (BG) — $126.28\n\n🛍️ *Sus productos*: Aceites de soya, canola, girasol y palma; harina de soya y trigo; margarina, mayonesa; materia prima para biocombustibles. Marcas: Delicia, Primor, Soya, Cyclus (Brasil), Dalda (India)\n\n🌍 *Presencia*: Suiza (sede), EE.UU. (HQ operativo), Brasil, Argentina, Canadá, Europa, India, China — 300+ instalaciones en 40+ países. El procesador de oleaginosas #1 del mundo tras fusionarse con Viterra.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.22% anual* solo por ser dueño. Cada vez que cocinas con aceite de soya, canola o girasol — ya sea en tu casa o en un restaurante — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Dependencia de los precios de commodities agrícolas que son cíclicos.\n\n🆕 Posición #24\n🔗 https://vectorialdata.com/stocks/BG\n\n💡 La diferencia entre alguien que invierte y alguien que no, no es el dinero. Es la decisión de empezar.`,
    attestation_uid:
      "0x338e6a247db294f9066e034e5b4b2797ee4f72e7a97bad4f84690d8cad3ab48f",
  },
  {
    id: 25,
    stock_id: 29,
    ticker: "BIDU",
    type: "new" as const,
    cycle_number: 5,
    price: 106.60,
    date: "2026-03-30",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #25* — Mar 30, 2026\n\n🏢 *Baidu* (BIDU) — $106.60\n\n🛍️ *Sus productos*: Baidu Search (el Google de China, 65%+ market share), Baidu AI Cloud, Apollo Go (robotaxis autónomos con 20M+ viajes), ERNIE Bot (chatbot IA con 200M+ usuarios), iQIYI (streaming)\n\n🌍 *Presencia*: China (Beijing HQ), con Apollo Go expandiéndose a Dubai, Abu Dhabi, Corea del Sur, Londres y Suiza. 22+ ciudades con robotaxis autónomos.\n\n💵 *Tu nuevo ingreso*: Esta empresa acaba de anunciar su *primer dividendo en la historia* solo por ser dueño. Cada vez que alguien en China busca algo en internet, pide un robotaxi autónomo, o habla con el chatbot ERNIE — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Revenue total cayó -3% en 2025. Negocio legacy de búsqueda en declive. Riesgo regulatorio chino y tensiones geopolíticas EE.UU.-China.\n\n🆕 Posición #25\n🔗 https://vectorialdata.com/stocks/BIDU\n\n💡 Con $3 compras una fracción de Baidu. Con $50 también. Lo que importa no es cuánto, es que lo hagas SIEMPRE.`,
    attestation_uid:
      "0x347404c4f2359227bd43524f46a6a07b9eb8f3118592055f95d57381b5dbb6a1",
  },
  {
    id: 26,
    stock_id: 30,
    ticker: "BKNG",
    type: "new" as const,
    cycle_number: 6,
    price: 168.17, // Split-adjusted (1:25 split, pre-split: $4204.22)
    date: "2026-03-31",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #26* — Mar 31, 2026\n\n🏢 *Booking Holdings* (BKNG) — $168.17\n\n🛍️ *Sus marcas*: Booking.com, Priceline, Kayak, Agoda, OpenTable\n\n🌍 *Presencia*: EE.UU. (Norwalk, CT), Ámsterdam, y operaciones en 220+ países. La plataforma de viajes en línea más grande del mundo con $186B en reservas brutas al año.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.02% anual* solo por ser dueño. Cada vez que alguien reserva un hotel, busca un vuelo, o reserva un restaurante en Booking.com, Priceline o OpenTable — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Regulación EU (Digital Markets Act) puede forzar a Booking.com a eliminar cláusulas de paridad de precios.\n\n🆕 Posición #26\n🔗 https://vectorialdata.com/stocks/BKNG\n\n💡 Mejor $3 por pick durante 3 años que $50 por pick y parar a los 2 meses. Consistencia > cantidad.`,
    attestation_uid:
      "0x3e90c1d750fc5e10a316615cd530eabfb46604ec5467c2a65ddaf509149f4510",
  },
  {
    id: 27,
    stock_id: 31,
    ticker: "BLK",
    type: "new" as const,
    cycle_number: 6,
    price: 962.11,
    date: "2026-03-31",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #27* — Mar 31, 2026\n\n🏢 *BlackRock* (BLK) — $962.11\n\n🛍️ *Sus marcas*: iShares (ETFs #1 global), Aladdin (plataforma de riesgo para $25T+), BlackRock Funds, HPS Investment Partners\n\n🌍 *Presencia*: EE.UU. (Nueva York), con oficinas en 30+ países. El administrador de activos más grande del mundo con $14 trillones bajo gestión.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.4% anual* solo por ser dueño. Cada vez que alguien compra un ETF iShares, invierte en un fondo BlackRock, o una institución usa la plataforma Aladdin — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Caídas de mercado reducen directamente los ingresos de BlackRock ya que cobra comisiones como porcentaje de los activos bajo gestión.\n\n🆕 Posición #27\n🔗 https://vectorialdata.com/stocks/BLK\n\n💡 Tu presupuesto mensual ÷ 30 = lo que compras de cada pick. Siempre igual. Así de simple.`,
    attestation_uid:
      "0x5679687dfc638864b6ffa3bc057747711218b5cbee94218e2268ebcc66a71e82",
  },
  {
    id: 28,
    stock_id: 32,
    ticker: "BTI",
    type: "new" as const,
    cycle_number: 6,
    price: 57.89,
    date: "2026-04-02",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #28* — Apr 2, 2026\n\n🏢 *British American Tobacco* (BTI) — $57.89\n\n🛍️ *Sus marcas*: Lucky Strike, Dunhill, Pall Mall, Camel, Kent, Vuse (#1 mundial en vaping), glo (tabaco calentado), Velo (nicotine pouches)\n\n🌍 *Presencia*: Reino Unido (Londres), operando en 180+ mercados. La segunda tabacalera más grande del mundo.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *5.71% anual* solo por ser dueño. Cada vez que alguien enciende un Lucky Strike, usa un Vuse, o compra Dunhill en un duty-free — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: La regulación global contra el tabaco sigue endureciéndose — prohibiciones de sabores en vaping, restricciones publicitarias y posibles impuestos adicionales.\n\n🆕 Posición #28\n🔗 https://vectorialdata.com/stocks/BTI\n\n💡 Miles de personas en United Kingdom trabajan para British American Tobacco hoy. Generan ingresos, pagan dividendos, y tú eres dueño. Así funciona.`,
    attestation_uid:
      "0x1cdc0fa4250b258698aab7259069a9e7877dc1b6637af7784fdca74f64285d98",
  },
  {
    id: 29,
    stock_id: 33,
    ticker: "MDLZ",
    type: "new" as const,
    cycle_number: 6,
    price: 57.03,
    date: "2026-04-02",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #29* — Apr 2, 2026\n\n🏢 *Mondelez International* (MDLZ) — $57.03\n\n🛍️ *Sus marcas*: Oreo (#1 mundial en galletas), Cadbury, Milka, Toblerone, Philadelphia, Trident, Tang, Ritz, belVita, Halls\n\n🌍 *Presencia*: Estados Unidos (Chicago), operando en 150+ países. Una de las compañías de snacks más grandes del mundo.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *3.5% anual* solo por ser dueño. Cada vez que alguien abre un paquete de Oreo, compra un Toblerone en el aeropuerto, o unta Philadelphia en su pan — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Los costos de materias primas (especialmente cacao y azúcar) han disparado presión sobre márgenes — el precio del cacao se triplicó en 2024-2025, y aunque está bajando, la volatilidad persiste.\n\n🆕 Posición #29\n🔗 https://vectorialdata.com/stocks/MDLZ\n\n💡 Dato: en la crisis de 2008, las ventas de Oreo SUBIERON. Cuando la economía se pone fea, la gente deja restaurantes y lujos, pero NO deja sus snacks de $2. Se llama "efecto lipstick" — y es exactamente por qué Mondelez aguanta recesiones mejor que el 90% de las empresas.`,
    attestation_uid:
      "0xb538f0e41529806eb85aa18e23d29eca91f94b8d6090cd1fbb89154e2b3c282f",
  },
  {
    id: 30,
    stock_id: 34,
    ticker: "ZTS",
    type: "new" as const,
    cycle_number: 6,
    price: 118.08,
    date: "2026-04-06",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #30* — Apr 6, 2026\n\n🏢 *Zoetis Inc* (ZTS) — $118.08\n\n🛍️ *Sus productos*: Simparica Trio (antiparasitario #1), Apoquel/Cytopoint (dermatología canina), Librela/Solensia (dolor artritis mascotas), vacunas y diagnósticos veterinarios\n\n🌍 *Presencia*: Estados Unidos (New Jersey), operando en 100+ países con 29 plantas de manufactura. La empresa #1 en salud animal del mundo — spin-off de Pfizer.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.7% anual* solo por ser dueño. Cada vez que alguien lleva su perro al veterinario, le pone su antiparasitario mensual, o un ganadero vacuna su ganado — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: La FDA está investigando Librela (perros) y Solensia (gatos) por efectos adversos neurológicos — se han reportado más de 2,300 muertes de mascotas.\n\n🆕 Posición #30\n🔗 https://vectorialdata.com/stocks/ZTS\n✅ Certificado por blockchain → vectorialdata.com/verify/ZTS\n\n💡 Pregunta incómoda: ¿por qué Zoetis Inc vale $118 y no la mitad o el doble? Porque el precio es el consenso de millones de personas apostando con dinero real. Cuando compras a $118, dices "creo que vale más". Si el negocio sigue creciendo, el tiempo te dará la razón — así se construye riqueza en la bolsa.`,
    attestation_uid:
      "0xf4859b5ce908b5073c1d78f4477c494b5e90cc08a83ea9da09d08dc09176db87",
  },
  {
    id: 31,
    stock_id: 35,
    ticker: "MLI",
    type: "new" as const,
    cycle_number: 7,
    price: 112.67,
    date: "2026-04-06",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #31* — Apr 6, 2026\n\n🏢 *Mueller Industries* (MLI) — $112.67\n\n🛍️ *Sus productos*: Tubería de cobre Streamline® (#1 en plomería profesional), conexiones de cobre, válvulas, componentes HVAC y refrigeración, fundición de latón y aluminio\n\n🌍 *Presencia*: Estados Unidos (Tennessee), con operaciones en América del Norte. Fabricando productos de cobre esenciales desde 1917 — ~4,800 empleados.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.9% anual* solo por ser dueño. Cada vez que se construye una casa, se instala un aire acondicionado, o se renueva la plomería de un edificio — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Mueller depende del precio del cobre — si los precios caen significativamente, los márgenes se comprimen y el revenue puede caer.\n\n🆕 Posición #31\n🔗 https://vectorialdata.com/stocks/MLI\n✅ Certificado por blockchain → vectorialdata.com/verify/MLI\n\n💡 MLI cuesta $113 hoy. Hace 10 años costaba una fracción. ¿Por qué subió? Porque cada año ganó más dinero, y el mercado recompensó esas ganancias con un precio más alto. No es magia: más ganancias → más valor → precio sube. Por eso invertimos en empresas que CRECEN.`,
    attestation_uid:
      "0xbd7e421ea0ee71571f65727e78fccb98dbdb30fc02167755ea1200e1aec343df",
  },
  {
    id: 32,
    stock_id: 2,
    ticker: "ROP",
    type: "new" as const,
    cycle_number: 7,
    price: 360.46,
    date: "2026-04-06",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #32* — Apr 6, 2026\n\n🏢 *Roper Technologies* (ROP) — $360.46\n\n🛍️ *Sus productos*: Vertafore (seguros), Deltek (gobierno), Aderant (bufetes legales), DAT (freight #1 en Norteamérica), CentralReach (terapia autismo), Foundry (efectos visuales Hollywood)\n\n🌍 *Presencia*: Estados Unidos (Florida), operando globalmente con 18,000+ empleados. El "Berkshire Hathaway del software" — 85%+ revenue recurrente de software vertical dominante en nichos.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.95% anual* solo por ser dueño. Cada vez que un abogado usa su software, un contratista del gobierno gestiona un proyecto, o un broker de freight conecta una carga — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El modelo de Roper depende de adquirir negocios de software a múltiplos atractivos — con $9.5B en deuda, si los múltiplos suben o las adquisiciones fallan, el flywheel se desacelera.\n\n🆕 Posición #32\n🔗 https://vectorialdata.com/stocks/ROP\n✅ Certificado por blockchain → vectorialdata.com/verify/ROP\n\n💡 El CEO de Roper Technologies gana más en un día que la mayoría en un año. Pero hay un detalle: tú puedes ganar cada vez que él gana. Así funcionan las acciones.`,
    attestation_uid:
      "0x00e11de53b0a332029189046e1d1308b5562b91c9e3750e5be2a6bc52581f417",
  },
  {
    id: 33,
    stock_id: 36,
    ticker: "BX",
    type: "new" as const,
    cycle_number: 7,
    price: 117.67,
    date: "2026-04-08",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #33* — Apr 8, 2026\n\n🏢 *Blackstone Inc.* (BX) — $117.67\n\n🛍️ *Sus marcas*: Hilton (inversión histórica), Bumble (app de citas), Ancestry.com (genealogía), centros de datos para AI ($55B+), Hipgnosis (derechos musicales)\n\n🌍 *Presencia*: Global — EE.UU., Europa, Asia, India, Japón, Australia. El gestor de activos alternativos más grande del mundo con $1.27 trillones bajo gestión.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *4.2% anual* solo por ser dueño. Cada vez que alguien se hospeda en un Hilton, hace match en Bumble, busca sus antepasados en Ancestry, o una empresa renta un centro de datos de Blackstone para AI — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El riesgo principal es la sensibilidad a tasas de interés y ciclos de mercado — si las tasas se mantienen altas, las valuaciones de real estate y private equity se comprimen.\n\n🆕 Posición #33\n🔗 https://vectorialdata.com/stocks/BX\n✅ Certificado por blockchain → vectorialdata.com/verify/BX\n\n💡 Blackstone Inc. paga 4.2% anual de dividendo. Eso es dinero que llega a tu cuenta sin que hagas nada. Automático.`,
    attestation_uid:
      "0x3cba824247397ef2a7e8d35ebf6a537b41f44f5b2bc515d3f332f9dceafb4660",
  },
  {
    id: 34,
    stock_id: 13,
    ticker: "CAIXY",
    type: "rebuy" as const,
    cycle_number: 7,
    price: 4.12,
    date: "2026-04-08",
    day_of_week: "wednesday",
    wa_message: `🔄 *RECOMPRA* — Apr 8, 2026\n\n🏢 *CaixaBank S.A.* (CAIXY) — $4.12\n🛍️ CaixaBank (banco #1 de España), imagin (banco digital), VidaCaixa (seguros), BPI (Portugal)\n\n💵 Seguimos acumulando ingreso del *4.82% anual*.\n💪 *¿Por qué recompramos?* Nuestra convicción es tan alta que estamos aumentando la posición. Comprar a diferentes precios reduce tu riesgo promedio.\n\n🔄 Recompra #34\n🔗 https://vectorialdata.com/stocks/CAIXY\n✅ Certificado por blockchain → vectorialdata.com/verify/CAIXY\n\n🆕 *¿Nuevo en el portafolio?* Esta puede ser tu primera posición en CAIXY. Ve el research completo: vectorialdata.com/stocks/CAIXY\n\n💡 Con 4.82% de dividendo, CAIXY duplica tu inversión solo en dividendos en ~15 años. Sin que suba de precio.`,
    attestation_uid:
      "0xb59a7d029639108ecc279f6ac2df8331057fc5a613a0f07ed7c851211de7a59d",
  },
  {
    id: 35,
    stock_id: 37,
    ticker: "IEX",
    type: "new" as const,
    cycle_number: 7,
    price: 197.85,
    date: "2026-04-08",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #35* — Apr 8, 2026\n\n🏢 *IDEX Corporation* (IEX) — $197.85\n\n🛍️ *Sus productos*: Bombas Viking, herramientas de rescate Jaws of Life, bombas contra incendios Hale, sistemas de sujeción BAND-IT, componentes para data centers y semiconductores\n\n🌍 *Presencia*: Estados Unidos y +20 países. Fabricante de bombas de precisión y tecnología de fluidos para mercados de misión crítica — desde bomberos hasta laboratorios y centros de datos.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.48% anual* solo por ser dueño. Cada vez que un camión de bomberos usa una bomba Hale, un laboratorio usa componentes IDEX, o un data center instala enfriamiento líquido — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El riesgo principal es la valuación premium — a P/E de 30.87x y forward ~24x, IDEX cotiza cara para una industrial con crecimiento orgánico modesto.\n\n🆕 Posición #35\n🔗 https://vectorialdata.com/stocks/IEX\n✅ Certificado por blockchain → vectorialdata.com/verify/IEX\n\n💡 El dividendo de IEX se reinvierte → compra más fracciones → genera más dividendo → compra más fracciones. Eso es interés compuesto.`,
    attestation_uid:
      "0x21f02a91b3893cc833a29444e9d3e005df5f7e5eafd02acc4394bfe7e995c3e6",
  },
  {
    id: 36,
    stock_id: 38,
    ticker: "CALM",
    type: "new" as const,
    cycle_number: 8,
    price: 77.72,
    date: "2026-04-09",
    day_of_week: "wednesday",
    wa_message: `📊 *STOCK PICK #36* — Apr 9, 2026\n\n🏢 *Cal-Maine Foods* (CALM) — $77.72\n\n🛍️ *Sus marcas*: Egg-Land's Best, Land O'Lakes, Farmhouse Eggs, Sunups, Crepini (egg wraps y pancakes)\n\n🌍 *Presencia*: Estados Unidos — el mayor productor de huevos del país (~20% del mercado), con granjas en Mississippi, Arkansas, Florida, Alabama y +10 estados.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *~3.4% anual* solo por ser dueño. Cada vez que alguien compra huevos en el supermercado, desayuna un omelette o usa un egg wrap Crepini — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Los ingresos de Cal-Maine dependen casi 100% del precio de los huevos — commodity extremadamente volátil por gripe aviar, costos de alimentación y regulación.\n\n🆕 Posición #36\n🔗 https://vectorialdata.com/stocks/CALM\n✅ Certificado por blockchain → vectorialdata.com/verify/CALM\n\n💡 Cal-Maine tiene una política de dividendo que casi ninguna empresa usa: te pagan exactamente 1/3 de lo que ganan cada trimestre. ¿Qué significa? Que cuando el precio del huevo sube, tu dividendo se dispara — hubo trimestres donde el yield llegó a +10%. Cuando baja, el dividendo baja también. Es como ser socio real del negocio: ganas cuando ganan. Alinea tus intereses con los de la empresa al 100%.`,
    attestation_uid:
      "0xb8848e79df28d19e195819dc5c0b4e9ca7aeeab8d8ca500655e3721b758bdd2e",
  },
  {
    id: 37,
    stock_id: 39,
    ticker: "CCJ",
    type: "new" as const,
    cycle_number: 8,
    price: 116.66,
    date: "2026-04-10",
    day_of_week: "friday",
    wa_message: `📊 *STOCK PICK #37* — Apr 10, 2026\n\n🏢 *Cameco Corporation* (CCJ) — $116.66\n\n⛏️ *Su producto*: Uranio — el combustible que mueve los reactores nucleares del mundo. Dueños de McArthur River (Saskatchewan), la mina de uranio más concentrada del planeta, y del 49% de Westinghouse (reactores nucleares AP1000 y AP300).\n\n🌍 *Presencia*: Canadá (Saskatoon HQ), con minas en Saskatchewan y joint venture en Kazajistán. Contratos de suministro con utilities nucleares en EE.UU., Europa, Asia y el Golfo — el productor de uranio más grande del mundo occidental.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.21% anual* solo por ser dueño — poco dividendo, pero la ganancia real está en el crecimiento. Cada vez que un reactor nuclear genera electricidad en Europa, Asia o EE.UU. — y cada vez que Microsoft, Google o Amazon firman un contrato para alimentar sus data centers de AI con energía nuclear — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Valuación muy alta (P/E forward 54x) y dependencia total del precio del uranio, que es cíclico.\n\n🆕 Posición #37\n🔗 https://vectorialdata.com/stocks/CCJ\n✅ Certificado por blockchain → vectorialdata.com/verify/CCJ\n\n💡 Dato que casi nadie sabe: cuando Microsoft firmó para reactivar Three Mile Island en 2024, cuando Amazon invirtió en X-energy, y cuando Google cerró con Kairos Power — todos llegaron a la misma conclusión. Los data centers de AI necesitan energía 24/7 sin carbono, y solo el nuclear da las 3 cosas a la vez. Cameco es dueña del combustible que hace posible esa electricidad — y de la mina McArthur River, que es ~100x más concentrada que el uranio normal. Por eso una apuesta al boom de AI es también una apuesta al uranio.`,
    attestation_uid:
      "0xd6537a82ef066d3ecacb03b64f49bb9c414bf42eedb653840977b9bf8c271dd2",
  },
  {
    id: 38,
    stock_id: 40,
    ticker: "CRRFY",
    type: "new" as const,
    cycle_number: 8,
    price: 3.94,
    date: "2026-04-14",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #38* — Apr 14, 2026\n\n🏢 *Carrefour SA* (CRRFY) — $3.94\n\n🛒 *Sus marcas y formatos*: Carrefour (hipermercados, supermercados, express), Atacadão (cash & carry líder de Brasil), Supeco (discount), Carrefour Bio, Promocash\n\n🌍 *Presencia*: Francia (#1 en hipermercados), Brasil (#2 con Atacadão), España (#2), Italia, Bélgica, Polonia, Rumania, Argentina, Medio Oriente y África — 14,000+ tiendas en 30+ países.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *5.36% anual* solo por ser dueño. Cada vez que alguien llena su carrito en un Carrefour en París, hace las compras del mes en un Atacadão en São Paulo, o carga gasolina en una estación Carfuel — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: Los márgenes del sector retail de alimentos son ultra-delgados (~2-3% neto), lo que deja poco margen de error operativo ante aumentos de costos.\n\n🆕 Posición #38\n🔗 https://vectorialdata.com/stocks/CRRFY\n✅ Certificado por blockchain → vectorialdata.com/verify/CRRFY\n\n💡 Dato curioso: Carrefour inventó el concepto de hipermercado en 1963 — la idea de meter comida, ropa, electrónica y hogar bajo un mismo techo gigante. Hoy, 60+ años después, tienen 14,000 tiendas en 30+ países. Pero la joya escondida no está en Francia: es Atacadão en Brasil, un formato cash & carry donde la gente compra al mayoreo a precios de distribuidor. Atacadão crece más rápido que todo el grupo y ya representa ~23% del revenue total. Tú compraste el segundo retailer más grande del mundo por menos de $4 la acción y con 5.36% de dividendo — literalmente te pagan por esperar.`,
    attestation_uid: "0xf948085fe6c9d000aa10457f7c37b041a469343257973ba9eb7486569876c423",
  },
  {
    id: 39,
    stock_id: 41,
    ticker: "CDNS",
    type: "new" as const,
    cycle_number: 8,
    price: 293.32,
    date: "2026-04-14",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #39* — Apr 14, 2026\n\n🏢 *Cadence Design Systems* (CDNS) — $293.32\n\n🔧 *Sus productos*: Software de diseño electrónico (EDA) — las herramientas que diseñan TODOS los chips del mundo. Virtuoso, Innovus, Spectre, Allegro, Palladium, Cerebrus (AI).\n\n🌍 *Presencia*: Estados Unidos (San José HQ), con 10,000+ empleados en 30+ países. Clientes: Apple, NVIDIA, AMD, Qualcomm, Intel, Samsung, TSMC — literalmente toda la industria de semiconductores.\n\n💵 *Tu nuevo ingreso*: Esta empresa no paga dividendo — reinvierte cada centavo en crecer. Pero aquí está el truco: Cadence es la mitad del duopolio que diseña todos los chips del mundo. Sin su software, no existiría tu iPhone, ni las GPUs que entrenan ChatGPT, ni los servidores de Amazon. El retorno viene de ser dueño de algo irremplazable.\n\n⚠️ *El riesgo*: Valuación cara (P/E 72x) — no deja margen de error. Cualquier miss en resultados puede causar caídas fuertes.\n\n🆕 Posición #39\n🔗 https://vectorialdata.com/stocks/CDNS\n✅ Certificado por blockchain → vectorialdata.com/verify/CDNS\n\n💡 Dato que parece inventado pero no lo es: CADA chip moderno — el A18 de tu iPhone, los H100 de NVIDIA que entrenan modelos de AI, los procesadores de tu laptop — fue diseñado usando software de Cadence o Synopsys. No hay opción 3. Son las "herramientas de herrería" de la revolución tecnológica: invisibles pero absolutamente esenciales. Los ingenieros se entrenan por años en estas herramientas — cambiar de proveedor tomaría una década y miles de millones. Por eso ~80% del revenue es recurrente y por eso, aunque no paga dividendo, Cadence tiene uno de los moats más profundos de toda la tecnología.`,
    attestation_uid: "0xce5b96efba3c1dd8409ca9e0f768efffc9ae05e8449d1115a980850cd0d8d25a",
  },
  {
    id: 40,
    stock_id: 42,
    ticker: "PNR",
    type: "new" as const,
    cycle_number: 8,
    price: 90.81,
    date: "2026-04-14",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #40* — Apr 14, 2026\n\n🏢 *Pentair plc* (PNR) — $90.81\n\n🔧 *Sus marcas y productos*: Pentair (tratamiento de agua), Everpure (filtración para restaurantes/hoteles), RainSoft (residencial premium), Kreepy Krauly (limpiadores de piscinas), Sta-Rite (bombas), Manitowoc Ice (máquinas de hielo comerciales), Pleatco (filtros)\n\n🌍 *Presencia*: Estados Unidos (Golden Valley, Minnesota HQ), con operaciones en 150+ países y ~10,500 empleados. Líder en equipos de piscinas en EE.UU. y tratamiento de agua a nivel global.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.14% anual* solo por ser dueño — y lleva *47 años consecutivos* aumentando ese dividendo (Dividend Aristocrat). Cada vez que un restaurante filtra agua con Everpure, alguien enciende la bomba de su piscina, o un hotel produce hielo con Manitowoc — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El segmento de piscinas (~35% del revenue) es cíclico y sensible al clima, tasas de interés y construcción de viviendas.\n\n🆕 Posición #40\n🔗 https://vectorialdata.com/stocks/PNR\n✅ Certificado por blockchain → vectorialdata.com/verify/PNR\n\n💡 Pentair lleva 47 años consecutivos aumentando su dividendo — eso lo convierte en un "Dividend Aristocrat" (se necesitan 25+ años para entrar al club). ¿Qué significa para ti? Que esta empresa ha aumentado tu pago cada año SIN FALTA durante recesiones, crisis financieras, pandemias y guerras. Solo 65 empresas en el S&P 500 tienen este récord. Y lo más interesante: el payout ratio es solo 26% — es decir, solo reparten una cuarta parte de lo que ganan. Tienen espacio de sobra para seguir aumentándolo por décadas.`,
    attestation_uid: "0x4768b0ac8ddbe3d93569f06e67a523a5ee269ae241f540ee301b0d18169ab607",
  },
  {
    id: 41,
    stock_id: 43,
    ticker: "MCD",
    type: "new" as const,
    cycle_number: 9,
    price: 306.26,
    date: "2026-04-15",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #41* — Apr 15, 2026\n\n🏢 *McDonald's Corporation* (MCD) — $306.26\n\n🛍️ *Sus marcas*: Big Mac, McNuggets, McCafé, McFlurry, Happy Meal, McDelivery, Egg McMuffin, Quarter Pounder\n\n🌍 *Presencia*: Global — 45,000+ restaurantes en 100+ países. La cadena de comida rápida más grande del mundo.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.43% anual* solo por ser dueño. Cada vez que alguien pide un Big Mac, un Happy Meal para sus hijos, o un McCafé en la mañana — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El riesgo principal es la presión sobre el consumidor de bajos ingresos: el CEO advirtió de una 'economía de dos niveles' donde el tráfico de clientes de menores ingresos ha caído ~10%.\n\n🆕 Posición #41\n🔗 https://vectorialdata.com/stocks/MCD\n✅ Certificado por blockchain → vectorialdata.com/verify/MCD\n\n💡 Dato que cambia cómo ves los Golden Arches: McDonald's no es una empresa de hamburguesas — es una empresa de bienes raíces. Posee o arrienda los terrenos de la mayoría de sus 45,000 restaurantes y cobra renta + regalías a los franquiciatarios. Solo el ~5% de las tiendas son operadas directamente. Por eso el margen operativo es del 46% — absurdo para un negocio de comida. Y lleva 50 años consecutivos aumentando su dividendo (Dividend Aristocrat). Eso significa que ha subido tu pago cada año sin falta durante recesiones, crisis y pandemias.`,
    attestation_uid: "0x6d83f3eea183aa808d0b0f4fb55ca97b9a77762c46cf621549a2438312e41b04",
  },
  {
    id: 42,
    stock_id: 44,
    ticker: "WFAFY",
    type: "new" as const,
    cycle_number: 9,
    price: 26.73,
    date: "2026-04-15",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #42* — Apr 15, 2026\n\n🏢 *Wesfarmers Ltd* (WFAFY) — $26.73\n\n🛍️ *Sus marcas*: Bunnings (el "Home Depot" australiano), Kmart, Officeworks, Priceline (farmacias), Anko (marca propia), Blackwoods\n\n🌍 *Presencia*: Australia y Nueva Zelanda — el conglomerado más grande de Australia con 120,000+ empleados. También tiene una mina de litio (Mt Holland) en joint venture con SQM.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *3.5% anual* solo por ser dueño. Cada vez que un australiano compra herramientas en Bunnings, ropa en Kmart, útiles en Officeworks, o medicinas en Priceline — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El riesgo principal es la valuación elevada: P/E forward de 33x es caro para un conglomerado retail, lo que limita el upside y amplifica las caídas si los resultados decepcionan.\n\n🆕 Posición #42\n🔗 https://vectorialdata.com/stocks/WFAFY\n✅ Certificado por blockchain → vectorialdata.com/verify/WFAFY\n\n💡 Bunnings no es simplemente una ferretería — es una institución cultural en Australia. Los australianos van los fines de semana como ritual, a comer "sausage sizzle" (salchicha a la parrilla a la entrada) y a pasear. Con A$23.4 billones en ventas anuales, es más grande que Home Depot en proporción al tamaño de su mercado. Pero la joya escondida de Wesfarmers no está en las tiendas: es su mina de litio Mt Holland, que ya produce espodumeno y está arrancando una refinería de hidróxido de litio. Si el litio despega con los autos eléctricos, tienes exposición a eso también — sin haber comprado una empresa minera pura.`,
    attestation_uid: "0xde0de2a842e9e3d4ec4cb07b0438307437b118b4beacc6a58d36e0ef0d9b8eb5",
  },
  {
    id: 43,
    stock_id: 45,
    ticker: "ESLOY",
    type: "new" as const,
    cycle_number: 9,
    price: 122.75,
    date: "2026-04-15",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #43* — Apr 15, 2026\n\n🏢 *EssilorLuxottica* (ESLOY) — $122.75\n\n🛍️ *Sus marcas*: Ray-Ban, Oakley, Persol, Oliver Peoples, Vogue Eyewear, Costa Del Mar. Fabrican las Ray-Ban Meta (smart glasses con AI). Tiendas: LensCrafters, Sunglass Hut, Pearle Vision, Target Optical.\n\n🌍 *Presencia*: Global — HQ en Paris + Milán. Controlan ~60% del mercado de eyewear en EE.UU. y 42% del mercado mundial de lentes correctivos. Integración vertical total: fabrican los lentes, diseñan las monturas, venden al menudeo, y aseguran (EyeMed).\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *1.87% anual* solo por ser dueño. Cada vez que alguien compra lentes en LensCrafters, se pone unos Ray-Ban, usa anteojos Oakley en el gym, o pide sus smart glasses Ray-Ban Meta — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: La competencia de Apple en smart glasses (producción prevista diciembre 2026, lanzamiento 2027) amenaza la ventaja actual de Ray-Ban Meta — fue el detonante principal de la caída del 34% desde máximos.\n\n🆕 Posición #43\n🔗 https://vectorialdata.com/stocks/ESLOY\n✅ Certificado por blockchain → vectorialdata.com/verify/ESLOY\n\n💡 Dato que casi nadie conecta: cada Ray-Ban Meta que ves en la calle — los smart glasses con cámara, parlante y AI — está fabricado por EssilorLuxottica. Vendieron 7 millones de unidades en 2025 (vs 2 millones acumuladas en 2023+2024). El mercado de smart glasses pasará de $1.2B este año a $5.6B en 2026, y EssilorLuxottica + Meta lideran con distancia. En 2026 lanzan versiones Oakley (deporte) y Prada (luxury). Cuando Apple finalmente entre en 2027, se topará con una empresa que ya lleva 4+ años fabricando millones de smart glasses — y que además controla el 60% del retail óptico en EE.UU. La caída del 34% desde el pico es miedo a Apple. Pero el miedo crea oportunidades.`,
    attestation_uid: "0x463bc6ed92ed891de6e44f718ad5dbc8e7434be075c9da0b578161e5d4ce5179",
  },
  {
    id: 44,
    stock_id: 46,
    ticker: "CEG",
    type: "new" as const,
    cycle_number: 9,
    price: 295.49,
    date: "2026-04-17",
    day_of_week: "friday",
    wa_message: `📊 *STOCK PICK #44* — Apr 17, 2026\n\n🏢 *Constellation Energy* (CEG) — $295.49\n\n🛍️ *Sus líneas/operaciones*: Energía nuclear (22 GW — la flota #1 de EE.UU.), gas natural (fleet de Calpine), eólica, solar e hidráulica. Opera el reactor Unit 1 de Three Mile Island (rebautizado Crane Clean Energy Center — contratado por Microsoft), Byron, Braidwood, Clinton, Dresden, Peach Bottom, Nine Mile Point. Retail: Constellation (electricidad a hogares y empresas).\n\n🌍 *Presencia*: EE.UU. — HQ en Baltimore, Maryland. Tras la compra de Calpine en enero 2026 son la mayor productora de electricidad del país: 55 GW de capacidad, suficientes para ~27M de hogares, ~10% de la electricidad sin carbono de EE.UU.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.57% anual* solo por ser dueño. Cada vez que enciendes la luz, cargas tu teléfono, o un data center de Microsoft entrena un modelo de AI — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El retraso del restart de Three Mile Island (Crane Clean Energy Center) hasta 2031 por cuellos de botella en la transmisión de PJM decepcionó al mercado — fue el detonante de la caída del 28% desde máximos.\n\n🆕 Posición #44\n🔗 https://vectorialdata.com/stocks/CEG\n✅ Certificado por blockchain → vectorialdata.com/verify/CEG\n\n💡 Dato que cambia cómo ves la acción: en septiembre de 2024, Microsoft firmó con Constellation un contrato de 20 años para absorber TODA la producción del reactor Unit 1 de Three Mile Island — 835 MW dedicados exclusivamente a entrenar AI. Primera vez en la historia que una hyperscaler paga para reactivar un reactor nuclear retirado. ¿Por qué? Los data centers de AI consumen electricidad 24/7, y solo nuclear puede dar baseload limpio sin parar (solar y viento son intermitentes). GPT-5, Copilot, Azure AI — todo eso corre con energía, y esa energía tiene que venir de algún lado. Amazon hizo algo similar con Talen. Meta firmó con Constellation para el reactor Clinton. Google está negociando. CEG no está vendiendo electricidad para casas — está vendiendo el combustible de la era de la AI. Por eso a $295 compras la utility #1 de EE.UU. con 28% de descuento; el mercado se asustó porque el restart de Crane se retrasa a 2031 en vez de 2028. Pero el contrato con Microsoft sigue firmado, y el gasto global en data centers proyecta +$500B en 2026. El miedo al timing abrió la puerta al precio.`,
    attestation_uid: "0xa7b19c642a63da503023afcc2b25dc3be73530cbe093985ef3159996713f6512",
  },
  {
    id: 45,
    stock_id: 47,
    ticker: "CNI",
    type: "new" as const,
    cycle_number: 9,
    price: 110.26,
    date: "2026-04-20",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #45* — Apr 20, 2026\n\n🏢 *Canadian National Railway* (CNI) — $110.26\n\n🛍️ *Sus líneas de negocio*: Intermodal/contenedores (25%), granos y fertilizantes (19%), productos forestales (13%), petroquímicos (13%), metales y minerales (12%), autos (6%), carbón (5%). Clientes: Cargill, Suncor, Ford, Toyota, Nutrien, ExxonMobil.\n\n🌍 *Presencia*: El único ferrocarril de Norteamérica que conecta los 3 océanos — Atlántico (Halifax, Montreal), Pacífico (Vancouver, Prince Rupert) y Golfo de México (New Orleans, Mobile). 19,500 millas de vía a lo largo de Canadá + el Midwest de EE.UU. HQ en Montreal.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *2.38% anual* solo por ser dueño. Cada vez que un tren de CN mueve granos de Saskatchewan a Asia, autos de Ontario a Veracruz, o bitumen de Alberta a refinerías del Golfo — parte de ese dinero llega a ti como dividendo.\n\n⚠️ *El riesgo*: El riesgo principal es la exposición cíclica a commodities canadienses — una recesión en precios de granos, potasa o productos forestales comprime volúmenes y márgenes.\n\n🆕 Posición #45\n🔗 https://vectorialdata.com/stocks/CNI\n✅ Certificado por blockchain → vectorialdata.com/verify/CNI\n\n💡 Dato que ancla la tesis: el único ferrocarril que conecta el Atlántico, el Pacífico Y el Golfo de México en Norteamérica es CN. Nadie más tiene las 3 costas. Cuando una empresa canadiense quiere exportar potasa a Corea del Sur, los únicos rieles directos a Prince Rupert son los de CN. Cuando Ford quiere enviar autos desde Oakville, Ontario hasta Veracruz, México — CN. Cuando ExxonMobil necesita bitumen de Alberta hasta refinerías del Golfo — CN. Este tipo de red NO se puede construir hoy: permisos ambientales, derechos de pueblos indígenas, zonificación. El moat es imposible de replicar. Por eso CN ha subido el dividendo 29 años consecutivos — no es suerte, es geografía.`,
    attestation_uid: "0x2b90eae65332f202e5afc6e970fa68ab7caa93725210ae72344e91a6421a2656",
  },
  {
    id: 46,
    stock_id: 48,
    ticker: "CICHY",
    type: "new" as const,
    cycle_number: 10,
    price: 22.66,
    date: "2026-04-20",
    day_of_week: "monday",
    wa_message: `📊 *STOCK PICK #46* — Apr 20, 2026\n\n🏢 *China Construction Bank* (CICHY) — $22.66\n\n🛍️ *Sus líneas de negocio*: Banca corporativa (infraestructura, PYMEs, grandes empresas estatales), banca retail (es el banco #1 en hipotecas residenciales de China, cuentas, tarjetas de crédito), y tesoro/mercado de capitales. Uno de los "Big Four" bancos estatales chinos.\n\n🌍 *Presencia*: China + ~30 oficinas internacionales. 14,000+ sucursales. Es el segundo banco más grande del mundo por activos (más que JPMorgan + Bank of America combinados). Controlado por Central Huijin (~57%), el brazo soberano del estado chino. HQ en Beijing.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *4.89% anual* solo por ser dueño. Cada vez que un chino abre una hipoteca, una PYME saca un crédito, o el gobierno financia un proyecto de infraestructura vía CCB — parte de ese dinero llega a ti como dividendo, pagado en dólares cada año.\n\n⚠️ *El riesgo*: El riesgo principal es geopolítico — una escalada de tensiones EE.UU.-China podría resultar en delisting de ADRs chinos de bolsas estadounidenses o sanciones secundarias que congelen la liquidez del ADR OTC.\n\n🆕 Posición #46\n🔗 https://vectorialdata.com/stocks/CICHY\n✅ Certificado por blockchain → vectorialdata.com/verify/CICHY\n\n💡 Dato contraintuitivo: CICHY paga 4.89% de dividendo y cotiza a P/E 6x, pero sus ganancias CRECEN cada año. En 2024 ganó aproximadamente $55B USD en utilidades netas, en 2025 ~$58B. Compáralo con JPMorgan — gana $50B al año pero cotiza a P/E 12x. La diferencia es geopolítica: el mercado descuenta brutalmente todo lo chino por miedo a sanciones, delisting o nueva guerra fría. Pero las utilidades reales son las que son, y China Construction Bank es sistémico — Beijing no lo deja caer, igual que EE.UU. no dejó caer a JPMorgan en 2008. Cuando compras CICHY a este precio, estás comprando ingresos bancarios reales a mitad de precio — pagados como dividendo en dólares cada año.`,
    attestation_uid: "0xf4a0968aa3c9059d24c71da5c249942c43b106005ad59f18d3adcc73f654b546",
  },
  {
    id: 47,
    stock_id: 49,
    ticker: "COIN",
    type: "new" as const,
    cycle_number: 10,
    price: 208.58,
    date: "2026-04-21",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #47* — Apr 21, 2026\n\n🏢 *Coinbase Global* (COIN) — $208.58\n\n🛍️ *Sus líneas de negocio*: Exchange de crypto (250+ activos para 110M+ usuarios), intereses sobre reservas de USDC (comparte ~50% con Circle, ~$900M anuales), Coinbase Custody (custodia el Bitcoin de 8 de los 11 ETFs spot de BTC aprobados por la SEC — BlackRock IBIT, Fidelity, Invesco, ARK, etc.), staking (ETH, SOL, ADA), Coinbase One ($29.99/mes) y Base (su L2 de Ethereum que procesa más transacciones diarias que Ethereum mainnet).\n\n🌍 *Presencia*: EE.UU. — la única exchange de crypto regulada completa con licencias SEC, CFTC, FinCEN y en los 50 estados. Además UE (MiCA), UK, Canadá, Singapur, Brasil, Australia. HQ remoto desde 2021.\n\n💵 *Tu nuevo ingreso*: Esta empresa no paga dividendo — es 100% apuesta por crecimiento. Cada vez que alguien compra Bitcoin, Ethereum o USDC en Coinbase, o cada vez que BlackRock IBIT recibe dinero nuevo y guarda ese Bitcoin en Coinbase Custody — el valor de tu participación crece.\n\n⚠️ *El riesgo*: El ~45% de sus ingresos aún depende del volumen de trading de crypto — que cae 60% en bear markets como el de 2022, comprimiendo márgenes y utilidades.\n\n🆕 Posición #47\n🔗 https://vectorialdata.com/stocks/COIN\n✅ Certificado por blockchain → vectorialdata.com/verify/COIN\n\n💡 Dato que casi nadie conecta: Coinbase no gana solo cobrando comisiones. Tiene un acuerdo con Circle (emisor de USDC) que le paga ~50% de los intereses sobre las reservas del stablecoin. Con USDC a ~$60B de supply y tasas del 4-5%, eso son ~$900M anuales de ingreso recurrente tipo SaaS — SIN depender del precio de BTC. Y custodia el Bitcoin de 8 de los 11 ETFs spot aprobados por la SEC. Cuando BlackRock vende IBIT a un cliente, ese Bitcoin vive en Coinbase. Cuando Fidelity FBTC crece, Coinbase gana fees de custodia. Son $90B+ de AUM combinado entre todos los ETFs de BTC y ETH — y Coinbase cobra por custodiar cada dólar. No compras una exchange. Compras la infraestructura regulada que conecta a Wall Street con crypto.`,
  },
  {
    id: 48,
    stock_id: 50,
    ticker: "COST",
    type: "new" as const,
    cycle_number: 10,
    price: 994.87,
    date: "2026-04-21",
    day_of_week: "tuesday",
    wa_message: `📊 *STOCK PICK #48* — Apr 21, 2026\n\n🏢 *Costco Wholesale* (COST) — $994.87\n\n🛍️ *Sus marcas/líneas*: Warehouses Costco (890+ en 14 países), Kirkland Signature (la marca propia más grande del mundo — factura ~$85B/año, más que Nike o Kellogg's), farmacia, óptica, combustible, travel, seguros. Hot dog + soda combo a $1.50 desde 1985. Pizza entera $9.99. Pollo rostizado $4.99.\n\n🌍 *Presencia*: EE.UU., Canadá, México, UK, Japón, Corea del Sur, Taiwán, Australia, España, Francia, China, Islandia, Nueva Zelanda, Suecia (primer warehouse marzo 2026). 73M+ hogares con membresía pagada ($65 Gold Star, $130 Executive). Renovación 92.9% EE.UU./Canadá.\n\n💵 *Tu nuevo ingreso*: Esta empresa te paga *0.59% anual* solo por ser dueño. Cada vez que alguien renueva su membresía anual, carga combustible en la gasolinera, compra Kirkland, o se come el hot dog de $1.50 — parte de ese dinero llega a ti como dividendo. Además paga dividendos ESPECIALES multimillonarios cada 3-4 años ($15 en 2023, $10 en 2020, $7 en 2017) — el próximo se espera fines 2026 o inicios 2027.\n\n⚠️ *El riesgo*: P/E TTM de 51.65x está entre los más altos de su historia — el mercado ya reconoce la calidad del negocio, lo que limita el margen de seguridad ante cualquier miss trimestral.\n\n🆕 Posición #48\n🔗 https://vectorialdata.com/stocks/COST\n✅ Certificado por blockchain → vectorialdata.com/verify/COST\n\n💡 Dato que ancla la tesis: más del 70% del profit de Costco NO viene de vender productos — viene de las membresías. $5.4B anuales en fees de membresía con ~100% de margen. Los productos los vende casi al costo (de ahí el nombre "Costco" = Cost + Co.). ¿Por qué renuevan 92.9% cada año? Por el hot dog de $1.50. En serio. Jim Sinegal, co-fundador, amenazó con "matar" a cualquier ejecutivo que lo subiera. Porque cuando entras y ves ese hot dog a $1.50, te sientes "ganando", y ese sentimiento se transfiere a toda la compra. Es el loss leader más efectivo en retail history. Eso convierte un negocio de warehouse en un negocio de ingresos recurrentes tipo SaaS con renovación tier-Amazon-Prime. Kirkland Signature, la marca propia, factura $85B al año — más que Kellogg's + Hershey's + Nike combinados en margen. Esto no es una tienda — es una máquina de compounding disfrazada de tienda.`,
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
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 5,
    cycle_number: 5,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 6,
    cycle_number: 6,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 7,
    cycle_number: 7,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 8,
    cycle_number: 8,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 9,
    cycle_number: 9,
    type: "new" as const,
    target_count: 5,
    current_count: 5,
    status: "completed" as const,
  },
  {
    id: 10,
    cycle_number: 10,
    type: "new" as const,
    target_count: 5,
    current_count: 3,
    status: "active" as const,
  },
];
