import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const SECTORS_FILE = join(DATA_DIR, "sectors.json");

// ── Predefined sector list ────────────────────────────────────────────────────
export const SECTORS = [
  "Semiconductors",
  "Software & Internet",
  "HPC & Quantum Computing",
  "Energy & Utilities",
  "Commodities",
  "Emerging Markets",
  "Financials",
  "Transportation & Aerospace",
  "Automotive",
  "REITs & Real Estate",
  "Index Funds & ETFs",
  "Industrials",
  "Volatility",
  "Telecom",
  "Other",
] as const;

export type SectorName = (typeof SECTORS)[number];

export interface SectorAssignments {
  [symbol: string]: string; // symbol → sector name
}

// ── Default sector mapping for known tickers ──────────────────────────────────
const DEFAULT_ASSIGNMENTS: SectorAssignments = {
  // Semiconductors
  NVDA: "Semiconductors",
  AMD: "Semiconductors",
  INTC: "Semiconductors",
  QCOM: "Semiconductors",
  MRVL: "Semiconductors",
  MU: "Semiconductors",
  ASML: "Semiconductors",
  LRCX: "Semiconductors",
  KLAC: "Semiconductors",
  ACLS: "Semiconductors",
  SOXL: "Semiconductors",
  SNDK: "Semiconductors",

  // Software & Internet
  META: "Software & Internet",
  GOOGL: "Software & Internet",
  MSFT: "Software & Internet",
  AAPL: "Software & Internet",
  NFLX: "Software & Internet",
  CDNS: "Software & Internet",
  PANW: "Software & Internet",
  ANET: "Software & Internet",
  PYPL: "Software & Internet",

  // HPC & Quantum Computing
  APLD: "HPC & Quantum Computing",
  IONQ: "HPC & Quantum Computing",
  RGTI: "HPC & Quantum Computing",
  QBTS: "HPC & Quantum Computing",
  LUMN: "HPC & Quantum Computing",
  DLR: "HPC & Quantum Computing",

  // Energy & Utilities
  VST: "Energy & Utilities",
  CEG: "Energy & Utilities",
  NEE: "Energy & Utilities",
  SMR: "Energy & Utilities",
  CCJ: "Energy & Utilities",
  URA: "Energy & Utilities",
  NLR: "Energy & Utilities",
  LTBR: "Energy & Utilities",
  BE: "Energy & Utilities",
  GEV: "Energy & Utilities",
  POWL: "Energy & Utilities",

  // Commodities
  NUGT: "Commodities",
  UNG: "Commodities",
  USO: "Commodities",
  MP: "Commodities",

  // Emerging Markets
  VWO: "Emerging Markets",
  EWZ: "Emerging Markets",
  ARGT: "Emerging Markets",
  INDA: "Emerging Markets",
  EEM: "Emerging Markets",
  BABA: "Emerging Markets",

  // Financials
  JPM: "Financials",
  GS: "Financials",
  BAC: "Financials",
  AGNC: "Financials",

  // Transportation & Aerospace
  DAL: "Transportation & Aerospace",
  UBER: "Transportation & Aerospace",
  LYFT: "Transportation & Aerospace",
  BA: "Transportation & Aerospace",

  // Automotive
  TSLA: "Automotive",
  GM: "Automotive",

  // REITs & Real Estate
  AVB: "REITs & Real Estate",
  ARE: "REITs & Real Estate",
  IYR: "REITs & Real Estate",

  // Index Funds & ETFs
  SPY: "Index Funds & ETFs",
  VTI: "Index Funds & ETFs",
  QQQM: "Index Funds & ETFs",
  VIG: "Index Funds & ETFs",
  VGT: "Index Funds & ETFs",
  FXAIX: "Index Funds & ETFs",
  VTV: "Index Funds & ETFs",

  // Industrials
  URI: "Industrials",
  NVT: "Industrials",
  SYM: "Industrials",
  RH: "Industrials",

  // Volatility
  UVXY: "Volatility",
  VXX: "Volatility",

  // Telecom
  T: "Telecom",

  // Other
  ONDS: "Other",
  USAR: "Other",
};

// ── Persistence ───────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Load saved sector assignments, merging with defaults */
export function loadSectorAssignments(): SectorAssignments {
  ensureDataDir();

  let saved: SectorAssignments = {};

  if (existsSync(SECTORS_FILE)) {
    try {
      saved = JSON.parse(readFileSync(SECTORS_FILE, "utf-8"));
    } catch {
      saved = {};
    }
  }

  // Merge: saved overrides defaults
  return { ...DEFAULT_ASSIGNMENTS, ...saved };
}

/** Save sector assignments (only the overrides, not defaults) */
export function saveSectorAssignments(assignments: SectorAssignments) {
  ensureDataDir();
  writeFileSync(SECTORS_FILE, JSON.stringify(assignments, null, 2), "utf-8");
}

/** Assign a single symbol to a sector */
export function assignSector(symbol: string, sector: string) {
  const assignments = loadSectorAssignments();
  assignments[symbol.toUpperCase()] = sector;
  saveSectorAssignments(assignments);
  return assignments;
}

/** Get the sector for a symbol, or "Other" if unknown */
export function getSector(symbol: string): string {
  const assignments = loadSectorAssignments();
  return assignments[symbol.toUpperCase()] || "Other";
}

/** Get all unique sectors currently in use */
export function getActiveSectors(symbols: string[]): string[] {
  const assignments = loadSectorAssignments();
  const sectorSet = new Set<string>();
  for (const sym of symbols) {
    sectorSet.add(assignments[sym.toUpperCase()] || "Other");
  }
  // Return in the predefined order, then any custom ones
  const ordered = SECTORS.filter((s) => sectorSet.has(s));
  const custom = [...sectorSet].filter(
    (s) => !SECTORS.includes(s as SectorName)
  );
  return [...ordered, ...custom];
}
