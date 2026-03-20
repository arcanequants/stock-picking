#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getLatestPicks,
  getResearch,
  getPortfolioPerformance,
  getStocks,
  getStockInfo,
} from "./api-client.js";

const server = new McpServer({
  name: "vectorialdata",
  version: "1.0.0",
});

// Tool: get_latest_picks
server.tool(
  "get_latest_picks",
  "Get the latest stock picks from Vectorial Data with current returns. Each pick includes ticker, name, sector, price at pick, current price, return percentage, and date.",
  { count: z.number().optional().describe("Number of picks to return") },
  async ({ count }) => {
    try {
      const picks = await getLatestPicks(count);
      return { content: [{ type: "text" as const, text: JSON.stringify(picks, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "unknown"}` }],
        isError: true,
      };
    }
  }
);

// Tool: get_research
server.tool(
  "get_research",
  "Get fundamental research for a specific stock. Includes financials, analyst consensus, and detailed analysis.",
  { ticker: z.string().describe("Stock ticker symbol (e.g., UBS, AVGO, B)") },
  async ({ ticker }) => {
    try {
      const research = await getResearch(ticker);
      return { content: [{ type: "text" as const, text: JSON.stringify(research, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "unknown"}` }],
        isError: true,
      };
    }
  }
);

// Tool: get_portfolio_performance
server.tool(
  "get_portfolio_performance",
  "Get overall portfolio performance: total return, positions count, current cycle.",
  {},
  async () => {
    try {
      const perf = await getPortfolioPerformance();
      return { content: [{ type: "text" as const, text: JSON.stringify(perf, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "unknown"}` }],
        isError: true,
      };
    }
  }
);

// Tool: search_stocks
server.tool(
  "search_stocks",
  "Search and filter the Vectorial Data stock universe by sector or region.",
  {
    sector: z.string().optional().describe("Filter by sector (e.g., Financials, Technology)"),
    region: z.string().optional().describe("Filter by region (e.g., Europe, North America)"),
  },
  async ({ sector, region }) => {
    try {
      const stocks = await getStocks({ sector, region });
      return { content: [{ type: "text" as const, text: JSON.stringify(stocks, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "unknown"}` }],
        isError: true,
      };
    }
  }
);

// Tool: get_stock_info
server.tool(
  "get_stock_info",
  "Get detailed information about a specific stock.",
  { ticker: z.string().describe("Stock ticker symbol") },
  async ({ ticker }) => {
    try {
      const stock = await getStockInfo(ticker);
      if (!stock) {
        return {
          content: [{ type: "text" as const, text: `Stock ${ticker} not found` }],
          isError: true,
        };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(stock, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : "unknown"}` }],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
