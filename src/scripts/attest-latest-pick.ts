/**
 * Attest the latest pick(s) that don't have an attestation_uid yet.
 * Auto-writes the UIDs back into stocks.ts — no manual copy-paste needed.
 *
 * Run after adding a new pick: npx tsx src/scripts/attest-latest-pick.ts
 *
 * Requires: CDP_API_KEY_ID + CDP_API_KEY_SECRET + EAS_SCHEMA_UID env vars
 * Optional: CDP_PAYMASTER_URL for gasless execution
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { transactions } from "../data/stocks";
import { createAttestation } from "../lib/eas";

const STOCKS_FILE = resolve(__dirname, "../data/stocks.ts");

function writeUidToStocksFile(
  txId: number,
  uid: string,
  fileContent: string
): string {
  // Find the transaction block by matching its id and the closing brace
  // We look for the wa_message line (last field before closing) and insert attestation_uid after it
  // Pattern: find `id: <txId>,` then find the next `},` or `}\n];` and insert before it

  // Strategy: find the transaction by id, then find where to insert attestation_uid
  // Match: `    id: <txId>,` ... then the closing `  },` or `  },\n]`
  const lines = fileContent.split("\n");
  let inTargetTx = false;
  let insertAfterLine = -1;

  // Start searching only after "export const transactions" to avoid matching stock entries
  const txSectionStart = lines.findIndex((l) =>
    l.includes("export const transactions")
  );
  const startLine = txSectionStart >= 0 ? txSectionStart : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of our target transaction
    if (line.match(new RegExp(`^\\s*id:\\s*${txId},`))) {
      inTargetTx = true;
      continue;
    }

    // If we hit the next transaction's id, we passed our target
    if (inTargetTx && line.match(/^\s*id:\s*\d+,/)) {
      break;
    }

    // If in target tx and we find the closing `},` or end `};`
    if (inTargetTx && line.match(/^\s*},?\s*$/)) {
      // Insert before this closing brace
      // Find the last non-empty content line before this
      insertAfterLine = i;
      break;
    }
  }

  if (insertAfterLine === -1) {
    throw new Error(
      `Could not find transaction id: ${txId} in stocks.ts to insert attestation_uid`
    );
  }

  // Check if attestation_uid already exists for this transaction
  for (let i = insertAfterLine - 10; i < insertAfterLine; i++) {
    if (i >= 0 && lines[i].includes("attestation_uid")) {
      // Replace existing attestation_uid
      lines[i] = `    attestation_uid:`;
      lines[i + 1] = `      "${uid}",`;
      return lines.join("\n");
    }
  }

  // Insert attestation_uid before the closing brace
  const indent = "    ";
  const newLines = [
    `${indent}attestation_uid:`,
    `${indent}  "${uid}",`,
  ];

  lines.splice(insertAfterLine, 0, ...newLines);
  return lines.join("\n");
}

async function attestLatest() {
  // Find transactions without attestation_uid
  const unattested = transactions
    .map((tx, i) => ({ tx, index: i }))
    .filter(({ tx }) => !tx.attestation_uid);

  if (unattested.length === 0) {
    console.log("All picks already attested!");
    return;
  }

  console.log(`Found ${unattested.length} unattested pick(s).\n`);

  // Rebuild hash chain
  let previousHash = "0".repeat(64);
  const hashes: string[] = [];
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
    const hash = createHash("sha256").update(input).digest("hex");
    hashes.push(hash);
    previousHash = hash;
  }

  // Read stocks.ts content for auto-writing UIDs
  let fileContent = readFileSync(STOCKS_FILE, "utf-8");
  const results: { txId: number; ticker: string; uid: string }[] = [];

  for (let j = 0; j < unattested.length; j++) {
    const { tx, index } = unattested[j];
    const pickNumber = index + 1;
    console.log(
      `Attesting Pick #${pickNumber}: ${tx.ticker} — $${tx.price} — ${tx.date}`
    );

    const result = await createAttestation({
      ticker: tx.ticker,
      price: tx.price,
      date: tx.date,
      pickNumber,
      chainHash: hashes[index],
    });

    console.log(`  UID: ${result.uid}`);
    console.log(`  TX:  ${result.txHash}`);

    // Auto-write UID back into stocks.ts
    fileContent = writeUidToStocksFile(tx.id, result.uid, fileContent);
    results.push({ txId: tx.id, ticker: tx.ticker, uid: result.uid });

    console.log(`  Written to stocks.ts\n`);

    // Wait between attestations
    if (j < unattested.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // Write the updated file once at the end
  writeFileSync(STOCKS_FILE, fileContent, "utf-8");

  console.log("=".repeat(50));
  console.log(`Done! ${results.length} pick(s) attested and written to stocks.ts.`);
  console.log("Ready to commit and push.");
}

attestLatest().catch((err) => {
  console.error("Attestation failed:", err);
  process.exit(1);
});
