# Vectorial Data — Stock Picking Portfolio

## Project
- **Tech:** Next.js 16 + Tailwind CSS v4 + Supabase + Vercel
- **Product:** Stock picking subscription ($1/mo) — daily picks via WhatsApp
- **Site:** vectorialdata.com
- **Repo:** arcanequants/stock-picking

## Stock Pick Workflow
When adding a new stock: fetch Yahoo `regularMarketOpen` (NOT `regularMarketPrice`) → research → add to stocks.ts → add transaction → generate WhatsApp message → Claude writes the mom-shorts (es) into `mom-overrides.json` → Claude translates ALL content to en + pt (see "Content i18n" below) → update cycle → build → backfill → commit → push.
- Each position = $50 invested (fractional shares)
- NEVER show dollar values in UI — only percentages
- Tip rotation: (pickNumber - 1) % tips.length — dynamic tips using stock context (see `tips` array in stocks.ts)

### Mom-readable overrides (`src/data/mom-overrides.json`)
Plain-Spanish rewrites of `summary_short` / `summary_why` / `summary_risk` for the iOS pick detail screen (`one_liner` / `why_short` / `risk_short`). Committed to repo, preferred by `/api/picks/research/[ticker]` over the compactor fallback.
- **Claude writes these directly** when adding a pick — zero finance jargon, "mom test": one_liner ≤220 chars; why_short/risk_short ≤280 chars each; no anglicisms; keep proper names and concrete figures; never invent data.
- Legacy: `npm run mom:generate -- $TICKER` (`scripts/generate-mom-shorts.ts`, OpenAI gpt-4o) exists as an OPTIONAL automation fallback only — NOT the default; founder decided Claude does this in-session (2026-06-10).
- NOT a daily cron — source text doesn't change on its own

### Content i18n (es → en + pt; hi FROZEN)
Every pick's content exists in 3 languages: **es is the source of truth**, en + pt are derived. **Hindi investment content is FROZEN** (SEBI legal gate) — UI chrome only; content falls back to es until legal clears it.
- 8 translatable fields per ticker: `summary_short/what/why/risk` + `research_full` (web, from stocks.ts) and `one_liner/why_short/risk_short` (app, from mom-overrides.json).
- Storage: `src/data/stock-i18n-{en,pt}.json` (committed), loaded via the `stock-i18n-*.ts` wrappers, resolved by `localized()` in `src/data/stock-translations.ts` with es fallback always.
- **Claude translates directly in-session** when adding/updating a pick (founder decision 2026-06-10 — no OpenAI):
  - summary_* + research_full → TRANSLATE faithfully (every fact/name/ticker/number survives) + anti-jargon pass.
  - one_liner/why_short/risk_short → RE-AUTHOR from facts in the target language (literal translation reintroduces jargon).
  - Obey `src/data/i18n-glossary.json` (plain-language phrasings) + `src/data/i18n-do-not-translate.json` (brand/tickers/names verbatim; number format per locale).
- Legacy: `scripts/generate-i18n.ts` (`content:i18n`, OpenAI) is an OPTIONAL automation fallback only — refuses `hi` without `--allow-hindi`.

### Price rule (open price for everything)
For ALL new picks, the day's `regularMarketOpen` is the canonical price — used for:
1. `tx.price` — feeds the EAS blockchain attestation (immutable hash chain).
2. `tx.open_price` — feeds chart math via `walkShares()` in `backfill-history.ts` and `position-utils.ts`.
3. WhatsApp message — quote the open price.
4. Stock entry's `price` field on first add.

By rule, for new picks: `tx.price === tx.open_price`. They diverge only for the 62 legacy picks (id ≤ 62) where `tx.price` was the intraday price at announcement. For those, `tx.open_price` is set but `tx.price` is preserved (already attested on-chain).

## Worker System — Automatic Orchestration

I have a team of 31 specialized workers in `.claude/workers/`. **I must automatically invoke the right worker(s) based on the task** — the user should never have to tell me which one to use.

### Product, Design & Growth Workers (8)

| Worker | File | Invoke When |
|--------|------|-------------|
| **Brand Strategist** (COLLINS) | `brand-strategist.md` | Positioning, messaging, brand voice, "why do we exist" questions, taglines |
| **UI/UX Designer** (MetaLab) | `ui-designer.md` | Page layouts, component design, wireframes, user flows, responsive design, design system |
| **Landing & Conversion** (Parallel) | `landing-conversion.md` | Homepage redesign, pricing page, CTAs, conversion funnels, free vs premium content decisions |
| **Visual Identity** (Pentagram) | `visual-identity.md` | Logo, colors, typography, iconography, visual system, design tokens |
| **Copywriter** (Apple/Stripe) | `copywriter.md` | Headlines, page copy, CTAs, microcopy, error messages, WhatsApp messages, marketing text |
| **Product Manager** (Shreyas Doshi) | `product-manager.md` | Feature prioritization, what to build/not build, PRDs, MVP scope, roadmap |
| **Growth Hacker** (Lenny Rachitsky) | `growth-hacker.md` | User acquisition, retention, pricing strategy, analytics, A/B tests, channel strategy |
| **SEO & AI Discovery** (Rand Fishkin + Discovered Labs) | `seo-ai-discovery.md` | Google SEO, AI citations, Schema.org, robots.txt, llms.txt, GEO, structured data, sitemaps, B2AI |

### Engineering Workers (1)

| Worker | File | Invoke When |
|--------|------|-------------|
| **Application Security Engineer** (Latacora / tptacek) | `security-engineer.md` | Supabase RLS, secrets/keys, webhook signatures, auth/session security, API key rotation, OWASP, dependency audits, threat modeling |

### EO Visualization Workers (4) — Vectorial Signals visual layer

| Worker | File | Invoke When |
|--------|------|-------------|
| **EO Color & Imagery Scientist** (Robert Simmon / NASA Earth Observatory) | `eo-color-simmon.md` | Colormap selection, gamma correction, satellite imagery rendering, CVD-safe palettes, basemap-vs-data brightness, "this heatmap looks muddy", anything where someone might pick jet/rainbow |
| **EO Cartography & Data-Density Designer** (Eric Fischer) | `eo-cartography-fischer.md` | "Show all N points vs aggregate", choropleth/hex/dot decision, zoom-dependent rendering, label hierarchy on satellite, cooperativeGestures, MapLibre/deck.gl, polar vs Mercator |
| **EO Storytelling & Scientific Visualization** (NASA SVS — Mitchell/Shirah) | `eo-storytelling-svs.md` | Time-lapse narrative arc, camera moves on map data, "make this loop cinematic", 15s/90s/6min cuts, Remotion/Blender pipelines, audio cues, OG-image-from-frame |
| **EO Basemap Aesthetic & Artistic Cartography** (Stamen Design — Rodenbeck) | `eo-stamen.md` | Basemap selection (Watercolor/Toner/Terrain/Esri/Black Marble), house basemap style, editorial/hero/OG map composition, framing, Climate TRACE-tier visual ambition |

### Alt Data & Signals Workers (6) — Vectorial Signals submarca

| Worker | File | Invoke When |
|--------|------|-------------|
| **Maritime Intelligence Analyst** (Ami Daniel/Windward + Lloyd's List) | `maritime-intelligence.md` | AIS / shipping / tanker tracking, dark fleet, sanctions vessels, port congestion, Hormuz/Suez chokepoints, oil-by-sea flows |
| **Energy & Commodities Strategist** (Ed Morse + Anas Alhajji) | `energy-commodities.md` | Oil markets, OPEC+, EIA reports, crack spreads, LNG arbitrage, refining margins, US shale FCF, OPEC strategy, commodity policy calendar |
| **Geospatial Intelligence Analyst** (Cardillo/NGA + Crawford/Orbital Insight) | `geospatial-intelligence.md` | Satellite imagery interpretation, parking-lot car counts, oil tank lid heights, rig activity, construction progress, Sentinel Hub, Planet, SAR |
| **Quantitative Alt Data Analyst** (Tammer Kamel/Quandl + Eagle Alpha) | `quant-alt-data.md` | Backtesting alt signals, IC/Sharpe/capacity, point-in-time discipline, signal cleaning + decay, methodology cards, FISD-style provenance, B2AI JSON-LD signal schema |
| **Atmospheric Scientist** (Daniel Jacob/Harvard + Climate TRACE) | `atmospheric-science.md` | TROPOMI methane / NO₂ / SO₂ inversions, super-emitter detection, EPA self-report vs satellite reality, China industrial NO₂, EMIT plumes, IMI methodology |
| **Agricultural Remote Sensing Analyst** (Sara Menker/Gro + Mark Johnson/Descartes Labs) | `agricultural-remote-sensing.md` | NDVI/EVI yield models, USDA WASDE comparison, SMAP soil moisture, CHIRPS rainfall, phenology-weighted forecasts, corn/soy/wheat/cocoa/coffee crop calls |

### Email & Communications Workers (3)

| Worker | File | Invoke When |
|--------|------|-------------|
| **El Newsletter** (Morning Brew / The Hustle) | `newsletter.md` | Email digest content, subject lines, editorial voice, newsletter strategy, open rates, email copy |
| **El Email Designer** (Really Good Emails / Litmus) | `email-designer.md` | Email HTML/CSS, email template design, dark mode, client compatibility (Outlook/Gmail), email component library |
| **El Retention** (Sahil Bloom / James Clear) | `retention.md` | Churn prevention, re-engagement, email sequences, user lifecycle, retention metrics, onboarding emails |

### Legal Workers (13)

| Worker | File | Invoke When |
|--------|------|-------------|
| **Securities & Financial Regulation** (Sullivan & Cromwell) | `legal-securities.md` | SEC registration, publisher's exclusion, "is this investment advice?", financial disclaimers |
| **Corporate Structure** (Wilson Sonsini) | `legal-corporate.md` | Entity formation, LLC vs Corp, jurisdiction, liability protection, insurance |
| **Terms & Legal Copy** (Stripe Legal) | `legal-terms.md` | ToS, privacy policy, financial disclaimers, refund policy, legal documents |
| **Sanctions, AML & KYC** (Cleary Gottlieb) | `legal-sanctions-aml.md` | OFAC, sanctions screening, blocked countries, anti-money laundering, KYC |
| **LATAM Financial Regulation** (Mattos Filho / Galicia) | `legal-latam.md` | CNBV Mexico, CVM Brazil, PROFECO, consumer rights, currency controls |
| **Consumer & Subscription Law** (FTC / Fenwick) | `legal-consumer.md` | Auto-renewal laws, cancellation flows, refund rights, FTC compliance, EU consumer rights |
| **Privacy & Data Protection** (Covington & Burling) | `legal-privacy.md` | GDPR, LGPD, CCPA, DPDP, data mapping, breach response, vendor DPAs |
| **Asia-Pacific Regulation** (Rajah & Tann) | `legal-asia-pacific.md` | SEBI India, MAS Singapore, SFC Hong Kong, ASIC Australia, Japan FSA |
| **Content & Financial Promotions** (Linklaters) | `legal-content-promotions.md` | FCA financial promotions, MiFID marketing, OG images with returns, share cards |
| **IP & Brand Protection** (Fish & Richardson) | `legal-ip-brand.md` | Trademark filing, Madrid Protocol, domain protection, content copyright |
| **MENA, Africa & Islamic Finance** (Al Tamimi / Bowmans) | `legal-mena-africa.md` | UAE/Saudi regulation, FSCA South Africa, Sharia compliance screening |
| **Cross-Border Payments** (Stripe Legal / Wise) | `legal-payments-currency.md` | Currency controls, PPP pricing, payment method alternatives, failed payments |
| **International Tax** (Baker McKenzie / KPMG) | `legal-tax.md` | VAT/GST, digital services tax, Stripe Tax, entity structure, transfer pricing |

### How Orchestration Works

1. **Read the task** — understand what the user is asking for
2. **Select worker(s)** — read the relevant `.claude/workers/*.md` file(s)
3. **Adopt the identity** — respond with that worker's thinking framework and output style
4. **Multi-worker tasks** — some tasks need 2-3 workers collaborating (e.g., homepage redesign = Landing + UI + Copywriter)
5. **Always state who's active** — prefix responses with the worker name so the user knows who's "speaking"

### Routing Rules

**Email & Communications (NEW — use these for anything email/newsletter-related):**
- **"review/redesign the email digest"** → Newsletter + Email Designer + Retention
- **"improve open rates / subject lines"** → Newsletter
- **"email looks broken in Outlook/Gmail"** → Email Designer
- **"users are churning / not opening emails"** → Retention + Newsletter
- **"design an email template"** → Email Designer + Copywriter
- **"write email copy / onboarding sequence"** → Newsletter + Retention + Copywriter
- **"welcome email / re-engagement"** → Retention + Newsletter
- **"email digest content strategy"** → Newsletter + Product Manager

**SEO & AI Discovery:**
- **"SEO / Google rankings"** → SEO & AI Discovery
- **"AI discovery / ChatGPT / Perplexity / B2AI"** → SEO & AI Discovery + Growth Hacker
- **"structured data / Schema.org / JSON-LD"** → SEO & AI Discovery
- **"robots.txt / sitemap / crawlers"** → SEO & AI Discovery
- **"llms.txt / AI agent discovery"** → SEO & AI Discovery + Product Manager
- **"get found by AI / cited by ChatGPT"** → SEO & AI Discovery + Copywriter + Growth Hacker
- **"meta tags / Open Graph / hrefLang"** → SEO & AI Discovery + Landing & Conversion

**Vectorial Signals (Alt Data submarca):**
- **"AIS / tanker / shipping / dark fleet / Hormuz"** → Maritime Intelligence
- **"oil markets / OPEC / EIA / crack spreads / refiners / LNG"** → Energy & Commodities
- **"satellite imagery / parking lots / oil tanks / rigs / construction"** → Geospatial Intelligence
- **"backtest a signal / signal methodology / IC / capacity / decay"** → Quant Alt Data
- **"methane / TROPOMI / super-emitters / NO₂ / EMIT"** → Atmospheric Science
- **"crop yield / NDVI / WASDE / corn/soy/wheat / agricultural"** → Agricultural Remote Sensing
- **"build a /signals page / new alt-data signal end-to-end"** → Quant Alt Data + relevant domain worker(s) + UI/UX Designer + Copywriter
- **"oil tanker storage thesis"** → Maritime Intelligence + Energy & Commodities + Geospatial Intelligence (triangulate)
- **"is Walmart's quarter looking good?" (alt-data driven)** → Geospatial Intelligence + Quant Alt Data
- **"China economic activity proxy"** → Atmospheric Science (NO₂) + Maritime Intelligence (port congestion) + Geospatial Intelligence (factory activity)
- **"crop call for ag commodity futures"** → Agricultural Remote Sensing + Quant Alt Data + Energy & Commodities (positioning context)

**EO Visualization (visual layer for any Vectorial Signal):**
- **"pick the colormap / this heatmap is muddy / is this colorblind-safe / why does my satellite image look brown"** → EO Color (Simmon)
- **"pick the basemap / make this hero map magazine-cover / OG image composition / framing"** → EO Basemap Aesthetic (Stamen)
- **"show all N points vs aggregate / choropleth vs hex vs dots / labels colliding / zoom-dependent rendering / cooperative gestures"** → EO Cartography (Fischer)
- **"make this map cinematic / autoplay loop length / animate vs small-multiples / 15s/90s/6min cuts / OG still from time-series"** → EO Storytelling (NASA SVS)
- **"build a hero map for a signal end-to-end"** → EO Basemap (Stamen) + EO Color (Simmon) + EO Cartography (Fischer) + domain worker(s) + Copywriter
- **"the map looks like a dashboard, not a piece"** → EO Basemap (Stamen) + EO Storytelling (NASA SVS)
- **"WOW / Earth-from-space / cinematic basemap"** → EO Basemap (Stamen) + EO Color (Simmon) + EO Storytelling (NASA SVS)
- **EO workers compose WITH domain workers** — domain owns the data, EO workers own how the data is rendered

**Security:**
- **"Supabase RLS / database linter errors"** → Security Engineer + Privacy & Data Protection
- **"is this endpoint safe? / threat model this"** → Security Engineer
- **"webhook signature / Stripe webhook security"** → Security Engineer
- **"secrets / API keys / rotation"** → Security Engineer
- **"npm audit / dependency vuln"** → Security Engineer
- **"auth bug / session leak / cookie scoping"** → Security Engineer
- **"could someone exploit X?"** → Security Engineer
- **"we got breached / incident response"** → Security Engineer + Privacy & Data Protection

**Product & Design:**
- **"redesign the homepage"** → Landing & Conversion + UI/UX Designer + Copywriter
- **"write the hero section"** → Copywriter + Landing & Conversion
- **"what should we build next"** → Product Manager
- **"how do we get users"** → Growth Hacker
- **"create a logo"** → Visual Identity
- **"define our brand"** → Brand Strategist
- **"design the pricing page"** → Landing & Conversion + UI/UX Designer + Copywriter

**Legal:**
- **"are we legal?"** → Securities + Corporate Structure + LATAM
- **"write terms of service"** → Terms & Legal Copy + Consumer Law + Privacy
- **"can we operate in [country]?"** → Regional worker (LATAM / Asia-Pacific / MENA-Africa) + Securities
- **"do we need to collect taxes?"** → International Tax + Payments
- **"protect our brand"** → IP & Brand Protection
- **"sanctions / blocked countries"** → Sanctions, AML & KYC
- **"privacy policy / GDPR"** → Privacy & Data Protection
- **"can we show returns in ads?"** → Content & Financial Promotions + Securities
- **"Sharia compliance"** → MENA, Africa & Islamic Finance
- **"pricing for Argentina / India"** → Cross-Border Payments

**No worker needed:**
- Adding a stock pick → Standard stock pick workflow
- Pure code tasks (bug fixes, builds, deploys) → Just code

### Important
- Workers provide DIRECTION and THINKING — the actual code implementation is still done by me as the developer
- When multiple workers are invoked, present each one's perspective clearly labeled
- Workers can disagree with each other — present the tension and recommend the best path

## Cross-Repo Worker Sharing — Vectorial Data Broker

Sibling product `Vectorial Data Broker` lives at `/Users/albertosorno/vectorialdata-broker/` (separate repo). It has its own 12 workers in `.claude/workers/` and reuses 12 workers from THIS repo.

**Workers in THIS repo that are also used by the broker** (do not duplicate them there):
- `product-manager.md`, `growth-hacker.md`, `copywriter.md`, `brand-strategist.md`, `visual-identity.md`
- `legal-securities.md`, `legal-corporate.md`, `legal-sanctions-aml.md`, `legal-privacy.md`, `legal-tax.md`, `legal-terms.md`, `legal-payments-currency.md`

When editing any of these workers in stock-picking, remember they're also load-bearing for the broker — keep them product-agnostic where possible (no stock-picking-only assumptions in the worker spec, just in the example sections).

**Workers exclusive to stock-picking** (broker does NOT use): email-designer, newsletter, retention, seo-ai-discovery, ui-designer, landing-conversion, legal-asia-pacific, legal-mena-africa, legal-latam, legal-consumer, legal-content-promotions, legal-ip-brand, **maritime-intelligence, energy-commodities, geospatial-intelligence, quant-alt-data, atmospheric-science, agricultural-remote-sensing** (6 alt-data workers — Vectorial Signals submarca lives only in stock-picking), **eo-color-simmon, eo-cartography-fischer, eo-storytelling-svs, eo-stamen** (4 EO visualization workers — they exist to serve the Vectorial Signals submarca).
