import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Stock Watchlist table
 * Stores user's watched stocks
 * Note: userId is optional until auth is implemented
 */
export const stocksWatchlist = sqliteTable("stocks_watchlist", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  symbol: text("symbol").notNull(),
  name: text("name"),
  addedAt: integer("added_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  notes: text("notes"),
  targetPrice: real("target_price"),
  alertEnabled: integer("alert_enabled", { mode: "boolean" }).default(false),
});

/**
 * Stock Quotes Cache table
 * Caches stock price data to reduce API calls
 */
export const stocksQuotesCache = sqliteTable("stocks_quotes_cache", {
  symbol: text("symbol").primaryKey(),
  price: real("price").notNull(),
  change: real("change"),
  changePercent: real("change_percent"),
  high: real("high"),
  low: real("low"),
  open: real("open"),
  previousClose: real("previous_close"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Stock News Cache table
 * Caches news articles for watched stocks
 */
export const stocksNewsCache = sqliteTable("stocks_news_cache", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull(),
  headline: text("headline").notNull(),
  summary: text("summary"),
  source: text("source"),
  url: text("url"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  cachedAt: integer("cached_at", { mode: "timestamp" }).notNull(),
});

// Export types
export type StockWatchlistItem = typeof stocksWatchlist.$inferSelect;
export type NewStockWatchlistItem = typeof stocksWatchlist.$inferInsert;
export type StockQuote = typeof stocksQuotesCache.$inferSelect;
export type StockNews = typeof stocksNewsCache.$inferSelect;
