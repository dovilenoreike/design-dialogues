import type { SupabaseMaterial } from "@/hooks/useGraphMaterials";

export const GRID_LIGHTNESS_STEP = 15;
export const GRID_WARMTH_STEP    = 0.07;

export interface GridCell {
  col: 0 | 1 | 2;  // 0 = cooler, 1 = similar warmth, 2 = warmer
  row: 0 | 1 | 2;  // 0 = lighter, 1 = similar lightness, 2 = darker
  material: SupabaseMaterial | null;
}

/**
 * Build a 3×3 warmth × lightness grid relative to a center material.
 * Returns 9 cells in row-major order (row 0..2, col 0..2).
 * The center cell (row=1, col=1) is always the center material itself.
 * Each non-center cell gets the best-ranked material in its warmth × lightness zone.
 * Any cell whose zone has no natural match is filled with the next best unassigned
 * material from the pool so the grid is never visually sparse.
 *
 * @param center  The material to place at the grid center.
 * @param pool    Candidates — same archetypeId + role, with imageUrl. Should exclude center.
 * @param rankedCodes  Output of getAllRankedCodes (best-first). Used to pick within each zone.
 */
export function buildMaterialGrid(
  center: SupabaseMaterial,
  pool: SupabaseMaterial[],
  rankedCodes: string[],
): GridCell[] {
  const rankIndex = new Map(rankedCodes.map((c, i) => [c, i]));
  const cells: GridCell[] = [];
  const assigned = new Set<string>([center.technicalCode]);

  // Pass 1: fill each cell with the best material in its natural zone.
  for (let row = 0; row <= 2; row++) {
    for (let col = 0; col <= 2; col++) {
      const r = row as 0 | 1 | 2;
      const c = col as 0 | 1 | 2;

      if (r === 1 && c === 1) {
        cells.push({ row: r, col: c, material: center });
        continue;
      }

      const candidates = pool.filter(m => {
        if (assigned.has(m.technicalCode)) return false;
        const lDiff = m.lightness - center.lightness;
        const wDiff = (m.warmth ?? 0) - (center.warmth ?? 0);

        const lighter = lDiff >  GRID_LIGHTNESS_STEP;
        const darker  = lDiff < -GRID_LIGHTNESS_STEP;
        const cooler  = wDiff < -GRID_WARMTH_STEP;
        const warmer  = wDiff >  GRID_WARMTH_STEP;

        const rowMatch = r === 0 ? lighter : r === 2 ? darker  : (!lighter && !darker);
        const colMatch = c === 0 ? cooler  : c === 2 ? warmer  : (!cooler  && !warmer);

        return rowMatch && colMatch;
      });

      const ranked = candidates
        .filter(m => rankIndex.has(m.technicalCode))
        .sort((a, b) => rankIndex.get(a.technicalCode)! - rankIndex.get(b.technicalCode)!);

      const best = ranked[0] ?? candidates[0] ?? null;
      if (best) assigned.add(best.technicalCode);
      cells.push({ row: r, col: c, material: best });
    }
  }

  // Pass 2: fill remaining null cells without violating lightness direction.
  // A material darker than center must never land in row 0 (lighter).
  // A material lighter than center must never land in row 2 (darker).
  // Within the allowed rows, prefer the cell closest to the material's natural position.
  const overflow = pool
    .filter(m => !assigned.has(m.technicalCode))
    .sort((a, b) => (rankIndex.get(a.technicalCode) ?? Infinity) - (rankIndex.get(b.technicalCode) ?? Infinity));

  for (const m of overflow) {
    if (!cells.some(c => c.material === null)) break;

    const lDiff = m.lightness - center.lightness;
    const wDiff = (m.warmth ?? 0) - (center.warmth ?? 0);
    const softRow: 0 | 1 | 2 = lDiff > 0 ? 0 : lDiff < 0 ? 2 : 1;
    const softCol: 0 | 1 | 2 = wDiff < -0.02 ? 0 : wDiff > 0.02 ? 2 : 1;

    // Hard constraint: lighter materials stay in rows 0–1, darker in rows 1–2.
    const allowedRows: ReadonlySet<number> =
      softRow === 0 ? new Set([0, 1]) :
      softRow === 2 ? new Set([2, 1]) :
      new Set([0, 1, 2]);

    let best: GridCell | null = null;
    let bestScore = Infinity;

    for (const cell of cells) {
      if (cell.material !== null || !allowedRows.has(cell.row)) continue;
      // Row distance weighted heavily so direction is never sacrificed for warmth fit.
      const score = Math.abs(cell.row - softRow) * 10 + Math.abs(cell.col - softCol);
      if (score < bestScore) { bestScore = score; best = cell; }
    }

    if (best) best.material = m;
  }

  return cells;
}
