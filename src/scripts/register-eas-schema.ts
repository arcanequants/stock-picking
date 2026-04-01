/**
 * One-time script to register the EAS schema on Base L2 via CDP.
 * Run: npx tsx src/scripts/register-eas-schema.ts
 *
 * After running, copy the schema UID to .env.local as EAS_SCHEMA_UID
 * and to Vercel environment variables.
 *
 * Requires: CDP_API_KEY_ID + CDP_API_KEY_SECRET env vars
 * Optional: CDP_PAYMASTER_URL for gasless execution
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { registerSchema, SCHEMA_STRING } from "../lib/eas";

async function main() {
  console.log("Registering EAS schema on Base L2 via CDP Smart Account...");
  console.log(`Schema: ${SCHEMA_STRING}\n`);

  const uid = await registerSchema();

  console.log("\nSchema registered successfully!");
  console.log(`Schema UID: ${uid}\n`);
  console.log("Add to .env.local and Vercel:");
  console.log(`EAS_SCHEMA_UID=${uid}`);
}

main().catch((err) => {
  console.error("Failed to register schema:", err);
  process.exit(1);
});
