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
 *
 * Each non-center cell has an ideal (L, W) target offset from center.
 * Materials are assigned by normalized distance to each cell's ideal target —
 * rank (from rankedCodes) is the tiebreaker only. This keeps grid positions
 * driven by lightness/warmth geometry even when pair-score boosts change rank.
 *
 * Hard direction constraint preserved:
 *   lighter material (lDiff > 0) → rows 0 or 1 only
 *   darker  material (lDiff < 0) → rows 1 or 2 only
 *
 * @param center      The material to place at the grid center.
 * @param pool        Candidates — same archetypeId + role, with imageUrl. Should exclude center.
 * @param rankedCodes Output of getAllRankedCodes (best-first). Used as tiebreaker.
 */
export function buildMaterialGrid(
  center: SupabaseMaterial,
  pool: SupabaseMaterial[],
  rankedCodes: string[],
): GridCell[] {
  const rankIndex = new Map(rankedCodes.map((c, i) => [c, i]));
  const cells: (SupabaseMaterial | null)[] = Array(9).fill(null);
  cells[4] = center; // (row=1, col=1)

  // Ideal L/W offsets from center for each row/col
  const idealLDiff = [+GRID_LIGHTNESS_STEP, 0, -GRID_LIGHTNESS_STEP]; // row 0=lighter, 2=darker
  const idealWDiff = [-GRID_WARMTH_STEP,    0, +GRID_WARMTH_STEP];    // col 0=cooler, 2=warmer

  type Pair = { mIdx: number; cellKey: number; dist: number };
  const pairs: Pair[] = [];

  for (let mIdx = 0; mIdx < pool.length; mIdx++) {
    const m = pool[mIdx];
    const lDiff = m.lightness - center.lightness;
    const wDiff = (m.warmth ?? 0) - (center.warmth ?? 0);

    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= 2; col++) {
        if (row === 1 && col === 1) continue;
        if (lDiff > 0 && row === 2) continue; // lighter → not darker row
        if (lDiff < 0 && row === 0) continue; // darker  → not lighter row

        const dL = (lDiff - idealLDiff[row]) / GRID_LIGHTNESS_STEP;
        const dW = (wDiff - idealWDiff[col]) / GRID_WARMTH_STEP;
        pairs.push({ mIdx, cellKey: row * 3 + col, dist: dL * dL + dW * dW });
      }
    }
  }

  // Primary: smallest distance. Tiebreaker: best rank.
  pairs.sort((a, b) => {
    const dd = a.dist - b.dist;
    if (Math.abs(dd) > 1e-9) return dd;
    return (rankIndex.get(pool[a.mIdx].technicalCode) ?? Infinity)
         - (rankIndex.get(pool[b.mIdx].technicalCode) ?? Infinity);
  });

  const usedMaterials = new Set<number>();
  const usedCells     = new Set<number>([4]);

  for (const { mIdx, cellKey } of pairs) {
    if (usedMaterials.has(mIdx) || usedCells.has(cellKey)) continue;
    cells[cellKey] = pool[mIdx];
    usedMaterials.add(mIdx);
    usedCells.add(cellKey);
  }

  const result: GridCell[] = [];
  for (let row = 0; row <= 2; row++)
    for (let col = 0; col <= 2; col++)
      result.push({ row: row as 0|1|2, col: col as 0|1|2, material: cells[row * 3 + col] });
  return result;
}
