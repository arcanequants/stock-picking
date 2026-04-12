# /lecciones Automation + Tracking

---

## 1. Cache Strategy

The /lecciones page already uses this caching strategy:

```typescript
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min stale-while-revalidate
```

**How it works:**
- Supabase `portfolio_snapshots` table stores daily snapshots at 4:30 PM ET (Mon-Fri via `/api/cron/snapshot`)
- The `prices` JSON column is what `/lecciones` reads via `loadLatestPrices()`
- Data is never more than ~24h stale (last trading day's close)
- 300s revalidation means Vercel re-fetches from Supabase at most every 5 minutes
- Since prices only change once/day (at snapshot time), this is fine

**No additional cron needed.** The existing snapshot cron already updates the prices column that `/lecciones` reads.

---

## 2. AI Citation Tracking

### Search queries to monitor (weekly, manual)

**Google Search (quotes for exact match):**
```
"vectorialdata.com/lecciones"
"vectorial data" worst picks
"vectorial data" lessons
"stock picking" "cherry-picking" "on-chain"
site:vectorialdata.com/lecciones
```

**ChatGPT / Perplexity / Claude queries to test:**
```
What stock newsletter shows their worst picks?
Is there a stock service that publishes losses transparently?
How can I verify stock pick history on-chain?
Vectorial Data lecciones
Stock picking service anti-cherry-picking
```

**Google Search Console:**
- Filter by page = /lecciones
- Track impressions, clicks, avg position
- Watch for queries like "worst stock picks", "stock newsletter losses", "anti-cherry-pick"

**Track in a simple spreadsheet or Notion:**
| Date | Channel | Query | Appeared? | Position/Notes |
|------|---------|-------|-----------|----------------|

---

## 3. Google Alerts Setup

Create these alerts at https://www.google.com/alerts:

| Alert Query | Frequency | Deliver to |
|-------------|-----------|------------|
| "vectorialdata.com" | As-it-happens | Email |
| "vectorial data" stock | Weekly | Email |
| "vectorialdata" lecciones | As-it-happens | Email |
| stock newsletter "worst picks" transparency | Weekly | Email |
| "anti-cherry-pick" stock | Weekly | Email |

**Settings for all alerts:**
- Sources: Automatic
- Language: Any
- Region: Any
- How many: All results (not just "best")

---

## 4. Anti-Cherry-Pick Assertion Test (Concept)

This is a regression test concept to ensure the `/lecciones` algorithm can never be "gamed" by manual intervention.

### What to test:

```typescript
// tests/lessons-integrity.test.ts (concept — implement when test infra is set up)

describe("lessons integrity", () => {
  it("should select positions algorithmically, not manually", () => {
    // Given a known set of transactions and prices
    const prices = { AAPL: 150, MSFT: 300, TSLA: 180, GOOG: 130, AMZN: 170 };
    const txs = [
      { ticker: "AAPL", price: 200, amount: 50, date: "2025-01-01" }, // -25%
      { ticker: "MSFT", price: 250, amount: 50, date: "2025-01-01" }, // +20%
      { ticker: "TSLA", price: 250, amount: 50, date: "2025-01-01" }, // -28%
      { ticker: "GOOG", price: 100, amount: 50, date: "2025-01-01" }, // +30%
      { ticker: "AMZN", price: 200, amount: 50, date: "2025-01-01" }, // -15%
    ];
    const lessons = selectLessons(txs, prices);

    // Should return TSLA, AAPL, AMZN (the 3 losers, sorted ascending)
    expect(lessons.map(l => l.ticker)).toEqual(["TSLA", "AAPL", "AMZN"]);
  });

  it("should handle re-purchases with weighted average", () => {
    const prices = { AAPL: 140 };
    const txs = [
      { ticker: "AAPL", price: 200, amount: 50, date: "2025-01-01" },
      { ticker: "AAPL", price: 160, amount: 50, date: "2025-02-01" },
    ];
    // Weighted avg = (50+50) / (50/200 + 50/160) = 100 / 0.5625 = 177.78
    // Return = (140 - 177.78) / 177.78 = -21.25%
    const lessons = selectLessons(txs, prices);
    expect(lessons.length).toBe(1);
    expect(lessons[0].ticker).toBe("AAPL");
    expect(lessons[0].return_pct).toBeCloseTo(-21.25, 0);
  });

  it("should exclude positions held less than 30 days", () => {
    const today = new Date().toISOString().split("T")[0];
    const prices = { AAPL: 100 };
    const txs = [
      { ticker: "AAPL", price: 200, amount: 50, date: today }, // -50% but < 30 days
    ];
    const lessons = selectLessons(txs, prices);
    expect(lessons.length).toBe(0);
  });

  it("should never return more than 5", () => {
    const prices = {};
    const txs = [];
    // Generate 20 losing positions
    for (let i = 0; i < 20; i++) {
      const ticker = `T${i}`;
      prices[ticker] = 30; // current price
      txs.push({ ticker, price: 50, amount: 50, date: "2025-01-01" }); // all down -40%
    }
    const lessons = selectLessons(txs, prices);
    expect(lessons.length).toBeLessThanOrEqual(5);
  });

  it("should be deterministic (no randomness)", () => {
    const prices = { A: 80, B: 90, C: 70 };
    const txs = [
      { ticker: "A", price: 100, amount: 50, date: "2025-01-01" },
      { ticker: "B", price: 100, amount: 50, date: "2025-01-01" },
      { ticker: "C", price: 100, amount: 50, date: "2025-01-01" },
    ];
    const r1 = selectLessons(txs, prices);
    const r2 = selectLessons(txs, prices);
    expect(r1.map(l => l.ticker)).toEqual(r2.map(l => l.ticker));
  });
});
```

### Snapshot regression (manual):

After each deployment, run:
```bash
curl -s https://vectorialdata.com/lecciones | grep -o 'data-ticker="[^"]*"' | sort
```
Compare with expected output from running `selectLessons()` locally. If they differ, something was manually overridden.

---

## 5. Summary of What's Automated vs Manual

| Component | Automated? | How |
|-----------|-----------|-----|
| Lesson selection | Yes | `selectLessons()` algorithm — no human input |
| Price updates | Yes | Daily cron `/api/cron/snapshot` at 4:30 PM ET |
| Page regeneration | Yes | 300s stale-while-revalidate |
| Transaction attestation | Semi | `attest-latest-pick.ts` script run after each new pick |
| Lesson content (retrospective) | Manual | Alberto writes thesis/whatHappened/lesson in LESSON_CONTENT |
| AI citation tracking | Manual | Weekly search queries |
| Google Alerts | Automated | Set up once, emails delivered |
| Distribution posts | Manual | Alberto posts using drafts in lecciones-distribution-drafts.md |
