/**
 * Generates picks-ledger.json — a hash-chained record of all stock picks.
 * Run: npx tsx src/scripts/generate-picks-ledger.ts
 *
 * Each pick is hashed with SHA-256: hash(ticker|price|date|previousHash)
 * The resulting file is committed to git, making it immutable.
 */

import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { resolve } from "path";

// Import transactions directly (relative for tsx)
import { transactions } from "../data/stocks";

interface LedgerEntry {
  pick_number: number;
  ticker: string;
  price: number;
  date: string;
  previous_hash: string;
  hash: string;
}

function computeHash(
  ticker: string,
  price: number,
  date: string,
  previousHash: string
): string {
  const input = `${ticker}|${price}|${date}|${previousHash}`;
  return createHash("sha256").update(input).digest("hex");
}

function generateLedger(): LedgerEntry[] {
  const ledger: LedgerEntry[] = [];
  let previousHash = "0".repeat(64);

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const hash = computeHash(tx.ticker, tx.price, tx.date, previousHash);

    ledger.push({
      pick_number: i + 1,
      ticker: tx.ticker,
      price: tx.price,
      date: tx.date,
      previous_hash: previousHash,
      hash,
    });

    previousHash = hash;
  }

  return ledger;
}

const ledger = generateLedger();
const outPath = resolve(__dirname, "../../public/picks-ledger.json");
writeFileSync(outPath, JSON.stringify(ledger, null, 2) + "\n");

console.log(`Generated picks-ledger.json with ${ledger.length} entries`);
console.log(`Latest hash: ${ledger[ledger.length - 1]?.hash}`);
