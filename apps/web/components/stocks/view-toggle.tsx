"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button, cn } from "@mysuperapp/ui";

export type ViewMode = "tile" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3",
          view === "tile" && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange("tile")}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Tiles</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3",
          view === "list" && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange("list")}
      >
        <List className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">List</span>
      </Button>
    </div>
  );
}
