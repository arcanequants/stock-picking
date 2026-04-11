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

/**
 * Count transaction object delimiter braces (lines that are exactly `{` or `},`)
 * inside the `export const transactions = [...]` block. Used as a sanity check
 * to verify our rewrite did not delete or duplicate structural braces.
 *
 * This counts only lines that START with `{` / `},` — embedded braces inside
 * template strings (wa_message) are ignored.
 */
function countTransactionBraces(fileContent: string): { open: number; close: number } {
  const start = fileContent.indexOf("export const transactions");
  if (start === -1) return { open: 0, close: 0 };
  // Find the matching closing `];` of the transactions array
  const end = fileContent.indexOf("\n];", start);
  if (end === -1) return { open: 0, close: 0 };
  const section = fileContent.slice(start, end);
  let open = 0;
  let close = 0;
  for (const line of section.split("\n")) {
    if (/^\s*\{\s*$/.test(line)) open++;
    if (/^\s*\},?\s*$/.test(line)) close++;
  }
  return { open, close };
}

function writeUidToStocksFile(
  txId: number,
  uid: string,
  fileContent: string
): string {
  const lines = fileContent.split("\n");

  // Locate the transactions section so we don't accidentally match stock entries
  const txSectionStart = lines.findIndex((l) =>
    l.includes("export const transactions")
  );
  if (txSectionStart === -1) {
    throw new Error("Could not find 'export const transactions' in stocks.ts");
  }

  // Find the target transaction's `id: <txId>,` line
  let idLineIdx = -1;
  for (let i = txSectionStart; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^\\s*id:\\s*${txId},`))) {
      idLineIdx = i;
      break;
    }
  }
  if (idLineIdx === -1) {
    throw new Error(
      `Could not find transaction id: ${txId} in stocks.ts`
    );
  }

  // Find the closing `},` of this transaction object (stop if we hit the next tx's id)
  let closingIdx = -1;
  for (let i = idLineIdx + 1; i < lines.length; i++) {
    if (lines[i].match(/^\s*id:\s*\d+,/)) {
      throw new Error(
        `Hit next transaction before finding closing brace for id: ${txId}`
      );
    }
    if (lines[i].match(/^\s*},?\s*$/)) {
      closingIdx = i;
      break;
    }
  }
  if (closingIdx === -1) {
    throw new Error(
      `Could not find closing '},' for transaction id: ${txId}`
    );
  }

  // Detect if an attestation_uid field already exists between id and closing brace.
  // Support both single-line and multi-line formats:
  //   Single-line: `    attestation_uid: "0x...",`
  //   Multi-line:
  //     `    attestation_uid:`
  //     `      "0x...",`
  let attUidStart = -1; // inclusive
  let attUidEnd = -1;   // inclusive
  for (let i = idLineIdx + 1; i < closingIdx; i++) {
    if (/^\s*attestation_uid\s*:/.test(lines[i])) {
      attUidStart = i;
      // Single-line if the value appears on the same line
      if (/^\s*attestation_uid\s*:\s*"[^"]*"\s*,?\s*$/.test(lines[i])) {
        attUidEnd = i;
      } else {
        // Multi-line: scan forward for the string value line
        for (let j = i + 1; j < closingIdx; j++) {
          if (/^\s*"[^"]*"\s*,?\s*$/.test(lines[j])) {
            attUidEnd = j;
            break;
          }
        }
        if (attUidEnd === -1) {
          throw new Error(
            `Malformed attestation_uid near line ${i + 1} in transaction id: ${txId}`
          );
        }
      }
      break;
    }
  }

  // Build the new (normalized) single-line field. Writing in a single canonical
  // format eliminates the off-by-one bug that destroyed the closing `},` when
  // the original code assumed a multi-line layout and overwrote `lines[i + 1]`.
  const newLine = `    attestation_uid: "${uid}",`;

  let newLines: string[];
  if (attUidStart >= 0) {
    // Replace existing field (1 or 2 lines) with normalized single line
    newLines = [
      ...lines.slice(0, attUidStart),
      newLine,
      ...lines.slice(attUidEnd + 1),
    ];
  } else {
    // No existing field: insert just before the closing brace
    newLines = [
      ...lines.slice(0, closingIdx),
      newLine,
      ...lines.slice(closingIdx),
    ];
  }

  const result = newLines.join("\n");

  // Sanity check: the number of transaction object delimiter braces must not
  // change. If it did, we corrupted structure and must abort.
  const before = countTransactionBraces(fileContent);
  const after = countTransactionBraces(result);
  if (before.open !== after.open || before.close !== after.close) {
    throw new Error(
      `Brace sanity check failed for tx id ${txId}. ` +
        `Before: open=${before.open} close=${before.close}, ` +
        `After: open=${after.open} close=${after.close}. ` +
        `Aborting to prevent stocks.ts corruption.`
    );
  }

  return result;
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
