// Per-endpoint API cost in micro-USDC (1 USDC = 1_000_000 micro).
// Parity with the x402 pay-per-request USD prices (× 1e6) so an API-key call and
// an x402 call cost the same for the same data. Keep these two in sync.
export const ENDPOINT_COST_MICRO_USDC = {
  picks: 5_000, //              $0.005  /api/v1/picks
  picksLatest: 1_000, //        $0.001  /api/v1/picks/latest
  research: 10_000, //          $0.01   /api/v1/research/{ticker}
  portfolio: 2_000, //          $0.002  /api/v1/portfolio
  portfolioPositions: 3_000, // $0.003  /api/v1/portfolio/positions
  portfolioHistory: 5_000, //   $0.005  /api/v1/portfolio/history
  sectors: 1_000, //            $0.001  /api/v1/sectors
  regions: 1_000, //            $0.001  /api/v1/regions
  stocks: 5_000, //             $0.005  /api/v1/stocks
  events: 2_000, //             $0.002  /api/v1/events
  digestLatest: 3_000, //       $0.003  /api/v1/digest/latest
  economicEvents: 2_000, //     $0.002  /api/v1/economic-events (no x402 twin; priced like events)
} as const;

// Exact pathname → cost. Order doesn't matter (exact keys can't collide).
const EXACT_PATH_COST: Record<string, number> = {
  "/api/v1/picks": ENDPOINT_COST_MICRO_USDC.picks,
  "/api/v1/picks/latest": ENDPOINT_COST_MICRO_USDC.picksLatest,
  "/api/v1/portfolio": ENDPOINT_COST_MICRO_USDC.portfolio,
  "/api/v1/portfolio/positions": ENDPOINT_COST_MICRO_USDC.portfolioPositions,
  "/api/v1/portfolio/history": ENDPOINT_COST_MICRO_USDC.portfolioHistory,
  "/api/v1/sectors": ENDPOINT_COST_MICRO_USDC.sectors,
  "/api/v1/regions": ENDPOINT_COST_MICRO_USDC.regions,
  "/api/v1/stocks": ENDPOINT_COST_MICRO_USDC.stocks,
  "/api/v1/events": ENDPOINT_COST_MICRO_USDC.events,
  "/api/v1/digest/latest": ENDPOINT_COST_MICRO_USDC.digestLatest,
  "/api/v1/economic-events": ENDPOINT_COST_MICRO_USDC.economicEvents,
};

/**
 * Resolve the per-request cost (micro-USDC) for a v1 API pathname.
 * Dynamic routes (research/{ticker}) are matched by prefix. Unknown paths
 * (legacy auth/payment ops) fall back to the caller-provided default.
 */
export function costForPath(pathname: string, fallback: number): number {
  if (pathname in EXACT_PATH_COST) return EXACT_PATH_COST[pathname];
  if (pathname.startsWith("/api/v1/research/")) {
    return ENDPOINT_COST_MICRO_USDC.research;
  }
  return fallback;
}
