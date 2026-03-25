/**
 * Deterministic rotation utilities for /stocks page.
 * All users see the same stocks on the same day — no Math.random().
 * Uses integer-only arithmetic (works identically on server and client).
 */

/** Hash a string into a positive integer (djb2) */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Linear congruential generator — deterministic PRNG from seed */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return s >>> 0;
  };
}

/** Fisher-Yates shuffle with deterministic seed */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const next = lcg(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Get day-of-year (1-366) for a date */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

/** Get ISO week number */
function isoWeek(d: Date): number {
  const tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** Compute a rotation period key — all users get the same key at the same time */
export function getRotationSeed(type: "48h" | "72h" | "7d", now?: Date): number {
  const d = now ?? new Date();
  const year = d.getFullYear();
  let key: string;

  switch (type) {
    case "48h":
      key = `${year}-p${Math.floor(dayOfYear(d) / 2)}`;
      break;
    case "72h":
      key = `${year}-f${Math.floor(dayOfYear(d) / 3)}`;
      break;
    case "7d":
      key = `${year}-W${isoWeek(d)}`;
      break;
  }

  return hashString(key);
}

/**
 * Select which stocks are visible to free users.
 * Returns ~ratio of the list, minimum 3.
 */
export function selectVisible<T>(items: T[], seed: number, ratio = 0.3): { visible: T[]; hidden: T[] } {
  const count = Math.max(Math.round(items.length * ratio), 3);
  const shuffled = seededShuffle(items, seed);
  return {
    visible: shuffled.slice(0, count),
    hidden: shuffled.slice(count),
  };
}

/**
 * Select showcase stocks (with full research preview).
 * Drawn from the visible pool. Returns `count` items.
 */
export function selectShowcase<T>(visibleItems: T[], seed: number, count = 2): T[] {
  const shuffled = seededShuffle(visibleItems, seed);
  return shuffled.slice(0, Math.min(count, visibleItems.length));
}

/**
 * Select a featured pick (random, NOT the latest).
 * `excludeTicker` is the latest pick ticker to avoid showing it.
 */
export function selectFeatured<T extends { ticker: string }>(
  items: T[],
  seed: number,
  excludeTicker?: string,
): T | null {
  const pool = excludeTicker ? items.filter((i) => i.ticker !== excludeTicker) : items;
  if (pool.length === 0) return items[0] ?? null;
  const shuffled = seededShuffle(pool, seed);
  return shuffled[0];
}
