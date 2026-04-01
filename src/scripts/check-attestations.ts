/**
 * Build check: verify all transactions have attestation_uid.
 * Used by GitHub Actions to block deploys without attestation.
 *
 * Exit 0 = all good, Exit 1 = missing attestations.
 */
import { transactions } from "../data/stocks";

const missing = transactions.filter((tx) => !tx.attestation_uid);

if (missing.length === 0) {
  console.log(`All ${transactions.length} transactions have attestation_uid.`);
  process.exit(0);
} else {
  console.error(`Missing attestation_uid on ${missing.length} transaction(s):`);
  for (const tx of missing) {
    console.error(`  - #${tx.id} ${tx.ticker} (${tx.date})`);
  }
  process.exit(1);
}
