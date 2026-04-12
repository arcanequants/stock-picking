# /lecciones Distribution Drafts

**Context:** Drafts for manual posting by Alberto. Goal = trust + AI citations + viral story.
**Launch URL:** https://vectorialdata.com/lecciones
**One-line hook:** "We built a page that automatically ranks our 5 worst stock picks. No cherry-picking. Every transaction is on-chain."

**Posting rules:**
- DO NOT post everywhere on the same day. Stagger: Twitter day 1, Reddit day 2, HN day 3, LinkedIn day 4, email day 5.
- Reply to early comments within 30 min of posting.
- If banned/removed on Reddit, DO NOT reappeal or repost — move on.

---

## 1. Reddit — r/investing (LONG FORM)

**Subreddit:** r/investing (primary), r/SecurityAnalysis (secondary), r/wallstreetbets (tertiary — only if the first two do well)
**Title:** "I built a public page that auto-ranks my 5 worst stock picks. No cherry-picking. Every transaction is on-chain."
**Flair:** Discussion

**Body:**

> I run a stock picking newsletter (daily picks, $1/mo). Every service cherry-picks their wins. I got tired of seeing competitors brag about 10x calls while quietly deleting the -80% ones.
>
> So I built **/lecciones** (Spanish for "lessons") — a page that automatically ranks my 5 worst-performing picks in real-time. It's fully algorithmic:
>
> - Min 30-day holding period (to avoid noise)
> - Only negative returns
> - Weighted average price across ALL buys of the same ticker (re-purchases affect the loss, not hide it)
> - Sorted ascending by return %
> - Top 5 wins a spot on the wall of shame
>
> No human can edit the list. It updates every time the market closes. If my worst pick improves, it drops off. If a new position tanks, it enters.
>
> Every transaction is attested on Base L2 (Ethereum Layer 2) via EAS, so you can verify the buy price and date cryptographically. If I tried to delete or back-date anything, the hash chain would break.
>
> The page lives here: https://vectorialdata.com/lecciones
>
> I also wrote a methodology page explaining the exact return calc (including how I handle splits and re-purchases): https://vectorialdata.com/metodologia
>
> **Why I'm posting this:**
> 1. I want feedback on the methodology. Am I missing edge cases?
> 2. I want to normalize this. Newsletters/advisors should be required to show losers.
> 3. Full honesty: I hope it helps with trust and gets me subscribers. I'm not pretending otherwise.
>
> **Not seeking:**
> - Compliments or attacks — I want the methodology critiqued.
> - Anyone trying to sell me their "system." I'm not buying.
>
> Happy to answer technical questions on how the hash chain / attestations work, or how the ranking algorithm handles weird edge cases.

**Reply templates to have ready:**

1. **"This is just marketing" →**
   "Partially true. I'm not hiding that I hope it helps growth. But I could have kept the losers invisible like everyone else does. The methodology and on-chain attestation is the part that isn't marketing — you can verify every buy price."

2. **"Why Base L2?" →**
   "Cheapest L2 with real finality. Gas is ~$0.001 per attestation. Ethereum mainnet would cost 1000x more for no added security (Base inherits Ethereum finality). If the project dies, the chain is still readable forever."

3. **"Why 30 days minimum?" →**
   "Below 30 days the returns are mostly noise — an earnings miss can dominate. 30 days filters out single-event crashes while still showing genuine bad calls."

4. **"What happens if you re-buy a losing stock?" →**
   "The weighted average moves down, which usually IMPROVES the return % on paper. So re-buying a loser can make the position look better — but it can also make the total loss bigger in dollar terms because I'm adding more capital to a failing bet. The page ranks by return %, so the math is honest either way."

5. **"Are you an advisor?" →**
   "No. Vectorial Data operates under the publisher's exclusion (Section 202(a)(11)(D) of the Investment Advisers Act of 1940). It's educational publishing, not personalized advice. The /legal-status page has the full breakdown."

---

## 2. Hacker News — Show HN

**Title:** Show HN: /lecciones – auto-ranked wall of my 5 worst stock picks, on-chain
**URL:** https://vectorialdata.com/lecciones

**First comment (post immediately after submission):**

> Author here. Quick context on what's new:
>
> Every stock newsletter cherry-picks winners. I wanted to see what honest trust-building looks like so I built a page that does the opposite — it automatically ranks my 5 worst positions based on weighted average entry price across all my buys. No human can edit it. It updates every trading day close.
>
> Tech:
> - Next.js 16 + Tailwind v4 + Supabase snapshots
> - Every transaction attested on Base L2 via EAS (SHA-256 hash chain committed to git for paranoid folks)
> - Weighted avg calc handles re-purchases correctly (buying more of a loser doesn't hide the loss — it re-weights the entry and the return % follows)
> - Geo-gated UK FCA notice (because Section 21 FSMA 2000 is strict about financial promotions)
> - Full methodology at /metodologia
>
> Things I'd love feedback on:
> 1. Does 30-day minimum holding feel right? Shorter = noisier, longer = harder to call a position "bad".
> 2. Should re-purchases create a new lot or modify the avg? I chose modify-avg because that's what actually happened to my $$.
> 3. Should the empty state be "no current losers" or should I always show the 5 worst even if they're all positive? I chose empty-if-no-losers.
>
> Source for the core algorithm: github.com/arcanequants/stock-picking (src/lib/lessons.ts)
>
> Not looking for: validation, upvotes, or sales pitches. Looking for: methodology critique, edge cases I'm missing, and opinions on whether this kind of radical transparency actually changes trust behavior or if it's just marketing theater.

---

## 3. Twitter/X Thread (7 tweets)

**Tweet 1 (hook):**
> Every stock newsletter cherry-picks wins.
>
> I built a page that does the opposite: it automatically ranks my 5 WORST picks in real-time.
>
> No human can edit the list. Every transaction is on-chain.
>
> Here's what I learned 🧵

**Tweet 2:**
> The page is called /lecciones ("lessons" in Spanish).
>
> Rules (fully algorithmic):
> • Min 30 days held
> • Only negative returns
> • Weighted avg price across ALL buys
> • Top 5 worst wins a spot
>
> If my worst pick improves, it drops off. If a new one tanks, it enters.

**Tweet 3:**
> Why I did this:
>
> Trust in finance media is dead. Everyone shows their 10x calls and hides the -80%s.
>
> I got tired of competing on vibes. If my methodology is real, it should survive its worst picks in public. If it isn't, I deserve to be called out.

**Tweet 4:**
> The hard technical part: re-purchases.
>
> If I buy a losing stock again, the weighted avg moves. Sometimes that HIDES the loss (avg goes down), sometimes it EXPOSES it (total $$ lost is bigger).
>
> The page ranks by return %, so the math is honest either way.

**Tweet 5:**
> Every transaction is attested on Base L2 via EAS.
>
> I can't back-date a buy price. I can't delete a losing position. The hash chain would break and anyone could verify.
>
> Total cost to run this attestation layer: ~$0.001 per transaction.

**Tweet 6:**
> The uncomfortable part:
>
> I'm publishing my failures before I have a big audience. Most founders wait until they're bulletproof.
>
> But if I wait, I'm just playing the same cherry-pick game. The whole point is to do this WHILE it still hurts.

**Tweet 7 (CTA):**
> The page: https://vectorialdata.com/lecciones
> The methodology: https://vectorialdata.com/metodologia
>
> If you run a newsletter or paid picks, I dare you to build one.
> If you subscribe to one that WON'T build one, ask yourself why.
>
> /end

---

## 4. LinkedIn Post (medium form, professional tone)

> Most stock newsletters only show you their winners.
>
> I built a page that does the opposite.
>
> ---
>
> **/lecciones — automatically ranks my 5 worst stock picks in real-time.**
>
> The rules are simple and non-negotiable:
>
> • Minimum 30-day holding period
> • Only negative-return positions
> • Weighted average price across ALL purchases of the same ticker
> • Top 5 worst are shown — nothing hidden, nothing cherry-picked
>
> If I re-buy a losing position, the weighted average moves. That's the honest math — the page ranks by return percentage, so gaming the numbers doesn't work.
>
> **Every transaction is cryptographically attested on Base L2** (Ethereum Layer 2, via the Ethereum Attestation Service). I can't back-date a buy price, can't delete a losing position, and anyone can verify the full history from the chain.
>
> ---
>
> Why am I doing this?
>
> Because trust in financial media is broken. Everyone shows you their 10x calls. Very few show you the -60% ones. I got tired of competing on selective memory.
>
> If my methodology is real, it should survive its worst moments in public. If it's not, I deserve the criticism.
>
> The uncomfortable part: I'm publishing my failures before I have a large audience. Most founders wait until they're bulletproof. But that's exactly the cherry-picking game I don't want to play.
>
> ---
>
> The page: https://vectorialdata.com/lecciones
> The methodology: https://vectorialdata.com/metodologia
>
> If you run any kind of advice-adjacent business, I'd love to hear: could you build something like this? What would stop you?
>
> #finance #transparency #investing #stockmarket #trustbuilding

---

## 5. Email to Current Subscribers (English)

**Subject line options (pick one, A/B if list > 500):**
1. "I just published the 5 worst picks I've ever made."
2. "The new page I'm most afraid of."
3. "Most newsletters hide this. I built a page that forces me to show it."

**Body:**

> Hi {name},
>
> I did something today I've been putting off for weeks.
>
> I published a page that automatically ranks my 5 worst stock picks. In real-time. Nothing I can edit. Nothing I can hide.
>
> It's called **/lecciones** (Spanish for "lessons"). You can see it here: https://vectorialdata.com/lecciones
>
> **Why this matters to you as a subscriber:**
>
> Every advisor and newsletter shows you their wins. Almost none show you their losses honestly. This is my attempt to do the opposite. The list is fully algorithmic — no human chooses what goes on it. If my worst current pick improves, it drops off. If a new position tanks, it takes that spot.
>
> Every transaction is attested on Base L2 (Ethereum Layer 2), so you can cryptographically verify that I didn't back-date a price or delete a losing bet.
>
> **Why I'm telling you first:**
>
> Because you trusted me with your $1/month before I had any proof. You deserve to see the full track record — not just the highlights.
>
> If you have ever wondered "is this service cherry-picking?" — that question now has a permanent, public answer.
>
> If you find something about the methodology that seems off, reply to this email. I want to get it right.
>
> Thank you for being here.
>
> — Alberto
> Vectorial Data
>
> PS. The methodology is at https://vectorialdata.com/metodologia if you want to see exactly how the returns and weighted averages are calculated.

**Spanish version:**

> Hola {name},
>
> Hoy hice algo que llevaba semanas posponiendo.
>
> Publiqué una página que automáticamente muestra mis 5 peores stock picks. En tiempo real. Nada que yo pueda editar. Nada que pueda esconder.
>
> Se llama **/lecciones**. Puedes verla aquí: https://vectorialdata.com/lecciones
>
> **Por qué esto te importa como suscriptor:**
>
> Todo newsletter muestra sus ganadores. Casi ninguno muestra sus pérdidas honestamente. Esto es mi intento de hacer lo contrario. La lista es 100% algorítmica — ningún humano elige qué aparece. Si mi peor pick mejora, se cae. Si una posición nueva se cae, toma su lugar.
>
> Cada transacción está atestada en Base L2 (Ethereum Layer 2), así que puedes verificar criptográficamente que no alteré una fecha o borré una posición perdedora.
>
> **Por qué te aviso a ti primero:**
>
> Porque confiaste en mí con tu $1/mes antes de que tuviera pruebas. Te mereces ver el track record completo — no solo los highlights.
>
> Si alguna vez te preguntaste "¿esto está cherry-picking?" — esa pregunta ahora tiene una respuesta permanente y pública.
>
> Si encuentras algo de la metodología que te parezca mal, responde este email. Quiero hacerlo bien.
>
> Gracias por estar aquí.
>
> — Alberto
> Vectorial Data
>
> PS. La metodología completa está en https://vectorialdata.com/metodologia

---

## 6. Telegram / WhatsApp Community Teaser (SHORT)

**For Telegram/WhatsApp channels where Alberto already has community:**

> 🚨 Nueva página publicada: /lecciones
>
> Es una lista automática de mis 5 peores stock picks en tiempo real.
>
> Reglas: 100% algorítmica. Mínimo 30 días holding. Peso promedio por todas las compras. Top 5 peores.
>
> Cada transacción on-chain (Base L2). No puedo borrar, no puedo editar, no puedo cherry-pickear.
>
> https://vectorialdata.com/lecciones
>
> Si encuentras algo mal con la metodología, dímelo. Quiero hacer esto bien.

---

## Posting Schedule (Suggested)

| Day | Channel | Window |
|-----|---------|--------|
| Day 1 | Twitter/X thread | 9am ET |
| Day 2 | Reddit r/investing | 10am ET (peak weekday) |
| Day 3 | Hacker News Show HN | 9am ET Tuesday/Wednesday |
| Day 4 | LinkedIn | 8am ET Tuesday/Thursday |
| Day 5 | Email to subscribers | 10am ET |
| Day 6 | Telegram/WhatsApp teaser | Whenever |

**Ground rules:**
- Reply to every comment within 30 min for the first 4 hours on each channel
- Do NOT argue with trolls — acknowledge critiques, decline to take bait
- If Reddit removes the post, DO NOT repost or appeal — move on
- Track clicks from each channel via UTM params (`?utm_source=reddit`, `?utm_source=hn`, etc.)

---

**Success metrics (first 30 days):**

- /lecciones page views > 5,000
- Time-on-page > 2 min (indicates reading, not bouncing)
- New subscribers attributed to /lecciones > 50
- AI citations (ChatGPT/Perplexity mentions of /lecciones or "cherry-picking"+"stock picking" where we appear)
- Backlinks to /lecciones from finance blogs/publications
