# Vectorial Data — Stock Picking Portfolio

## Project
- **Tech:** Next.js 16 + Tailwind CSS v4 + Supabase + Vercel
- **Product:** Stock picking subscription ($1/mo) — daily picks via WhatsApp
- **Site:** vectorialdata.com
- **Repo:** arcanequants/stock-picking

## Stock Pick Workflow
When adding a new stock: fetch live Yahoo Finance price → research → add to stocks.ts → add transaction → generate WhatsApp message → update cycle → build → backfill → commit → push.
- Each position = $50 invested (fractional shares)
- NEVER show dollar values in UI — only percentages
- Tip rotation: (pickNumber - 1) % tips.length — dynamic tips using stock context (see `tips` array in stocks.ts)

## Worker System — Automatic Orchestration

I have a team of 23 specialized workers in `.claude/workers/`. **I must automatically invoke the right worker(s) based on the task** — the user should never have to tell me which one to use.

### Product & Design Workers (7)

| Worker | File | Invoke When |
|--------|------|-------------|
| **Brand Strategist** (COLLINS) | `brand-strategist.md` | Positioning, messaging, brand voice, "why do we exist" questions, taglines |
| **UI/UX Designer** (MetaLab) | `ui-designer.md` | Page layouts, component design, wireframes, user flows, responsive design, design system |
| **Landing & Conversion** (Parallel) | `landing-conversion.md` | Homepage redesign, pricing page, CTAs, conversion funnels, free vs premium content decisions |
| **Visual Identity** (Pentagram) | `visual-identity.md` | Logo, colors, typography, iconography, visual system, design tokens |
| **Copywriter** (Apple/Stripe) | `copywriter.md` | Headlines, page copy, CTAs, microcopy, error messages, WhatsApp messages, marketing text |
| **Product Manager** (Shreyas Doshi) | `product-manager.md` | Feature prioritization, what to build/not build, PRDs, MVP scope, roadmap |
| **Growth Hacker** (Lenny Rachitsky) | `growth-hacker.md` | User acquisition, retention, pricing strategy, analytics, A/B tests, channel strategy |

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
