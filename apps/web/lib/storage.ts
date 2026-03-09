import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Data directory for local file storage
const DATA_DIR = join(process.cwd(), ".data");
const WATCHLIST_FILE = join(DATA_DIR, "watchlist.json");

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  addedAt: string;
  notes?: string;
  targetPrice?: number;
  alertEnabled?: boolean;
}

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load watchlist from file
export function loadWatchlist(): WatchlistItem[] {
  ensureDataDir();
  
  if (!existsSync(WATCHLIST_FILE)) {
    return [];
  }
  
  try {
    const data = readFileSync(WATCHLIST_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading watchlist:", error);
    return [];
  }
}

// Save watchlist to file
export function saveWatchlist(watchlist: WatchlistItem[]) {
  ensureDataDir();
  
  try {
    writeFileSync(WATCHLIST_FILE, JSON.stringify(watchlist, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving watchlist:", error);
    throw error;
  }
}

// Add items to watchlist
export function addToWatchlist(items: Array<{ symbol: string; name: string }>): {
  added: string[];
  existing: string[];
} {
  const watchlist = loadWatchlist();
  const existingSymbols = new Set(watchlist.map(item => item.symbol.toUpperCase()));
  
  const added: string[] = [];
  const existing: string[] = [];
  
  for (const item of items) {
    const symbol = item.symbol.toUpperCase();
    
    if (existingSymbols.has(symbol)) {
      existing.push(symbol);
    } else {
      watchlist.push({
        id: `${symbol}-${Date.now()}`,
        symbol,
        name: item.name || symbol,
        addedAt: new Date().toISOString(),
      });
      existingSymbols.add(symbol);
      added.push(symbol);
    }
  }
  
  saveWatchlist(watchlist);
  return { added, existing };
}

// Remove items from watchlist
export function removeFromWatchlist(symbols: string[]): string[] {
  const watchlist = loadWatchlist();
  const symbolsToRemove = new Set(symbols.map(s => s.toUpperCase()));
  
  const newWatchlist = watchlist.filter(
    item => !symbolsToRemove.has(item.symbol.toUpperCase())
  );
  
  const removed = watchlist
    .filter(item => symbolsToRemove.has(item.symbol.toUpperCase()))
    .map(item => item.symbol);
  
  saveWatchlist(newWatchlist);
  return removed;
}
