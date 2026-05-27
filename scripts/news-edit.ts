#!/usr/bin/env tsx
/**
 * Edit a published news item (typo fix, copy polish). Does NOT re-fire
 * the push — that's deliberate, edits are silent.
 *
 * Usage:
 *   npx tsx scripts/news-edit.ts --id <uuid> [--headline "..."] [--body "..."] [--link "..."] [--audience all|premium]
 */
import "dotenv/config";

interface Args {
  id?: string;
  headline?: string;
  body?: string;
  link?: string;
  audience?: "all" | "premium";
  target?: "prod" | "local";
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--id": out.id = next; i++; break;
      case "--headline": out.headline = next; i++; break;
      case "--body": out.body = next; i++; break;
      case "--link": out.link = next; i++; break;
      case "--audience":
        if (next !== "all" && next !== "premium") {
          throw new Error("--audience must be 'all' or 'premium'");
        }
        out.audience = next; i++; break;
      case "--target":
        if (next !== "prod" && next !== "local") {
          throw new Error("--target must be 'prod' or 'local'");
        }
        out.target = next; i++; break;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id) {
    console.error("Usage: news-edit --id <uuid> [--headline ...] [--body ...] [--link ...] [--audience ...]");
    process.exit(1);
  }

  const token = process.env.ADMIN_NEWS_TOKEN;
  if (!token) {
    console.error("✗ ADMIN_NEWS_TOKEN not set");
    process.exit(1);
  }

  const base = args.target === "local"
    ? "http://localhost:3000"
    : (process.env.APP_BASE_URL ?? "https://vectorialdata.com");

  const patch: Record<string, unknown> = {};
  if (args.headline !== undefined) patch.headline = args.headline;
  if (args.body !== undefined) patch.body = args.body;
  if (args.link !== undefined) patch.link_url = args.link;
  if (args.audience !== undefined) patch.audience = args.audience;

  if (Object.keys(patch).length === 0) {
    console.error("✗ Nothing to edit. Pass at least one of --headline/--body/--link/--audience.");
    process.exit(1);
  }

  const res = await fetch(`${base}/api/admin/news/${args.id}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}:`, await res.text());
    process.exit(1);
  }

  console.log(`✅ Edited id=${args.id}`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
