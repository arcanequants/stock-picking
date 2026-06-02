#!/usr/bin/env tsx
/**
 * Publish a curated news item to the iOS app.
 *
 * Calls POST /api/admin/news with Bearer ADMIN_NEWS_TOKEN. The server
 * inserts the row and fires an APNs push to every active device matching
 * `audience`. The web site is intentionally untouched.
 *
 * Usage:
 *   npx tsx scripts/news-publish.ts \
 *     --headline "Fed corta 25bp, S&P toca máximo histórico" \
 *     --body "El comité de la Fed bajó la tasa al 4.00%..." \
 *     [--link "https://example.com/article"] \
 *     [--audience all|premium|free]   (default: all)
 *     [--target prod|local]      (default: prod)
 *
 * Required env (in .env.local):
 *   ADMIN_NEWS_TOKEN
 *   APP_BASE_URL          (defaults to https://vectorialdata.com)
 */
import "dotenv/config";

interface Args {
  headline?: string;
  body?: string;
  link?: string;
  audience?: "all" | "premium" | "free";
  target?: "prod" | "local";
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--headline":
        out.headline = next; i++; break;
      case "--body":
        out.body = next; i++; break;
      case "--link":
        out.link = next; i++; break;
      case "--audience":
        if (next !== "all" && next !== "premium" && next !== "free") {
          throw new Error("--audience must be 'all', 'premium', or 'free'");
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

  if (!args.headline || !args.body) {
    console.error("Usage: news-publish --headline \"...\" --body \"...\" [--link URL] [--audience all|premium]");
    process.exit(1);
  }

  if (args.headline.length > 80) {
    console.error(`✗ Headline is ${args.headline.length} chars (max 80).`);
    process.exit(1);
  }

  const token = process.env.ADMIN_NEWS_TOKEN;
  if (!token) {
    console.error("✗ ADMIN_NEWS_TOKEN not set in .env.local");
    process.exit(1);
  }

  const base = args.target === "local"
    ? "http://localhost:3000"
    : (process.env.APP_BASE_URL ?? "https://vectorialdata.com");

  const audience = args.audience ?? "all";

  console.log(`→ Publishing to ${base} (audience: ${audience})`);
  console.log(`  Headline: ${args.headline}`);
  console.log(`  Body: ${args.body.slice(0, 80)}${args.body.length > 80 ? "…" : ""}`);
  if (args.link) console.log(`  Link: ${args.link}`);

  const res = await fetch(`${base}/api/admin/news`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      headline: args.headline,
      body: args.body,
      link_url: args.link ?? null,
      audience,
    }),
  });

  const text = await res.text();
  let payload: unknown = text;
  try { payload = JSON.parse(text); } catch {}

  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}:`, payload);
    process.exit(1);
  }

  const result = payload as {
    news: { id: string; published_at: string };
    delivery: { sent: number; failed: number; deactivated: number };
  };

  console.log("");
  console.log(`✅ Published id=${result.news.id}`);
  console.log(`   Push: ${result.delivery.sent} sent · ${result.delivery.failed} failed · ${result.delivery.deactivated} dead tokens deactivated`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
