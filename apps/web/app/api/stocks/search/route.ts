import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  
  // If no API key, return mock data for development
  if (!apiKey) {
    return NextResponse.json({
      results: getMockSearchResults(query),
      mock: true,
    });
  }

  try {
    const url = new URL(`${FINNHUB_BASE_URL}/search`);
    url.searchParams.set("token", apiKey);
    url.searchParams.set("q", query);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to only stock types and US exchanges for simplicity
    const filtered = data.result
      ?.filter((item: { type: string; symbol: string }) => 
        item.type === "Common Stock" && !item.symbol.includes(".")
      )
      .slice(0, 10) || [];

    return NextResponse.json({
      results: filtered.map((item: { symbol: string; description: string }) => ({
        symbol: item.symbol,
        name: item.description,
      })),
    }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Stock search error:", error);
    return NextResponse.json(
      { error: "Failed to search stocks" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// Mock data for development without API key
function getMockSearchResults(query: string) {
  const mockStocks = [
    { symbol: "AAPL", name: "Apple Inc" },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc" },
    { symbol: "AMZN", name: "Amazon.com Inc" },
    { symbol: "TSLA", name: "Tesla Inc" },
    { symbol: "META", name: "Meta Platforms Inc" },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "JPM", name: "JPMorgan Chase & Co" },
    { symbol: "V", name: "Visa Inc" },
    { symbol: "WMT", name: "Walmart Inc" },
  ];

  const q = query.toLowerCase();
  return mockStocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
  );
}
