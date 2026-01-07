import type { Tier } from "@/config/tiers";
import type { TierDurationConfig, TimelineTask } from "@/types/timeline";

/**
 * Tier-based duration configurations
 * Proportions: 20% / 20% / 30% / 30% across all tiers
 */
export const TIER_DURATIONS: Record<Tier, TierDurationConfig> = {
  Budget: {
    totalWeeks: 10,
    phases: {
      phase1Weeks: 2,
      phase2Weeks: 2,
      phase3Weeks: 3,
      phase4Weeks: 3
    },
  },
  Standard: {
    totalWeeks: 14,
    phases: {
      phase1Weeks: 3,
      phase2Weeks: 3,
      phase3Weeks: 4,
      phase4Weeks: 4
    },
  },
  Premium: {
    totalWeeks: 24,
    phases: {
      phase1Weeks: 5,
      phase2Weeks: 5,
      phase3Weeks: 7,
      phase4Weeks: 7
    },
  },
};

/**
 * Renovation prep phase duration (Phase 0)
 */
export const RENOVATION_PREP_WEEKS = 2;

/**
 * Base phase templates with i18n keys
 */
export const PHASE_TEMPLATES = {
  renovation: {
    id: "phase-0",
    titleKey: "timeline.phases.prep.title",
    siteStatusKey: "timeline.phases.prep.site",
    tasks: ["apply-permits", "asbestos-test", "demo-plan"],
  },
  phase1: {
    id: "phase-1",
    titleKey: "timeline.phases.vision.title",
    siteStatusKey: "timeline.phases.vision.site",
    tasks: ["hire-designer", "approve-budget"],
  },
  phase2: {
    id: "phase-2",
    titleKey: "timeline.phases.logistics.title",
    siteStatusKey: "timeline.phases.logistics.site",
    tasks: ["hire-contractor", "order-tiles"],
  },
  phase3: {
    id: "phase-3",
    titleKey: "timeline.phases.rough.title",
    siteStatusKey: "timeline.phases.rough.site",
    tasks: ["order-doors", "order-kitchen"],
  },
  phase4: {
    id: "phase-4",
    titleKey: "timeline.phases.finishes.title",
    siteStatusKey: "timeline.phases.finishes.site",
    tasks: ["hire-carpenter", "book-cleaning"],
  },
};

/**
 * Task definitions with metadata
 */
export const TASK_DEFINITIONS: Record<string, Omit<TimelineTask, "label">> = {
  // Phase 0 (Renovation)
  "apply-permits": {
    id: "apply-permits",
    buttonVariant: "outline"
  },
  "asbestos-test": {
    id: "asbestos-test",
    buttonVariant: "outline"
  },
  "demo-plan": {
    id: "demo-plan",
    buttonVariant: "solid"
  },

  // Phase 1
  "hire-designer": {
    id: "hire-designer",
    buttonVariant: "solid",
    requiresService: "spacePlanning",
  },
  "approve-budget": {
    id: "approve-budget",
    buttonVariant: "outline"
  },

  // Phase 2
  "hire-contractor": {
    id: "hire-contractor",
    buttonVariant: "solid",
    isCritical: true,
  },
  "order-tiles": {
    id: "order-tiles",
    buttonVariant: "outline"
  },

  // Phase 3
  "order-doors": {
    id: "order-doors",
    buttonVariant: "outline"
  },
  "order-kitchen": {
    id: "order-kitchen",
    buttonVariant: "solid"
  },

  // Phase 4
  "hire-carpenter": {
    id: "hire-carpenter",
    buttonVariant: "outline",
    requiresService: "interiorFinishes",
  },
  "book-cleaning": {
    id: "book-cleaning",
    buttonVariant: "solid"
  },
};
