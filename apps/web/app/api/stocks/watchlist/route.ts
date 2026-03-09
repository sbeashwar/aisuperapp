import { type NextRequest, NextResponse } from "next/server";
import { 
  loadWatchlist, 
  addToWatchlist, 
  removeFromWatchlist 
} from "@/lib/storage";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const watchlist = loadWatchlist();
    return NextResponse.json({ watchlist }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body as { symbols: Array<{ symbol: string; name: string }> };

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected { symbols: [{ symbol, name }] }" },
        { status: 400 }
      );
    }

    const { added, existing } = addToWatchlist(symbols);

    return NextResponse.json({
      success: true,
      added,
      existing,
      message: `Added ${added.length} stock(s)${existing.length > 0 ? `. ${existing.length} already in watchlist.` : ""}`,
    });
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
    return NextResponse.json(
      { error: "Failed to add to watchlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body as { symbol: string };

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const removed = removeFromWatchlist([symbol]);

    return NextResponse.json({
      success: true,
      removed: removed[0] || symbol.toUpperCase(),
    });
  } catch (error) {
    console.error("Failed to remove from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
