import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

// Database file path from environment or default
const databaseUrl = process.env.DATABASE_URL || "file:local.db";

// Create libSQL client (works with SQLite files and Turso cloud)
const client = createClient({
  url: databaseUrl,
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export the client for advanced usage
export { client };

// Export schema for type inference
export { schema };

// Track initialization
let initialized = false;

/**
 * Initialize the database tables
 * Call this once on app startup
 */
export async function initializeDatabase() {
  if (initialized) return;
  
  console.log("Initializing database...");
  
  // Create stocks_watchlist table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS stocks_watchlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      symbol TEXT NOT NULL,
      name TEXT,
      added_at INTEGER,
      notes TEXT,
      target_price REAL,
      alert_enabled INTEGER DEFAULT 0
    )
  `);

  // Create stocks_quotes_cache table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS stocks_quotes_cache (
      symbol TEXT PRIMARY KEY,
      price REAL NOT NULL,
      change REAL,
      change_percent REAL,
      high REAL,
      low REAL,
      open REAL,
      previous_close REAL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create indexes for faster lookups
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON stocks_watchlist(user_id)
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON stocks_watchlist(symbol)
  `);

  initialized = true;
  console.log("Database initialized successfully");
}
