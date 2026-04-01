/**
 * Backfill all existing picks as EAS attestations on Base L2 via CDP.
 * Run: npx tsx src/scripts/backfill-eas-attestations.ts
 *
 * After running, copy the attestation_uid values into stocks.ts transactions.
 * Gas: Sponsored by CDP Paymaster (free on Base L2)
 *
 * Requires: CDP_API_KEY_ID + CDP_API_KEY_SECRET + EAS_SCHEMA_UID env vars
 * Optional: CDP_PAYMASTER_URL for gasless execution
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createHash } from "crypto";
import { transactions } from "../data/stocks";
import { createAttestation } from "../lib/eas";

async function backfill() {
  console.log(
    `Backfilling ${transactions.length} picks as EAS attestations via CDP...\n`
  );

  let previousHash = "0".repeat(64);
  const results: { pickNumber: number; ticker: string; uid: string }[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const input = `${tx.ticker}|${tx.price}|${tx.date}|${previousHash}`;
    const hash = createHash("sha256").update(input).digest("hex");

    console.log(
      `[${i + 1}/${transactions.length}] ${tx.ticker} — $${tx.price} — ${tx.date}`
    );
    console.log(`  Chain hash: ${hash.slice(0, 16)}...`);

    if (tx.attestation_uid) {
      console.log(
        `  Already attested: ${tx.attestation_uid.slice(0, 16)}...`
      );
      previousHash = hash;
      continue;
    }

    try {
      const result = await createAttestation({
        ticker: tx.ticker,
        price: tx.price,
        date: tx.date,
        pickNumber: i + 1,
        chainHash: hash,
      });

      console.log(`  Attestation UID: ${result.uid}`);
      console.log(`  TX: ${result.txHash}`);
      results.push({ pickNumber: i + 1, ticker: tx.ticker, uid: result.uid });

      // Rate limit: wait 3 seconds between attestations
      if (i < transactions.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error(`  FAILED:`, err);
    }

    previousHash = hash;
  }

  console.log(
    "\n\n=== Copy these attestation_uid values into stocks.ts ===\n"
  );
  for (const r of results) {
    console.log(`  // Pick #${r.pickNumber} ${r.ticker}`);
    console.log(`  attestation_uid: "${r.uid}",`);
  }
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
