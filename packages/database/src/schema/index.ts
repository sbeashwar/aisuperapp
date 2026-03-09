// Auth schema (Auth.js tables)
export {
  users,
  accounts,
  sessions,
  verificationTokens,
  type User,
  type NewUser,
  type Account,
  type Session,
} from "./auth";

// Stocks mini app schema
export {
  stocksWatchlist,
  stocksQuotesCache,
  stocksNewsCache,
  type StockWatchlistItem,
  type NewStockWatchlistItem,
  type StockQuote,
  type StockNews,
} from "./stocks";
