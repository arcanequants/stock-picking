// Tentative price packs for API credit top-ups. 1 credit = 1 request = $0.002.
// Each pack ships pure credits at flat $0.002 each — no volume discount yet.
// Phase 1.3 just wires payments; tier pricing can evolve once we see demand.

export type CreditPackId = "starter" | "pro" | "scale";

export interface CreditPack {
  id: CreditPackId;
  label: string;
  credits: number;
  priceUsdCents: number;
}

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  starter: { id: "starter", label: "Starter",  credits: 2_500,  priceUsdCents: 500 },   // $5
  pro:     { id: "pro",     label: "Pro",      credits: 10_000, priceUsdCents: 2_000 }, // $20
  scale:   { id: "scale",   label: "Scale",    credits: 50_000, priceUsdCents: 10_000 },// $100
};

export function getPack(id: string | null | undefined): CreditPack | null {
  if (!id) return null;
  return (CREDIT_PACKS as Record<string, CreditPack>)[id] ?? null;
}
