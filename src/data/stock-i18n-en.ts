import type { StockTranslation } from "./stock-translations";

export const enTranslations: Record<string, StockTranslation> = {
  UBS: {
    summary_short:
      "The largest bank in Switzerland and the #1 wealth manager in the world. They just absorbed Credit Suisse, making them a giant with $7 trillion in assets.",
    summary_what:
      "UBS manages money for the world's wealthiest individuals and largest corporations. They are the global #1 in wealth management. They also do investment banking, trading, and personal banking in Switzerland. They acquired their rival Credit Suisse in 2023 and are finishing the integration.",
    summary_why:
      "The Credit Suisse integration is generating $11B+ in savings. Profit rose 53% in 2025. They plan to buy back $3B in shares in 2026 and increase the dividend by +15%. With $7T in assets, they are a financial powerhouse.",
    summary_risk:
      "Swiss banking regulation may tighten. Q4 2025 EPS missed estimates. There are still $2B in integration costs remaining for 2026.",
  },
  ROP: {
    summary_short:
      "The 'Berkshire Hathaway of software.' They acquire niche software companies and let them grow. Down -44% due to temporary issues — a once-in-a-decade opportunity.",
    summary_what:
      "Roper acquires software companies that are #1 in specific niches (software for lawyers, government contractors, freight, laboratories). They let them operate independently and reinvest the cash flow to acquire more companies.",
    summary_why:
      "A compounding machine with 31% FCF margin. Down -44% due to temporary headwinds (government spending cuts, freight recession). A forward P/E of 16x for an elite compounder is extraordinary. $6B+ in M&A capacity.",
    summary_risk:
      "DOGE cuts affect Deltek. Freight recession affects DAT. Conservative 2026 guidance.",
  },
  PNR: {
    summary_short:
      "A pure-play water company: treatment, filtration, and pool equipment. Dividend Aristocrat with 50 consecutive years of dividend growth. Riding the clean water megatrend.",
    summary_what:
      "Pentair makes everything water-related: home filters, pool pumps, industrial treatment systems, and municipal equipment. If water passes through something, Pentair probably makes it.",
    summary_why:
      "Secular clean water megatrend (PFAS regulation, aging infrastructure). 50 years of consecutive dividend growth. Record FCF of $748M. The 80/20 transformation has expanded margins for 15 consecutive quarters.",
    summary_risk:
      "Weak organic growth (3-4%). Pool segment depends on the housing market. Volumes have been flat since 2021.",
  },
  NTR: {
    summary_short:
      "The world's largest fertilizer producer. They control ~20% of global potash. Essential for feeding the world.",
    summary_what:
      "Nutrien produces and sells fertilizers (potash, nitrogen, phosphate) and distributes them directly to farmers through its retail store network in North America, South America, and Australia.",
    summary_why:
      "World-class potash mines with ultra-low costs. Megatrend: feeding 8B+ people. Growing dividend. Unique vertical integration.",
    summary_risk:
      "Commodity cyclicality. Current price above analyst price targets. Shutdown of operations in Trinidad.",
  },
  KHC: {
    summary_short:
      "Owners of Heinz Ketchup, Philadelphia, Kraft Mac & Cheese. Berkshire Hathaway is selling its entire stake — a strong negative signal.",
    summary_what:
      "Kraft Heinz makes ketchup, cream cheese, macaroni, deli meats, and more. Brands everyone knows but that are losing relevance against new consumer trends.",
    summary_why:
      "The 6.5% yield looks attractive. P/E of 9.5x is cheap. 8 brands with sales of +$1B each.",
    summary_risk:
      "Berkshire is selling its 27.5% stake. Revenue declining -1.5% to -3.5%. Potential value trap. Questionable dividend sustainability.",
  },
  VGK: {
    summary_short:
      "Vanguard ETF with 1,246 European companies for just a 0.06% expense ratio. 3.7% dividend yield — more than double the S&P 500. Europe trades at a 33% discount vs the U.S.",
    summary_what:
      "VGK tracks the FTSE Developed Europe All Cap Index. It gives you exposure to 1,246 companies across 16 European countries: UK (22%), France, Switzerland, Germany, the Netherlands, and more. Includes global leaders like ASML, Roche, Nestle, SAP, and AstraZeneca.",
    summary_why:
      "Cheap geographic diversification (0.06% expense ratio). Europe pays generous dividends (3.7%). Attractive valuations at P/E ~14x vs S&P 500 at ~21x. Natural hedge against dollar weakness.",
    summary_risk:
      "European economic growth has historically been slower than the U.S. Currency risk from EUR/GBP/CHF. Lacks the American mega-cap tech names that have dominated returns.",
  },
  VPL: {
    summary_short:
      "Vanguard ETF with 2,363 Asia-Pacific companies for 0.07%. Samsung, Toyota, SK Hynix — direct exposure to the AI and Asian semiconductor boom.",
    summary_what:
      "VPL tracks the FTSE Developed Asia Pacific All Cap Index. It covers 2,363 companies in Japan (53%), Australia (17%), South Korea (14%), Hong Kong, Singapore, and New Zealand. Top holdings: Samsung, SK Hynix, Toyota, Sony.",
    summary_why:
      "Asia-Pacific is the fastest-growing region globally. Samsung + SK Hynix (7.7% of the fund) are memory/semiconductor leaders — direct AI exposure. Japan is reforming with better corporate governance. A perfect complement to VGK for diversifying outside the U.S.",
    summary_risk:
      "Concentrated in Japan (53%) with an aging population. Geopolitical tensions (China/Taiwan, North Korea). Highly volatile Japanese yen.",
  },
  ARM: {
    summary_short:
      "They design the processor architecture used by 99% of smartphones, and now data centers, cars, and PCs. A pure asset-light model: they only collect licenses and royalties on every chip sold.",
    summary_what:
      "ARM doesn't manufacture chips — they design processor architectures and collect licenses and royalties. Apple, Qualcomm, Samsung, Google, Amazon, Nvidia all pay ARM to use their designs. 99%+ of smartphones run on ARM. Now expanding into data centers (AWS Graviton), AI inference, automotive, and PCs.",
    summary_why:
      "De facto monopoly in mobile processor architecture. SaaS-like recurring revenue — every chip sold pays royalties. Massive AI tailwind: hyperscalers migrating from x86 to ARM. 90% of analysts rate it Buy. Growth of ~20% YoY.",
    summary_risk:
      "Expensive valuation: trailing P/E of 169x, forward 65x. Must execute flawlessly. SoftBank controls ~90%. RISC-V could erode market share long-term.",
  },
  ASBFY: {
    summary_short:
      "British conglomerate that owns Primark (Europe's #1 fast fashion retailer) plus food, sugar, and ingredients businesses. They are evaluating a separation of Primark from the food business to unlock value.",
    summary_what:
      "Associated British Foods is a conglomerate with 5 segments: Retail (Primark — £9.5B in sales, 384 stores in 13 countries), Grocery (brands like Twinings, Ovaltine, Kingsmill), Ingredients (yeast and enzymes), Sugar (Illovo in Africa, British Sugar in the UK), and Agriculture. Primark is the star business — low-cost fast fashion with no online store.",
    summary_why:
      "P/E of 13x and forward of 11x — extremely cheap for what it is. Dividend yield of 3.4%. The board announced a structural review that could result in a Primark spin-off (valued at ~£13B). If separated, each business would be valued higher individually. Primark continues growing with ~4% new store expansion. Primark operating margin at 11.9%.",
    summary_risk:
      "Primark has no online store — 100% dependent on in-store foot traffic. Weak consumer spending in continental Europe. Sugar segment at breakeven. Total revenue fell 3% in 2025. The Weston family controls the company via Wittington Investments.",
  },
  AVGO: {
    summary_short:
      "Semiconductor and software giant. Owners of VMware, they make the Wi-Fi and networking chips that connect the world. Explosive AI-driven growth — their custom chips are in the data centers of Google, Meta, and Apple.",
    summary_what:
      "Broadcom designs semiconductor chips and infrastructure software. Their chips are in your iPhone (Wi-Fi), in enterprise routers, in data center switches, and in AI servers. They acquired VMware in 2023 for $69B — now they are also a giant in virtualization and cloud software. Clients: Apple, Google, Meta, Amazon, Microsoft.",
    summary_why:
      "AI networking is the new boom — Broadcom makes the chips that connect Nvidia GPUs in data centers. AI revenue tripled. VMware generates $13B+ annually in recurring software revenue. A forward P/E of 19x is reasonable for a company growing 40%+. Dividend of 0.76% and growing.",
    summary_risk:
      "Apple is replacing Broadcom Wi-Fi chips with its own in-house chips (N1) in iPhone 17. Expensive trailing valuation (P/E 67x). High dependence on a few large customers. Significant debt from the VMware acquisition.",
  },
  ASML: {
    summary_short:
      "ASML is a MONOPOLY. They are the ONLY company in the world that makes the machines needed to produce advanced chips. Without ASML, there are no iPhones, no Nvidia, no AI. Period.",
    summary_what:
      "ASML manufactures the lithography machines that chipmakers (TSMC, Samsung, Intel) need to produce semiconductors. Their EUV (Extreme Ultraviolet) technology is the only one in the world capable of making 5nm, 3nm, and 2nm chips. Without these machines, modern chips simply don't exist — not for smartphones, not for AI, not for anything.",
    summary_why:
      "A literal monopoly — there is no #2 competitor. Each EUV machine costs $380M+ and they have a years-long backlog. Revenue of EUR 32.7B in 2025 (+16% YoY). Net income of EUR 9.6B. 2026 guidance: EUR 34-39B. The AI boom needs more chips, and more chips = more ASML machines. Plus EUR 8.2B in recurring service revenue from maintenance.",
    summary_risk:
      "Expensive valuation (P/E 49x). China accounted for 33% of revenue in 2025 but export restrictions are reducing that. Semiconductor cycles can create volatility. They essentially have only one main product.",
  },
  AWK: {
    summary_short:
      "The largest water utility in the U.S. They own the pipes, treatment plants, and infrastructure that delivers clean water to 14 million people across 14 states + 18 military bases. A regulated monopoly with 18 consecutive years of dividend growth.",
    summary_what:
      "American Water Works is the largest publicly traded water utility in the U.S. They own and operate water and wastewater infrastructure: 80+ surface water treatment plants, 520+ groundwater treatment plants, 190+ wastewater treatment plants, and 54,500 miles of pipeline. They also operate water systems on 18 Department of Defense military bases under 50-year contracts.",
    summary_why:
      "Regulated monopoly — no competition in each territory they serve. Water is the most essential utility (nobody stops using water). Dividend growing ~8% annually for 18 consecutive years. U.S. water infrastructure needs $1.3 trillion in investment — AWK is the largest private investor. The merger with Essential Utilities (approved, closing Q1 2027) will expand coverage to 17 states.",
    summary_risk:
      "Depends on state regulators to approve rate increases — they may cut what's requested. Premium valuation for a utility (P/E ~22x). High debt needed to fund $46-48B in investment through 2035. The Essential Utilities merger is still pending regulatory approvals.",
  },
  CAIXY: {
    summary_short:
      "The #1 bank in Spain with 18 million customers. Named 'Best Consumer Bank in Europe' by Euromoney 2025. 5.1% dividend yield — growing 15% annually. They absorbed Bankia and own BPI in Portugal.",
    summary_what:
      "CaixaBank is the largest retail bank in Spain. With 18 million customers, it offers bank accounts, mortgages, insurance (VidaCaixa), investment funds, and private banking. They absorbed Bankia in 2021, becoming the undisputed leader in the Spanish market. They also operate in Portugal through BPI. The 'la Caixa' Foundation is the largest private foundation in Europe.",
    summary_why:
      "Spain's #1 bank with massive scale (EUR 1.1 trillion in business volume). P/E of 11.7x — cheap. 5.1% dividend yield growing aggressively (+15% in 2025). ROTE of 17.5% — exceptional profitability. Cost/income ratio of 39.4% — elite banking efficiency. Named best consumer bank in Europe.",
    summary_risk:
      "Concentrated in Spain (~90% of revenue). ECB interest rate cuts could compress margins. ADR trades OTC with lower liquidity than the main listing in Madrid. European banking regulation is constantly changing.",
  },
  ROL: {
    summary_short:
      "Owners of Orkin — the #1 pest control brand in the world. 24 consecutive years of revenue growth. Morningstar rates it 'Wide Moat' (broad competitive advantage). An essential service: cockroaches don't care about recessions.",
    summary_what:
      "Rollins is the second-largest pest control company in the world. Their flagship brand is Orkin, but they also operate HomeTeam Pest Defense, Clark Pest Control, Northwest Exterminating, Western Pest Services, Critter Control, and more. They offer residential and commercial pest control, termite treatment, wildlife control, and mosquito services. They grow by acquiring small local companies ('tuck-in acquisitions').",
    summary_why:
      "An essential service that doesn't depend on the economy — pests don't disappear in a recession. 24 consecutive years of revenue growth. Revenue of $3.8B (+11% YoY). EPS growing 13% annually. Morningstar 'Wide Moat' for cost advantages and the Orkin brand. Their BOSS system optimizes routes and reduces costs. 35 years of uninterrupted dividend payments.",
    summary_risk:
      "Expensive valuation: P/E of 51x (industry average 25x). Q4 2025 missed estimates due to early winter weather. Strong seasonality — earns more in summer. Must execute flawlessly to justify the price.",
  },
  GFI: {
    summary_short:
      "South African gold miner with mines in 5 countries. Profit tripled in 2025 to $3.57B. 5.1% dividend yield + special dividend + share buybacks = $1.7B returned to shareholders. Gold is at all-time highs driven by central bank demand.",
    summary_what:
      "Gold Fields extracts gold from mines in South Africa, Ghana, Australia, Peru, and Chile. They produce 2.44 million ounces per year. They are also building a new mine in Canada (Windfall) set to start in late 2026. Gold is the universal safe haven against inflation, uncertainty, and currency devaluation — the world's central banks are buying record amounts.",
    summary_why:
      "Profit tripled from $1.25B to $3.57B in 2025. Free cash flow of $2.97B (5x more than 2024). P/E of 12x with forward of 8.5x — extremely cheap. 5.1% dividend yield plus a special dividend. Returned $1.7B to shareholders. New Windfall mine in Canada (300K oz/year at ultra-low cost of $758/oz). Gold at all-time highs with JP Morgan projecting $5,055/oz for Q4 2026.",
    summary_risk:
      "Gold prices could fall if global uncertainty diminishes. Geopolitical risk in South Africa (electricity, regulation) and Ghana. Mining is inherently dangerous and costly. Volatile stock: 52-week range of $19 to $62.",
  },
  WAL: {
    summary_short:
      "Commercial bank specializing in high-growth niches (tech, startups, real estate). Survived the SVB crisis in 2023 and reported record earnings in 2025 with EPS +23%. Forward P/E of 5.75x with 16.9% ROE — extremely cheap for the quality it offers.",
    summary_what:
      "Western Alliance is a U.S. regional commercial bank that operates differently from traditional banks: instead of branches, it specializes in vertical business lines for specific industries — technology, startups, private capital, legal, gaming, real estate, and warehouse lending. With $93B in assets, they are the #1 bank for SMBs in the U.S. Southwest.",
    summary_why:
      "They grew deposits by $15B in 2025 after recovering from the SVB crisis. Q4 2025: revenue +17% YoY, EPS $2.59 (+33% YoY), ROE of 16.9%. They project +$6B in loans and +$8B in deposits for 2026. Their specialized banking model generates superior margins (NIM 3.51%) and they are national leaders in warehouse lending.",
    summary_risk:
      "They will cross the $100B asset threshold in 2-3 years, which triggers stricter regulation. Exposure to cyclical sectors like tech and real estate. Fresh memory of the 2023 banking crisis when they lost $9.5B in deposits in days.",
  },
  SIEGY: {
    summary_short:
      "A 177-year-old German industrial giant, leader in automation, smart infrastructure, and trains. Record order backlog of EUR 120B. 35% growth in data centers driven by the AI boom. 2.5% dividend yield with NVIDIA and Microsoft partnerships.",
    summary_what:
      "Siemens manufactures industrial automation technology, smart infrastructure for buildings and data centers, and rail transportation systems. It operates in three segments: Digital Industries (software and automation), Smart Infrastructure (buildings, data centers, power grids), and Mobility (trains and metros). With a $198B market cap, it is one of the largest industrials in the world.",
    summary_why:
      "Positioned for the AI and digital infrastructure boom — Smart Infrastructure grew 35% in data centers with EUR 1,800M in U.S. contracts. Record order backlog of EUR 120B guarantees future revenue. Q1 2026: orders +10%, revenue +8%, industrial margin 15.6%. Partnerships with NVIDIA and Microsoft for industrial AI. Raised EPS guidance for FY2026.",
    summary_risk:
      "Intense competition from Schneider Electric, ABB, and tech giants entering the industrial market. Adverse currency effects weigh on growth. The planned spin-off of 30% of Siemens Healthineers could create volatility.",
  },
  AXAHY: {
    summary_short:
      "Europe's #1 global insurer with 92 million clients across 50 countries. Forward P/E of just 8.7x with a 5.4% dividend yield and a policy of returning 75% of profit to shareholders. Strategic plan 2024-2026 targets the high end of 6-8% EPS growth.",
    summary_what:
      "AXA is one of the world's largest insurers. It operates in property & casualty insurance (auto, home, liability), life insurance & savings, health insurance, and asset management. AXA XL is its global commercial/specialty lines arm. With 156,000 employees and a presence in ~50 countries, it is a diversified financial giant.",
    summary_why:
      "Trades at just 8.7x forward P/E — absurdly cheap for a dominant global insurer. 5.4% dividend yield backed by a disciplined 75% total payout policy (60% dividend + annual buybacks). The 'Unlock the Future' 2024-2026 plan targets the high end of 6-8% EPS growth. ROE target of 14-16% and a beta of just 0.65 — defensive compounding with real upside.",
    summary_risk:
      "Natural catastrophes from climate change can significantly increase claims costs, especially at AXA XL. Complex regulation across 50+ jurisdictions.",
  },
  B: {
    summary_short:
      "One of the world's largest gold and copper miners. 3.26M oz of gold and 220K tons of copper in 2025. Revenue of $16.96B.",
    summary_what:
      "Barrick Mining (formerly Barrick Gold) extracts gold and copper in 17 countries. It operates Nevada Gold Mines (JV with Newmont), Pueblo Viejo (Dominican Republic), Loulo-Gounkoto (Mali), Lumwana (Zambia), and is building the Reko Diq megaproject in Pakistan.",
    summary_why:
      "Enormous margins with gold above $5,000/oz (AISC of $1,637/oz). Free cash flow grew 194% to $3.87B. New dividend policy: 50% of FCF. Unique growth pipeline: Reko Diq (copper-gold), Lumwana Super Pit, and Fourmile (Nevada). Production +30% by 2030.",
    summary_risk:
      "100% exposed to gold prices with no hedging. Operates in high political risk jurisdictions (Mali, Pakistan, DRC). Dispute with Newmont over the IPO of North American assets could block a key catalyst.",
  },
  BABA: {
    summary_short:
      "China's e-commerce and cloud giant. Taobao, Tmall, Alibaba Cloud, Alipay. 800M+ active users and China's #1 cloud provider with triple-digit AI growth.",
    summary_what:
      "Alibaba is the world's largest e-commerce company by volume and the #1 cloud provider in China. It operates Taobao (C2C), Tmall (B2C), Alibaba Cloud + DingTalk, AliExpress (international), Ele.me (delivery), and Cainiao (logistics). Its open-source Qwen AI models have 600M+ downloads.",
    summary_why:
      "Cloud growing 36% with AI in triple digits for 10 quarters. Investing $52B in AI infrastructure over 3 years. Forward P/E of 16x — value stock pricing for the largest AI/cloud company in China. Analysts see +35% upside. Solid balance sheet: $52B in cash, low debt.",
    summary_risk:
      "U.S.-China geopolitical risk is ever-present. The Pentagon briefly added it to a military list (later removed). FCF temporarily negative due to the massive AI investment cycle. E-commerce market share dropped from 52% to 41% due to PDD and Douyin.",
  },
  BAC: {
    summary_short:
      "The second-largest bank in the U.S. with a $384B market cap. Consumer banking, wealth management (Merrill Lynch), trading, and corporate banking. Revenue of $113B in 2025, profit of $30.5B.",
    summary_what:
      "Bank of America is one of the 'Big Four' U.S. banks. It operates in 4 segments: Consumer Banking (deposits, cards, loans), Wealth Management (Merrill Lynch, Private Bank), Global Markets (equities and fixed income trading — record year in 2025), and Global Banking (corporate and investment banking). 66 million consumer and small business clients.",
    summary_why:
      "EPS grew 19% in 2025 to $3.81. Forward P/E of 10.86x — the cheapest of the Big Four after Citi. NII guided to grow 5-7% in 2026. Returned $30B to shareholders in 2025. Payout ratio of only 29% — plenty of room to raise the dividend. Global Markets had its best year ever.",
    summary_risk:
      "Sensitive to interest rates — if the Fed cuts more than expected, NII gets compressed. Credit risk if the economy slows. Proposed credit card rate caps would impact Consumer Banking.",
  },
  BDX: {
    summary_short:
      "The world's most essential medical device maker. BD Vacutainer (blood collection tubes), syringes, BD Alaris infusion pumps, and BD Pyxis dispensers. 54 consecutive years of dividend increases — a Dividend Aristocrat.",
    summary_what:
      "Becton Dickinson makes the medical devices used by every hospital in the world. It operates in 4 segments: Medical Essentials (syringes, needles, Vacutainer — 34% of revenue), Interventional (surgery, urology, critical care — 28%), Connected Care (BD Alaris pumps, BD Pyxis dispensers — 25%), and BioPharma Systems (pre-filled syringes for GLP-1s and biologics — 13%). Present in ~200 countries.",
    summary_why:
      "Forward P/E of 12.5x — cheap for medtech (sector trades at 18-25x). Dividend Aristocrat with 54 years of increases. The Life Sciences spin-off completed in Feb 2026 generated $4B in cash for buybacks and debt reduction. BD Alaris received full FDA approval — unlocking an upgrade cycle. BioPharma benefits from the GLP-1 boom (Ozempic, Mounjaro).",
    summary_risk:
      "Tariffs impact 370 basis points in FY2026 due to manufacturing in Mexico. China is pressuring prices with volume-based purchasing policies. Organic growth in Q1 was only 1.6% and needs to accelerate.",
  },
  FCX: {
    summary_short:
      "The #1 copper producer in the U.S. and owner of the Grasberg megadeposit in Indonesia (copper + gold). Megatrend: AI, data centers, and EVs need massive amounts of copper.",
    summary_what:
      "Freeport-McMoRan mines copper, gold, and molybdenum in the U.S. (Morenci, Arizona — the largest copper mine in North America), Indonesia (Grasberg — one of the world's largest copper and gold deposits), Peru (Cerro Verde), and Chile (El Abra). It produces ~3.4 billion pounds of copper and ~1 million ounces of gold per year.",
    summary_why:
      "Secular copper megatrend: AI data centers could consume 1.1M tons annually by 2030. Supply deficit projected for 2026+. Grasberg restarting production in Q2 2026 — a strong earnings catalyst. 2026E EPS of $2.95 (+93% vs 2025). JPMorgan projects copper at $5.67/lb in Q2 2026.",
    summary_risk:
      "A mud rush at Grasberg (Sept 2025) cut production ~35% and caused 7 fatalities. Indonesian regulation may tighten concentrate exports. Copper price is volatile — every $0.10/lb = ~$400M in EBITDA.",
  },
  LMT: {
    summary_short:
      "The #1 defense contractor in the world. Maker of the F-35 (the most advanced fighter jet in the world), HIMARS, PAC-3, Sikorsky helicopters, and NASA's Orion spacecraft. Record backlog of $194 billion.",
    summary_what:
      "Lockheed Martin is the largest defense contractor for the Pentagon and in the world. It operates in 4 segments: Aeronautics (F-35, F-16, C-130J — 40% of revenue), Missiles & Fire Control (HIMARS, PAC-3, JASSM — 19%), Rotary & Mission Systems (Sikorsky, Aegis, radars — 23%), and Space (Orion, GPS III, missile defense — 17%). 100% focused on defense.",
    summary_why:
      "Record backlog of $194B (2.6x annual sales). NATO committed to raising spending to 5% of GDP by 2035. 2026 EPS guided to $29.80 (+39% vs 2025). U.S. defense budget rising ~15% in FY2026. Unprecedented demand for missiles due to conflicts in Ukraine and the Middle East. 24 consecutive years of dividend growth.",
    summary_risk:
      "The Pentagon cut F-35 purchases by nearly 50% in FY2026, shifting focus to sustainment. Block 4/TR-3 has $6B in cost overruns and years of delays. The F-35 is ~30% of revenue — high concentration.",
  },
  NOC: {
    summary_short:
      "The maker of the B-21 Raider (the world's most advanced stealth bomber) and the Sentinel ICBM. The #2 U.S. defense contractor with a record backlog of $95.7 billion and international sales growing 20%.",
    summary_what:
      "Northrop Grumman designs and manufactures advanced defense systems. It operates in 4 segments: Aeronautics (B-21 Raider, drones — 29% of revenue), Mission Systems (radars, cybersecurity, C4ISR — 28%), Space Systems (satellites, GEM 63, missiles — 24%), and Defense Systems (munitions, logistics — 18%). It is the prime contractor for the B-21 and the next-generation Sentinel ICBM.",
    summary_why:
      "Record backlog of $95.7B with a book-to-bill of 1.10x. The B-21 Raider just secured a $4.5B production expansion (+25% capacity). Free cash flow rose 26% to $3.3B in 2025. International sales grew 20%. The geopolitical environment (NATO at 5% of GDP, active conflicts) is driving unprecedented defense spending.",
    summary_risk:
      "The Sentinel ICBM program has massive cost overruns ($141B+) and is undergoing restructuring. At a forward P/E of 24.4x, the valuation is demanding for ~4% sales growth and 2026 EPS guided lower.",
  },
  GE: {
    summary_short:
      "The #1 aircraft engine manufacturer in the world. After separating from GE Vernova in 2024, GE Aerospace is a pure-play aviation company with 44,000+ installed commercial engines, a record ~$190 billion backlog, and the MRO supercycle as a tailwind.",
    summary_what:
      "GE Aerospace designs, manufactures, and services commercial and military aircraft engines. It operates in 2 segments: Commercial Engines & Services (CES, ~72% of revenue) — LEAP engines (via CFM International, a 50/50 JV with Safran) for the Boeing 737 MAX and Airbus A320neo, GE9X for the 777X, GEnx, CF6 — and Defense & Propulsion Technologies (DPT, ~28%) — T700 engines for helicopters, F110, F414 for fighter jets. Its installed base of 44,000+ engines generates massive recurring MRO revenue.",
    summary_why:
      "2025 revenue grew 21% to $42.3B and operating profit rose 25% to $9.1B. Record free cash flow of $7.7B (+24%). Backlog of ~$190B (+$20B in one year). The MRO supercycle (aging fleet + record air travel demand) drove commercial services +26%. LEAP hit a record 1,802 engine deliveries. 2026 guidance targets $9.85B-$10.25B in operating profit.",
    summary_risk:
      "Boeing 737 MAX continues to have production issues that limit LEAP engine deliveries. Premium valuation (forward P/E of 33.7x) requires flawless execution. A GE9X internal seal durability issue could delay 777X certification.",
  },
  HWM: {
    summary_short:
      "The global leader in aerospace engineered components. They make the critical parts inside aircraft engines — the blades spinning at 2,000+ degrees — for Boeing, Airbus, Pratt & Whitney, and GE Aerospace. Record revenue of $8.25B in 2025 with 30% EBITDA margins.",
    summary_what:
      "Howmet Aerospace designs and manufactures high-precision components for the aerospace and defense industry. It operates in 4 segments: Engine Products (blades and rings for aircraft engines — the crown jewel), Fastening Systems (aerospace fasteners and connections), Engineered Structures (titanium parts for fuselages and landing gear), and Forged Wheels (wheels for heavy trucks). It spun off from Alcoa in 2020.",
    summary_why:
      "Record revenue of $8.25B in 2025 (+11% YoY). Q4 was the strongest quarter at $2.2B (+15%). Record adjusted EBITDA margins of 30.1%. Adjusted EPS grew 42%. 2026 guidance targets ~$9.1B in revenue (~10% growth) and EPS of $4.35-$4.55. Just announced the $1.8B acquisition of Consolidated Aerospace Manufacturing to strengthen Fastening Systems.",
    summary_risk:
      "The stock trades at a forward P/E of 41x — priced for perfection. Any stumble in earnings or Boeing production issues could cause a significant correction. The stock is already down ~12% from February highs.",
  },
  BG: {
    summary_short:
      "The #1 oilseed processor in the world. They merged with Viterra, creating a global agribusiness giant with $70B+ in revenue and operations in 40+ countries.",
    summary_what:
      "Bunge connects farmers to consumers globally. They buy, process, and distribute soybeans, canola, sunflower, wheat, and corn. They produce vegetable oils, flours, margarines, mayonnaise, and biofuel feedstocks. After the merger with Viterra (July 2025), they are the largest oilseed processor on the planet.",
    summary_why:
      "The Viterra merger is generating synergies of $190M+ in 2026, ahead of the original plan. Forward P/E of 15.5x is cheap for the scale of the business. 2.2% dividend yield with a low payout ratio (57%). EPS guided at $7.50-$8.00 for 2026 with a target of $15 by 2030. $3B buyback announced. 7 of 7 analysts rate it Buy.",
    summary_risk:
      "Dependence on agricultural commodity prices which are cyclical. Viterra integration still in progress with execution risks. Exposure to tariffs and global trade tensions.",
  },
  BIDU: {
    summary_short:
      "The Google of China and an AI leader. Dominates search with 65%+ market share, operates autonomous robotaxis (Apollo Go) with 20M+ rides, and its ERNIE chatbot has 200M+ monthly users.",
    summary_what:
      "Baidu is the dominant search engine in China and one of the country's most advanced AI companies. It operates Baidu Search, Baidu AI Cloud (~RMB 30B in revenue), Apollo Go (autonomous robotaxis in 22+ cities), ERNIE Bot (AI chatbot with 200M+ MAUs), and holds a stake in iQIYI (video streaming). Its business is in full transition from digital advertising to an integrated AI platform.",
    summary_why:
      "AI transition accelerating: AI Cloud grew 34% in 2025, Apollo Go tripled rides YoY, ERNIE 5.0 competes with GPT-5. Non-GAAP P/E of 14x is absurdly cheap for a leading AI company. $42B in cash (more than its market cap). New $5B buyback program + first-ever dividend policy in 2026.",
    summary_risk:
      "Total revenue fell -3% in 2025. Legacy search business in decline. Chinese regulatory risk and U.S.-China geopolitical tensions. GAAP earnings distorted by iQIYI impairments.",
  },
  BKNG: {
    summary_short:
      "The world's largest online travel platform. Owners of Booking.com, Priceline, Kayak, Agoda, and OpenTable. They process $186B per year in hotel, flight, car, and restaurant bookings across 220+ countries.",
    summary_what:
      "Booking Holdings is the global leader in online travel, connecting travelers with accommodation, transportation, dining, and experiences in over 220 countries. It operates five brands: Booking.com (the world's largest accommodation platform), Priceline (travel deals in North America), Agoda (Asia-Pacific), KAYAK (price search engine), and OpenTable (restaurant reservations). In 2025, they processed $186.1B in gross bookings and 285 million hotel nights in Q4 alone.\n\nIt generates revenue from booking commissions, its payments platform, and metasearch advertising. It has invested heavily in 'Connected Trip' — an AI-powered ecosystem aiming to manage every aspect of travel within a unified platform. The Genius loyalty program increasingly drives direct bookings, reducing dependence on paid marketing.\n\nHeadquartered in Norwalk, Connecticut, but operates globally. Its largest brand, Booking.com, is based in Amsterdam and dominates Europe. Agoda leads in Southeast Asia and Priceline serves the discount segment in North America. It will execute a 25:1 stock split effective April 2, 2026.",
    summary_why:
      "Attractive combination of dividend income and price appreciation. Trades at a forward P/E of ~15.5x, below the S&P 500 and Airbnb, despite 15%+ revenue and EPS growth. 36 analysts have a Buy consensus with a target of ~$5,874 (43% upside). A newly initiated dividend ($42/share, ~1% yield) with a conservative 23% payout ratio — plenty of room to grow.\n\nPowerful structural tailwinds: travel spending continues to shift online, and Booking is the leader with unmatched scale and network effects. The AI-powered Connected Trip strategy captures more spend per traveler. $17.8B in cash for buybacks, dividends, and acquisitions. 2025 revenue of $26.9B (+13.4%), operating cash flow +107% in Q4. Asset-light with high margins — an excellent compounder.",
    summary_risk:
      "EU regulation and AI disruption are the most significant threats. The Digital Markets Act designated Booking.com as a 'gatekeeper,' which could force the removal of price parity clauses — allowing hotels to offer lower rates directly. A proposed $530M fine from Spanish authorities for anticompetitive conduct.\n\nGoogle's planned 'native booking' functionality in AI search (expected 2026) could disintermediate OTAs. Macroeconomic risk: Oxford Economics projects 2026 as the weakest global growth since 2009.",
  },
  BLK: {
    summary_short:
      "The world's largest asset manager with $14 trillion under management. Owners of iShares (the #1 global ETF platform with 32% market share), the Aladdin platform managing $25T+ in assets, and recently acquired HPS Investment Partners (private credit).",
    summary_what:
      "BlackRock is the world's largest investment management firm, founded in 1988 by Larry Fink. It manages ~$14 trillion in assets for institutional clients (pension funds, sovereign wealth funds, central banks, insurers), financial intermediaries, and individual investors across 30+ countries.\n\nIt operates multiple product lines: iShares is the world's largest ETF platform (~32% of the global market with $4.2T in AUM). It also manages active strategies in equities, fixed income, multi-asset, and alternatives. Its Aladdin technology platform processes risk analytics for $25T+ in assets, generating high-margin recurring revenue.\n\nIn 2025, it expanded aggressively into private markets with the acquisitions of HPS Investment Partners (private credit) and Preqin (private markets data). 2025 revenue of $24B (+19% YoY), record net inflows of $698B, and an operating margin of ~45%.",
    summary_why:
      "BlackRock sits at the intersection of multiple secular trends: the shift from active to passive (iShares), the growth of private markets (HPS/Preqin), and the technologization of asset management (Aladdin). Its dominant position creates a powerful flywheel: scale leads to lower fees, which attracts more flows, which brings more scale. Record net inflows of $698B in 2025 demonstrate asset consolidation at BlackRock.\n\n17 consecutive years of dividend increases, a ~2.4% yield with an annual payout of $22.92/share. Forward P/E of 19.5x against 2026 estimated EPS of $54.42. Strong Buy consensus from 27 analysts with a target of $1,309 (~36% upside). A rare combination of reliable and growing dividends, secular tailwinds, and high-margin technology revenue.",
    summary_risk:
      "Market declines directly reduce BlackRock's revenue since it charges fees as a percentage of assets under management — a prolonged bear market compresses earnings and valuation simultaneously. The recent drop from $1,220 to $960 (21% drawdown from 52-week high) illustrates this sensitivity.\n\nAdditional risks: fee compression in ETFs with Vanguard and Schwab pushing expense ratios toward zero; political and regulatory pressure over ESG (13 Republican states have accused BlackRock of anticompetitive climate activism); and integration risk from the HPS and Preqin acquisitions.",
  },
  BTI: {
    summary_short:
      "The second-largest tobacco company in the world. Owners of Lucky Strike, Dunhill, Pall Mall, Camel, and Kent. Global leader in next-generation products (Vuse vaping, glo heated tobacco) with a presence in 180+ markets.",
    summary_what:
      "British American Tobacco is the world's second-largest tobacco company by revenue, founded in 1902 in London. It operates in over 180 markets with iconic brands like Lucky Strike, Dunhill, Pall Mall, Camel, Kent, and Natural American Spirit.\n\nBeyond traditional cigarettes, BAT leads the transition to next-generation products (NGP): Vuse is #1 globally in vaping with ~40% market share, glo competes in heated tobacco, and Velo leads in nicotine pouches. In 2025, new generation categories reached ~£4B in revenue, growing double digits.\n\nTotal revenue ~£27B, with an operating margin of ~43%. BAT generates massive free cash flow (~£8B annually), which funds one of the highest dividends in the sector: 5.7% yield with a 25+ year track record of consecutive payments.",
    summary_why:
      "BTI is a dividend machine at a bargain valuation. At a forward P/E of 11x, it pays 5.7% in dividends — more than double the S&P 500 average. Free cash flow of ~£8B annually comfortably covers the dividend with a ~60% payout ratio.\n\nThe transition to smoke-free products (Vuse, glo, Velo) reduces long-term regulatory and health risk. Vuse is #1 globally in vaping with ~40% market share. The market discounts BAT for being a tobacco company but ignores that new categories are growing double digits and already represent ~15% of revenue.\n\nAnalyst consensus is Buy with a $62 target, ~7% upside plus the 5.7% dividend = ~13% expected total return. Ideal for investors seeking high passive income with a defensive valuation.",
    summary_risk:
      "Global tobacco regulation continues to tighten — vaping flavor bans, advertising restrictions, and potential additional taxes could slow growth in the next-generation categories that are key to BAT's future.\n\nAdditional risks: traditional cigarette volumes decline ~3-4% annually globally; multibillion-dollar health damage lawsuits remain a latent threat; net debt of ~£35B limits financial flexibility; and competition from Philip Morris (IQOS) and Japan Tobacco is intense in heated tobacco.",
  },
  MDLZ: {
    summary_short:
      "The global snack giant. Owners of Oreo (the #1 cookie in the world), Cadbury, Toblerone, Milka, Trident, Tang, Philadelphia, and Ritz. Presence in 150+ countries with ~$36B in revenue.",
    summary_what:
      "Mondelez International is one of the world's largest snack companies, created in 2012 as a spin-off from Kraft Foods. Headquartered in Chicago, it operates in 150+ countries generating ~$36B in annual revenue.\n\nIts portfolio includes some of the most globally recognized snack brands: Oreo (the world's #1 cookie), Cadbury (iconic chocolate in the UK/India/Australia), Milka (leading chocolate in continental Europe), Toblerone (premium Swiss chocolate), Philadelphia (cream cheese), Trident (gum), Tang (powdered drink), Ritz (crackers), belVita (breakfast biscuits), and Halls (lozenges).\n\nMondelez generates ~75% of its revenue outside the U.S., with dominant positions in emerging markets where snack consumption is growing fastest. Operating margin of ~17% with a target to expand to 18-19%.",
    summary_why:
      "Mondelez is the perfect defensive play: snack brands people buy in any economy. Oreo, Cadbury, and Milka have real pricing power — they are low-cost impulse purchases that withstand recessions.\n\nAt $57, MDLZ trades at a forward P/E of 16.9x — a significant discount vs its ~22x historical average. The 20% drawdown from highs ($71) is driven by cocoa cost concerns, but these are already normalizing. 3.5% dividend yield with 10+ years of consecutive growth and a sustainable ~55% payout ratio.\n\nBuy consensus from 22 analysts with an average target of ~$68 (19% upside). Mondelez combines defense (essential snacks), growth (emerging markets), and income (3.5% growing dividend yield).",
    summary_risk:
      "Raw material costs (especially cocoa and sugar) have surged, pressuring margins — cocoa prices tripled in 2024-2025, and while they are coming down, volatility persists and can compress earnings.\n\nAdditional risks: significant currency exposure (75% of revenue outside the U.S.) with a strong dollar eroding reported results; increasing regulation of processed foods and labeling in key markets (EU, Mexico, India); intense competition from local brands in emerging markets; and the risk of shifting consumer habits toward 'healthy' snacks that could displace traditional categories.",
  },
};
