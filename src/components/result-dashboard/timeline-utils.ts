import { addWeeks, format, startOfDay } from "date-fns";
import type { Tier } from "@/config/tiers";
import type { ServiceSelection } from "@/types/calculator";
import type { TimelineCalculation, TimelinePhase, TimelineTask } from "@/types/timeline";
import {
  TIER_DURATIONS,
  RENOVATION_PREP_WEEKS,
  PHASE_TEMPLATES,
  TASK_DEFINITIONS
} from "./timeline-constants";

/**
 * Calculate timeline phases with absolute dates
 */
export function calculateTimeline(
  tier: Tier,
  isRenovation: boolean,
  services: ServiceSelection,
  t: (key: string) => string,
  startDate: Date = new Date()
): TimelineCalculation {
  const config = TIER_DURATIONS[tier];
  const phases: TimelinePhase[] = [];
  let currentWeek = 1;

  const normalizedStart = startOfDay(startDate);

  // Phase 0: Renovation Prep (conditional)
  if (isRenovation) {
    phases.push(
      createPhase(
        PHASE_TEMPLATES.renovation,
        currentWeek,
        currentWeek + RENOVATION_PREP_WEEKS - 1,
        normalizedStart,
        services,
        t
      )
    );
    currentWeek += RENOVATION_PREP_WEEKS;
  }

  // Phase 1: The Vision
  phases.push(
    createPhase(
      PHASE_TEMPLATES.phase1,
      currentWeek,
      currentWeek + config.phases.phase1Weeks - 1,
      normalizedStart,
      services,
      t
    )
  );
  currentWeek += config.phases.phase1Weeks;

  // Phase 2: Logistics
  phases.push(
    createPhase(
      PHASE_TEMPLATES.phase2,
      currentWeek,
      currentWeek + config.phases.phase2Weeks - 1,
      normalizedStart,
      services,
      t
    )
  );
  currentWeek += config.phases.phase2Weeks;

  // Phase 3: Rough Works
  phases.push(
    createPhase(
      PHASE_TEMPLATES.phase3,
      currentWeek,
      currentWeek + config.phases.phase3Weeks - 1,
      normalizedStart,
      services,
      t
    )
  );
  currentWeek += config.phases.phase3Weeks;

  // Phase 4: Finishes
  phases.push(
    createPhase(
      PHASE_TEMPLATES.phase4,
      currentWeek,
      currentWeek + config.phases.phase4Weeks - 1,
      normalizedStart,
      services,
      t
    )
  );

  const totalWeeks = isRenovation
    ? config.totalWeeks + RENOVATION_PREP_WEEKS
    : config.totalWeeks;

  return {
    totalWeeks,
    startDate: normalizedStart,
    endDate: addWeeks(normalizedStart, totalWeeks),
    phases,
  };
}

/**
 * Create a timeline phase with calculated dates
 */
function createPhase(
  template: typeof PHASE_TEMPLATES.phase1,
  weekStart: number,
  weekEnd: number,
  projectStart: Date,
  services: ServiceSelection,
  t: (key: string) => string
): TimelinePhase {
  const startDate = addWeeks(projectStart, weekStart - 1);
  const endDate = addWeeks(projectStart, weekEnd);

  return {
    id: template.id,
    title: t(template.titleKey),
    weekStart,
    weekEnd,
    dateRange: formatDateRange(startDate, endDate),
    siteStatus: t(template.siteStatusKey),
    tasks: template.tasks
      .map(taskId => {
        const taskDef = TASK_DEFINITIONS[taskId];
        // Filter out tasks that require disabled services
        if (taskDef.requiresService && !services[taskDef.requiresService]) {
          return null;
        }
        return {
          ...taskDef,
          label: t(`timeline.tasks.${taskId}`),
        };
      })
      .filter((task): task is TimelineTask => task !== null),
  };
}

/**
 * Format date range (e.g., "Jan 07 - Jan 21")
 */
function formatDateRange(start: Date, end: Date): string {
  return `${format(start, "MMM dd")} - ${format(end, "MMM dd")}`;
}
