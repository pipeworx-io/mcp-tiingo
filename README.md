# mcp-tiingo

Tiingo MCP — wraps the Tiingo financial API (tiingo.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `stock_prices` | Get EOD historical stock prices for a ticker (open, high, low, close, volume, adjClose). Without a start_date, returns just the latest trading day. Example: stock_prices({ ticker: "AAPL", start_date: "2024-01-01", end_date: "2024-01-31", frequency: "daily" }) |
| `stock_metadata` | Get metadata for a stock ticker: company name, description, exchange code, and the date range of available EOD price data. Example: stock_metadata({ ticker: "AAPL" }) |
| `news` | Get recent financial news articles, optionally filtered by tickers or tags. Returns title, description, URL, published date, source, and related tickers. Example: news({ tickers: "aapl,msft", limit: 10 }) |
| `crypto_prices` | Get crypto prices for a pair (open, high, low, close, volume) at a chosen resample frequency. Example: crypto_prices({ ticker: "btcusd", resampleFreq: "1day" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tiingo": {
      "url": "https://gateway.pipeworx.io/tiingo/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tiingo data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
