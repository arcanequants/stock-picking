/**
 * Re-score legacy portfolio_events with the new severity rubric.
 *
 * Run after migration 013: events created before that point default to
 * severity=3 with no human_summary_*, which means humans see them as
 * "below threshold" but they were never actually scored. This walks
 * those rows, calls generateEventInsight, and updates them in place.
 *
 * Usage:
 *   npx tsx src/scripts/backfill-event-severity.ts        # dry run
 *   npx tsx src/scripts/backfill-event-severity.ts --apply # write changes
 *
 * Requires: OPENAI_API_KEY + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { generateEventInsight } from "../lib/ai-explainer";
import { stocks } from "../data/stocks";
import type { EventType } from "../lib/types";

const APPLY = process.argv.includes("--apply");
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? parseInt(arg.split("=")[1]) : Infinity;
})();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key);

interface EventRow {
  id: string;
  ticker: string;
  event_type: EventType;
  title_key: string;
  params: Record<string, string>;
  severity: number;
  human_summary_es: string | null;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing changes)" : "MODE: DRY RUN");
  console.log(`LIMIT: ${LIMIT === Infinity ? "all" : LIMIT}`);

  // Target: rows that were never scored — severity defaulted to 3 AND
  // no Spanish summary exists. The new ai-explainer always writes one.
  const { data, error } = await supabase
    .from("portfolio_events")
    .select("id, ticker, event_type, title_key, params, severity, human_summary_es")
    .is("human_summary_es", null)
    .order("created_at", { ascending: false })
    .limit(LIMIT === Infinity ? 1000 : LIMIT);

  if (error) {
    console.error("Failed to fetch events:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as EventRow[];
  console.log(`Found ${rows.length} unscored events.\n`);
  if (rows.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }

  const stats = { scored: 0, skipped: 0, errors: 0, bySeverity: {} as Record<number, number> };

  for (const row of rows) {
    const stock = stocks.find((s) => s.ticker === row.ticker);
    const research = stock?.research_full ?? "";
    if (!research) {
      console.log(`  SKIP ${row.ticker} (${row.event_type}) — no research available`);
      stats.skipped++;
      continue;
    }

    try {
      const insight = await generateEventInsight(
        row.ticker,
        row.event_type,
        row.params ?? {},
        research
      );

      stats.bySeverity[insight.severity] = (stats.bySeverity[insight.severity] ?? 0) + 1;
      const flag = insight.affects_thesis ? " [THESIS]" : "";
      const summary = insight.summaries.es ?? insight.summaries.en ?? "(no summary)";
      console.log(`  ${row.ticker} (${row.event_type}) → sev ${insight.severity}${flag}`);
      console.log(`    ${summary}`);

      if (APPLY) {
        const { error: updateError } = await supabase
          .from("portfolio_events")
          .update({
            severity: insight.severity,
            affects_thesis: insight.affects_thesis,
            human_summary_es: insight.summaries.es ?? null,
            human_summary_en: insight.summaries.en ?? null,
            human_summary_pt: insight.summaries.pt ?? null,
            human_summary_hi: insight.summaries.hi ?? null,
            explanations: insight.explanations,
          })
          .eq("id", row.id);
        if (updateError) {
          console.error(`    UPDATE FAILED: ${updateError.message}`);
          stats.errors++;
          continue;
        }
      }
      stats.scored++;
    } catch (e) {
      console.error(`  ERROR ${row.ticker}:`, e instanceof Error ? e.message : e);
      stats.errors++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Scored: ${stats.scored}`);
  console.log(`Skipped (no research): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log("By severity:", stats.bySeverity);
  if (!APPLY) console.log("\n(dry run — re-run with --apply to write changes)");
  process.exit(0);
}

main();
