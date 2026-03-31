/**
 * Attest the latest pick that doesn't have an attestation_uid yet.
 * Run after adding a new pick: npx tsx src/scripts/attest-latest-pick.ts
 *
 * Requires: WALLET_PRIVATE_KEY + EAS_SCHEMA_UID env vars
 */
import "dotenv/config";
import { createHash } from "crypto";
import { transactions } from "../data/stocks";
import { createAttestation } from "../lib/eas";

async function attestLatest() {
  // Find the last transaction without attestation_uid
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

  for (const { tx, index } of unattested) {
    const pickNumber = index + 1;
    console.log(`Attesting Pick #${pickNumber}: ${tx.ticker} — $${tx.price} — ${tx.date}`);

    const result = await createAttestation({
      ticker: tx.ticker,
      price: tx.price,
      date: tx.date,
      pickNumber,
      chainHash: hashes[index],
    });

    console.log(`  Attestation UID: ${result.uid}`);
    console.log(`  TX: ${result.txHash}`);
    console.log(`\nAdd to stocks.ts transaction #${tx.id}:`);
    console.log(`  attestation_uid: "${result.uid}",\n`);

    // Wait between attestations
    if (unattested.indexOf({ tx, index }) < unattested.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

attestLatest().catch((err) => {
  console.error("Attestation failed:", err);
  process.exit(1);
});
