# Plan: Página `/lecciones` — "Lo que aprendimos perdiendo"

**Fecha de aprobación:** 2026-04-10
**Aprobado por:** Alberto
**Status:** En ejecución
**Owner:** Dream Team (9 workers) — coordinado por Claude

---

## Decisiones tomadas por Alberto

| # | Decisión | Valor aprobado |
|---|----------|---------------|
| 1 | Nombre de la página | `/lecciones` (ES default) + `/lessons` (en/pt/hi) |
| 2 | Título visible | "Lo que aprendimos perdiendo" / "What we learned by losing" |
| 3 | UK regulation strategy | **Opción B** — mantener UK con banner geo-targeted FCA-compliant |
| 4 | Cadencia de updates | **REAL-TIME** (no trimestral) |
| 5 | Algoritmo: precio de cálculo | **Precio promedio ponderado** cuando hay recompras |
| 6 | Rollout | Ejecutar todas las fases hoy (2026-04-10) |

### Razón de la cadencia real-time (palabras de Alberto):
> "Real time porque luego si aumentamos posicion en una empresa y eso mejora el precio promedio entonces reduce la perdida o la aumenta en el futuro"

**Implicación crítica para el algoritmo:** cuando un ticker tiene múltiples transacciones (recompras), el `effective_buy_price` se calcula como:
```
weighted_avg_price = sum(price_i * shares_i) / sum(shares_i)
return_pct = (current_price - weighted_avg_price) / weighted_avg_price
```

---

## El concepto en una línea

**La página que ningún newsletter financiero del mundo tiene.**

Una página pública, permanente, machine-readable y legalmente blindada que muestra los **5 picks con peor performance** del portafolio, con análisis honesto de qué salió mal, vinculada on-chain a sus attestaciones de Base, calculada en tiempo real desde el algoritmo determinístico, sin posibilidad de cherry-picking.

**Tono:** honesto, técnico, sin drama. Como reporte de piloto sobre near-miss. Cero marketing.

---

## Algoritmo de selección (DETERMINÍSTICO, no editable manualmente)

```typescript
type LessonEntry = {
  ticker: string
  name: string
  buy_date: string  // primera fecha de compra
  weighted_avg_price: number  // precio promedio ponderado de TODAS las transactions
  total_shares: number
  current_price: number
  return_pct: number  // basado en weighted_avg_price
  attestation_uids: string[]  // todas las attestaciones de las transactions del ticker
  days_held: number  // desde la primera compra
}

function selectLessons(stocks, transactions): LessonEntry[] {
  // 1. Group transactions by ticker
  // 2. Compute weighted average buy price per ticker
  // 3. Get current price (from latest stock data)
  // 4. Compute return_pct
  // 5. Filter: days_held >= 30 (minimum holding period)
  // 6. Sort: by return_pct ASC (worst first)
  // 7. Take top 5
  // 8. If less than 5 negative, show only existing
  return lessons
}
```

**Reglas duras:**
1. Min holding period: **30 días** desde la PRIMERA compra
2. Top 5 por menor return % (basado en avg ponderado)
3. Desempate: días sosteniendo (más antiguo primero)
4. Real-time: calculado en cada request (cacheado <5 min para perf)
5. Si <5 picks tienen return negativo, mostrar solo los que existen
6. **JAMÁS edición manual de la lista** — esto es la regla #1

---

## Estructura de la página (wireframe top-to-bottom)

```
[Logo nav, minimal]

H1: Lo que aprendimos perdiendo
SUB: Los 5 picks con peor performance del portafolio.
     Sin filtros. Sin ediciones. Verificable on-chain.

[Last updated: real-time | Auto-calculado | Verificable]

⚠️ AVISO IMPORTANTE
Esta página muestra pérdidas reales. El rendimiento pasado
no garantiza resultados futuros. Esto NO es asesoría financiera.
[Ver metodología →]

──────────────────────────────────────────
Cómo elegimos esta lista
──────────────────────────────────────────
Estos son los 5 picks con menor return % del portafolio
completo, calculado en tiempo real basado en el precio
promedio ponderado de TODAS nuestras compras (incluyendo
recompras). La lista NO se edita manualmente. Si algún
pick mejora, sale automáticamente. Si empeora, entra
automáticamente.

══════════════════════════════════════════
LECCIÓN #1   TICKER · Empresa
             Comprado: [primera fecha] a $[precio promedio ponderado]
             Total compras: [N] (ver attestations)
             Return: -XX% *
             (real-time, calculado al [timestamp])

             ┌─ Lo que pensábamos ─────┐
             │ [thesis original]       │
             └─────────────────────────┘

             ┌─ Lo que pasó ───────────┐
             │ [hechos objetivos]      │
             └─────────────────────────┘

             ┌─ La lección ────────────┐
             │ [retrospectiva, NO      │
             │  prospectiva]           │
             └─────────────────────────┘

             🔗 Verificar attestations on-chain →
                [N attestation UIDs]

[Repetir para #2, #3, #4, #5]
══════════════════════════════════════════

Contexto del portafolio completo
[# de posiciones totales, performance global con disclaimer]
[Link a /stocks]

FAQ
- ¿Por qué publicamos esto?
- ¿Cómo se eligieron estos 5?
- ¿Cómo verifico que no se editó?
- ¿Esto cuenta cuando hay recompras?
- ¿Esto es asesoría financiera?

[Footer extendido con disclosures completos]
```

---

## Disclaimers obligatorios (Securities + Content Promotions lock)

### Above-the-fold (mismo prominence que H1):
```
⚠️ AVISO IMPORTANTE

Esta página muestra pérdidas reales del portafolio.
El rendimiento pasado no garantiza resultados futuros.
Esto NO es asesoría financiera personalizada.

[Ver metodología y disclosures completos →]
```

### Per-pick footnote en cada return %:
```
* Past performance does not guarantee future results.
  Return calculated as (current_price - weighted_avg_buy_price)
  / weighted_avg_buy_price. See methodology.
```

### Footer extendido (separado del footer normal del sitio):
```
DISCLOSURES

1. Esta página es contenido educativo, no asesoría
   financiera personalizada.
2. Los retornos son brutos, no incluyen impuestos, fees
   ni slippage.
3. Los retornos se calculan en tiempo real basados en el
   precio promedio ponderado de todas las compras.
4. La selección de los 5 picks es algorítmica y
   determinística. Ver metodología.
5. Vectorial Data opera bajo la Publisher's Exclusion
   del Investment Advisers Act of 1940 (Section 202(a)(11)(D)).
6. No somos broker-dealer, RIA, ni custodial. No ejecutamos
   trades. No tenemos custodia de tus activos.
7. Para residentes en UK: esta página puede constituir
   financial promotion bajo FCA Section 21. Consulta a un
   asesor autorizado por FCA antes de tomar decisiones.
8. Ver disclosures completos en /disclosures.
```

### UK Banner geo-targeted (Opción B aprobada):
- Detectar geo (Vercel `request.geo.country === 'GB'`)
- Banner adicional arriba con FCA disclaimer:
```
🇬🇧 UK RESIDENTS

This page may constitute a financial promotion under
FCA Section 21 of FSMA 2000. The content has not been
approved by an FCA-authorized person. Investing carries
risk. Consult an FCA-authorized adviser before making
investment decisions.
```

---

## Linguistic guardrails (Securities lock)

| ✅ Permitido | ❌ Prohibido |
|---|---|
| "Compramos a $X" | "Recomendamos comprar a $X" |
| "Subestimamos el riesgo de Y" | "Evita siempre Y" |
| "El thesis era Z. No se materializó." | "Z no funciona como thesis" |
| "Aprendimos a chequear más a fondo W" | "Te recomendamos chequear W" |
| Lección retrospectiva específica | Recomendación prospectiva general |
| Hecho objetivo verificable | Opinión sobre el mercado |

---

## Fases de ejecución (TODAS HOY)

### Phase 0 — Foundation: 4 páginas legales (DEPENDENCY HARD)
**Deben existir antes de publicar `/lecciones`.**

- [ ] `/metodologia` — Cómo calculamos returns, cómo seleccionamos picks, cómo se eligen los losers, cómo manejamos recompras
- [ ] `/disclosures` — Conflict of interest, compensation, risk warnings, methodology, performance disclosure
- [ ] `/risk-disclosure` — Riesgos generales de invertir, riesgos específicos del modelo, advertencia clara
- [ ] `/legal-status` — Bajo qué exenciones operamos (Publisher's Exclusion), qué NO somos (broker-dealer, RIA, custodial)

### Phase 1 — MVP de `/lecciones`
- [ ] Crear `src/app/lecciones/page.tsx` (default ES)
- [ ] Implementar algoritmo `selectLessons()` con weighted average price
- [ ] Componente `LessonCard` con los 3 bloques (thesis, qué pasó, lección)
- [ ] Disclaimer above-the-fold
- [ ] UK geo-banner condicional
- [ ] Real-time calculation desde stocks/transactions
- [ ] Link a attestations on-chain por cada lección
- [ ] Empty state si <5 picks negativos
- [ ] Scribir las primeras 5 lecciones reales (Alberto + Copywriter)

### Phase 2 — Soft launch
- [ ] Add `/lecciones` to sitemap.xml
- [ ] Add to llms.txt: línea de descripción de la página
- [ ] Schema.org `Article` markup con `articleBody`
- [ ] Schema.org `FAQPage` markup
- [ ] Link desde `/proof` y/o `/about` (lo que exista)
- [ ] Link en footer del sitio
- [ ] hreflang alternates (es/en/pt/hi)
- [ ] Canonical URL
- [ ] OG image y meta tags

### Phase 3 — Hard launch (drafts para Alberto, posteo manual)
- [ ] Reddit r/investing post draft (título + body)
- [ ] Hacker News Show HN draft
- [ ] Twitter/X thread draft (5-7 tweets)
- [ ] LinkedIn post draft (más serio)
- [ ] Email draft a subscribers actuales

### Phase 4 — Real-time automation
- [ ] Cache strategy (5 min stale-while-revalidate via Next.js)
- [ ] Snapshot logging para tener histórico (auditabilidad)

### Phase 5 — Compounding setup
- [ ] AI citation tracking doc (queries mensuales para probar)
- [ ] Google Alerts setup doc para "Vectorial Data" mentions
- [ ] Anti-cherry-pick assertion test (snapshot regression)

---

## Tensiones resueltas

| Tensión | Resolución |
|---------|-----------|
| ¿Cuántos losers? | Top 5 + link a `/stocks` filtrado |
| Números prominentes vs discretos | Prominentes pareados con disclaimer same-prominence |
| Timing de lanzamiento | Cuando esté legalmente listo (hoy) |
| Snapshot trimestral vs real-time | **REAL-TIME** (decisión Alberto) |
| Llamarlo "Hall of Shame" | NO en copy oficial. La gente puede llamarlo así informalmente |

---

## Pre-mortem (riesgos)

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Espantó suscriptores | Baja | Pair con contexto portafolio total |
| SEC/FCA contactó | Media | Disclaimers blindados + UK geo-banner |
| Competidores screenshot | Alta | Es un PRO no un CON — la realidad ya está on-chain |
| Nadie compartió | Baja | Distribución manual Tier 1 ejecutada |
| AI no citó | Media | Schema.org + llms.txt + RSS + paciencia 3-6 meses |
| Tono virtue-signaling | Media | Tono boring radical, cero drama |
| **Edición manual de lista** | **Media-Alta** | **NUNCA. Algoritmo + snapshot + archivo público** |

---

## Métricas de éxito

**Primarias (north star):**
- Inbound shares (Twitter/Reddit/HN/LinkedIn mentions)
- AI citations (manual queries mensuales)
- Time on page (>2min indica lectura real)
- Backlinks generados

**Secundarias (lagging):**
- Conversion rate delayed (visitantes a /lecciones → suscriptores 7-30d)
- Retention de subs que visitaron /lecciones antes
- % de visitas a /stocks referidas desde /lecciones

**Anti-métricas (NO optimizar):**
- Conversion rate directo
- Bounce rate
- Pages per session

---

## Hipótesis 90 días

- 10K+ visitas únicas (1 viral post HN/Reddit)
- 50+ menciones inbound
- 5+ AI citations en queries de prueba
- +15% conversion en /stocks (efecto halo)
- 0 enforcement actions

---

## NEVER list (reglas permanentes)

- ❌ Nunca publicar sin las 4 páginas legales adyacentes
- ❌ Nunca aceptar pago para excluir un pick
- ❌ Nunca cherry-pick manualmente
- ❌ Nunca borrar una versión histórica
- ❌ Nunca remover una lección "porque ya pasó tiempo"
- ❌ Nunca llamarlo "Hall of Shame" en copy oficial
- ❌ Nunca usar copy prospectivo ("evita comprar X")
- ❌ Nunca CTA de suscripción en la página (es educativa)
- ❌ Nunca screenshots/share cards con loss numbers (financial promotions risk)

---

## Estado actual de la ejecución

**2026-04-10:** Plan aprobado por Alberto. Iniciando ejecución de las 5 fases.

**Workers en standby para review:** Securities Lawyer y Content Promotions revisarán cualquier copy con returns o disclaimers antes de publicar.
