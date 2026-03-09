"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Plus, X, Loader2 } from "lucide-react";
import { Button, Input, Card, CardContent, cn } from "@mysuperapp/ui";

interface SearchResult {
  symbol: string;
  name: string;
}

interface StockSearchProps {
  onAdd: (stocks: SearchResult[]) => void;
  existingSymbols: string[];
}

export function StockSearch({ onAdd, existingSymbols }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Process tickers from input (called on space, comma, or Enter)
  const processTickerInput = useCallback((input: string) => {
    // Parse comma/space separated tickers
    const potentialTickers = input
      .toUpperCase()
      .split(/[\s,]+/)
      .filter((t) => t.length > 0 && t.length <= 5 && /^[A-Z]+$/.test(t));

    if (potentialTickers.length === 0) return false;

    // Filter out duplicates (already in selected or existing watchlist)
    const newStocks = potentialTickers
      .filter((t, index, self) => 
        // Remove duplicates within the input itself
        self.indexOf(t) === index &&
        // Remove if already in selected
        !selected.some((s) => s.symbol === t) &&
        // Remove if already in watchlist
        !existingSymbols.includes(t)
      )
      .map((t) => ({ symbol: t, name: t }));

    if (newStocks.length > 0) {
      setSelected((prev) => [...prev, ...newStocks]);
      setQuery("");
      setResults([]);
      setShowResults(false);
      return true;
    }
    
    // If all were duplicates, clear the input anyway
    if (potentialTickers.length > 0) {
      setQuery("");
      return true;
    }

    return false;
  }, [existingSymbols, selected]);

  // Search API for company names
  const searchStocks = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 1) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      setResults(data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const lastChar = value.slice(-1);
    
    // Check if user just typed a space or comma (delimiter)
    if (lastChar === " " || lastChar === ",") {
      const tickerPart = value.slice(0, -1).trim();
      if (tickerPart && processTickerInput(tickerPart)) {
        return; // Tickers were processed, input cleared
      }
    }
    
    setQuery(value);
    
    // Debounce search for API calls (only for non-ticker searches)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Don't search if it looks like they're typing tickers
      const trimmed = value.trim();
      if (trimmed && !trimmed.includes(",") && !trimmed.includes(" ")) {
        searchStocks(trimmed);
      }
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        processTickerInput(trimmed);
      }
    }
  };

  const handleSelectStock = (stock: SearchResult) => {
    if (!selected.some((s) => s.symbol === stock.symbol) && !existingSymbols.includes(stock.symbol)) {
      setSelected((prev) => [...prev, stock]);
    }
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleRemoveSelected = (symbol: string) => {
    setSelected((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const handleAddToWatchlist = () => {
    if (selected.length > 0) {
      onAdd(selected);
      setSelected([]);
    }
  };

  const isAlreadyAdded = (symbol: string) => 
    existingSymbols.includes(symbol) || selected.some((s) => s.symbol === symbol);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, ticker, or enter tickers (e.g., AAPL, MSFT, GOOGL)"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="pl-10 pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <Card className="absolute z-10 mt-1 w-full overflow-hidden">
            <CardContent className="p-0">
              <ul className="max-h-64 overflow-auto">
                {results.map((result) => (
                  <li key={result.symbol}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between",
                        isAlreadyAdded(result.symbol) && "opacity-50"
                      )}
                      onClick={() => handleSelectStock(result)}
                      disabled={isAlreadyAdded(result.symbol)}
                    >
                      <div>
                        <span className="font-medium">{result.symbol}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {result.name}
                        </span>
                      </div>
                      {isAlreadyAdded(result.symbol) ? (
                        <span className="text-xs text-muted-foreground">Added</span>
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Stocks */}
      {selected.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selected.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
              >
                <span className="font-medium">{stock.symbol}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(stock.symbol)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={handleAddToWatchlist} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add {selected.length} stock{selected.length > 1 ? "s" : ""} to watchlist
          </Button>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Tip: Type tickers and press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Space</kbd>, <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">,</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to add them. Duplicates are ignored.
      </p>
    </div>
  );
}
