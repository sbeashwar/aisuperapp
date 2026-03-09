"use client";

import { TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { Card, CardContent, Button, cn } from "@mysuperapp/ui";

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

interface StockCardProps {
  stock: StockQuote;
  onRemove: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
}

export function StockCard({ stock, onRemove, onSelect }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <Card
      className="group relative overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      onClick={() => onSelect?.(stock.symbol)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm">{stock.symbol}</h3>
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                  isPositive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </div>
            </div>
            {stock.name && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {stock.name}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(stock.symbol); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2">
          <div className="text-lg font-bold">
            ${stock.price.toFixed(2)}
          </div>
          <div
            className={cn(
              "text-xs font-medium",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {isPositive ? "+" : ""}
            {stock.change.toFixed(2)} ({isPositive ? "+" : ""}
            {stock.changePercent.toFixed(2)}%)
          </div>
        </div>

        {(stock.high || stock.low) && (
          <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-1 text-[11px]">
            {stock.high && (
              <div>
                <span className="text-muted-foreground">High</span>
                <span className="ml-1 font-medium">${stock.high.toFixed(2)}</span>
              </div>
            )}
            {stock.low && (
              <div>
                <span className="text-muted-foreground">Low</span>
                <span className="ml-1 font-medium">${stock.low.toFixed(2)}</span>
              </div>
            )}
            {stock.open && (
              <div>
                <span className="text-muted-foreground">Open</span>
                <span className="ml-1 font-medium">${stock.open.toFixed(2)}</span>
              </div>
            )}
            {stock.previousClose && (
              <div>
                <span className="text-muted-foreground">Prev</span>
                <span className="ml-1 font-medium">${stock.previousClose.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StockListProps {
  stocks: StockQuote[];
  onRemove: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
  isLoading?: boolean;
}

export function StockList({ stocks, onRemove, onSelect, isLoading }: StockListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-5 bg-muted rounded w-16 mb-2" />
              <div className="h-4 bg-muted rounded w-32 mb-4" />
              <div className="h-8 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">📈</span>
        <h3 className="text-lg font-medium mb-1">No stocks in your watchlist</h3>
        <p className="text-muted-foreground">
          Search for stocks above to add them to your watchlist
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {stocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} onRemove={onRemove} onSelect={onSelect} />
      ))}
    </div>
  );
}
