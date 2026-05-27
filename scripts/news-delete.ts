#!/usr/bin/env tsx
/**
 * Delete a published news item. Hard delete — these rows are editorial,
 * not transactional, so there's nothing to preserve for audit.
 *
 * Usage:
 *   npx tsx scripts/news-delete.ts --id <uuid> [--target prod|local]
 */
import "dotenv/config";

async function main() {
  const argv = process.argv.slice(2);
  let id: string | undefined;
  let target: "prod" | "local" = "prod";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--id") id = argv[++i];
    else if (argv[i] === "--target") {
      const v = argv[++i];
      if (v !== "prod" && v !== "local") {
        console.error("✗ --target must be prod or local");
        process.exit(1);
      }
      target = v;
    }
  }

  if (!id) {
    console.error("Usage: news-delete --id <uuid> [--target prod|local]");
    process.exit(1);
  }

  const token = process.env.ADMIN_NEWS_TOKEN;
  if (!token) {
    console.error("✗ ADMIN_NEWS_TOKEN not set");
    process.exit(1);
  }

  const base = target === "local"
    ? "http://localhost:3000"
    : (process.env.APP_BASE_URL ?? "https://vectorialdata.com");

  const res = await fetch(`${base}/api/admin/news/${id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}:`, await res.text());
    process.exit(1);
  }

  console.log(`✅ Deleted id=${id}`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
