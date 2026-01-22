import type { ServiceSelection } from "./calculator";

/**
 * Timeline phase definition
 */
export interface TimelinePhase {
  id: string;
  title: string;
  weekStart: number;
  weekEnd: number;
  startDate: Date;
  endDate: Date;
  dateRange: string;
  siteStatus: string;
  tasks: TimelineTask[];
}

/**
 * Timeline task definition
 */
export interface TimelineTask {
  id: string;
  label: string;
  isCritical?: boolean;
  buttonVariant: "solid" | "outline";
  requiresService?: keyof ServiceSelection;
  isHireTask?: boolean;
}

/**
 * Timeline calculation result
 */
export interface TimelineCalculation {
  totalWeeks: number;
  startDate: Date;
  endDate: Date;
  phases: TimelinePhase[];
}

/**
 * Tier-based duration configuration
 */
export interface TierDurationConfig {
  totalWeeks: number;
  phases: {
    phase1Weeks: number;
    phase2Weeks: number;
    phase3Weeks: number;
    phase4Weeks: number;
    phase5Weeks: number;
  };
}
