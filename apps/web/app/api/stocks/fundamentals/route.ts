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
    const fundamentals: Record<string, StockFundamentals> = {};

    // Fetch fundamentals in parallel with batching
    const batchSize = 20;
    for (let i = 0; i < symbolList.length; i += batchSize) {
      const batch = symbolList.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (symbol) => {
          try {
            // Single quoteSummary call to get all fundamentals at once
            const summary = await yahooFinance.quoteSummary(symbol, {
              modules: ["defaultKeyStatistics", "financialData", "summaryDetail", "price"],
            });

            const keyStats = summary.defaultKeyStatistics;
            const finData = summary.financialData;
            const detail = summary.summaryDetail;
            const price = summary.price;

            fundamentals[symbol] = {
              symbol,
              week52High: detail?.fiftyTwoWeekHigh,
              week52Low: detail?.fiftyTwoWeekLow,
              forwardPE: keyStats?.forwardPE,
              trailingPE: detail?.trailingPE,
              eps: keyStats?.trailingEps,
              debtToEquity: finData?.debtToEquity,
              marketCap: price?.marketCap,
              dividendYield: detail?.dividendYield
                ? (typeof detail.dividendYield === "number"
                  ? detail.dividendYield * 100
                  : undefined)
                : undefined,
              beta: keyStats?.beta,
              avgVolume: detail?.averageDailyVolume10Day ?? price?.averageDailyVolume10Day,
            };
          } catch (error) {
            console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
          }
        })
      );
    }

    return NextResponse.json({ fundamentals }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Fundamentals fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fundamentals" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

interface StockFundamentals {
  symbol: string;
  week52High?: number;
  week52Low?: number;
  forwardPE?: number;
  trailingPE?: number;
  eps?: number;
  debtToEquity?: number;
  marketCap?: number;
  dividendYield?: number;
  beta?: number;
  avgVolume?: number;
}
