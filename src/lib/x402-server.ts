import { x402ResourceServer } from "@x402/core/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { facilitator } from "@coinbase/x402";

// Use CDP facilitator (mainnet) when CDP keys are set, otherwise x402.org (testnet)
const useCdp = !!(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET);

const facilitatorClient = new HTTPFacilitatorClient(
  useCdp
    ? facilitator
    : { url: "https://x402.org/facilitator" }
);

// Base mainnet when CDP keys available, Base Sepolia testnet otherwise
export const NETWORK = (process.env.X402_NETWORK || (useCdp ? "eip155:8453" : "eip155:84532")) as `${string}:${string}`;

export const PAY_TO = (process.env.X402_PAY_TO_ADDRESS ||
  process.env.CRYPTO_WALLET_ADDRESS ||
  "") as `0x${string}`;

export const x402Server = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme()
);
