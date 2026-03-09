"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  Tag,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button, cn } from "@mysuperapp/ui";

export interface StockFundamentals {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  week52High?: number;
  week52Low?: number;
  forwardPE?: number;
  trailingPE?: number;
  eps?: number;
  debtToEquity?: number;
  marketCap?: number;
  dividendYield?: number;
  beta?: number;
  volume?: number;
  avgVolume?: number;
  sector?: string;
}

type SortField =
  | "symbol"
  | "price"
  | "changePercent"
  | "week52Position"
  | "trailingPE"
  | "forwardPE"
  | "eps"
  | "debtToEquity"
  | "marketCap";
type SortDirection = "asc" | "desc" | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

interface StockListViewProps {
  stocks: StockFundamentals[];
  onRemove: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
  isLoading?: boolean;
  sectorAssignments?: Record<string, string>;
  sectors?: string[];
  groupBySector?: boolean;
  onSectorChange?: (symbol: string, sector: string) => void;
}

// ── Sector colours ──────────────────────────────────────────────────────────

const SECTOR_COLORS: Record<string, string> = {
  Semiconductors: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "Software & Internet": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "HPC & Quantum Computing": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Energy & Utilities": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Commodities: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Emerging Markets": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Financials: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Transportation & Aerospace": "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  Automotive: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  "REITs & Real Estate": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "Index Funds & ETFs": "bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-300",
  Industrials: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Volatility: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  Telecom: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300",
};

function getSectorColor(sector: string): string {
  return SECTOR_COLORS[sector] || SECTOR_COLORS["Other"]!;
}

const SECTOR_DOT_COLORS: Record<string, string> = {
  Semiconductors: "bg-purple-500",
  "Software & Internet": "bg-blue-500",
  "HPC & Quantum Computing": "bg-cyan-500",
  "Energy & Utilities": "bg-yellow-500",
  Commodities: "bg-amber-500",
  "Emerging Markets": "bg-emerald-500",
  Financials: "bg-green-500",
  "Transportation & Aerospace": "bg-sky-500",
  Automotive: "bg-rose-500",
  "REITs & Real Estate": "bg-indigo-500",
  "Index Funds & ETFs": "bg-slate-500",
  Industrials: "bg-orange-500",
  Volatility: "bg-red-500",
  Telecom: "bg-teal-500",
  Other: "bg-gray-500",
};

function getSectorDotColor(sector: string): string {
  return SECTOR_DOT_COLORS[sector] || "bg-gray-500";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calculatePERangeFromStocks(
  stocks: StockFundamentals[]
): { min: number; max: number } | null {
  const validPEs = stocks
    .map((s) => s.forwardPE)
    .filter((pe): pe is number => pe !== undefined && pe > 0);
  if (validPEs.length === 0) return null;
  return { min: Math.min(...validPEs), max: Math.max(...validPEs) };
}

function calculateWeek52Position(stock: StockFundamentals): number | null {
  if (stock.week52Low === undefined || stock.week52High === undefined) return null;
  if (stock.week52High === stock.week52Low) return 50;
  const position =
    ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100;
  return Math.max(0, Math.min(100, position));
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Main component ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function StockListView({
  stocks,
  onRemove,
  onSelect,
  isLoading,
  sectorAssignments = {},
  sectors = [],
  groupBySector = false,
  onSectorChange,
}: StockListViewProps) {
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());
  const [initialCollapseApplied, setInitialCollapseApplied] = useState(false);

  const peRange = useMemo(() => calculatePERangeFromStocks(stocks), [stocks]);

  // ── Sorting ─────────────────────────────────────────────────────────────
  const sortedStocks = useMemo(() => {
    if (!sort.field || !sort.direction) return stocks;

    return [...stocks].sort((a, b) => {
      let aVal: number | string | null = null;
      let bVal: number | string | null = null;

      switch (sort.field) {
        case "symbol":        aVal = a.symbol;                       bVal = b.symbol;                       break;
        case "price":         aVal = a.price;                        bVal = b.price;                        break;
        case "changePercent": aVal = a.changePercent;                bVal = b.changePercent;                break;
        case "week52Position":aVal = calculateWeek52Position(a);     bVal = calculateWeek52Position(b);     break;
        case "trailingPE":    aVal = a.trailingPE ?? null;           bVal = b.trailingPE ?? null;           break;
        case "forwardPE":     aVal = a.forwardPE ?? null;            bVal = b.forwardPE ?? null;            break;
        case "eps":           aVal = a.eps ?? null;                  bVal = b.eps ?? null;                  break;
        case "debtToEquity":  aVal = a.debtToEquity ?? null;         bVal = b.debtToEquity ?? null;         break;
        case "marketCap":     aVal = a.marketCap ?? null;            bVal = b.marketCap ?? null;            break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sort.direction === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [stocks, sort]);

  // ── Grouping ────────────────────────────────────────────────────────────
  const groupedStocks = useMemo(() => {
    if (!groupBySector) return null;

    const groups: Record<string, StockFundamentals[]> = {};
    for (const stock of sortedStocks) {
      const sector = sectorAssignments[stock.symbol] || "Other";
      if (!groups[sector]) groups[sector] = [];
      groups[sector]!.push(stock);
    }

    const orderedSectors = sectors.length > 0 ? sectors : Object.keys(groups);
    const result: Array<{ sector: string; stocks: StockFundamentals[] }> = [];

    for (const sector of orderedSectors) {
      if (groups[sector]?.length) result.push({ sector, stocks: groups[sector]! });
    }
    for (const sector of Object.keys(groups)) {
      if (!orderedSectors.includes(sector)) result.push({ sector, stocks: groups[sector]! });
    }
    return result;
  }, [sortedStocks, groupBySector, sectorAssignments, sectors]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, direction: "asc" as const };
      if (prev.direction === "asc") return { field, direction: "desc" as const };
      return { field: null, direction: null };
    });
  };

  const toggleSectorCollapse = (sector: string) => {
    setCollapsedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  // Default to all collapsed on first load
  useEffect(() => {
    if (!initialCollapseApplied && groupBySector && groupedStocks && groupedStocks.length > 0) {
      setCollapsedSectors(new Set(groupedStocks.map((g) => g.sector)));
      setInitialCollapseApplied(true);
    }
  }, [groupBySector, groupedStocks, initialCollapseApplied]);

  const collapseAll = () => {
    if (groupedStocks) {
      setCollapsedSectors(new Set(groupedStocks.map((g) => g.sector)));
    }
  };

  const expandAll = () => {
    setCollapsedSectors(new Set());
  };

  const allCollapsed = groupedStocks
    ? groupedStocks.every((g) => collapsedSectors.has(g.sector))
    : false;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    if (sort.direction === "asc") return <ChevronUp className="h-3 w-3" />;
    return <ChevronDown className="h-3 w-3" />;
  };

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        "p-3 font-medium text-sm whitespace-nowrap cursor-pointer hover:bg-muted/70 transition-colors select-none",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </span>
    </th>
  );

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-sm">Symbol</th>
                <th className="text-right p-3 font-medium text-sm">Price</th>
                <th className="text-right p-3 font-medium text-sm">Change</th>
                <th className="text-center p-3 font-medium text-sm">52W Range</th>
                <th className="text-right p-3 font-medium text-sm">Fwd P/E</th>
                <th className="text-right p-3 font-medium text-sm">EPS</th>
                <th className="text-right p-3 font-medium text-sm">D/E</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="p-3"><div className="h-4 bg-muted rounded w-16" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-20 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-16 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-12 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-32 mx-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-12 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-12 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-12 ml-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-muted rounded w-8" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
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

  const colCount = groupBySector ? 10 : 11;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <SortableHeader field="symbol" className="text-left">
                {groupBySector && groupedStocks && (
                  <button
                    type="button"
                    title={allCollapsed ? "Expand all sectors" : "Collapse all sectors"}
                    className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted transition-colors mr-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); allCollapsed ? expandAll() : collapseAll(); }}
                  >
                    {allCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </button>
                )}
                Symbol
              </SortableHeader>
              <SortableHeader field="price" className="text-right justify-end">Price</SortableHeader>
              <SortableHeader field="changePercent" className="text-right justify-end">Change</SortableHeader>
              <SortableHeader field="week52Position" className="text-center justify-center min-w-[180px]">52W Range</SortableHeader>
              <SortableHeader field="trailingPE" className="text-right justify-end">P/E</SortableHeader>
              <SortableHeader field="forwardPE" className="text-center justify-center min-w-[140px]">Fwd P/E</SortableHeader>
              <SortableHeader field="eps" className="text-right justify-end">EPS</SortableHeader>
              <SortableHeader field="debtToEquity" className="text-right justify-end">D/E</SortableHeader>
              <SortableHeader field="marketCap" className="text-right justify-end">Mkt Cap</SortableHeader>
              {!groupBySector && (
                <th className="p-3 font-medium text-sm text-left whitespace-nowrap min-w-[100px]">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Sector
                  </span>
                </th>
              )}
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {groupBySector && groupedStocks
              ? groupedStocks.map(({ sector, stocks: groupStocks }) => {
                  const isCollapsed = collapsedSectors.has(sector);
                  const avgChange =
                    groupStocks.reduce((s, st) => s + st.changePercent, 0) / groupStocks.length;
                  const totalMktCap = groupStocks.reduce(
                    (s, st) => s + (st.marketCap ?? 0),
                    0
                  );

                  return (
                    <SectorGroupRows
                      key={sector}
                      sector={sector}
                      stockCount={groupStocks.length}
                      avgChange={avgChange}
                      totalMktCap={totalMktCap}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleSectorCollapse(sector)}
                      colCount={colCount}
                    >
                      {!isCollapsed &&
                        groupStocks.map((stock) => (
                          <StockListRow
                            key={stock.symbol}
                            stock={stock}
                            onRemove={onRemove}
                            onSelect={onSelect}
                            peRange={peRange}
                            showSector={false}
                            sectorAssignments={sectorAssignments}
                            sectors={sectors}
                            onSectorChange={onSectorChange}
                          />
                        ))}
                    </SectorGroupRows>
                  );
                })
              : sortedStocks.map((stock) => (
                  <StockListRow
                    key={stock.symbol}
                    stock={stock}
                    onRemove={onRemove}
                    onSelect={onSelect}
                    peRange={peRange}
                    showSector={true}
                    sectorAssignments={sectorAssignments}
                    sectors={sectors}
                    onSectorChange={onSectorChange}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-4">
        <span><strong>P/E:</strong> Trailing Price-to-Earnings (last 12 months)</span>
        <span><strong>Fwd P/E:</strong> Forward Price-to-Earnings (range bar from your watchlist)</span>
        <span><strong>EPS:</strong> Earnings Per Share</span>
        <span><strong>D/E:</strong> Debt-to-Equity Ratio</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Sector group header ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function SectorGroupRows({
  sector,
  stockCount,
  avgChange,
  totalMktCap,
  isCollapsed,
  onToggle,
  colCount,
  children,
}: {
  sector: string;
  stockCount: number;
  avgChange: number;
  totalMktCap: number;
  isCollapsed: boolean;
  onToggle: () => void;
  colCount: number;
  children: React.ReactNode;
}) {
  const isPositive = avgChange >= 0;

  return (
    <>
      <tr
        className="bg-muted/60 hover:bg-muted/80 cursor-pointer transition-colors border-t"
        onClick={onToggle}
      >
        <td colSpan={colCount} className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                !isCollapsed && "rotate-90"
              )}
            />
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full flex-shrink-0",
                getSectorDotColor(sector)
              )}
            />
            <span className="font-semibold text-sm">{sector}</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {stockCount} stock{stockCount !== 1 ? "s" : ""}
            </span>
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-1 ml-auto",
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              Avg {isPositive ? "+" : ""}
              {avgChange.toFixed(2)}%
            </span>
            {totalMktCap > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatMarketCap(totalMktCap)} total
              </span>
            )}
          </div>
        </td>
      </tr>
      {children}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Stock row ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface PERange {
  min: number;
  max: number;
}

function StockListRow({
  stock,
  onRemove,
  onSelect,
  peRange,
  showSector,
  sectorAssignments,
  sectors,
  onSectorChange,
}: {
  stock: StockFundamentals;
  onRemove: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
  peRange: PERange | null;
  showSector: boolean;
  sectorAssignments?: Record<string, string>;
  sectors?: string[];
  onSectorChange?: (symbol: string, sector: string) => void;
}) {
  const isPositive = stock.change >= 0;
  const week52Position = calculateWeek52Position(stock);
  const currentSector = sectorAssignments?.[stock.symbol] || "Other";

  return (
    <tr
      className="border-t hover:bg-muted/30 transition-colors group cursor-pointer"
      onClick={() => onSelect?.(stock.symbol)}
    >
      <td className="p-3">
        <div>
          <span className="font-semibold">{stock.symbol}</span>
          {stock.name && (
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {stock.name}
            </p>
          )}
        </div>
      </td>
      <td className="p-3 text-right font-medium">${stock.price.toFixed(2)}</td>
      <td className="p-3 text-right">
        <div
          className={cn(
            "flex items-center justify-end gap-1",
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span className="text-sm font-medium">
            {isPositive ? "+" : ""}
            {stock.changePercent.toFixed(2)}%
          </span>
        </div>
      </td>
      <td className="p-3">
        <Week52RangeBar
          low={stock.week52Low}
          high={stock.week52High}
          current={stock.price}
          position={week52Position}
        />
      </td>
      <td className="p-3 text-right">
        {stock.trailingPE !== undefined && stock.trailingPE > 0 ? (
          <span className="text-sm">{stock.trailingPE.toFixed(1)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
      <td className="p-3">
        <PERangeBar value={stock.forwardPE} range={peRange} />
      </td>
      <td className="p-3 text-right">
        {stock.eps !== undefined ? (
          <span
            className={cn(
              "text-sm",
              stock.eps >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            ${stock.eps.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
      <td className="p-3 text-right">
        <DebtToEquityIndicator value={stock.debtToEquity} />
      </td>
      <td className="p-3 text-right text-sm">
        {stock.marketCap !== undefined ? formatMarketCap(stock.marketCap) : "—"}
      </td>
      {showSector && (
        <td className="p-3">
          <SectorBadge
            symbol={stock.symbol}
            currentSector={currentSector}
            sectors={sectors || []}
            onSectorChange={onSectorChange}
          />
        </td>
      )}
      <td className="p-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(stock.symbol); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Sector badge with dropdown picker ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function SectorBadge({
  symbol,
  currentSector,
  sectors,
  onSectorChange,
}: {
  symbol: string;
  currentSector: string;
  sectors: string[];
  onSectorChange?: (symbol: string, sector: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "text-xs px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer",
          getSectorColor(currentSector),
          "hover:ring-2 hover:ring-offset-1 hover:ring-primary/30"
        )}
      >
        {currentSector}
      </button>
      {open && sectors.length > 0 && (
        <div className="absolute z-50 mt-1 right-0 w-52 max-h-64 overflow-y-auto bg-popover border rounded-lg shadow-lg py-1">
          {sectors.map((sector) => (
            <button
              key={sector}
              type="button"
              className={cn(
                "w-full text-left text-xs px-3 py-1.5 hover:bg-muted transition-colors flex items-center gap-2",
                sector === currentSector && "font-semibold bg-muted/60"
              )}
              onClick={() => {
                onSectorChange?.(symbol, sector);
                setOpen(false);
              }}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  getSectorDotColor(sector)
                )}
              />
              {sector}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Visual sub-components ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function Week52RangeBar({
  low,
  high,
  current: _current,
  position,
}: {
  low?: number;
  high?: number;
  current: number;
  position: number | null;
}) {
  if (low === undefined || high === undefined || position === null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const getPositionColor = (pos: number) => {
    if (pos >= 70) return "bg-green-500";
    if (pos >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <span className="text-xs text-muted-foreground w-14 text-right">
        ${low.toFixed(0)}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full relative">
        <div
          className={cn(
            "absolute h-3 w-3 rounded-full -top-0.5 border-2 border-background",
            getPositionColor(position)
          )}
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-14">
        ${high.toFixed(0)}
      </span>
    </div>
  );
}

function PERangeBar({
  value,
  range,
}: {
  value?: number;
  range: PERange | null;
}) {
  if (value === undefined || value <= 0 || !range) {
    return (
      <span className="text-muted-foreground text-sm text-center block">—</span>
    );
  }
  const { min, max } = range;
  let position = 50;
  if (max !== min) {
    position = ((value - min) / (max - min)) * 100;
    position = Math.max(0, Math.min(100, position));
  }
  const getPositionColor = (pos: number) => {
    if (pos <= 30) return "bg-green-500";
    if (pos <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className="text-xs text-muted-foreground w-10 text-right">
        {min.toFixed(0)}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full relative">
        <div
          className={cn(
            "absolute h-3 w-3 rounded-full -top-0.5 border-2 border-background",
            getPositionColor(position)
          )}
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-10">
        {max.toFixed(0)}
      </span>
    </div>
  );
}

function DebtToEquityIndicator({ value }: { value?: number }) {
  if (value === undefined || value < 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const getColor = (de: number) => {
    if (de < 0.5) return "text-green-600 dark:text-green-400";
    if (de < 1) return "text-yellow-600 dark:text-yellow-400";
    if (de < 2) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };
  return (
    <span className={cn("text-sm font-medium", getColor(value))}>
      {value.toFixed(2)}
    </span>
  );
}
