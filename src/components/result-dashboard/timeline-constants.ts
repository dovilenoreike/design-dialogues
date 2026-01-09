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
      phase2Weeks: 1,
      phase3Weeks: 3,
      phase4Weeks: 2,
      phase5Weeks: 2
    },
  },
  Standard: {
    totalWeeks: 15,
    phases: {
      phase1Weeks: 3,
      phase2Weeks: 2,
      phase3Weeks: 4,
      phase4Weeks: 3,
      phase5Weeks: 3
    },
  },
  Premium: {
    totalWeeks: 24,
    phases: {
      phase1Weeks: 4,
      phase2Weeks: 3,
      phase3Weeks: 6,
      phase4Weeks: 6,
      phase5Weeks: 5
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
    tasks: ["hire-designer", "approve-concept", "approve-technical"],
  },
  phase2: {
    id: "phase-2",
    titleKey: "timeline.phases.logistics.title",
    siteStatusKey: "timeline.phases.logistics.site",
    tasks: ["hire-contractor", "order-tiles-plumbing"],
  },
  phase3: {
    id: "phase-3",
    titleKey: "timeline.phases.infrastructure.title",
    siteStatusKey: "timeline.phases.infrastructure.site",
    tasks: ["order-doors", "order-kitchen-joinery", "socket-walkthrough"],
  },
  phase4: {
    id: "phase-4",
    titleKey: "timeline.phases.finishes.title",
    siteStatusKey: "timeline.phases.finishes.site",
    tasks: ["order-flooring", "buy-lighting", "schedule-cleaners"],
  },
  phase5: {
    id: "phase-5",
    titleKey: "timeline.phases.assembly.title",
    siteStatusKey: "timeline.phases.assembly.site",
    tasks: ["order-sofa-curtains", "defect-check"],
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

  // Phase 1: Vision
  "hire-designer": {
    id: "hire-designer",
    buttonVariant: "solid",
    requiresService: "spacePlanning",
  },
  "approve-concept": {
    id: "approve-concept",
    buttonVariant: "outline"
  },
  "approve-technical": {
    id: "approve-technical",
    buttonVariant: "outline",
  },

  // Phase 2: Logistics
  "hire-contractor": {
    id: "hire-contractor",
    buttonVariant: "solid",
  },
  "order-tiles-plumbing": {
    id: "order-tiles-plumbing",
    buttonVariant: "outline"
  },

  // Phase 3: Infrastructure
  "order-doors": {
    id: "order-doors",
    buttonVariant: "solid"
  },
  "order-kitchen-joinery": {
    id: "order-kitchen-joinery",
    buttonVariant: "solid",
    requiresService: "interiorFinishes",
  },
  "socket-walkthrough": {
    id: "socket-walkthrough",
    buttonVariant: "outline",
  },

  // Phase 4: Finishes
  "order-flooring": {
    id: "order-flooring",
    buttonVariant: "outline"
  },
  "buy-lighting": {
    id: "buy-lighting",
    buttonVariant: "outline"
  },
  "schedule-cleaners": {
    id: "schedule-cleaners",
    buttonVariant: "outline"
  },

  // Phase 5: Assembly
  "order-sofa-curtains": {
    id: "order-sofa-curtains",
    buttonVariant: "outline",
    requiresService: "furnishingDecor",
  },
  "defect-check": {
    id: "defect-check",
    buttonVariant: "outline",
    isCritical: true,
  },
};
