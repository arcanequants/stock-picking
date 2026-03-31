import { EAS, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";

// Base L2 EAS contracts
const EAS_CONTRACT = "0x4200000000000000000000000000000000000021";
const SCHEMA_REGISTRY = "0x4200000000000000000000000000000000000020";

// Schema for stock pick attestations
export const SCHEMA_STRING =
  "string ticker, uint256 price, string date, uint256 pickNumber, bytes32 chainHash";

export interface AttestationData {
  ticker: string;
  price: number; // USD price, stored as price*100 on-chain
  date: string; // ISO date e.g. "2026-03-04"
  pickNumber: number;
  chainHash: string; // 64-char hex (no 0x prefix)
}

export interface AttestationResult {
  uid: string;
  txHash: string;
}

// --- Signer ---

function getSigner(): ethers.Wallet {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error("WALLET_PRIVATE_KEY not configured");
  const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}

function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

// --- Schema Registration (one-time) ---

export async function registerSchema(): Promise<string> {
  const signer = getSigner();
  const registry = new SchemaRegistry(SCHEMA_REGISTRY);
  registry.connect(signer);

  const tx = await registry.register({
    schema: SCHEMA_STRING,
    resolverAddress: ethers.ZeroAddress,
    revocable: false,
  });

  const uid = await tx.wait();
  return uid;
}

// --- Create Attestation ---

export async function createAttestation(
  data: AttestationData
): Promise<AttestationResult> {
  const schemaUid = process.env.EAS_SCHEMA_UID;
  if (!schemaUid) throw new Error("EAS_SCHEMA_UID not configured");

  const signer = getSigner();
  const eas = new EAS(EAS_CONTRACT);
  eas.connect(signer);

  const encoder = new SchemaEncoder(SCHEMA_STRING);
  const encodedData = encoder.encodeData([
    { name: "ticker", value: data.ticker, type: "string" },
    { name: "price", value: BigInt(Math.round(data.price * 100)), type: "uint256" },
    { name: "date", value: data.date, type: "string" },
    { name: "pickNumber", value: BigInt(data.pickNumber), type: "uint256" },
    { name: "chainHash", value: "0x" + data.chainHash, type: "bytes32" },
  ]);

  const tx = await eas.attest({
    schema: schemaUid,
    data: {
      recipient: ethers.ZeroAddress,
      expirationTime: BigInt(0),
      revocable: false,
      data: encodedData,
    },
  });

  const uid = await tx.wait();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txHash = (tx as any).tx?.hash ?? "";
  return { uid, txHash };
}

// --- Read Attestation ---

export async function getAttestation(uid: string) {
  const provider = getProvider();
  const eas = new EAS(EAS_CONTRACT);
  eas.connect(provider);

  const attestation = await eas.getAttestation(uid);

  const encoder = new SchemaEncoder(SCHEMA_STRING);
  const decoded = encoder.decodeData(attestation.data);

  return {
    uid: attestation.uid,
    attester: attestation.attester,
    time: Number(attestation.time),
    data: {
      ticker: decoded[0].value.value as string,
      price: Number(decoded[1].value.value) / 100,
      date: decoded[2].value.value as string,
      pickNumber: Number(decoded[3].value.value),
      chainHash: (decoded[4].value.value as string).slice(2),
    },
  };
}

// --- URL Helpers ---

export function getEasExplorerUrl(uid: string): string {
  return `https://base.easscan.org/attestation/view/${uid}`;
}

export function getBasescanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}
