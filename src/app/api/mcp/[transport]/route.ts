import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { ingestEconomicEvent } from "@/lib/economic-events-ingest";
import { listRecentNews, publishNewsItem } from "@/lib/news-ingest";

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
