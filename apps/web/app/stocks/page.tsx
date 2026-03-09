"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { Button } from "@mysuperapp/ui";
import { 
  StockSearch, 
  StockList, 
  StockListView,
  StockDetailDrawer,
  ViewToggle,
  type StockQuote, 
  type StockFundamentals,
  type StockDetailData,
  type ViewMode 
} from "@/components/stocks";

interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
}

export default function StocksPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [fundamentals, setFundamentals] = useState<Record<string, StockFundamentals>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupBySector, setGroupBySector] = useState(true);
  const [sectorAssignments, setSectorAssignments] = useState<Record<string, string>>({});
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockDetailData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Open detail drawer for a stock
  const handleSelectStock = (symbol: string) => {
    const quote = quotes[symbol];
    const fund = fundamentals[symbol];
    const wl = watchlist.find((w) => w.symbol === symbol);
    if (!quote) return;
    setSelectedStock({
      symbol,
      name: wl?.name,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      high: quote.high,
      low: quote.low,
      open: quote.open,
      previousClose: quote.previousClose,
      week52High: fund?.week52High,
      week52Low: fund?.week52Low,
      forwardPE: fund?.forwardPE,
      trailingPE: fund?.trailingPE,
      eps: fund?.eps,
      debtToEquity: fund?.debtToEquity,
      marketCap: fund?.marketCap,
      dividendYield: fund?.dividendYield,
      beta: fund?.beta,
    });
    setDetailOpen(true);
  };

  // Fetch sectors
  const fetchSectors = useCallback(async () => {
    try {
      const response = await fetch("/api/stocks/sectors", { cache: "no-store" });
      const data = await response.json();
      setSectorAssignments(data.assignments || {});
      setSectors(data.sectors || []);
    } catch (error) {
      console.error("Failed to fetch sectors:", error);
    }
  }, []);

  // Update a stock's sector
  const handleSectorChange = async (symbol: string, sector: string) => {
    // Optimistic update
    setSectorAssignments((prev) => ({ ...prev, [symbol]: sector }));
    try {
      await fetch("/api/stocks/sectors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, sector }),
      });
    } catch (error) {
      console.error("Failed to update sector:", error);
      // Revert on error
      fetchSectors();
    }
  };

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await fetch("/api/stocks/watchlist", { cache: "no-store" });
      const data = await response.json();
      setWatchlist(data.watchlist || []);
      return data.watchlist || [];
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      return [];
    }
  }, []);

  // Fetch quotes for watchlist
  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/stocks/quotes?symbols=${symbols.join(",")}`, { cache: "no-store" });
      const data = await response.json();
      setQuotes(data.quotes || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch fundamentals for watchlist
  const fetchFundamentals = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;

    try {
      const response = await fetch(`/api/stocks/fundamentals?symbols=${symbols.join(",")}`, { cache: "no-store" });
      const data = await response.json();
      setFundamentals(data.fundamentals || {});
    } catch (error) {
      console.error("Failed to fetch fundamentals:", error);
    }
  }, []);

  // Refs for polling intervals
  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchlistRef = useRef<WatchlistItem[]>([]);

  // Keep watchlistRef in sync
  useEffect(() => {
    watchlistRef.current = watchlist;
  }, [watchlist]);

  // Start/stop polling helpers
  const startPolling = useCallback(() => {
    // Clear any existing intervals
    if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
    if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);

    // Poll quotes every 5 seconds
    quoteIntervalRef.current = setInterval(() => {
      const symbols = watchlistRef.current.map((item) => item.symbol);
      if (symbols.length > 0) {
        fetchQuotes(symbols);
      }
    }, 5_000);

    // Poll fundamentals, watchlist & sectors every 15 minutes
    dataIntervalRef.current = setInterval(async () => {
      const [list] = await Promise.all([
        fetchWatchlist(),
        fetchSectors(),
      ]);
      const symbols = (list as WatchlistItem[]).map((item) => item.symbol);
      if (symbols.length > 0) {
        fetchFundamentals(symbols);
      }
    }, 15 * 60_000);
  }, [fetchQuotes, fetchFundamentals, fetchWatchlist, fetchSectors]);

  const stopPolling = useCallback(() => {
    if (quoteIntervalRef.current) { clearInterval(quoteIntervalRef.current); quoteIntervalRef.current = null; }
    if (dataIntervalRef.current) { clearInterval(dataIntervalRef.current); dataIntervalRef.current = null; }
  }, []);

  // Initial load + start polling
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [list] = await Promise.all([
        fetchWatchlist(),
        fetchSectors(),
      ]);
      if (list.length > 0) {
        const symbols = list.map((item: WatchlistItem) => item.symbol);
        // Load quotes first (fast) to show the page quickly
        await fetchQuotes(symbols);
        setIsLoading(false);
        // Then load fundamentals in the background
        fetchFundamentals(symbols);
      } else {
        setIsLoading(false);
      }
      startPolling();
    };
    load();
    return () => stopPolling();
  }, [fetchWatchlist, fetchQuotes, fetchFundamentals, fetchSectors, startPolling, stopPolling]);

  // Pause polling when tab/app is hidden, resume + immediate refresh when visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Immediate refresh when coming back
        const symbols = watchlistRef.current.map((item) => item.symbol);
        if (symbols.length > 0) fetchQuotes(symbols);
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchQuotes, startPolling, stopPolling]);

  // Add stocks to watchlist
  const handleAddStocks = async (stocks: Array<{ symbol: string; name: string }>) => {
    try {
      const response = await fetch("/api/stocks/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: stocks }),
      });
      const data = await response.json();
      
      if (data.success) {
        setWatchlist(data.watchlist);
        // Fetch quotes and fundamentals for newly added stocks
        const newSymbols = data.added as string[];
        if (newSymbols.length > 0) {
          const allSymbols = [...Object.keys(quotes), ...newSymbols];
          await Promise.all([
            fetchQuotes(allSymbols),
            fetchFundamentals(allSymbols),
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to add stocks:", error);
    }
  };

  // Remove stock from watchlist
  const handleRemoveStock = async (symbol: string) => {
    try {
      const response = await fetch("/api/stocks/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await response.json();
      
      if (data.success) {
        setWatchlist(data.watchlist);
        // Remove from quotes and fundamentals
        setQuotes((prev) => {
          const next = { ...prev };
          delete next[symbol];
          return next;
        });
        setFundamentals((prev) => {
          const next = { ...prev };
          delete next[symbol];
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to remove stock:", error);
    }
  };

  // Refresh quotes and fundamentals
  const handleRefresh = () => {
    const symbols = watchlist.map((item) => item.symbol);
    Promise.all([
      fetchQuotes(symbols),
      fetchFundamentals(symbols),
    ]);
  };

  // Combine watchlist with quotes (for tile view)
  const stocksWithQuotes: StockQuote[] = watchlist.map((item) => {
    const quote = quotes[item.symbol];
    return {
      symbol: item.symbol,
      name: item.name,
      price: quote?.price ?? 0,
      change: quote?.change ?? 0,
      changePercent: quote?.changePercent ?? 0,
      high: quote?.high,
      low: quote?.low,
      open: quote?.open,
      previousClose: quote?.previousClose,
    };
  });

  // Combine watchlist with quotes and fundamentals (for list view)
  const stocksWithFundamentals: StockFundamentals[] = watchlist.map((item) => {
    const quote = quotes[item.symbol];
    const fund = fundamentals[item.symbol];
    return {
      symbol: item.symbol,
      name: item.name,
      price: quote?.price ?? 0,
      change: quote?.change ?? 0,
      changePercent: quote?.changePercent ?? 0,
      week52High: fund?.week52High,
      week52Low: fund?.week52Low,
      forwardPE: fund?.forwardPE,
      trailingPE: fund?.trailingPE,
      eps: fund?.eps,
      debtToEquity: fund?.debtToEquity,
      marketCap: fund?.marketCap,
      dividendYield: fund?.dividendYield,
      beta: fund?.beta,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <h1 className="font-semibold">Stock Watchlist</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                <span className="hidden sm:inline">Updated </span>
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || watchlist.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Section */}
        <section>
          <h2 className="text-lg font-medium mb-3">Add Stocks</h2>
          <StockSearch
            onAdd={handleAddStocks}
            existingSymbols={watchlist.map((item) => item.symbol)}
          />
        </section>

        {/* Watchlist Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">
              Your Watchlist
              {watchlist.length > 0 && (
                <span className="ml-2 text-sm text-muted-foreground font-normal">
                  ({watchlist.length} stock{watchlist.length !== 1 ? "s" : ""})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {viewMode === "list" && (
                <Button
                  variant={groupBySector ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupBySector(!groupBySector)}
                  className="h-8"
                >
                  <Layers className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Group by Sector</span>
                </Button>
              )}
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
          
          {viewMode === "tile" ? (
            <StockList
              stocks={stocksWithQuotes}
              onRemove={handleRemoveStock}
              onSelect={handleSelectStock}
              isLoading={isLoading}
            />
          ) : (
            <StockListView
              stocks={stocksWithFundamentals}
              onRemove={handleRemoveStock}
              onSelect={handleSelectStock}
              isLoading={isLoading}
              sectorAssignments={sectorAssignments}
              sectors={sectors}
              groupBySector={groupBySector}
              onSectorChange={handleSectorChange}
            />
          )}
        </section>
      </main>

      {/* Stock detail drawer */}
      <StockDetailDrawer
        stock={selectedStock}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
