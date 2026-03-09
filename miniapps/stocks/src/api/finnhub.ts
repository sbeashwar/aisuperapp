/**
 * Finnhub API Client
 * Free tier: 60 API calls/minute
 * Docs: https://finnhub.io/docs/api
 */

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface FinnhubSymbolSearchResult {
  count: number;
  result: Array<{
    description: string;  // Company name
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

class FinnhubClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
    url.searchParams.set("token", this.apiKey);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for stocks by symbol or company name
   */
  async searchSymbols(query: string): Promise<FinnhubSymbolSearchResult> {
    return this.fetch<FinnhubSymbolSearchResult>("/search", { q: query });
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<FinnhubQuote> {
    return this.fetch<FinnhubQuote>("/quote", { symbol: symbol.toUpperCase() });
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols: string[]): Promise<Map<string, FinnhubQuote>> {
    const quotes = new Map<string, FinnhubQuote>();
    
    // Fetch in parallel but respect rate limits
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await this.getQuote(symbol);
          return { symbol: symbol.toUpperCase(), quote };
        } catch (error) {
          console.error(`Failed to fetch quote for ${symbol}:`, error);
          return { symbol: symbol.toUpperCase(), quote: null };
        }
      })
    );

    for (const { symbol, quote } of results) {
      if (quote) {
        quotes.set(symbol, quote);
      }
    }

    return quotes;
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile> {
    return this.fetch<FinnhubCompanyProfile>("/stock/profile2", { symbol: symbol.toUpperCase() });
  }

  /**
   * Get company news
   */
  async getCompanyNews(symbol: string, fromDate: string, toDate: string): Promise<FinnhubNews[]> {
    return this.fetch<FinnhubNews[]>("/company-news", {
      symbol: symbol.toUpperCase(),
      from: fromDate,
      to: toDate,
    });
  }
}

// Singleton instance - initialized lazily
let finnhubClient: FinnhubClient | null = null;

export function getFinnhubClient(): FinnhubClient {
  if (!finnhubClient) {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error("FINNHUB_API_KEY environment variable is not set");
    }
    finnhubClient = new FinnhubClient(apiKey);
  }
  return finnhubClient;
}

export { FinnhubClient };
