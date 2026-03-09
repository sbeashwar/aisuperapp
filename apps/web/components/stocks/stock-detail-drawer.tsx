"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Loader2,
  Newspaper,
} from "lucide-react";
import { Button, cn } from "@mysuperapp/ui";

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}

export interface StockDetailData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  week52High?: number;
  week52Low?: number;
  forwardPE?: number;
  trailingPE?: number;
  eps?: number;
  debtToEquity?: number;
  marketCap?: number;
  dividendYield?: number;
  beta?: number;
}

interface StockDetailDrawerProps {
  stock: StockDetailData | null;
  open: boolean;
  onClose: () => void;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StockDetailDrawer({
  stock,
  open,
  onClose,
}: StockDetailDrawerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(false);

  const fetchNews = useCallback(async (symbol: string) => {
    setNewsLoading(true);
    setNewsError(false);
    try {
      const res = await fetch(
        `/api/stocks/news?symbol=${symbol}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setNews(data.news || []);
    } catch {
      setNewsError(true);
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // Fetch news when drawer opens with a new stock
  useEffect(() => {
    if (open && stock) {
      fetchNews(stock.symbol);
    }
    if (!open) {
      setNews([]);
      setNewsError(false);
    }
  }, [open, stock?.symbol, fetchNews]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!stock) return null;

  const isPositive = stock.change >= 0;
  const week52Position =
    stock.week52Low !== undefined && stock.week52High !== undefined && stock.week52High !== stock.week52Low
      ? Math.max(0, Math.min(100, ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100))
      : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[70] w-full sm:w-[420px] bg-background shadow-2xl border-l",
          "transform transition-transform duration-200 ease-out",
          "flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{stock.symbol}</h2>
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                  isPositive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
              </div>
            </div>
            {stock.name && (
              <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Price section */}
          <div className="px-4 py-4 border-b">
            <div className="text-3xl font-bold">${stock.price.toFixed(2)}</div>
            <div
              className={cn(
                "text-sm font-medium mt-0.5",
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Quote details */}
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Quote Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <DetailRow label="Open" value={stock.open != null ? `$${stock.open.toFixed(2)}` : undefined} />
              <DetailRow label="Prev Close" value={stock.previousClose != null ? `$${stock.previousClose.toFixed(2)}` : undefined} />
              <DetailRow label="Day High" value={stock.high != null ? `$${stock.high.toFixed(2)}` : undefined} />
              <DetailRow label="Day Low" value={stock.low != null ? `$${stock.low.toFixed(2)}` : undefined} />
            </div>
          </div>

          {/* 52-week range */}
          {week52Position !== null && stock.week52Low !== undefined && stock.week52High !== undefined && (
            <div className="px-4 py-3 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                52-Week Range
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">${stock.week52Low.toFixed(2)}</span>
                <div className="flex-1 h-2 bg-muted rounded-full relative">
                  <div
                    className={cn(
                      "absolute h-3 w-3 rounded-full -top-0.5 border-2 border-background",
                      week52Position >= 70 ? "bg-green-500" : week52Position >= 40 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ left: `calc(${week52Position}% - 6px)` }}
                  />
                </div>
                <span className="text-muted-foreground">${stock.week52High.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Fundamentals */}
          <div className="px-4 py-3 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Fundamentals
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <DetailRow label="Trailing P/E" value={stock.trailingPE != null && stock.trailingPE > 0 ? stock.trailingPE.toFixed(2) : undefined} />
              <DetailRow label="Forward P/E" value={stock.forwardPE != null && stock.forwardPE > 0 ? stock.forwardPE.toFixed(2) : undefined} />
              <DetailRow label="EPS" value={stock.eps != null ? `$${stock.eps.toFixed(2)}` : undefined} />
              <DetailRow label="Mkt Cap" value={stock.marketCap != null ? formatMarketCap(stock.marketCap) : undefined} />
              <DetailRow label="Debt/Equity" value={stock.debtToEquity != null && stock.debtToEquity >= 0 ? stock.debtToEquity.toFixed(2) : undefined} />
              <DetailRow label="Div Yield" value={stock.dividendYield != null ? `${stock.dividendYield.toFixed(2)}%` : undefined} />
              <DetailRow label="Beta" value={stock.beta != null ? stock.beta.toFixed(2) : undefined} />
            </div>
          </div>

          {/* News */}
          <div className="px-4 py-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" />
              Recent News
            </h3>

            {newsLoading && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Loading news...</span>
              </div>
            )}

            {newsError && !newsLoading && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Unable to load news.
              </p>
            )}

            {!newsLoading && !newsError && news.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent news found.
              </p>
            )}

            {!newsLoading && news.length > 0 && (
              <div className="space-y-3">
                {news.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors group"
                  >
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-16 h-16 rounded object-cover flex-shrink-0 bg-muted"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="truncate">{item.publisher}</span>
                        {item.publishedAt && (
                          <>
                            <span>·</span>
                            <span className="flex-shrink-0">{timeAgo(item.publishedAt)}</span>
                          </>
                        )}
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
