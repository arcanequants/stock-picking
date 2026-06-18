// Preset top-up amounts for an API key's prepaid balance. Each pack adds USDC
// directly to the balance — $1 charged via Stripe = 1 USDC credited (parity with
// x402 per-request pricing). Minimum deposit is 5 USDC.

export type TopUpPackId = "starter" | "pro" | "scale";

export interface TopUpPack {
  id: TopUpPackId;
  label: string;
  usdc: number; // USDC added to the prepaid balance
  priceUsdCents: number; // amount charged by Stripe (cents)
}

/** Minimum top-up deposit, in USDC. */
export const MIN_TOPUP_USDC = 5;

export const TOPUP_PACKS: Record<TopUpPackId, TopUpPack> = {
  starter: { id: "starter", label: "Starter", usdc: 5,   priceUsdCents: 500 },    // $5
  pro:     { id: "pro",     label: "Pro",     usdc: 20,  priceUsdCents: 2_000 },  // $20
  scale:   { id: "scale",   label: "Scale",   usdc: 100, priceUsdCents: 10_000 },// $100
};

export function getPack(id: string | null | undefined): TopUpPack | null {
  if (!id) return null;
  return (TOPUP_PACKS as Record<string, TopUpPack>)[id] ?? null;
}
