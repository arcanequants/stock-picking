import { x402ResourceServer } from "@x402/core/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

// CDP facilitator for mainnet, x402.org for testnet (free, no API key)
const facilitatorUrl =
  process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator";

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

// Base Sepolia testnet by default (x402.org facilitator only supports testnet)
// Switch to eip155:8453 for mainnet when using CDP facilitator
export const NETWORK = (process.env.X402_NETWORK || "eip155:84532") as `${string}:${string}`;

export const PAY_TO = (process.env.X402_PAY_TO_ADDRESS ||
  process.env.CRYPTO_WALLET_ADDRESS ||
  "") as `0x${string}`;

export const x402Server = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme()
);
