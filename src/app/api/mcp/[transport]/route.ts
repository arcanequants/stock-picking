import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { ingestEconomicEvent } from "@/lib/economic-events-ingest";
import { listRecentNews, publishNewsItem } from "@/lib/news-ingest";
import { publishBriefing } from "@/lib/briefing-ingest";

export const maxDuration = 60;

const analysisSchema = z.object({
  headline: z.string(),
  what_it_means: z.string(),
  market_impact: z.string(),
  learning: z.string(),
});

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "publish_economic_event",
      "Publish the single most relevant macro event of the day to Vectorial Economía (vectorialdata.com/economia). Provide the analysis in Spanish (es, required) plus English (en), Portuguese (pt) and Hindi (hi). Each language needs headline, what_it_means, market_impact and a learning takeaway. Upserts one row per event_date.",
      {
        event_date: z.string().describe("Release date, YYYY-MM-DD"),
        event_name: z.string().describe('e.g. "US CPI (May)"'),
        country: z.string().describe('e.g. "US"'),
        category: z
          .string()
          .describe("inflation | employment | growth | central-bank | ..."),
        importance: z.enum(["high", "medium"]).optional(),
        actual: z.string().optional().describe('e.g. "3.5%"'),
        forecast: z.string().optional(),
        previous: z.string().optional(),
        unit: z.string().optional().describe('e.g. "% YoY"'),
        surprise: z.enum(["hotter", "cooler", "inline", "mixed"]).optional(),
        source_url: z.string().optional(),
        affected_markets: z
          .array(
            z.object({
              market: z.string(),
              direction: z.enum(["up", "down", "neutral"]).optional(),
              why: z.string().optional(),
            })
          )
          .optional(),
        analysis: z.object({
          es: analysisSchema,
          en: analysisSchema.optional(),
          pt: analysisSchema.optional(),
          hi: analysisSchema.optional(),
        }),
      },
      async (args) => {
        const result = await ingestEconomicEvent(
          args as unknown as Record<string, unknown>
        );
        if (!result.ok) {
          return {
            content: [{ type: "text", text: `Error: ${result.error}` }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Published ${result.event_date}: ${result.page_url}`,
            },
          ],
        };
      }
    );
    server.tool(
      "list_recent_news",
      "List the news items published to Vectorial Noticias (the app's news feed) in the last 7 days. ALWAYS call this before publish_news and never publish the same story again unless there is a genuinely new development.",
      {},
      async () => {
        const recent = await listRecentNews(7);
        const text =
          recent.length === 0
            ? "No news published in the last 7 days."
            : recent
                .map(
                  (r) =>
                    `- [${r.published_at.slice(0, 10)}] (${r.topic ?? "?"} · ${(r.regions ?? []).join(",") || "?"}) ${r.headline}`,
                )
                .join("\n");
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "publish_news",
      "Publish one news item to Vectorial Noticias (the mobile app's news feed). Send plain Spanish headline+body only — the server automatically classifies topic/regions/tickers, writes the 4-block explainer + glossary, translates to en/pt/hi and sends the preference-aware push. Rejects same-story repeats from the last 7 days (409 duplicate_story) — call list_recent_news first.",
      {
        headline: z
          .string()
          .describe("Spanish, ≤80 chars, concrete — the number/fact up front"),
        body: z
          .string()
          .describe(
            "Spanish, ≤4000 chars. The full story in plain language: what happened (with the real numbers), why it matters, which sectors/prices it touches. No jargon.",
          ),
        link_url: z
          .string()
          .optional()
          .describe("Source URL for 'leer más' (optional)"),
      },
      async (args) => {
        const result = await publishNewsItem({
          headline: args.headline,
          body: args.body,
          link_url: args.link_url ?? null,
        });
        if (!result.ok) {
          const detail =
            result.error === "duplicate_story"
              ? `duplicate_story — already covered: "${result.duplicate_of}" (${result.reason}). Do NOT retry with a rephrase; only publish if there is a genuinely new development, framed around what changed.`
              : `Error: ${result.error}`;
          return { content: [{ type: "text", text: detail }], isError: true };
        }
        const news = result.news as { id?: string; topic?: string };
        return {
          content: [
            {
              type: "text",
              text: `Published ${news.id} (topic ${news.topic ?? "legacy"}) · enriched=${result.enriched} · push sent=${result.delivery.sent} · translated=${result.translated.join(",")}`,
            },
          ],
        };
      }
    );

    server.tool(
      "publish_briefing",
      "Publish the daily marketing briefing: emails it to the founder and archives it. Call this ONCE per run, at the end, with every draft you wrote — there is no other delivery path, so a briefing you don't publish here is lost. Do NOT write files to the repo and do NOT curl GitHub.",
      {
        date: z.string().describe("CDMX date, YYYY-MM-DD"),
        summary: z.string().describe("The day's theme in one sentence"),
        causalChain: z
          .string()
          .optional()
          .describe("The day's causal chain, 1-2 sentences"),
        table: z
          .array(
            z.object({
              n: z.number(),
              region: z.string(),
              angle: z.string().describe("One-line headline for the angle"),
              worker: z.string().optional(),
            }),
          )
          .optional()
          .describe("Consolidated table, one row per draft"),
        drafts: z
          .array(
            z.object({
              n: z.number().describe("Sequential across regions, starting at 1"),
              region: z
                .string()
                .describe("GLOBAL | MEXICO | ASIA | EUROPE | OCEANIA | CRYPTO | WOW CIENCIA"),
              text: z.string().describe("The full X draft, 280-500 chars"),
            }),
          )
          .min(1)
          .describe("Every draft of the run"),
      },
      async (args) => {
        const result = await publishBriefing({
          date: args.date,
          summary: args.summary,
          causalChain: args.causalChain,
          table: args.table,
          drafts: args.drafts,
        });
        if (!result.ok) {
          return {
            content: [{ type: "text", text: `Error: ${result.error}` }],
            isError: true,
          };
        }
        const archive = result.archived
          ? "archived"
          : `NOT archived (${result.archiveError ?? "unknown"}) — email did go out, report this`;
        return {
          content: [
            {
              type: "text",
              text: `Briefing ${result.date} emailed (${result.drafts} drafts, id ${result.emailId ?? "?"}) · ${archive}`,
            },
          ],
        };
      }
    );
  },
  {},
  { basePath: "/api/mcp" }
);

function unauthorized(req: Request): Response | null {
  const url = new URL(req.url);
  const key =
    url.searchParams.get("key") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const secret =
    process.env.ECON_MCP_SECRET || process.env.ECON_INGEST_SECRET || "";
  if (!secret || key !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

async function guarded(req: Request): Promise<Response> {
  const fail = unauthorized(req);
  if (fail) return fail;
  return handler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
