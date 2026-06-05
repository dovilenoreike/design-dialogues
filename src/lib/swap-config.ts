/** Tunable thresholds for the ✨ swap nudge. All values are relative (0–1 ratios or ranks). */
export const SWAP_CONFIG = {
  /** Minimum rank within own direction before nudging (1-based).
   *  rank=5 means at least 4 other candidates must score better before nudging. */
  minRank: 5,

  /** Relative score gap: (bestScore - currentScore) / bestScore must meet this to show nudge. */
  relativeGap: 0.03,

  /** Minimum directionScore for a direction to be considered the material's natural home.
   *  Directions where the placed material scores below this are skipped during detection. */
  minDirectionScore: 0.8,

  /** Browse picks: material claimed no direction (off-grid choice) — use a higher bar. */
  browse: {
    minRank: 6,
    relativeGap: 0.25,
  },
} as const;
