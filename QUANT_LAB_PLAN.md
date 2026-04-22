# Quant Lab — Implementation Plan

> **Durable playbook. If context is lost, resume from here.**
> Last updated: 2026-04-22

---

## 1. Context — what this is

**Quant Lab** is a new product line under Vectorial Data: a laboratory of systematic trading bots across asset classes (crypto futures, gold, stocks, etc.). Each bot has a public track record and a path for users to copy it on the execution venue.

**First instance: Arcane Quant** — Alberto's copy-trading lead trader account on Binance Futures. Current handle: `Arcane Quant`. Referral code: `92418859`. Strategy: 10x–20x leverage, systematic, rotating between ATOM/DOT/JUP/majors.

**Why now:** Alberto already operates Arcane Quant on Binance. Vectorial Data users are stocks-focused but crypto-curious. Opportunity to (a) drive copiers to Arcane Quant via referral, (b) build brand equity as the "honest transparent systematic trading lab", (c) open a second revenue line (10% profit share × copiers).

---

## 2. Decisions already made (do NOT re-litigate unless data changes)

| # | Decision | Who decided | Date |
|---|----------|-------------|------|
| 1 | Brand architecture: Vectorial Data → Quant Lab → [bot instances]. Quant Lab is the lab, bots are the products. | Alberto (user) | 2026-04-22 |
| 2 | First bot in Quant Lab = **Arcane Quant** (same name as the Binance handle, option C). | Alberto | 2026-04-22 |
| 3 | **NO personal names** anywhere. Not "Alberto Sorno", not "run by Alberto". Entity → product → bot only. | Alberto | 2026-04-22 |
| 4 | **No geoblocking.** Binance handles jurisdiction/KYC/geo. Vectorial only promotes with disclaimer. | Alberto | 2026-04-22 |
| 5 | **Data window:** show only since the current bot started (Day 30 at launch of feature). Unlock 90d at Day 90, 180d at Day 180, etc. Do NOT surface the legacy 365d Binance data (includes discontinued bots). | Alberto + PM (Shreyas) | 2026-04-22 |
| 6 | **Ingest cadence:** every 2 hours. Binance refreshes metrics every 1-2h, so faster gains nothing. | Alberto + PM | 2026-04-22 |
| 7 | URL scheme: `/quant-lab` (lab landing) and `/quant-lab/arcane-quant` (bot detail). | Director | 2026-04-22 |
| 8 | **Copier PnL transparency:** show aggregate with inline explanation about outlier distortion + simulated "$100 today would be $X" metric. Do NOT filter or hide. | Legal (Sullivan & Cromwell) | 2026-04-22 |
| 9 | **Referral flow:** user without Binance account → our referral code + onboarding guide; user with Binance account → deep-link to the lead trader page. | Alberto + Growth (Lenny) | 2026-04-22 |

---

## 3. Brand & positioning (COLLINS)

### Positioning statement
> *Quant Lab — El laboratorio de Vectorial Data. Probamos estrategias sistemáticas en diferentes mercados. Las que funcionan las publicamos. Las que no, las cerramos.*

### Brand hierarchy
- **Vectorial Data** — parent. Stocks, honest long-term picks. Tone: calm, curious, educational.
- **Quant Lab** — subproduct. Systematic bot experiments. Tone: transparent, factual, scientific.
- **Arcane Quant** — first bot instance. Tone: dense data, no hype.

### What NOT to do
- Don't use Binance's yellow. Vectorial stays in its own palette; Binance yellow only appears when the user clicks the external CTA.
- Don't use hype words ("quantum-grade", "AI-powered", "institutional DNA"). Replace with factual descriptions.
- Don't show returns without drawdowns. Never.
- Don't mention Alberto by name anywhere in Quant Lab.

---

## 4. Legal guardrails (Sullivan & Cromwell + Linklaters + Mattos Filho)

### Must-have on every Quant Lab page
1. **Disclosure banner** (visible, not footer-only):
   > *"Vectorial Data no opera servicios de copy trading. Quant Lab muestra el histórico público de Arcane Quant en Binance. Binance no está regulado por CNBV (México), SEC (EE.UU.) ni CFTC (EE.UU.). Si copias, los fondos viven en tu cuenta de Binance. Esta información es educativa, no asesoría de inversiones."*

2. **Returns + drawdown rule:** any `ROI` number shown must be accompanied (same view, comparable weight) by `MDD` (max drawdown). Non-negotiable.

3. **No guaranteed-returns language:** prohibited words/phrases — "garantizado", "seguro", "sin riesgo", "estrategia probada", "alpha", "beats market".

4. **Referral disclosure:** text like *"Vectorial Data recibe comisión de referidos de Binance y profit share de Arcane Quant."* Must be visible before the CTA.

5. **Risk page:** dedicated `/quant-lab/riesgos` section or modal explaining: leverage, liquidation, copy timing risk, fee drag, and that past performance ≠ future results.

### What Binance DOES cover (and what it doesn't)
- ✅ Binance covers: KYC, geoblocking, platform licensing, dispute resolution between copier and lead trader.
- ❌ Binance does NOT cover: Vectorial's marketing claims, investment advisor status in Alberto's personal jurisdictions, tax reporting on referral/profit-share income, consumer protection of how Vectorial describes returns.

### Recurring legal check
Quarterly: Sullivan & Cromwell review of the `/quant-lab` page for claims drift. If any new bots added, repeat review.

---

## 5. Data model & ingest (Shreyas + engineering)

### 5.1 Binance data source

**Endpoint (internal to Binance's public website, no official API):**
- URL (to be confirmed in Phase 0): `POST https://www.binance.com/bapi/futures/v1/public/future/copy-trade/lead-portfolio/detail`
- Body: `{ "portfolioId": "<ARCANE_QUANT_PORTFOLIO_ID>", "timeRange": "30D" }`
- Response: JSON with ROI, PnL, MDD, Sharpe, Win Rate, asset preferences, copier count, AUM, etc.
- Auxiliary endpoints to discover in Phase 0:
  - ROI/PnL time series (for the equity curve)
  - Recent positions list
  - Asset allocation pie chart

**Risk:** Binance can change the endpoint without notice. Mitigation: monitor for shape changes, email alert on parse failure, graceful degradation to last known values with "data delayed" badge.

### 5.2 Supabase schema

**Migration `009_quant_lab_arcane_quant.sql`:**

```sql
-- Snapshots: one row every 2 hours
create table quant_lab_snapshots (
  id bigserial primary key,
  bot_slug text not null,  -- 'arcane-quant'
  captured_at timestamptz not null default now(),

  -- Performance metrics (time-range = current active window: start at 30D)
  roi_pct numeric(8,4),
  pnl_usdt numeric(12,4),
  copier_pnl_usdt numeric(12,4),
  sharpe_ratio numeric(6,3),
  mdd_pct numeric(8,4),
  win_rate_pct numeric(6,3),
  win_positions int,
  total_positions int,

  -- Account-level
  aum_usdt numeric(14,4),
  leading_margin_balance_usdt numeric(14,4),
  profit_sharing_pct numeric(4,2),
  minimum_copy_amount_usdt numeric(10,4),
  active_copiers int,
  total_copiers int,
  closed_portfolios int,
  days_trading int,

  -- Asset mix (JSONB: { "ATOM": 32.2, "DOT": 18.46, ... })
  asset_preferences jsonb,

  -- Raw payload for debugging
  raw_response jsonb,

  created_at timestamptz not null default now()
);

create index idx_quant_lab_snapshots_bot_captured
  on quant_lab_snapshots (bot_slug, captured_at desc);

-- Bot registry (static, pre-populated with arcane-quant)
create table quant_lab_bots (
  slug text primary key,
  display_name text not null,
  strategy_description text,
  started_at timestamptz not null,       -- Day 0 of the current bot
  status text not null default 'active', -- 'active' | 'paused' | 'discontinued'
  binance_portfolio_id text,
  binance_lead_url text,
  referral_code text,
  asset_class text not null,             -- 'crypto-futures' | 'gold-futures' | ...
  leverage_range text,                   -- '10x-20x'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the initial bot
insert into quant_lab_bots (slug, display_name, strategy_description, started_at,
                             binance_portfolio_id, binance_lead_url, referral_code,
                             asset_class, leverage_range)
values ('arcane-quant',
        'Arcane Quant',
        'Systematic long/short strategy on crypto futures, rotating among ATOM, DOT, JUP and majors.',
        '2026-03-24T00:00:00Z', -- day 1 from the 30-day equity curve
        '<TO_FILL_IN_PHASE_0>',
        'https://www.binance.com/en/copy-trading/lead-details/<TO_FILL>?ref=92418859',
        '92418859',
        'crypto-futures',
        '10x-20x');

-- Email alert list (for drawdown notifications)
create table quant_lab_alert_subscribers (
  id bigserial primary key,
  email text not null,
  bot_slug text not null,
  drawdown_threshold_pct numeric(5,2) default 10.0,
  winrate_threshold_pct numeric(5,2) default 50.0,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unique (email, bot_slug)
);
```

### 5.3 Cron route

**New file: `src/app/api/cron/quant-lab-ingest/route.ts`**

- Runs every 2h via `vercel.json`
- For each active bot in `quant_lab_bots`: hit Binance endpoint, parse, insert snapshot
- On parse failure: insert `raw_response` only, flag `error_at`, email Alberto
- Vercel cron path: `/api/cron/quant-lab-ingest`, schedule: `0 */2 * * *`

### 5.4 Public read API

**New file: `src/app/api/quant-lab/[slug]/route.ts`**

- `GET` → returns latest snapshot + `quant_lab_bots` row + last 30 days of snapshots (for the equity curve)
- Cached at the edge via `revalidate = 600` (10 minutes)
- No auth required (public page)

---

## 6. UI/UX spec (MetaLab)

### 6.1 `/quant-lab` (landing)

Hero:
> **Quant Lab**
> *El laboratorio de Vectorial Data. Estrategias sistemáticas en diferentes mercados, con track record público en tiempo real.*

List of bots (initially one): **Arcane Quant — Crypto Futures.**
- Card shows: display name, asset class, day counter, ROI current period, MDD, status pill, CTA "Ver bot →"

Discontinued bots section (empty initially, placeholder for future).

### 6.2 `/quant-lab/arcane-quant` (bot detail)

**Sections, top to bottom:**

1. **Title row:** "Arcane Quant" · subtitle "Crypto Futures Bot · Día N operando en Binance Futures"
2. **Hero metrics (two columns, same weight):**
   - Left: ROI 30d (emerald if positive)
   - Right: MDD (neutral/red, same font size as ROI)
3. **Secondary metrics row:** Sharpe, Win Rate (x/y positions)
4. **Simulated copier metric (big, boxed):**
   > *"Si hubieras copiado $100 al arrancar este bot (hace N días), hoy tendrías ~$X (+Y%, neto del 10% profit share). Tu resultado real depende del timing de entrada y el tamaño de tu margen."*
5. **Equity curve chart** (recharts). Emerald line, drawdown band semi-transparent red beneath.
6. **Asset allocation donut** (our palette, not Binance's).
7. **Copier PnL aggregate section** with the outlier explanation copy.
8. **How to copy** — 2 cards side by side:
   - "Ya tengo cuenta Binance" → CTA `Copiar en Binance →` (deep link)
   - "No tengo cuenta" → CTA `Crear cuenta con nuestro referral →` (Binance signup with ref=92418859) + link to onboarding guide
9. **Risks section** — dense, red/amber accents: leverage, liquidation, past performance, etc.
10. **Email alerts subscribe** — "Avísame si el drawdown supera 10%" form.
11. **Disclosure + disclaimer footer** (the legal-mandated block).

### 6.3 Component files

New files under `src/app/quant-lab/`:
- `page.tsx` — lab landing
- `[slug]/page.tsx` — bot detail (server component; fetches via internal API)
- `_components/BotHero.tsx`
- `_components/EquityCurve.tsx` (uses `recharts`, already a dep)
- `_components/AssetAllocationDonut.tsx`
- `_components/SimulatedCopierCard.tsx`
- `_components/CopierPnLExplainer.tsx`
- `_components/HowToCopy.tsx`
- `_components/RisksSection.tsx`
- `_components/DisclosureBanner.tsx`
- `_components/AlertSubscribeForm.tsx`

Dark card aesthetic consistent with existing Vectorial pages (reuse `CardBackground`, `BrandEmerald`, etc. color tokens).

### 6.4 Navigation

Add `Quant Lab` link to the main nav (between `Stocks` and `Portfolio`, or wherever fits the existing layout). No mobile-only treatment; visible on all breakpoints.

---

## 7. Copy (Copywriter)

### 7.1 Key strings (Spanish)

**Hero:**
- Title: `Arcane Quant`
- Subtitle: `Crypto Futures Bot · Día {N} operando en Binance Futures · Leverage 10x–20x`

**Metric labels:**
- `ROI {período}` / `MDD` / `Sharpe Ratio` / `Win Rate`

**Simulated copier card:**
> *"Si hubieras copiado $100 al arrancar este bot (hace {N} días), hoy tendrías ~${V} ({+/-}{pct}%, neto del 10% de profit share). Tu resultado real depende del tamaño de tu margen y del momento exacto de entrada."*

**Copier PnL explainer:**
> *"El 'Copier PnL agregado' es la suma de ganancias y pérdidas de todos los copiers activos e históricos combinados — distorsionado por outliers (un copier con mucho capital que entra o sale en mal momento mueve el total). Para decidir si te conviene, fíjate primero en el ROI % del bot y el drawdown máximo; el agregado es contexto, no la métrica principal."*

**CTAs:**
- Primary (has Binance): `Copiar en Binance →`
- Secondary (no Binance): `Crear cuenta con nuestro referral →`

**Risks list (non-negotiable, display all):**
- *Futures con leverage 10x–20x amplifican pérdidas al mismo nivel que ganancias.*
- *Una posición mal colocada puede liquidar tu margen completo en minutos.*
- *Los copiers pueden tener rendimiento distinto al lead trader por timing, slippage y fees.*
- *El rendimiento pasado no garantiza el rendimiento futuro.*
- *Esta no es asesoría financiera. Es información educativa.*

**Disclosure banner:**
> *"Vectorial Data no opera servicios de copy trading. Quant Lab muestra el histórico público de Arcane Quant en Binance. Binance no está registrado ante CNBV, SEC ni CFTC. Vectorial Data recibe comisión de referidos de Binance y 10% de profit share de las ganancias de los copiers de Arcane Quant. Esta información es educativa, no asesoría de inversiones."*

### 7.2 Onboarding guide content

File: `/quant-lab/guia-copy-trading-binance` (or a PDF if preferred).

Step-by-step:
1. Create Binance account (with referral link)
2. KYC verification
3. Deposit USDT (minimum 10 USDT)
4. Go to Arcane Quant lead trader page
5. Click "Copy", choose Fixed Amount or Fixed Ratio
6. Confirm

Each step has a screenshot and expected time. Total ~15 min.

---

## 8. Growth loops (Lenny)

### 8.1 Referral loop
- Every `/quant-lab/arcane-quant` view → CTA with `?ref=92418859` → copier → 10% profit share + referral commission from Binance.
- Track: referral clicks via URL parameter logging, copier count delta in `quant_lab_snapshots`.

### 8.2 Content loop (email digest)
- Weekly email section: "This week in Quant Lab" with the week's ROI, trades count, one interesting trade if notable.
- Requires: email template card component (new).

### 8.3 Alert loop
- Users subscribe to drawdown alerts on `/quant-lab/arcane-quant`.
- Cron checks thresholds after each snapshot; sends email via Resend when breached.
- Re-engagement value: users who sign up for alerts are high-intent future copiers.

### 8.4 KPIs (initial)
- Referral-tagged clicks to Binance
- Copier count delta week-over-week
- Email alert sign-ups per week
- Page load → CTA click rate
- (Secondary) share of Vectorial Data users who visit `/quant-lab` at least once

---

## 9. Phases (build order)

### Phase 0 — Technical discovery (1 day)
**Owner:** engineer (me/Claude).
**Deliverables:**
- Confirm Binance endpoint URL, request format, response shape.
- Extract Arcane Quant's `portfolioId` and the full `lead-details` URL.
- Document findings in this file + commit.
- **Risk check:** if the endpoint requires auth cookies or rotates, abort and revisit strategy (alternative: puppeteer-based scrape on Vercel or a self-hosted worker).

### Phase 1 — MVP (1 week)
**Deliverables:**
1. Supabase migration `009_quant_lab_arcane_quant.sql` + seed Arcane Quant row.
2. `src/app/api/cron/quant-lab-ingest/route.ts` + add to `vercel.json` crons.
3. `src/app/api/quant-lab/[slug]/route.ts` (public read).
4. `src/app/quant-lab/page.tsx` (lab landing).
5. `src/app/quant-lab/[slug]/page.tsx` (bot detail).
6. All components listed in §6.3.
7. Disclosure banner + disclaimers live.
8. Email alert subscribe endpoint (`POST /api/quant-lab/[slug]/alerts`).
9. Nav link added.
10. Sitemap updated.

### Phase 2 — Enrichment (month 2)
**Deliverables:**
1. Unlock 90d view at Day 90 (UI unhide).
2. Recent trades feed if Binance exposes it.
3. Weekly email digest section for Quant Lab.
4. Simple backtest visualizer ("$100 vs $1000 vs $10000 over time").
5. Analytics dashboard for Alberto (internal `/quant-lab/admin`): referral clicks, cron health, parse failures.

### Phase 3 — Expansion (month 3+, only if Phase 1 validated)
**Deliverables:**
1. Second bot (e.g., gold-futures or stock-options) added to Quant Lab.
2. `quant_lab_bots.status = 'discontinued'` rendering — transparent "bot cerrado, ROI final: X" section.
3. API connection to user's own Binance account (read-only) to show their personal P&L of copying.
4. Own subdomain `arcanequant.com` if organic search warrants.

---

## 10. Open technical questions (for Phase 0)

1. Does Binance's internal endpoint work from server-side without auth cookies?
2. Is there rate limiting we need to respect?
3. Can we get the ROI/PnL daily time series from a separate endpoint? (Currently only the chart shows it; need raw data.)
4. Does the `portfolioId` include enough to also get recent trades?
5. If the endpoint changes shape, what's our fallback? (Options: Puppeteer scrape on a separate worker, manual weekly upload via admin UI, pause ingest and show "data stale" badge.)

---

## 11. File-level manifest (to be created)

```
supabase/migrations/
  009_quant_lab_arcane_quant.sql                            [Phase 1]

src/app/api/cron/quant-lab-ingest/
  route.ts                                                   [Phase 1]

src/app/api/quant-lab/[slug]/
  route.ts                                                   [Phase 1]
  alerts/route.ts                                            [Phase 1]

src/app/quant-lab/
  page.tsx                                                   [Phase 1]
  [slug]/page.tsx                                            [Phase 1]
  guia-copy-trading-binance/page.tsx                         [Phase 1]
  riesgos/page.tsx                                           [Phase 1]
  _components/
    BotHero.tsx                                              [Phase 1]
    EquityCurve.tsx                                          [Phase 1]
    AssetAllocationDonut.tsx                                 [Phase 1]
    SimulatedCopierCard.tsx                                  [Phase 1]
    CopierPnLExplainer.tsx                                   [Phase 1]
    HowToCopy.tsx                                            [Phase 1]
    RisksSection.tsx                                         [Phase 1]
    DisclosureBanner.tsx                                     [Phase 1]
    AlertSubscribeForm.tsx                                   [Phase 1]

src/lib/
  binance-copy-trading.ts                                    [Phase 0/1] (fetch + parse + types)
  quant-lab.ts                                               [Phase 1] (derived metrics, simulated copier calc)
```

---

## 12. How to resume if context is lost

1. Read this file top to bottom.
2. Check `supabase/migrations/` — what's the latest migration number?
3. Check `src/app/quant-lab/` — does it exist? What's inside?
4. Check `vercel.json` — is `/api/cron/quant-lab-ingest` registered?
5. Check `src/app/api/cron/quant-lab-ingest/route.ts` — does it exist?
6. Run `git log --oneline -- src/app/quant-lab` to see progress.
7. Current phase = whatever the latest commit message says. If unclear, ask Alberto.

**One-line status:** _update this line each major commit._
- 2026-04-22: Plan written. Phase 0 not yet started.
