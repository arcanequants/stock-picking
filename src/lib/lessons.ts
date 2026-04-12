/**
 * Selects the top 5 worst-performing positions for the /lecciones page.
 *
 * RULES (see .claude/plans/lecciones-page-plan.md):
 * 1. Weighted average price from ALL transactions per ticker (reuses aggregatePositions)
 * 2. Minimum holding period: 30 days from first buy
 * 3. Only negative returns qualify
 * 4. Sort ASC by return_pct (worst first)
 * 5. Top 5 max
 * 6. NEVER edit the list manually — this is the #1 rule
 */
import { aggregatePositions, type AggregatedPosition } from "@/lib/position-utils";
import { transactions, stocks } from "@/data/stocks";
import type { Transaction } from "@/lib/types";

const MIN_HOLDING_DAYS = 30;
const MAX_LESSONS = 5;

export interface LessonEntry extends AggregatedPosition {
  attestation_uids: string[];
}

/**
 * Given the current prices map (from the latest portfolio snapshot), returns
 * the top 5 worst-performing positions that qualify as "lessons".
 *
 * Pure function — safe to call from a server component. Takes `txs` and
 * `prices` as parameters so tests can inject fixture data.
 */
export function selectLessons(
  txs: Transaction[],
  prices: Record<string, number>,
): LessonEntry[] {
  const { positions } = aggregatePositions(txs, prices);

  // Collect all attestation UIDs per ticker (for the on-chain verification link)
  const uidsByTicker = new Map<string, string[]>();
  for (const tx of txs) {
    if (!tx.attestation_uid) continue;
    const arr = uidsByTicker.get(tx.ticker) ?? [];
    arr.push(tx.attestation_uid);
    uidsByTicker.set(tx.ticker, arr);
  }

  const eligible = positions
    .filter((p) => p.days_held >= MIN_HOLDING_DAYS)
    .filter((p) => p.return_pct < 0)
    .sort((a, b) => {
      // Primary: worst return first
      if (a.return_pct !== b.return_pct) return a.return_pct - b.return_pct;
      // Tiebreak: oldest first
      return a.first_bought.localeCompare(b.first_bought);
    })
    .slice(0, MAX_LESSONS);

  return eligible.map((p) => ({
    ...p,
    attestation_uids: uidsByTicker.get(p.ticker) ?? [],
  }));
}

/**
 * Convenience wrapper that uses the full transactions list.
 * Use the pure `selectLessons(txs, prices)` for testing.
 */
export function selectCurrentLessons(prices: Record<string, number>): LessonEntry[] {
  return selectLessons(transactions, prices);
}

/**
 * Minimal per-ticker educational content. Populate lazily as losers appear.
 * Keys are ticker symbols. Unknown tickers fall back to a placeholder.
 *
 * IMPORTANT (linguistic guardrails — see plan):
 *  - Use retrospective language: "subestimamos X" / "el thesis era Y"
 *  - NEVER prospective: "evita X" / "no compres Y"
 *  - Stick to facts, not opinions about the market
 */
export interface LessonContent {
  thesis: string; // "Lo que pensábamos" — original thesis at the time of the buy
  whatHappened: string; // "Lo que pasó" — objective facts, no drama
  lesson: string; // "La lección" — retrospective, about OUR process, not prospective
}

// Actual content per ticker. Missing tickers render a "research in progress" card.
// Linguistic rules: retrospective only ("subestimamos", "el thesis era"), never prospective ("evita", "no compres").
export const LESSON_CONTENT: Record<string, LessonContent> = {
  AWK: {
    thesis:
      "El thesis era un monopolio regulado intocable: la utility de agua privada más grande de EE.UU., 14 millones de clientes, dividendo creciendo ~8% anual por 18 años consecutivos, y una megafusión con Essential Utilities que expandiría cobertura a 17 estados. Agua = necesidad absoluta. Sin competencia en cada territorio. Ingresos predecibles por décadas.",
    whatHappened:
      "A 32 días del pick, la posición está esencialmente flat (-0.75%). No hubo un evento negativo — el negocio sigue operando exactamente como se esperaba. Lo que subestimamos fue el timing: las utilities se mueven con las expectativas de tasas de interés. Con tasas altas prolongadas, el mercado descuenta menos el flujo futuro de dividendos. La fusión con Essential Utilities sigue en proceso regulatorio (cierre esperado Q1 2027).",
    lesson:
      "Las utilities reguladas son defensivas pero no inmunes al entorno macro. Un P/E de 22x en un ambiente de tasas altas significa que el mercado ya está pagando premium por la estabilidad — y cuando las tasas no bajan, ese premium no se expande. La tesis de largo plazo sigue intacta, pero reconocemos que compramos en un momento donde el viento de cola de las tasas no estaba soplando a favor.",
  },
};

export function getLessonContent(ticker: string): LessonContent | null {
  return LESSON_CONTENT[ticker] ?? null;
}

/**
 * Derives the nice display name from stocks.ts (for the lesson header).
 */
export function getStockName(ticker: string): string {
  return stocks.find((s) => s.ticker === ticker)?.name ?? ticker;
}
