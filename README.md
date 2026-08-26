# mcp-tiingo

Tiingo MCP — wraps the Tiingo financial API (tiingo.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/tiingo/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Tiingo data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
