interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Tiingo MCP — wraps the Tiingo financial API (tiingo.com)
 *
 * Tools:
 * - stock_prices: EOD historical stock prices (open/high/low/close/volume/adjClose)
 * - stock_metadata: ticker metadata (name, description, exchange, date coverage)
 * - news: financial news articles, optionally filtered by tickers or tags
 * - crypto_prices: crypto prices (e.g. btcusd) at a chosen resample frequency
 *
 * Dual key: pass _apiKey for your own Tiingo key + higher limits, or omit to
 * use the shared Pipeworx key. Auth via `Authorization: Token <key>` header.
 */


const BASE_URL = 'https://api.tiingo.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'stock_prices',
    description:
      'Get EOD historical stock prices for a ticker (open, high, low, close, volume, adjClose). Without a start_date, returns just the latest trading day. Example: stock_prices({ ticker: "AAPL", start_date: "2024-01-01", end_date: "2024-01-31", frequency: "daily" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol, e.g. "AAPL", "MSFT", "TSLA"',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional). Omit to get only the latest day.',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
        frequency: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Resample frequency (default "daily")',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own Tiingo API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'stock_metadata',
    description:
      'Get metadata for a stock ticker: company name, description, exchange code, and the date range of available EOD price data. Example: stock_metadata({ ticker: "AAPL" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol, e.g. "AAPL"',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own Tiingo API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'news',
    description:
      'Get recent financial news articles, optionally filtered by tickers or tags. Returns title, description, URL, published date, source, and related tickers. Example: news({ tickers: "aapl,msft", limit: 10 })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tickers: {
          type: 'string',
          description: 'Comma-separated ticker filter, e.g. "aapl,msft" (optional)',
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tag filter (optional)',
        },
        limit: {
          type: 'number',
          description: 'Number of articles to return (default 10, max 100)',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own Tiingo API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: [],
    },
  },
  {
    name: 'crypto_prices',
    description:
      'Get crypto prices for a pair (open, high, low, close, volume) at a chosen resample frequency. Example: crypto_prices({ ticker: "btcusd", resampleFreq: "1day" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Crypto pair ticker, e.g. "btcusd", "ethusd"',
        },
        resampleFreq: {
          type: 'string',
          description: 'Resample frequency, e.g. "1min", "1hour", "1day" (default "1day")',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own Tiingo API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['ticker'],
    },
  },
];

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: `Token ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function tiingoGet(apiKey: string, path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers(apiKey) });
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  if (!apiKey) {
    return { error: 'api_key_required', message: 'No Tiingo key available.' };
  }

  switch (name) {
    case 'stock_prices':
      return stockPrices(args, apiKey);
    case 'stock_metadata':
      return stockMetadata(args.ticker as string, apiKey);
    case 'news':
      return news(args, apiKey);
    case 'crypto_prices':
      return cryptoPrices(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function stockPrices(args: Record<string, unknown>, apiKey: string) {
  const ticker = args.ticker as string;
  const frequency = (args.frequency as string) || 'daily';
  const startDate = args.start_date as string | undefined;
  const endDate = args.end_date as string | undefined;

  let path = `/tiingo/daily/${encodeURIComponent(ticker)}/prices?resampleFreq=${encodeURIComponent(frequency)}`;
  if (startDate) path += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) path += `&endDate=${encodeURIComponent(endDate)}`;

  const data = await tiingoGet(apiKey, path);
  if (data && typeof data === 'object' && 'error' in (data as object)) return data;

  const prices = data as Array<{
    date: string; open: number; high: number; low: number;
    close: number; volume: number; adjClose: number;
  }>;

  return {
    ticker,
    prices: prices.map((p) => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
      adjClose: p.adjClose,
    })),
  };
}

async function stockMetadata(ticker: string, apiKey: string) {
  const data = await tiingoGet(apiKey, `/tiingo/daily/${encodeURIComponent(ticker)}`);
  if (data && typeof data === 'object' && 'error' in (data as object)) return data;

  const d = data as {
    ticker: string; name: string; description: string;
    exchangeCode: string; startDate: string; endDate: string;
  };

  return {
    ticker: d.ticker,
    name: d.name,
    description: (d.description || '').slice(0, 500),
    exchangeCode: d.exchangeCode,
    startDate: d.startDate,
    endDate: d.endDate,
  };
}

async function news(args: Record<string, unknown>, apiKey: string) {
  const limit = Math.min(100, (args.limit as number) || 10);
  const tickers = args.tickers as string | undefined;
  const tags = args.tags as string | undefined;

  let path = `/tiingo/news?limit=${limit}`;
  if (tickers) path += `&tickers=${encodeURIComponent(tickers)}`;
  if (tags) path += `&tags=${encodeURIComponent(tags)}`;

  const data = await tiingoGet(apiKey, path);
  if (data && typeof data === 'object' && 'error' in (data as object)) return data;

  const articles = data as Array<{
    title: string; description: string; url: string;
    publishedDate: string; source: string; tickers: string[];
  }>;

  return {
    articles: articles.map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      publishedDate: a.publishedDate,
      source: a.source,
      tickers: a.tickers,
    })),
  };
}

async function cryptoPrices(args: Record<string, unknown>, apiKey: string) {
  const ticker = args.ticker as string;
  const resampleFreq = (args.resampleFreq as string) || '1day';

  const path = `/tiingo/crypto/prices?tickers=${encodeURIComponent(ticker)}&resampleFreq=${encodeURIComponent(resampleFreq)}`;
  const data = await tiingoGet(apiKey, path);
  if (data && typeof data === 'object' && 'error' in (data as object)) return data;

  const arr = data as Array<{
    ticker: string;
    priceData: Array<{
      date: string; open: number; high: number; low: number; close: number; volume: number;
    }>;
  }>;

  return {
    ticker,
    prices: (arr[0]?.priceData || []).map((p) => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    })),
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
