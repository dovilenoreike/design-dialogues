import { addWeeks, format, startOfDay, subDays, subWeeks } from "date-fns";
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
  options?: {
    startDate?: Date;      // For forward calculation (from start date)
    moveInDate?: Date;     // For backward calculation (from move-in date)
  }
): TimelineCalculation {
  const config = TIER_DURATIONS[tier];
  const phases: TimelinePhase[] = [];
  let currentWeek = 1;

  // Calculate total weeks including renovation if needed
  const totalWeeks = isRenovation
    ? config.totalWeeks + RENOVATION_PREP_WEEKS
    : config.totalWeeks;

  // Determine start date based on calculation direction
  let normalizedStart: Date;
  if (options?.moveInDate) {
    // Backward calculation: subtract total weeks from move-in date
    normalizedStart = startOfDay(subWeeks(options.moveInDate, totalWeeks));
  } else if (options?.startDate) {
    // Forward calculation: use provided start date
    normalizedStart = startOfDay(options.startDate);
  } else {
    // Default: forward calculation from today
    normalizedStart = startOfDay(new Date());
  }

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
  currentWeek += config.phases.phase4Weeks;

  // Phase 5: Assembly
  phases.push(
    createPhase(
      PHASE_TEMPLATES.phase5,
      currentWeek,
      currentWeek + config.phases.phase5Weeks - 1,
      normalizedStart,
      services,
      t
    )
  );

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

/**
 * Calculate phase states based on current date
 * Returns isActive (current phase) and isUrgent (3 days before or overdue)
 */
export function calculatePhaseStates(
  phases: TimelinePhase[],
  timelineStartDate: Date,
  today: Date = new Date()
): Map<string, { isActive: boolean; isUrgent: boolean }> {
  const stateMap = new Map();
  const normalizedToday = startOfDay(today);

  phases.forEach(phase => {
    const phaseStartDate = addWeeks(timelineStartDate, phase.weekStart - 1);
    const phaseEndDate = addWeeks(timelineStartDate, phase.weekEnd);
    const urgentThreshold = subDays(phaseEndDate, 3); // 3 days before end

    const isActive = normalizedToday >= phaseStartDate && normalizedToday <= phaseEndDate;
    const isUrgent = normalizedToday >= urgentThreshold; // Within 3 days or past end

    stateMap.set(phase.id, { isActive, isUrgent });
  });

  return stateMap;
}
