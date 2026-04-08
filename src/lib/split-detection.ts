/**
 * Automatic stock split detection.
 *
 * Compares a transaction's buy price against the current (or historical)
 * market price. If the ratio is close to a common split factor, the buy
 * price is adjusted so portfolio math stays correct even when Yahoo
 * Finance has retroactively adjusted historical prices.
 */

const COMMON_FORWARD_RATIOS = [2, 3, 4, 5, 10, 15, 20, 25, 50, 100];
const COMMON_REVERSE_RATIOS = [2, 3, 4, 5, 10, 20, 50];

// Tighter tolerance for 2:1 (could be confused with a 50% price drop)
const TOLERANCE_2X = 0.1;
const TOLERANCE_DEFAULT = 0.15;

export interface SplitAdjustment {
  detected: boolean;
  splitRatio: number; // e.g. 25 for 25:1 forward, 0.1 for 1:10 reverse
  adjustedPrice: number;
  originalPrice: number;
}

/**
 * Detects if a stock split likely occurred between the buy date and now.
 *
 * Forward split (e.g. 25:1): buyPrice >> currentPrice
 * Reverse split (e.g. 1:10): buyPrice << currentPrice
 */
export function adjustPriceForSplit(
  buyPrice: number,
  currentPrice: number,
): SplitAdjustment {
  if (!buyPrice || !currentPrice || buyPrice <= 0 || currentPrice <= 0) {
    return { detected: false, splitRatio: 1, adjustedPrice: buyPrice, originalPrice: buyPrice };
  }

  const ratio = buyPrice / currentPrice;

  // Forward split detection (buyPrice much higher than currentPrice)
  if (ratio > 1.8) {
    for (const r of COMMON_FORWARD_RATIOS) {
      const tolerance = r === 2 ? TOLERANCE_2X : TOLERANCE_DEFAULT;
      if (Math.abs(ratio / r - 1) < tolerance) {
        return {
          detected: true,
          splitRatio: r,
          adjustedPrice: buyPrice / r,
          originalPrice: buyPrice,
        };
      }
    }
  }

  // Reverse split detection (currentPrice much higher than buyPrice)
  if (ratio < 0.55) {
    const inverseRatio = currentPrice / buyPrice;
    for (const r of COMMON_REVERSE_RATIOS) {
      const tolerance = r === 2 ? TOLERANCE_2X : TOLERANCE_DEFAULT;
      if (Math.abs(inverseRatio / r - 1) < tolerance) {
        return {
          detected: true,
          splitRatio: 1 / r,
          adjustedPrice: buyPrice * r,
          originalPrice: buyPrice,
        };
      }
    }
  }

  return { detected: false, splitRatio: 1, adjustedPrice: buyPrice, originalPrice: buyPrice };
}
