# @pipeworx/tiingo

Financial market data from Tiingo (tiingo.com): EOD stock prices, ticker
metadata, crypto prices, and financial news.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

- `stock_prices(ticker, start_date?, end_date?, frequency?)` — EOD historical
  prices (open/high/low/close/volume/adjClose). Omit `start_date` for just the
  latest trading day.
- `stock_metadata(ticker)` — company name, description, exchange code, and the
  date range of available EOD data.
- `news(tickers?, tags?, limit?)` — recent financial news articles, optionally
  filtered by ticker or tag.
- `crypto_prices(ticker, resampleFreq?)` — crypto pair prices (e.g. `btcusd`)
  at a chosen resample frequency.

## Auth

Platform key (`PLATFORM_TIINGO_KEY`) with BYO override via `_apiKey` — for
`stock_prices`, `stock_metadata`, and `crypto_prices` only.

**`news` is BYO-only** (fleet #733): Tiingo's News API sits on a plan tier
above the shared Pipeworx key (a Basic/EOD-only key), so a platform-key call
403s "You do not have permission to access the News API" every time — this is
not an outage, it never worked and structurally can't. Pass your own Tiingo
key on the News-tier plan (Power or higher — see
https://www.tiingo.com/about/pricing) as `_apiKey` to use this tool; the
gateway will not attempt the shared key for it.

## Data sources

- `https://api.tiingo.com/tiingo/daily/*` — EOD prices and ticker metadata.
- `https://api.tiingo.com/tiingo/news` — financial news (News-tier plan
  required; see Auth above).
- `https://api.tiingo.com/tiingo/crypto/prices` — crypto prices.

Tiingo separates share classes with a hyphen (`BRK-B`), not the dot most
sources use (`BRK.B`) — the pack rewrites `.` to `-` automatically, so either
spelling works.

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

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/stock_prices \
  -H 'Content-Type: application/json' \
  -d '{"ticker":"AAPL"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/stock_prices`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "tiingo": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-tiingo"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-tiingo
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

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
