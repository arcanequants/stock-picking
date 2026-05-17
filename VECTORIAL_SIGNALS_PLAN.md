# Vectorial Signals — Implementation Plan

> **Durable playbook. If context is lost, resume from here.**
> Last updated: 2026-05-10

---

## 1. The Brief — what we're building

**Vectorial Signals** is a submarca of Vectorial Data at `vectorialdata.com/signals`. It brings hedge-fund-tier alternative-data signals (satellite oil-tank levels, AIS tanker tracking, methane super-emitter detection, NDVI crop yield models, EIA inventories, TROPOMI atmospheric pollution, parking-lot car counts) to retail subscribers at the same **$1/mo** subscription — and to AI agents via a B2AI tier (x402 pay-per-request).

### The thesis
- Hedge funds pay $50k/year for the same datasets we're going to ship: Bloomberg, Kpler, Planet, Quandl, Eagle Alpha, GHGSat tasked.
- The underlying data has democratized: **Sentinel Hub Statistical API**, **Copernicus**, **TROPOMI**, **AISStream**, **EIA API**, **USDA NASS**, **CHIRPS**, **NASA SMAP** — all free or near-free.
- The differentiator is **(a) cleaning + PIT discipline + backtesting**, **(b) plain-English translation** so retail can act, **(c) machine-readable provenance** so AI agents cite us, **(d) honesty-as-moat** (public IC dashboard, public decay disclosure).
- Same $1/mo. No pricing change. The submarca expands the value of the existing subscription, drives B2AI revenue, and seeds a new acquisition channel (signal pages = SEO + AI-citation magnets).

### The promise to the user (every signal, every time)
> One number. One baseline. One translation.

### The promise to the AI agent (B2AI)
> JSON-LD `Dataset` schema + OpenAPI + `llms.txt` entry + provenance chain + uncertainty bounds. Cite us with confidence.

---

## 2. Decisions already made (do NOT re-litigate)

| # | Decision | Source | Date |
|---|----------|--------|------|
| 1 | Submarca lives at `/signals`, not a separate domain | Alberto | 2026-05-10 |
| 2 | Pricing unchanged ($1/mo) — Signals expands subscription value, not a new tier | Alberto | 2026-05-10 |
| 3 | Build all 18 signals in launch slate (not a 5-signal MVP) — phased over 3 sessions | Alberto | 2026-05-10 |
| 4 | Free + cheap data sources first; paid feeds (Planet, Kpler, GHGSat tasked) only when ROI proven | Alberto + Quant Alt Data | 2026-05-10 |
| 5 | Existing infra: Vercel Pro + Supabase. No new platforms unless required | Alberto | 2026-05-10 |
| 6 | Workers exclusive to stock-picking (broker repo doesn't share these 6) | Director | 2026-05-10 |
| 7 | Free public preview per signal (current value + 90d chart) — gated history + alerts + raw API | Landing & Conversion | 2026-05-10 |
| 8 | Honesty-as-moat: public rolling IC dashboard, public decay/decommission posts | Quant Alt Data | 2026-05-10 |
| 9 | B2AI tier via x402 pay-per-request (existing infra) | Growth + SEO/AI Discovery | 2026-05-10 |
| 10 | Zero finance jargon in surface text (Mom Test rule) | Copywriter + Alberto's standing rule | 2026-05-10 |
| 11 | Default framing GLOBAL world-class (not LATAM) — same standing rule as Broker | Alberto's standing rule | 2026-05-06 |
| 12 | **4-tier language strategy from day one** (Casual / Pro / AI brief / Machine). One canonical signal definition, four renderings. Override of PM 2+2-staged recommendation. | Alberto | 2026-05-10 |
| 13 | **Pro tier free today** (toggle for logged-in users) — lays the rail for a future **$19/mo Vectorial Pro** tier. Today no pricing change; tomorrow optionality. | Alberto + Growth | 2026-05-10 |
| 14 | AI brief endpoint at `/signals/[id]/brief.md` (file-style URL, cleaner for LLM ingestion) — disclaimers embedded inside the markdown so they travel with citations | Alberto + SEO/AI Discovery + Securities | 2026-05-10 |
| 15 | Mom Test rule **does not mean dumbed-down language** — it means *clarity*. Sophisticated + clear is the floor. Jerga-as-status without inline definition is what fails. | Copywriter clarification | 2026-05-10 |
| 16 | **AISStream killed from plan** — no published ToS (page 404), legal risk for B2AI redistribution. Replaced by **Path A**: Sentinel-1 SAR (Copernicus EU Reg 1159/2013, commercial+redistribution explicitly permitted) for Hormuz tanker counts + China port congestion. **Kystverket NLOD** (Norway open-gov TCP feed `153.44.253.27:5631`) as bonus for NW Europe shipping. **NOAA MarineCadastre CC0** for US backfill. All three are legal-clean for B2AI with attribution only. | Alberto + verified ToS research | 2026-05-14 |

---

## 3. The 12-signal launch slate (god-tier — team consensus 2026-05-14)

Tiered investment system: **Tier A flagship** (deep) → **Tier B workhorse** (solid) → **Tier C experimental** (BETA, kill-or-promote @60d).

### 🥇 Tier A — Flagship (3) — hero of /signals, hedge-fund-grade backtest, weekly hand-curated explainer
| # | Signal | Source | Cadence |
|---|--------|--------|---------|
| A1 | **EIA Weekly Petroleum Status Dashboard** (crude/gasoline/distillate vs 5y avg) | EIA API | Weekly (Wed 10:30 ET) |
| A2 | **US Corn Belt Yield Model** (county-level vs USDA WASDE) | Sentinel-2 NDVI + SMAP + CHIRPS | Weekly |
| A3 | **TROPOMI NO₂ Economic-Activity Index** (top 50 industrial regions) | Sentinel-5P TROPOMI | Weekly |

### 🥈 Tier B — Workhorse (6) — solid backtest, indexed for SEO/AI cite-targets
| # | Signal | Source | Cadence |
|---|--------|--------|---------|
| B1 | Hormuz Strait transit count | Sentinel-1 SAR (revisit 6-12d) | Weekly |
| B2 | Crack spread monitor (3-2-1, gasoil-Brent, Singapore Mogas) | EIA + CME settlements | Daily |
| B3 | LNG arbitrage screen (Henry Hub / TTF / JKM) | EIA + GIE AGSI + ICE proxies | Daily |
| B4 | Top-20 US retailer parking-lot tracker (WMT/TGT/COST/HD/LOW/...) | Sentinel-2 via Sentinel Hub | Weekly |
| B5 | Cushing oil storage tank-lid tracker | Sentinel-1 SAR (cloud-penetrating) | Weekly |
| B6 | Brazil safrinha + soy condition (Mato Grosso/Paraná/RGS) | Sentinel-2 + CHIRPS + ERA5 | Weekly |

### 🥉 Tier C — Experimental (3) — explicit "BETA" label, IC decides promote/kill @60d
| # | Signal | Source | Cadence |
|---|--------|--------|---------|
| C1 | Permian methane super-emitter alerts | TROPOMI + Carbon Mapper public + EMIT | Weekly |
| C2 | Permian rig activity index | Sentinel-2 + Sentinel-1 SAR | Weekly |
| C3 | China power-sector emissions (Shanxi + Inner Mongolia) | Sentinel-5P NO₂ + SO₂ | Weekly |

### ⚙️ Cross-domain Infrastructure (always-on, NOT counted as signals)
- **Signal IC Dashboard** — public rolling out-of-sample IC per signal (shipped Phase 1)
- **AI Explainer** — Claude on top of every signal, on-demand, lightweight

### Killed from original 18-slate (2026-05-14 team consensus)
- ~~Crude tanker floating storage~~ → SAR weekly revisit doesn't capture daily turnover (replaced by Hormuz B1)
- ~~Top-10 port congestion~~ → Same problem: AIS dwell-time is daily, SAR weekly insufficient
- ~~Cocoa West Africa~~ → Capacity too small (cocoa market too thin for retail moat)
- ~~Cross-signal triangulation engine~~ → Needs 6+ months data accumulated → Phase 3 backlog
- ~~AI Explainer as standalone signal~~ → Moved to Cross-domain Infrastructure (not a signal)

### Cross-cutting: every signal ships in **4 language tiers**

| Tier | Audience | Format | Surface |
|---|---|---|---|
| **Casual** | Default human reader | Sophisticated + clear; jargon defined inline once | `/signals/[id]` (HTML, default) |
| **Pro** | Logged-in user with toggle on (free today, future $19/mo) | Dense, jargon allowed without inline definition, tabular | Same URL, toggle persisted as user pref |
| **AI brief** | LLMs (ChatGPT, Claude, Perplexity, Claude Search) | Markdown with structured sections (METHODOLOGY / OBSERVATION / BASELINE / UNCERTAINTY / PROVENANCE / ANALOGS / DISCLAIMER) | `/signals/[id]/brief.md` (raw markdown response) |
| **Machine** | Bots, APIs, quants, B2AI customers | JSON, JSON-LD, OpenAPI, optional CSV/Parquet | `/api/signals/[id]` + B2AI x402 paid tier |

---

## 4. Worker contributions (the team meeting)

### Product Manager — Shreyas Doshi
**MVP scope discipline.** Don't ship 18 signals in Phase 1 — ship 6 signals + the AI explainer + the IC dashboard scaffold. The riskiest assumption is "do retail subscribers actually engage with /signals once it exists" — test that with 6 signals before pouring engineering into 18.

**Phasing logic.** Each phase ships an end-to-end vertical slice (ingest → store → backtest → surface → explain). Never ship a half-built signal. A signal without a backtest is a press release.

**KPIs.**
- North Star: % of weekly active subscribers who view ≥1 signal page per week. **Target: 40% by Phase 1 + 8 weeks.**
- Engagement: median signals viewed per session.
- B2AI proxy: AI-citation count per signal page (Perplexity, ChatGPT-Search, Claude Search referrals in `referer` log).
- Quality: rolling IC vs published IC for every signal, public dashboard.

**Anti-bloat rule.** Any signal with rolling IC < threshold for 60 consecutive days is auto-killed publicly with a methodology post-mortem. Decommissioning is a feature, not a bug.

---

### Brand Strategist — COLLINS
**Positioning.**
> *"Vectorial Signals — los ojos del hedge fund. Traducidos."*
> *"Vectorial Signals — the hedge fund's eyes. Translated."*

**Brand hierarchy.**
- **Vectorial Data** (parent) — calm, curious, educational. Stock picks.
- **Vectorial Signals** (submarca) — confident, technical-but-translated, never breathless. Alt data.
- Wordmark identical; "SIGNALS" appears as eyebrow / type lockup.

**What NOT to do.**
- Never "real-time hedge-fund-grade" — it's not real-time (TROPOMI has revisit gaps). Be honest.
- Never "AI predicts" — the data observes; AI translates. Frame correctly.
- Never use red/green only for signals (color-blind accessibility + emotional bias). Use directional arrows + neutral palette + a single accent.

---

### Visual Identity — Pentagram
**Color.** Existing brand color stays. One signature accent for Signals: **chart-ink hue** (a neutral data-green or muted teal — to be selected with Alberto in design pass). Used only for "live" indicators and signal sparklines.

**Iconography.** One glyph per domain:
- Maritime → vessel silhouette
- Energy → barrel / oil drop
- Geospatial → satellite
- Atmospheric → atmosphere line / molecule
- Agricultural → wheat sheaf
- Quant cross-domain → triangulation triangle

**Typography.** Existing system. Signal numbers in **tabular figures** (so columns align). Sparklines + tabular numbers = institutional feel without bloat.

---

### UI/UX Designer — MetaLab
**Card-based system.** Each signal renders as a `<SignalCard>`:

```
┌─────────────────────────────────────────┐
│ [glyph]  Crude floating storage  [LIVE] │
│                                         │
│  18.4 mt        ↑ +23% vs 90d           │
│  ──────────────────────────────         │
│  [── 90-day sparkline ────────]         │
│                                         │
│  Translation: too much oil sitting in   │
│  ships off China. Bearish for Brent.    │
│                                         │
│  [Explain it to me] [Set alert]         │
└─────────────────────────────────────────┘
```

**/signals (index).** Grid of cards, filterable by domain. Above-the-fold: 6 highest-conviction signals (cross-signal triangulation surfaces these).

**/signals/[id] (detail).** Full chart, methodology card, backtest disclosure, IC time series, source provenance, "alert me when this flips" CTA.

**Mobile-first.** Most users on iOS app — cards must work in a single column at 375px width. Sparklines render server-side (avoid hydration jank).

**Dark mode parity.** Existing Tailwind v4 dark scheme — no new tokens needed.

---

### Landing & Conversion — Parallel
**Free vs gated split.**
- **FREE / public:** current value, 90d sparkline, plain-English translation, methodology card, IC stat. **This is the SEO + B2AI honeypot.**
- **GATED ($1/mo):** full history beyond 90d, alert subscriptions (email + WhatsApp), raw API access, cross-signal triangulation tag.

**Conversion path.**
1. User lands on `/signals/oil-tanker-storage` from Google or ChatGPT citation
2. Sees current value + 90d chart + plain-English translation (free)
3. CTA: "Get alerted when this signal flips ($1/mo, includes daily picks + 17 more signals)"
4. → `/join` Stripe checkout
5. Post-conversion: routes user back to the signal page they came from, plus dashboard

**Above-the-fold rule per signal.** ONE number (current). ONE delta (vs baseline). ONE chart (90d). ONE plain-English sentence. Everything else is below the fold.

---

### Copywriter — Apple/Stripe school
**Clarification on the Mom Test rule.** The Mom Test is *clarity*, not dumbed-down. Apple's M4 chip page uses "neural engine" and "GPU cores" — defines them inline once, then trusts the reader. That's the bar. **What fails the test is jerga-as-status without definition, not vocabulary itself.**

**Every signal ships authored content in 4 tiers** (one signal definition, four renderings):

#### Casual tier (default UI)
- **Title** (max 5 words): "Crude floating storage"
- **Tagline** (max 15 words): "Oil sitting in tankers, waiting to unload at port."
- **Translation** (max 35 words, defines terms inline): "Crude *floating storage* — oil sitting in tankers waiting to unload — hit 18.4 mt off China, a 6-month high. Historically bearish for Brent for ~30 days when sustained."
- **Alert copy** (max 25 words): same vocabulary, shorter.

**Banned in Casual:** undefined "alpha", "IC", "Sharpe", "drawdown", "contango", "Treasury yield", "DWT", "VLCC". If unavoidable, define inline the first time on the page.

#### Pro tier (toggle, logged-in users)
- **Same data, denser packaging.** Jargon allowed without inline definition — assumes finance fluency.
- Tabular. Numbers + units + statistical notation.
- Example: *"VLCC AIS-anchored ≥7d 50nm of Ningbo: 18.4 mt (+23% Δ90d, p=0.02). 6M peak. Brent 1M-12M contango steepening 0.4 → 1.1 $/bbl WoW. Implied: refiner draw delayed; Ningbo crude utilization weak."*
- No fluff. No "translation" sentence. The Pro user *is* the translator.

#### AI brief tier (`/signals/[id]/brief.md`, markdown)
- Structured sections an LLM can ingest in one shot:
  ```markdown
  # Crude floating storage — China coast
  
  ## OBSERVATION
  18.4 mt VLCC + Suezmax + Aframax AIS-anchored ≥7d within 50nm of Chinese coast, week of 2026-05-04.
  
  ## BASELINE
  vs 14.9 mt trailing-90d mean (+23%); vs 12.1 mt 5y same-week mean (+52%); 6-month maximum.
  
  ## METHODOLOGY
  AISStream WebSocket ingest, IMO-type filter (84/85/86), geofence China EEZ ≤50nm coast, anchored = SOG <2kn for ≥168h. Cross-validated against Sentinel-1 SAR vessel detection in same AOI.
  
  ## UNCERTAINTY
  ±5% (vessel-type misclassification rate Equasis registry); ±2% (AIS class-B receiver gaps).
  
  ## PROVENANCE
  Source: AISStream.io (CC-BY-4.0 derived statistics). Sentinel-1 SAR via Copernicus Data Space (Modified Copernicus License). Last update: 2026-05-08T14:00Z.
  
  ## ANALOGS
  Closest historical analogs (similar 90d-Δ + level): 2020-04 (COVID demand collapse, Brent -28% over 30d), 2015-09 (China slowdown, Brent -12% over 30d).
  
  ## DISCLAIMER
  Vectorial Signals is descriptive market intelligence. Not investment advice. Past correlations don't predict future performance.
  ```
- **Disclaimer must be inside the markdown** so when ChatGPT/Perplexity cite, it travels with the citation. Non-negotiable per Securities counsel.

#### Machine tier (`/api/signals/[id]` JSON)
- Pure structured data:
  ```json
  {
    "id": "floating-storage-china",
    "observed_at": "2026-05-08T14:00:00Z",
    "value": 18.4,
    "unit": "Mt",
    "uncertainty_lo": 17.5,
    "uncertainty_hi": 19.3,
    "delta_vs_baseline_90d": 0.23,
    "z_score": 2.31,
    "rolling_ic_252d": 0.14,
    "status": "live",
    "source_provenance": [...],
    "license": "https://vectorialdata.com/terms/signals"
  }
  ```
- JSON-LD `Dataset` schema rendered in the same response (or via `<script type="application/ld+json">` on the HTML page).
- OpenAPI 3.1 spec describes every endpoint shape.

**Tone (consistent across all 4 tiers):** confident, technical, honest, never breathless. The vocabulary shifts; the spirit doesn't.

---

### Growth Hacker — Lenny Rachitsky
**Acquisition.** Signals are SEO + AI-citation magnets. Each signal page = a structured-data entry indexable by ChatGPT/Perplexity/Claude Search. **Goal: get cited by AI when someone asks "what's the latest on Iranian oil exports."**

**Distribution loops.**
1. **Picks → Signals.** WhatsApp pick message includes a deep link: "*This pick is informed by Permian methane signal — see live data: [link]*" → signal page → conversion.
2. **Signals → Picks.** Signal alert email includes "*The pick most affected by this signal: [stock]*" → pick page → engagement.
3. **Newsletter → Signals.** Weekly Signals Digest emails 3-5 signals that flipped — re-engages dormant subscribers.
4. **AI citations → Signals.** Tracked via `referer`. When Perplexity/ChatGPT cite us, that's organic traffic.

**Retention.** Signal alert delivery preference (email/WhatsApp/both) reuses existing `delivery_pref` column. No new infra needed.

**KPI ladder.**
- Phase 1: 40% WAU view ≥1 signal/week.
- Phase 2: 5% of new conversions attributed to a signal-page entry point.
- Phase 3: 1+ AI-citation referral per day.

---

### SEO & AI Discovery — Rand Fishkin + Discovered Labs
**B2AI is the moat.** Every signal page MUST publish:

1. **JSON-LD `Dataset` schema** with:
   ```json
   {
     "@type": "Dataset",
     "name": "Crude floating storage off China",
     "description": "Weekly aggregate of crude tankers anchored >7d off Chinese ports",
     "creator": { "@type": "Organization", "name": "Vectorial Data" },
     "license": "https://vectorialdata.com/terms/signals",
     "temporalCoverage": "2024-01-01/..",
     "spatialCoverage": "...",
     "measurementTechnique": "AIS + Sentinel-1 SAR cross-validation",
     "variableMeasured": "Million metric tons crude in floating storage",
     "isAccessibleForFree": true,
     "distribution": [
       { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://vectorialdata.com/api/signals/floating-storage.json" }
     ]
   }
   ```
2. **OpenAPI 3.1 spec** at `/api/signals/openapi.json` — every signal endpoint discoverable.
3. **`/llms.txt`** entry: catalog of all signals with one-line descriptions and JSON endpoints.
4. **`sitemap.xml`** entries for every `/signals/[id]` page.
5. **Provenance chain** in JSON-LD: `prov:wasDerivedFrom` pointing to NASA Earthdata, EIA, AISStream, etc.

**Honesty as discovery edge.** Public IC dashboard + public decommission log = trust signals AI agents weight heavily. ChatGPT cites the source that explains its methodology, not the one with the loudest claims.

**Schema.org choices.**
- `Dataset` (not `Article`) for the data itself
- `TechArticle` for methodology cards
- `FinancialProduct` only for pages framing equity impact (with disclaimers)

---

### Quantitative Alt Data Analyst — Tammer Kamel + Eagle Alpha
**Signal schema (Supabase tables).**

```sql
-- Source layer (write-once, PIT-safe)
CREATE TABLE signal_observations (
  id BIGSERIAL PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES signal_definitions(id),
  observed_at TIMESTAMPTZ NOT NULL,    -- when the underlying data was acquired
  ingested_at TIMESTAMPTZ DEFAULT NOW(),  -- when WE got it
  value NUMERIC NOT NULL,
  uncertainty_lo NUMERIC,
  uncertainty_hi NUMERIC,
  source_provenance JSONB NOT NULL,    -- { source: "TROPOMI", url: "...", license: "..." }
  raw_payload JSONB,                    -- audit trail
  UNIQUE (signal_id, observed_at)
);

CREATE TABLE signal_definitions (
  id TEXT PRIMARY KEY,                  -- e.g., "permian-methane"
  domain TEXT NOT NULL,                 -- maritime, energy, geospatial, atmospheric, agricultural
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  methodology_card_url TEXT NOT NULL,
  baseline_method TEXT NOT NULL,        -- "trailing-90d", "5y-same-week", etc.
  backtest_disclosure JSONB,            -- IC, Sharpe, capacity, walk-forward window
  status TEXT DEFAULT 'live',           -- live | decayed | deprecated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE signal_ic_history (
  signal_id TEXT REFERENCES signal_definitions(id),
  evaluated_at TIMESTAMPTZ,
  rolling_ic_252d NUMERIC,
  PRIMARY KEY (signal_id, evaluated_at)
);
```

**PIT discipline.** `observed_at` is write-once. If we improve a model and want to re-score history, we write a NEW `signal_id` (e.g., `permian-methane-v2`), keep the old one frozen for backtest integrity.

**Backtest harness.** Walk-forward, 80/20 train/holdout per signal, t-cost model 8bps, capacity estimate. Signals ship only after backtest passes minimum thresholds (TBD per domain).

**Public IC dashboard.** Rolling 252d IC chart per signal. When IC drops below threshold for 60 consecutive days → auto-flag → 14d review window → public decommission post + signal status flip to `deprecated`.

**FISD-style tear sheet** per signal at `/signals/[id]/methodology`: source, license, freshness, latency, sample size, known biases, backtest disclosure.

---

### Maritime Intelligence — Ami Daniel + Lloyd's List
**Phase 1 implementation.**
- **Hormuz Strait transit count** — easiest first signal. AISStream WebSocket subscription, geofence the Strait, count vessel passes by direction.
- **Architecture warning:** AISStream is a persistent WebSocket. Vercel Functions can't hold long-lived connections. **Recommendation:** lightweight Railway/Fly.io worker subscribes to AISStream, writes batched observations to Supabase via service-role REST. Cost: ~$5/mo Fly.io 256MB instance.
- **Alternative for Phase 1 if Railway feels heavy:** sample-only approach — Vercel cron every 15min hits AISStream short-poll endpoint or REST snapshot, accept lower fidelity.

**Phase 2.** Tanker floating storage per region. Vessel-type lookup (IMO type codes). Anchored-time threshold (>7d at <2 knots within 50nm of port = floating storage). Cross-validate with Sentinel-1 SAR vessel detection in the same AOI.

**Phase 3.** Shadow fleet detector — vessels age >15y + flag-of-convenience flips + AIS gaps >24h + last-known near sanctioned ports. ML behavioral model — probably defer until we have 6mo of training data ingested.

**Vessel registry.** Equasis (free) for IMO numbers, vessel type, owner. Cache in Supabase, refresh weekly.

---

### Energy & Commodities Strategist — Ed Morse + Anas Alhajji
**Phase 1 implementation.** Pure REST. Easy.
- **EIA Weekly Petroleum Status** — `https://api.eia.gov/v2/petroleum/...`. Wednesday 10:30 ET cron. Crude/gasoline/distillate stocks, refinery utilization, SPR balance. Compare to 5y same-week average.
- **Crack spreads** — derivable from CME settlements (Brent/WTI/RBOB/HO) + EIA pricing. Daily cron.
- **LNG arbitrage** — Henry Hub via EIA, TTF + JKM via futures settlements (some via ICE public; if not, ICE Endex public reports).

**Disagreement disclosure.** When EIA / API survey / banks disagree on a number — surface the spread. "EIA build +2.4mb vs API survey +4.1mb vs banks consensus +3.0mb." That spread IS the alpha.

**Anti-circular sourcing.** Every chart on every signal cites the original publisher (EIA, OPEC, USDA), not a press release.

**Policy calendar.** Hard-coded JSON file: OPEC+ meetings, Fed FOMC, USDA WASDE release dates, EIA STEO release dates, OFAC sanctions update windows. Surfaced as "Catalyst calendar" sidebar on `/signals`.

---

### Geospatial Intelligence — Cardillo + Crawford
**Phase 1 — start with Sentinel Hub Statistical API.**
- This is the single biggest cost saver. Returns aggregated stats over an AOI without image download.
- Free tier: 10k requests/month (sufficient for ~20 AOIs × weekly cadence × 50 weeks = 1k req/yr, comfortable margin).
- **Cushing tank-lid tracker** — Sentinel-1 SAR (cloud-penetrating), measure radar backscatter delta over each tank polygon. Backscatter changes with lid height (filled tank = higher reflection). Calibrate against EIA Cushing inventory data — that's the backtest.
- **Permian rig activity** — Sentinel-2 + Sentinel-1 SAR over Eddy/Lea/Reeves county polygons. Bright spots = active drilling. Lagged correlation to EIA DPR.

**Phase 2 — parking lot tracker.**
- Start with 1 retailer (Walmart Bentonville HQ) as proof-of-concept.
- Method: Sentinel-2 NDBI delta + Sentinel-1 SAR backscatter delta. Custom YOLO model only if simpler proxy fails.
- Calibrate against published comp sales over 8+ quarters before going live.
- Scale to top 20 retailers in Phase 3.

**Phase 3.**
- Methane plume detection (joint with `atmospheric-science.md`).
- Container yard fill rates (LA/LB).
- Construction progress (data centers, fabs — TSMC AZ, Samsung TX, Intel OH).

**Cloud cover gating.** Optical signals report "no signal" weeks when cloud >30%. Don't fake it. SAR is the cloud-penetrating fallback for critical signals.

---

### Atmospheric Scientist — Daniel Jacob + Climate TRACE
**Phase 1 — TROPOMI NO₂ economic-activity index.**
- Sentinel-5P TROPOMI NO₂ via Sentinel Hub Statistical API.
- 50 industrial AOIs (Wuhan, Shanghai, Detroit, LA, Houston, Antwerp, Mumbai, etc.) — pre-defined GeoJSON polygons.
- Weekly aggregate NO₂ column density. Anomaly vs 90d trailing baseline + same-week 3y baseline.
- This is the signal that flagged Wuhan slowdown 2 weeks before official data in Jan 2020. **Alpha-rich, free, easy.**

**Phase 2 — Permian methane super-emitter alert.**
- TROPOMI CH₄ over Permian basin polygon.
- Use IMI v2.0 framework (Daniel Jacob's open-source code) if compute budget allows.
- Simpler heuristic V1: column anomaly threshold + facility-attribution by nearest operator polygon.
- Cross-reference against Carbon Mapper public alerts + EMIT plume catalog when available.
- Honest uncertainty: ±20% at facility scale. Never overclaim.

**Phase 3 — China power-sector tracker.**
- NO₂ + SO₂ over Shanxi + Inner Mongolia + Hebei power generation hubs.
- Coal-burn intensity proxy. Correlate to thermal coal pricing + utility equity.

**EPA self-report vs satellite reality.** Climate TRACE-style audit. Compare EPA GHGRP self-reports for top 100 US methane emitters to TROPOMI inverted fluxes. Name the largest gaps — this is high-conviction journalism + investment intelligence.

---

### Agricultural Remote Sensing — Sara Menker + Mark Johnson
**Phase 1 — US Corn Belt yield model.**
- Sentinel-2 NDVI weekly composite at county level (USDA NASS CDL cropland mask).
- SMAP soil moisture (9km, free).
- CHIRPS rainfall (free, daily, 0.05°).
- Crop calendar hard-coded per state (planting → V6 → silking → maturity).
- Phenology-weighted ensemble: NDVI 40% + SMAP 30% + GDD 20% + LST 10% during reproductive phase.
- Walk-forward backtest 2018-2025 vs USDA NASS county yields. Target RMSE <5 bu/ac at county level, <3 bu/ac at state level.

**Phase 2 — Brazil safrinha + Argentine soy.**
- Different crop calendars. Different disaggregations (Mato Grosso vs Paraná vs RGS).
- CONAB ground truth.

**Phase 3 — cocoa, palm oil, Indian wheat.**
- Cocoa W. Africa: NDVI + rainfall + black pod disease risk proxies. Recently went structurally bullish — high-attention signal.
- Palm oil Indonesia + Malaysia productivity.
- Indian wheat heat stress (Feb-April) + monsoon onset.

**Climate-mode overlays.** ENSO, IOD, NAO state surfaced on every ag signal. La Niña vs El Niño has predictable yield distributions per region.

---

### Application Security Engineer — Latacora / tptacek
**Threat model.**

| Threat | Mitigation |
|---|---|
| Free signal preview scraping at scale | Rate-limit `/api/signals/*` per IP + caching layer (Vercel Edge Cache, 60s TTL on preview values). |
| B2AI x402 receipt forgery | Verify x402 payment receipts server-side against blockchain settlement. No client-trust. Existing infra. |
| Cron jobs ingesting external APIs | `CRON_SECRET` fail-closed (P1-2 from prior audit, finally needed here). |
| Source API key leaks (Sentinel Hub OAuth, AISStream, EIA, NASA Earthdata, Copernicus) | All Vercel env, never `NEXT_PUBLIC_*`, document rotation procedure. |
| PIT integrity violations | `signal_observations` table is INSERT-only via service-role; no UPDATE/DELETE policies. |
| Malformed JSON-LD attack vectors | Render JSON-LD via `JSON.stringify(data)` only on known-shape data — never user input flows into schema markup. |
| Data poisoning (someone spoofs AIS to flood a port AOI) | Outlier detection at ingest (>4σ delta vs trailing window flagged for human review before publication). |

**RLS posture.** Every new `signal_*` table RLS-on. Public-read policy on `signal_observations` and `signal_definitions` (preview is free). Service-role only for INSERT.

**Secrets to add.**
- `SENTINEL_HUB_CLIENT_ID` / `SENTINEL_HUB_CLIENT_SECRET` (OAuth)
- `AISSTREAM_API_KEY`
- `EIA_API_KEY`
- `NASA_EARTHDATA_TOKEN`
- `COPERNICUS_USER` / `COPERNICUS_PASS`

All scoped to "Production" + "Preview" in Vercel env. Rotation calendar: quarterly.

---

### Securities & Financial Regulation — Sullivan & Cromwell
**The single most important guardrail in this entire project.**

**Vectorial Signals is descriptive market intelligence, not investment advice.** Signals must be **descriptive**, not **prescriptive**. The publisher's exclusion under §202(a)(11)(D) of the US Investment Advisers Act of 1940 protects us only if signals are:
- **Impersonal** (not tailored to any individual)
- **Regular** (published on a schedule)
- **Incidental** to the subscription business (not the primary product positioned as "advice")

**Banned language across all surface text.**
- "Buy" / "sell" / "recommend"
- "We expect price to rise/fall"
- "This stock will outperform"
- Any forward return projection

**Allowed framing.**
- "Consistent with…"
- "Historically, similar conditions preceded… X% of the time"
- "May indicate…"
- "Backtest, not forecast"

**Mandatory disclaimers.**
- Footer of every `/signals/*` page: *"Vectorial Signals is descriptive market intelligence. Not investment advice. We don't manage money. Past correlations don't predict future performance. Decisions are yours."*
- Per-signal methodology cards include: source provenance, sample size, known biases, walk-forward backtest dates.

---

### Terms & Legal Copy — Stripe Legal
**Signals ToS addendum** (link from footer + onboarding):
- Methodology disclosure rights
- Uncertainty bounds disclosure
- "Past correlations don't predict future performance"
- "Not investment advice" (echo Securities)
- Data licensing — personal use + retail decisions OK; redistribution at scale (e.g., reselling our signal feeds) requires a B2AI commercial tier license
- Source data attribution (Copernicus, NASA, EIA, USDA, AISStream) where required by their licenses

---

### Content & Financial Promotions — Linklaters
**Marketing of Signals on X/IG/WA:**
- **Never** include forward return claims in marketing.
- Always pair backtest stats with "may not work in future" hedges.
- OG images for `/signals/[id]`: chart + "Backtest, not forecast" disclaimer.
- FCA / MiFID-safe defaults; avoid targeting EU/UK marketing channels with promo until reviewed.

**Content marketing playbook.**
- Methodology blog posts ("How we built the Permian methane signal") — high-trust, AI-citation magnet, no promotional risk.
- Avoid X threads framing signals as trade ideas. Frame them as data observations.

---

### Privacy & Data Protection — Covington
**Data inventory.**
- Signals ingest **no personal data** from external sources (satellites + REST APIs only).
- We cache user emails for alert delivery (existing infra, GDPR/LGPD-covered already).
- AIS data is vessel-position public data (not personal data under GDPR).

**Source license review (per worker).**
- **Copernicus / Sentinel** — Modified Copernicus license, allows commercial use + redistribution with attribution.
- **NASA Earthdata** — public domain, attribution requested.
- **EIA, USDA NASS, BLS** — US federal, public domain.
- **AISStream** — free for non-commercial-redistribution; **B2AI tier may require commercial license** — flag for legal review before launching B2AI.
- **Sentinel Hub Statistical API** — paid SaaS, redistribution of derived statistics OK; do not redistribute raw imagery.

---

### IP & Brand Protection — Fish & Richardson
**Trademark filings.**
- "Vectorial Signals" — file US class 36 (financial information services) + class 42 (technology services).
- "Vectorial Data" parent — confirm prior registration; file in priority markets (US, MX, ES, BR, EU).
- Each individual signal name (e.g., "Permian methane signal") — not separately trademarked; methodologies are publishable as research (we WANT them cited).

**Domain.** `vectorialdata.com/signals` — no separate TLD. (Optional: register `vectorialsignals.com` defensively, redirect to `/signals`.)

---

### Newsletter — Morning Brew + Hustle
**Weekly Signals Digest.** Sundays 9am local time per user.
- 3-5 signals that flipped this week.
- Plain-English explanations (Copywriter standards).
- Inline mini-charts (PNG, see Email Designer).
- Subject line max 50 chars, A/B-tested. Banned: clickbait ("9 things you must…").

**Editorial voice.** Confident, plain English, never moralizing. The Hustle's sentence rhythm + Morning Brew's data density.

**Reuse existing newsletter infra.** Same Resend + delivery_pref + locale pipeline as ticket replies.

---

### Email Designer — Really Good Emails / Litmus
**Reuse the branded HTML template** built for ticket replies. Add:
- Inline mini-charts as PNG (rasterized via a `/api/og/signal-chart/[id]` route returning PNG via `@vercel/og` or `satori` — same pattern as OG images).
- No SVG charts in email (Outlook breaks them).
- Dark mode support (use `@media (prefers-color-scheme: dark)` block + neutral image backgrounds).
- Single primary CTA per email: "View signal" → `/signals/[id]`.

---

### Retention — Sahil Bloom + James Clear
**Onboarding sequence.**
- **Week 1 email:** "How to read your first signal — the 3 numbers that matter."
- **Week 2 email:** "Signal IC dashboard — why we publish what's working and what isn't."
- **Week 4 email:** "Cross-signal triangulation — when 3 signals agree."

**Re-engagement.**
- If user hasn't viewed `/signals` in 14 days → "You haven't seen this signal" email with the highest-conviction signal of the week.
- If user hasn't opened any email in 30 days → light re-engage; if 60 days → suppress to protect sender reputation.

**Lifecycle integration.**
- Signal alerts deep-link to `/signals/[id]` AND surface "the pick most affected by this signal."
- WhatsApp pick messages cite the signal that informed them, deep-linking back.

---

## 5. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  SOURCE LAYER (free APIs)                                   │
│  AISStream · Sentinel Hub · TROPOMI · EIA · USDA · CHIRPS  │
│  Carbon Mapper · NASA Earthdata · Copernicus · OPEC        │
└────────────────────┬────────────────────────────────────────┘
                     │ Vercel cron + (1) Fly.io worker for AISStream WS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  STORAGE LAYER (Supabase, PIT-safe, write-once)            │
│  signal_definitions · signal_observations · signal_ic_history│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CLEANING + FEATURE LAYER                                   │
│  calendar align · ticker map · GeoJSON canonical · baselines│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKTEST + IC MONITOR LAYER                                │
│  walk-forward · t-cost · capacity · rolling 252d IC        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────────┬─────────────────┐
        ▼                             ▼                 ▼
┌────────────────┐  ┌───────────────────┐  ┌────────────────────────┐
│  HUMAN SURFACE │  │  AI BRIEF SURFACE │  │  MACHINE SURFACE (B2AI)│
│  Casual (def.) │  │  /signals/[id]    │  │  /api/signals/*.json   │
│  Pro (toggle)  │  │       /brief.md   │  │  JSON-LD + OpenAPI     │
│  /signals UI   │  │  Markdown + disc. │  │  /llms.txt             │
│  Email digest  │  │  embedded         │  │  x402 paid tier        │
│  WhatsApp link │  │  (LLM-citable)    │  │                        │
└────────────────┘  └───────────────────┘  └────────────────────────┘
```

---

## 6. Phased rollout

### Phase 1 — Foundation + 6 signals + ALL 4 LANGUAGE TIERS (target ~6 working sessions)

**Decision:** ship the 4-tier rendering pipeline from day one (Alberto, 2026-05-10). One canonical signal definition, four renderings, every signal.

**Engineering:**
- Migrations: `signal_definitions`, `signal_observations`, `signal_ic_history` tables (RLS-on)
- `signal_copy` table or JSONB column on `signal_definitions` storing the Casual + Pro authored strings; AI-brief and Machine are derived
- `/signals` index page shell (server component, lists all live signals from `signal_definitions`)
- `/signals/[id]` detail page shell with **Casual default** + **Pro toggle** (top-right, persisted as user pref in `users.signals_view_mode`)
- `<SignalCard>` component (server-rendered sparkline, renders Casual or Pro variant based on mode)
- `/signals/[id]/brief.md` route (returns text/markdown, structured sections + disclaimer embedded)
- `/api/signals/[id].json` public endpoint (Machine tier, cached + rate-limited)
- `/api/signals/openapi.json` OpenAPI 3.1 spec
- JSON-LD `Dataset` schema injected per signal HTML page
- AI explainer route (Claude Haiku 4.5 over signal context, generates Casual translation strings on signal definition creation; cached, not regenerated per request)
- IC dashboard scaffold (`/signals/methodology`)
- `/llms.txt` updated with signals catalog (links each signal to its `/brief.md` endpoint)
- `sitemap.xml` updated
- Pro toggle: anonymous users never see it; logged-in users get the toggle in `/signals` header

**Signals shipped (all 6 ship in all 4 tiers):**
1. EIA Weekly Petroleum dashboard
2. Crack spread monitor (3-2-1)
3. LNG arbitrage screen (HH/TTF/JKM)
4. Hormuz Strait transit count (sample-only via Vercel cron Phase 1)
5. TROPOMI NO₂ economic-activity index (top 20 industrial regions, scale to 50 in Phase 2)
6. US Corn Belt yield model (Iowa state-level only Phase 1)

**Per-signal authoring deliverable (Copywriter + domain worker):**
- Casual: title + tagline + translation + alert copy (~120 words total)
- Pro: tabular dense version (~50 words)
- AI brief markdown template (rendered server-side from signal data + provenance)
- Machine: schema-conformant JSON (rendered from `signal_observations` row)

**Signals shipped:**
1. EIA Weekly Petroleum dashboard
2. Crack spread monitor (3-2-1)
3. LNG arbitrage screen (HH/TTF/JKM)
4. Hormuz Strait transit count (sample-only, Vercel cron approach Phase 1)
5. TROPOMI NO₂ economic-activity index (top 20 industrial regions, scale to 50 in Phase 2)
6. US Corn Belt yield model (Iowa state-level only Phase 1, expand to county Phase 2)

**Legal/Brand:**
- Signals ToS addendum drafted + linked
- Footer disclaimer on every `/signals/*` page
- Visual Identity color/glyph pass

**Distribution:**
- Account page link to `/signals`
- Newsletter weekly digest skeleton

**Exit criteria:** 6 signals live in all 4 tiers, Pro toggle persists, `/brief.md` returns valid markdown with disclaimer embedded, `/api/signals/[id].json` returns schema-conformant JSON, IC dashboard shows real backtest stats, AI explainer caches Casual translations.

---

### Phase 2 — 6 more signals + AISStream worker + B2AI paid tier (~6 sessions)

(Note: 4-tier rendering pipeline already in place from Phase 1 — Phase 2 just extends content.)

**Engineering:**
- Fly.io worker for AISStream WebSocket (or commit to sample-only approach if Phase 1 sample fidelity is sufficient)
- Sentinel Hub Statistical API integration (OAuth flow + signed-request helper)
- Methodology card system (`/signals/[id]/methodology`)
- B2AI **x402 paid tier** on `/api/signals/[id]/history` (history beyond 90d) — preview stays free
- Cross-signal triangulation engine v1 (manual rules; ML later)
- Alert subscriptions (email + WhatsApp) reusing existing `delivery_pref`

**Signals shipped:**
7. Cushing oil storage tank-lid tracker
8. Permian rig activity index
9. Top-20 US retailer parking lot tracker (start with WMT, TGT, COST)
10. Permian methane super-emitter alert
11. China power-sector emissions tracker
12. Brazil safrinha + soy condition

**Legal/Brand:**
- Trademark filing initiated for "Vectorial Signals"
- AISStream commercial license review (B2AI redistribution)
- Linklaters review of any X/IG marketing that cites signal stats

**Exit criteria:** 12 signals live, AISStream ingest stable, B2AI tier accepting x402 payments, cross-signal triangulation tag surfaced on at least 3 high-conviction events.

---

### Phase 3 — 6 hardest signals + decay engine + polish (~6 sessions)
**Engineering:**
- Decay-monitor auto-killer (signal status auto-flip + public decommission post template)
- Cross-signal triangulation v2 (statistical co-movement detection vs manual rules)
- WhatsApp pick deep-link to relevant signal
- `/signals/api` developer-facing landing (B2AI front door)
- OpenAPI 3.1 spec polished + published
- AI-citation referer tracking dashboard

**Signals shipped:**
13. Floating storage by region (China + Singapore + Saldanha — full Maritime Phase 3)
14. Top-10 port congestion index
15. Cocoa West Africa screen
16. EPA self-report vs TROPOMI reality cross-check
17. Top-20 retailer parking-lot tracker (full scale-out)
18. Cross-signal triangulation engine (Signal #17 in slate, treated as a signal itself)

**Plus:**
- Signal IC dashboard (Signal #16 in slate) becomes the public homepage for `/signals/methodology`
- AI Explainer (Signal #18 in slate) reaches every signal in the catalog

**Legal/Brand:**
- Trademark approved/in-process
- Privacy DPA addendum if any new vendors added
- Newsletter Signals Digest hits steady cadence

**Exit criteria:** All 18 signals live, decay monitor auto-killing weak signals publicly, B2AI revenue measurable, AI citations ≥1/day average.

---

## 7. Risks & open questions for Alberto

### Technical
- ~~**Q1: Fly.io worker for AISStream WebSocket**~~ → **RESOLVED 2026-05-14**: Vercel Pro Cron + Fluid Compute (Option A). Worker only needed if we add Kystverket NLOD as bonus; cron opens TCP socket ~50s per minute. Hormuz/China use Sentinel-1 SAR poll-only — no worker needed.
- **Q2: Sentinel Hub free tier (10k req/mo) sufficient through Phase 2?** → **RESOLVED 2026-05-14**: Free tier OK (~1,825 req/mo projected, 5x headroom). Internal counter + 80% alert. Jump to paid only if we cross 8k consistent.
- ~~**Q3: AISStream commercial license**~~ → **RESOLVED 2026-05-14**: AISStream killed. Path A (Sentinel-1 SAR + Kystverket NLOD + NOAA CC0). Sentinel-1 SAR detects ships from radar directly — sidesteps AIS ToS entirely. Kystverket NLOD permits commercial redistribution with attribution. NOAA MarineCadastre is CC0.

### Product
- ~~**Q4: Confirm 18-signal slate, or trim to 12?**~~ → **RESOLVED 2026-05-14**: 12 señales en 3 tiers (Tier A flagship 3 / Tier B workhorse 6 / Tier C experimental 3) + Cross-domain Infra. Team consensus PM+Quant+Growth+SEO. Killed: floating storage, port congestion, cocoa, triangulation engine, AI Explainer-as-signal. See §3.
- ~~**Q5: Free preview = current value + 90d.**~~ → **RESOLVED 2026-05-14**: Free = current value + 90d trailing chart. Full history (252d+ IC) gated behind sub.
- ~~**Q6: Signal alerts channel — WhatsApp?**~~ → **RESOLVED 2026-05-15**: **WhatsApp killed for Signals** (unprofessional for B2AI/institutional audience). 3-channel stack: (1) Page `/signals` + RSS feed (`/signals/feed.xml`, `/signals/feed.json`) pull-based default, AI-crawlable; (2) Email digest section folded into existing Sunday portfolio digest (no new ritual, no new infra); (3) Webhook API + x402 endpoint deferred to **Phase 3** (gated by Tier A IC track record). Team consensus: UI+SEO+Newsletter+Retention+PM unanimous.

### Brand
- ~~**Q7: Submarca naming — "Vectorial Signals" approved?**~~ → **RESOLVED 2026-05-15**: ✅ "Vectorial Signals" approved as operating name. **Branded house architecture confirmed**: Vectorial Data is umbrella; Signals / Stocks / Terminal / News / Quant Lab are services living at `vectorialdata.com/{service}` (Stripe / Bloomberg / Google pattern). **NO separate domains, NO trademark filings yet** — defer until MRR justifies. Brand monitoring (Google Alerts + USPTO TESS watch) DEFERRED to backlog. Action items spawned: (1) Global nav bar across vectorialdata.com listing all services, (2) JSON-LD `@type: Service` per service so AI models index them as separate entities under one domain.
- ~~**Q8: Visual accent color for Signals — pick now or design pass later?**~~ → **RESOLVED 2026-05-15**: **Cyan radar `#00BCD4`** (Tailwind `cyan-500` / `cyan-400` dark). CSS var `--signals-accent: 188 86% 42%`. Picked because (a) doesn't collide with semantic status colors (emerald=live, amber=decayed, faint=deprecated/pending) used in `methodology/page.tsx`, (b) evokes radar/satellite/alt-data instruments matching the Signals voice (descriptive, scientific, no-hype), (c) distinct from any future Stocks/Terminal accent. OG image template uses cyan gradient corner.

### Legal
- ~~**Q9: Confirm publisher's exclusion comfort**~~ → **RESOLVED 2026-05-16**: Alberto signed off on (A) the 4 bright lines — no buy/sell/recommend language, no forward return projections, no personalized DM/email responses, no portfolio-tailored signals; (B) Stripe Legal worker drafts a `/legal/signals-terms` ToS addendum before Phase 2 ship (separate from stock-picking ToS, linked from `/signals/*` footer). (C) Support ticket SOP for "should I buy X" type asks is handled **manually by Alberto for now** — no automated macro / template needed yet. Revisit C if ticket volume grows.
- ~~**Q10: B2AI tier license terms**~~ → **RESOLVED 2026-05-16**: **Permissive everything if paid.** No restrictions on consumer downstream use — training, redistribution, derivative products all OK. Our legal posture: "not investment advice" + attribution boilerplate + no warranty + liability cap (Polygon.io / Tiingo pattern). **Pricing model — 2 tiers:** (1) 🧍 **Vectorial Pro** flat monthly for humans/institutions ($19/mo personal · $199/mo institutional 5-seat); (2) 🤖 **API pay-as-you-use** for everything machine-consumed ($0.005 read · $0.01 webhook · $2 bulk historical · $50-500 AI training samples). **Billing model — prepaid credits with auto-refill** (OpenAI/Anthropic/Vercel pattern): minimum top-up $5 · auto-refill threshold $1 → refill $10 · $1 free credit at email-verified signup · Stripe Customer Balance API for card rail · x402 USDC on Base for crypto/atomic rail. Prepaid > postpaid for fraud protection (Security Engineer rationale).

### Resolved 2026-05-10
- **Language strategy:** ship 4 tiers from day one (Casual / Pro / AI brief / Machine). Override of PM 2+2-staged proposal. ✓
- **Pro tier monetization:** free today (toggle for logged-in users); future $19/mo "Vectorial Pro" tier when ready. ✓
- **AI brief endpoint:** `/signals/[id]/brief.md` (file-style URL); disclaimer embedded inside the markdown so it travels with LLM citations. ✓

### Data sources Alberto needs to provision (non-blocking, Phase 1 ASAP)
- ☐ EIA API key (free, 5min)
- ☐ NASA Earthdata account (free, 5min)
- ☐ Copernicus Data Space account (free, 5min)
- ☐ AISStream API key (free, 5min)
- ☐ Sentinel Hub OAuth account (free tier, 10min)

---

## 8. Success metrics (Phase 1 + 8 weeks)

| Metric | Target | Why |
|---|---|---|
| Weekly active subscribers viewing ≥1 signal | 40% | Engagement validates the bet |
| Median signals viewed per session | 3 | Catalog discovery working |
| AI-citation referrals per week | ≥3 | B2AI strategy validated |
| Signals with passing IC | 5 of 6 | Quality bar holding |
| Email digest open rate | >35% | Distribution loop working |
| Conversion from signal page → /join | >2% | SEO + AI citation funnel works |

---

## 9. What we are NOT doing (anti-scope)

- **Not** building a Bloomberg Terminal clone. Curated retail-tier signals only.
- **Not** offering "real-time" signals (most have revisit/cron latency 6h-7d). Be honest.
- **Not** offering investment advice. Descriptive, not prescriptive. Securities-counsel-approved language only.
- **Not** ingesting paid feeds in Phase 1-2. Free + cheap (Sentinel Hub) only until ROI proven.
- **Not** changing pricing. $1/mo stays. Signals expand the existing subscription's value.
- **Not** building a separate domain. `/signals` lives under `vectorialdata.com`.
- **Not** sharing these workers with the Broker repo. Stock-picking-only by Director decision.
- **Not** trademarking individual signal names. Methodologies are publishable research.
- **Not** building cross-signal ML triangulation in Phase 1. Manual rules first; ML when we have ≥6 months of training data.

---

## 10. Glossary (Casual tier defines these inline; Pro tier assumes them)

- **AOI** — Area of Interest. A polygon on the map we monitor.
- **AIS** — Automatic Identification System. Ships broadcast position, speed, type. Public.
- **NDVI** — vegetation greenness from satellite. High = healthy crops.
- **TROPOMI** — Sentinel-5P satellite that measures atmospheric pollution daily.
- **PIT** — Point-In-Time. Data record of WHEN we observed it. Critical for honest backtesting.
- **IC** — Information Coefficient. How well a signal correlates with what it's supposed to predict. Public per signal.
- **Walk-forward** — backtest method where you train on past, test on future, repeating. Honest.
- **B2AI** — business-to-AI. Tier where ChatGPT/Claude/Perplexity buy our signals via x402 pay-per-request.
