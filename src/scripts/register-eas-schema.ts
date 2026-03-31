/**
 * One-time script to register the EAS schema on Base L2.
 * Run: npx tsx src/scripts/register-eas-schema.ts
 *
 * After running, copy the schema UID to .env.local as EAS_SCHEMA_UID
 * and to Vercel environment variables.
 *
 * Requires: WALLET_PRIVATE_KEY env var set
 */
import "dotenv/config";
import { registerSchema, SCHEMA_STRING } from "../lib/eas";

async function main() {
  console.log("Registering EAS schema on Base L2...");
  console.log(`Schema: ${SCHEMA_STRING}\n`);

  const uid = await registerSchema();

  console.log("Schema registered successfully!");
  console.log(`Schema UID: ${uid}\n`);
  console.log("Add to .env.local and Vercel:");
  console.log(`EAS_SCHEMA_UID=${uid}`);
}

main().catch((err) => {
  console.error("Failed to register schema:", err);
  process.exit(1);
});
