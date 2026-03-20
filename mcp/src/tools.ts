import { z } from "zod";
import {
  getLatestPicks,
  getResearch,
  getPortfolioPerformance,
  getStocks,
  getStockInfo,
} from "./api-client.js";

export const tools = [
  {
    name: "get_latest_picks",
    description:
      "Get the latest stock picks from Vectorial Data with current returns. Each pick includes ticker, name, sector, price at pick, current price, return percentage, and date.",
    inputSchema: z.object({
      count: z
        .number()
        .optional()
        .describe("Number of picks to return (default: all available)"),
    }),
    handler: async (input: { count?: number }) => {
      const picks = await getLatestPicks(input.count);
      return JSON.stringify(picks, null, 2);
    },
  },
  {
    name: "get_research",
    description:
      "Get fundamental research for a specific stock. Includes financials (P/E, dividend yield, EPS, market cap), analyst consensus, and detailed analysis.",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol (e.g., UBS, AVGO, B)"),
    }),
    handler: async (input: { ticker: string }) => {
      const research = await getResearch(input.ticker);
      return JSON.stringify(research, null, 2);
    },
  },
  {
    name: "get_portfolio_performance",
    description:
      "Get the overall portfolio performance including total return percentage, number of positions, and current cycle status.",
    inputSchema: z.object({}),
    handler: async () => {
      const performance = await getPortfolioPerformance();
      return JSON.stringify(performance, null, 2);
    },
  },
  {
    name: "search_stocks",
    description:
      "Search and filter the Vectorial Data stock universe by sector or region.",
    inputSchema: z.object({
      sector: z
        .string()
        .optional()
        .describe(
          "Filter by sector (e.g., Financials, Technology, Materials, Industrials)"
        ),
      region: z
        .string()
        .optional()
        .describe("Filter by region (e.g., Europe, North America, Asia)"),
    }),
    handler: async (input: { sector?: string; region?: string }) => {
      const stocks = await getStocks(input);
      return JSON.stringify(stocks, null, 2);
    },
  },
  {
    name: "get_stock_info",
    description:
      "Get detailed information about a specific stock including price, metrics, summaries, and analyst data.",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol"),
    }),
    handler: async (input: { ticker: string }) => {
      const stock = await getStockInfo(input.ticker);
      if (!stock) {
        return JSON.stringify({ error: `Stock ${input.ticker} not found` });
      }
      return JSON.stringify(stock, null, 2);
    },
  },
];
