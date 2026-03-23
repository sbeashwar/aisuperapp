import { type NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json(
      { error: "Query parameter 'symbols' is required" },
      { status: 400 }
    );
  }

  const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());

  try {
    const yahooFinance = new YahooFinance();
    const quotes: Record<string, StockQuote> = {};

    // Fetch quotes in parallel with batching
    const batchSize = 20;
    for (let i = 0; i < symbolList.length; i += batchSize) {
      const batch = symbolList.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (symbol) => {
          try {
            const quote = await yahooFinance.quote(symbol);
            
            if (quote && quote.regularMarketPrice) {
              quotes[symbol] = {
                symbol,
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange ?? 0,
                changePercent: quote.regularMarketChangePercent ?? 0,
                high: quote.regularMarketDayHigh ?? quote.regularMarketPrice,
                low: quote.regularMarketDayLow ?? quote.regularMarketPrice,
                open: quote.regularMarketOpen ?? quote.regularMarketPrice,
                previousClose: quote.regularMarketPreviousClose ?? quote.regularMarketPrice,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch quote for ${symbol}:`, error);
          }
        })
      );
    }

    return NextResponse.json({ quotes }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Quote fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}
