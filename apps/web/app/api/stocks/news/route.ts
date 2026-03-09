import { type NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Query parameter 'symbol' is required" },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const result = await yahooFinance.search(symbol.toUpperCase(), {
      newsCount: 8,
      quotesCount: 0,
    });

    const news = (result.news || []).map((item: Record<string, unknown>) => ({
      title: item.title ?? "",
      publisher: item.publisher ?? "",
      link: item.link ?? "",
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime as number * 1000).toISOString()
        : "",
      thumbnail:
        ((item.thumbnail as Record<string, unknown>)?.resolutions as Array<Record<string, unknown>>)?.[0]?.url ??
        null,
    }));

    return NextResponse.json({ news }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error(`Failed to fetch news for ${symbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch news", news: [] },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
