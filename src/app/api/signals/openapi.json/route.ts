import { NextResponse } from "next/server";
import { listLiveSignals } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const SITE_URL = "https://vectorialdata.com";

export async function GET() {
  const signals = await listLiveSignals();
  const ids = signals.map((s) => s.id);

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Vectorial Signals API",
      version: "1.0.0",
      description:
        "Public read API for Vectorial Signals — alternative-data signals derived from satellites, AIS, EIA, USDA, TROPOMI, and other free public sources. Translated for human consumption and structured for AI agents.",
      contact: { name: "Vectorial Data", url: SITE_URL },
      license: { name: "Mixed — see per-signal license field" },
    },
    servers: [{ url: `${SITE_URL}/api/signals`, description: "Production" }],
    paths: {
      "/": {
        get: {
          summary: "List all live signals",
          operationId: "listSignals",
          responses: {
            "200": {
              description: "Catalog of all live signals.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SignalCatalog" },
                },
              },
            },
          },
        },
      },
      "/{id}": {
        get: {
          summary: "Get latest snapshot for a signal",
          operationId: "getSignal",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", enum: ids.length > 0 ? ids : undefined },
            },
          ],
          responses: {
            "200": {
              description: "Latest observation, baseline, and JSON-LD Dataset.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SignalSnapshot" },
                },
              },
            },
            "404": { description: "Signal not found." },
          },
        },
      },
    },
    components: {
      schemas: {
        SignalCatalog: {
          type: "object",
          properties: {
            product: { type: "string" },
            count: { type: "integer" },
            signals: {
              type: "array",
              items: { $ref: "#/components/schemas/SignalCatalogEntry" },
            },
          },
        },
        SignalCatalogEntry: {
          type: "object",
          properties: {
            id: { type: "string" },
            domain: { type: "string" },
            name: { type: "string" },
            unit: { type: "string" },
            status: { type: "string", enum: ["live", "decayed", "deprecated"] },
            page_url: { type: "string", format: "uri" },
            brief_url: { type: "string", format: "uri" },
            machine_url: { type: "string", format: "uri" },
            source_url: { type: "string", format: "uri" },
            license: { type: "string" },
          },
        },
        SignalSnapshot: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            domain: { type: "string" },
            unit: { type: "string" },
            status: { type: "string" },
            observed_at: { type: "string", format: "date-time", nullable: true },
            ingested_at: { type: "string", format: "date-time", nullable: true },
            value: { type: "number", nullable: true },
            uncertainty_lo: { type: "number", nullable: true },
            uncertainty_hi: { type: "number", nullable: true },
            baseline_value: { type: "number", nullable: true },
            baseline_method: { type: "string" },
            delta_vs_baseline_pct: { type: "number", nullable: true },
            z_score: { type: "number", nullable: true },
            backtest: { type: "object", nullable: true },
            source_url: { type: "string", format: "uri" },
            license: { type: "string" },
            brief_url: { type: "string", format: "uri" },
            page_url: { type: "string", format: "uri" },
            json_ld: { type: "object" },
            disclaimer: { type: "string" },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
