import { CdpClient } from "@coinbase/cdp-sdk";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import {
  createPublicClient,
  http,
  type Hex,
  type Address,
} from "viem";
import { base } from "viem/chains";

// === Constants ===

const EAS_ADDRESS: Address = "0x4200000000000000000000000000000000000021";
const SCHEMA_REGISTRY_ADDRESS: Address =
  "0x4200000000000000000000000000000000000020";
const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
const ZERO_BYTES32: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const SCHEMA_STRING =
  "string ticker, uint256 price, string date, uint256 pickNumber, bytes32 chainHash";

// === ABIs ===

const EAS_ABI = [
  {
    name: "attest",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple",
            components: [
              { name: "recipient", type: "address" },
              { name: "expirationTime", type: "uint64" },
              { name: "revocable", type: "bool" },
              { name: "refUID", type: "bytes32" },
              { name: "data", type: "bytes" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getAttestation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "schema", type: "bytes32" },
          { name: "time", type: "uint64" },
          { name: "expirationTime", type: "uint64" },
          { name: "revocationTime", type: "uint64" },
          { name: "refUID", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "attester", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
] as const;

const SCHEMA_REGISTRY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schema", type: "string" },
      { name: "resolver", type: "address" },
      { name: "revocable", type: "bool" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

// Event ABIs not needed — we parse logs directly by contract address and topic structure
// Base L2 EAS contracts use non-standard event signatures

// === Interfaces ===

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

// === Clients ===

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

function getCdpClient(): CdpClient {
  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    throw new Error(
      "CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set. Get them from https://portal.cdp.coinbase.com → API Keys"
    );
  }
  return new CdpClient();
}

async function getSmartAccount(cdp: CdpClient) {
  const owner = await cdp.evm.getOrCreateAccount({ name: "eas-attestor" });
  const smartAccount = await cdp.evm.getOrCreateSmartAccount({
    owner,
    name: "eas-smart-account",
  });
  return smartAccount;
}

// === Schema Registration (one-time) ===

export async function registerSchema(): Promise<string> {
  const cdp = getCdpClient();
  const smartAccount = await getSmartAccount(cdp);
  const paymasterUrl = process.env.CDP_PAYMASTER_URL;

  console.log(`Smart Account: ${smartAccount.address}`);

  const result = await cdp.evm.sendUserOperation({
    smartAccount,
    network: "base",
    calls: [
      {
        to: SCHEMA_REGISTRY_ADDRESS,
        abi: [...SCHEMA_REGISTRY_ABI],
        functionName: "register",
        args: [SCHEMA_STRING, ZERO_ADDRESS, false],
      },
    ],
    ...(paymasterUrl ? { paymasterUrl } : {}),
  });

  const receipt = await cdp.evm.waitForUserOperation({
    smartAccountAddress: smartAccount.address,
    userOpHash: result.userOpHash,
  });

  if (receipt.status !== "complete") {
    throw new Error("Schema registration failed on-chain");
  }

  // Parse Registered event from transaction logs
  // Base L2 SchemaRegistry emits: topics[0]=sig, topics[1]=uid
  const txReceipt = await publicClient.getTransactionReceipt({
    hash: receipt.transactionHash as Hex,
  });

  const SCHEMA_REGISTRY_LOWER = SCHEMA_REGISTRY_ADDRESS.toLowerCase();
  for (const log of txReceipt.logs) {
    if (
      log.address.toLowerCase() === SCHEMA_REGISTRY_LOWER &&
      log.topics.length >= 2 &&
      log.topics[1]
    ) {
      return log.topics[1]; // Schema UID is topics[1]
    }
  }

  throw new Error("Could not find Registered event in transaction logs");
}

// === Create Attestation ===

export async function createAttestation(
  data: AttestationData
): Promise<AttestationResult> {
  const schemaUid = process.env.EAS_SCHEMA_UID;
  if (!schemaUid) throw new Error("EAS_SCHEMA_UID not configured");

  const cdp = getCdpClient();
  const smartAccount = await getSmartAccount(cdp);
  const paymasterUrl = process.env.CDP_PAYMASTER_URL;

  // Encode attestation data using EAS SchemaEncoder
  const encoder = new SchemaEncoder(SCHEMA_STRING);
  const encodedData = encoder.encodeData([
    { name: "ticker", value: data.ticker, type: "string" },
    {
      name: "price",
      value: BigInt(Math.round(data.price * 100)),
      type: "uint256",
    },
    { name: "date", value: data.date, type: "string" },
    { name: "pickNumber", value: BigInt(data.pickNumber), type: "uint256" },
    { name: "chainHash", value: "0x" + data.chainHash, type: "bytes32" },
  ]);

  const result = await cdp.evm.sendUserOperation({
    smartAccount,
    network: "base",
    calls: [
      {
        to: EAS_ADDRESS,
        abi: [...EAS_ABI.filter((f) => f.name === "attest")],
        functionName: "attest",
        args: [
          {
            schema: schemaUid as Hex,
            data: {
              recipient: ZERO_ADDRESS,
              expirationTime: BigInt(0),
              revocable: false,
              refUID: ZERO_BYTES32,
              data: encodedData as Hex,
              value: BigInt(0),
            },
          },
        ],
        value: BigInt(0),
      },
    ],
    ...(paymasterUrl ? { paymasterUrl } : {}),
  });

  const receipt = await cdp.evm.waitForUserOperation({
    smartAccountAddress: smartAccount.address,
    userOpHash: result.userOpHash,
  });

  if (receipt.status !== "complete") {
    throw new Error(`Attestation failed for ${data.ticker}`);
  }

  // Parse Attested event from transaction logs
  // Base L2 EAS: topics[0]=sig, topics[1]=recipient, topics[2]=attester,
  // topics[3]=schemaUID, data=uid (32 bytes)
  const txReceipt = await publicClient.getTransactionReceipt({
    hash: receipt.transactionHash as Hex,
  });

  const EAS_LOWER = EAS_ADDRESS.toLowerCase();
  const schemaLower = schemaUid.toLowerCase();
  for (const log of txReceipt.logs) {
    if (
      log.address.toLowerCase() === EAS_LOWER &&
      log.topics.length >= 4 &&
      log.topics[3]?.toLowerCase() === schemaLower &&
      log.data &&
      log.data.length === 66
    ) {
      return {
        uid: log.data as string, // uid is the entire data field (bytes32)
        txHash: receipt.transactionHash,
      };
    }
  }

  throw new Error("Could not find Attested event in transaction logs");
}

// === Read Attestation (read-only, no CDP needed) ===

export async function getAttestation(uid: string) {
  const result = await publicClient.readContract({
    address: EAS_ADDRESS,
    abi: EAS_ABI,
    functionName: "getAttestation",
    args: [uid as Hex],
  });

  const encoder = new SchemaEncoder(SCHEMA_STRING);
  const decoded = encoder.decodeData(result.data);

  return {
    uid: result.uid,
    attester: result.attester,
    time: Number(result.time),
    data: {
      ticker: decoded[0].value.value as string,
      price: Number(decoded[1].value.value) / 100,
      date: decoded[2].value.value as string,
      pickNumber: Number(decoded[3].value.value),
      chainHash: (decoded[4].value.value as string).slice(2),
    },
  };
}

// === URL Helpers ===

export function getEasExplorerUrl(uid: string): string {
  return `https://base.easscan.org/attestation/view/${uid}`;
}

export function getBasescanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}
