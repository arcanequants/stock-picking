#!/usr/bin/env tsx
/**
 * Generate an iOS deep-link magic link bypassing Resend.
 *
 * Useful when email delivery is slow or the simulator can't reach inbox.
 * Hits Supabase Admin generateLink and prints a `vectorialdata://` URL ready
 * to open with `xcrun simctl openurl`.
 *
 * Usage: npx tsx --env-file=.env.local.vercel scripts/dev-magic-link.ts <email>
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: dev-magic-link <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email.toLowerCase().trim(),
  });

  if (error || !data?.properties?.action_link) {
    console.error("generateLink failed:", error);
    process.exit(1);
  }

  const actionUrl = new URL(data.properties.action_link);
  const tokenHash = actionUrl.searchParams.get("token");
  const type = actionUrl.searchParams.get("type") || "magiclink";
  const iosUrl = `vectorialdata://auth?token_hash=${tokenHash}&type=${type}`;
  console.log(iosUrl);
}

main().catch((e) => { console.error(e); process.exit(1); });
