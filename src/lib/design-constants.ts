/**
 * Design System Constants
 * Central source of truth for colors, thresholds, and formulas
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  /** Success/positive state - used for pass, good scores */
  green: "#647d75",
  /** Warning state - used for medium scores, optimization needed */
  yellow: "#CA8A04",
  /** Error/negative state - used for fail, poor scores */
  red: "#9A3412",
} as const;

// Tailwind-compatible class names
export const colorClasses = {
  green: {
    text: "text-[#647d75]",
    bg: "bg-[#647d75]",
    bgLight: "bg-[#647d75]/10",
    border: "border-[#647d75]",
  },
  yellow: {
    text: "text-[#CA8A04]",
    bg: "bg-[#CA8A04]",
    bgLight: "bg-[#CA8A04]/10",
    border: "border-[#CA8A04]",
  },
  red: {
    text: "text-[#9A3412]",
    bg: "bg-[#9A3412]",
    bgLight: "bg-[#9A3412]/10",
    border: "border-[#9A3412]",
  },
} as const;

// =============================================================================
// AUDIT SCORE THRESHOLDS
// =============================================================================

export const auditThresholds = {
  /** Score >= this is GREEN (good) */
  green: 80,
  /** Score >= this is YELLOW/AMBER (needs optimization) */
  yellow: 50,
  /** Score < yellow threshold is RED (needs attention) */
} as const;

/**
 * Determine score level based on thresholds
 * @param score - The score value (0-100)
 * @returns "green" | "yellow" | "red"
 */
export const getScoreLevel = (score: number): "green" | "yellow" | "red" => {
  if (score >= auditThresholds.green) return "green";
  if (score >= auditThresholds.yellow) return "yellow";
  return "red";
};

/**
 * Get color class for a score
 * @param score - The score value (0-100) or null
 * @returns Tailwind text color class
 */
export const getScoreColorClass = (score: number | null): string => {
  if (score === null) return "text-muted-foreground";
  return colorClasses[getScoreLevel(score)].text;
};

// =============================================================================
// AUDIT SCORE FORMULAS
// =============================================================================

/**
 * AUDIT SCORE CALCULATION
 *
 * Formula: score = (pass / (pass + fail)) × 100
 *
 * - Only "pass" and "fail" responses count toward the score
 * - "unknown" and "na" (not applicable) are EXCLUDED from calculation
 * - Score ranges from 0-100
 * - Returns null if no pass/fail responses exist
 *
 * Example:
 *   3 pass, 1 fail, 2 unknown, 1 na
 *   score = (3 / (3 + 1)) × 100 = 75
 */
export const calculateScore = (pass: number, fail: number): number | null => {
  const total = pass + fail;
  if (total === 0) return null;
  return Math.round((pass / total) * 100);
};

// =============================================================================
// ERGONOMIC STANDARDS (Audit Item Calculations)
// =============================================================================

export const ergonomicStandards = {
  /** Wardrobe length per person in meters */
  wardrobeLengthPerPerson: 0.4,
  /** Dining table perimeter per person in meters */
  diningPerimeterPerPerson: 0.6,
  /** Sofa seating length per person in meters */
  sofaLengthPerPerson: 0.6,
  /** Minimum master bedroom wardrobe length in meters */
  minMasterWardrobeLength: 1.8,
  /** Minimum utility storage dimensions in cm */
  minUtilityStorage: { width: 60, depth: 60 },
  /** Minimum chair clearance behind dining chairs in cm */
  minChairClearance: 80,
  /** Maximum work triangle total distance in meters */
  maxWorkTriangle: 6,
  /** Minimum kitchen prep zone width in cm */
  minPrepZoneWidth: 60,
  /** Minimum kitchen aisle width in cm */
  minAisleWidth: 90,
  /** Minimum fridge-to-oven distance in cm */
  minFridgeOvenDistance: 15,
  /** Minimum bed access width on each side in cm */
  minBedAccessWidth: 50,
  /** Minimum toilet side clearance in cm */
  minToiletClearance: 15,
  /** Maximum people per bathroom */
  maxPeoplePerBathroom: 3,
  /** Maximum distance from sofa to outlet in meters */
  maxSofaOutletDistance: 1.5,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  /** Large score display */
  scoreDisplay: "text-5xl font-serif font-bold tabular-nums leading-none",
  /** Small caps label */
  smallCapsLabel: "text-[10px] uppercase tracking-[0.15em] font-bold",
} as const;
