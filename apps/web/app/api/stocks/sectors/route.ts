import { type NextRequest, NextResponse } from "next/server";
import {
  loadSectorAssignments,
  assignSector,
  SECTORS,
} from "@/lib/sectors";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/** GET /api/stocks/sectors – return all sector assignments + the list of sectors */
export async function GET() {
  try {
    const assignments = loadSectorAssignments();
    return NextResponse.json({ assignments, sectors: [...SECTORS] }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Failed to load sector assignments:", error);
    return NextResponse.json(
      { error: "Failed to load sector assignments" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

/** PUT /api/stocks/sectors – update a single symbol's sector */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, sector } = body as { symbol: string; sector: string };

    if (!symbol || !sector) {
      return NextResponse.json(
        { error: "Both symbol and sector are required" },
        { status: 400 }
      );
    }

    const updated = assignSector(symbol, sector);
    return NextResponse.json({ success: true, assignments: updated });
  } catch (error) {
    console.error("Failed to update sector:", error);
    return NextResponse.json(
      { error: "Failed to update sector" },
      { status: 500 }
    );
  }
}
