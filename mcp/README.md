# @vectorialdata/mcp-server

MCP server for [Vectorial Data](https://vectorialdata.com) — AI-native stock picking with verifiable track record.

## Setup

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "vectorialdata": {
      "command": "npx",
      "args": ["@vectorialdata/mcp-server"],
      "env": {
        "VD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Get your API key:

```bash
curl -X POST https://vectorialdata.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent"}'
```

## Tools

| Tool | Description |
|------|-------------|
| `get_latest_picks` | Latest stock picks with current returns |
| `get_research` | Full research for a specific stock |
| `get_portfolio_performance` | Portfolio summary + total return |
| `search_stocks` | Filter stocks by sector or region |
| `get_stock_info` | Detailed data for one stock |

## Tiers

| Tier | Requests/day | Data |
|------|-------------|------|
| Free | 10 | Last 3 picks, basic data |
| Pro ($5 USDC/mo) | 1,000 | All picks, full research, history |

## Environment Variables

- `VD_API_KEY` — Your Vectorial Data API key (required)
- `VD_API_BASE` — Custom API base URL (default: `https://vectorialdata.com/api/v1`)

## Links

- [API Docs](https://vectorialdata.com/developers)
- [OpenAPI Spec](https://vectorialdata.com/openapi.yaml)
- [llms.txt](https://vectorialdata.com/llms.txt)
