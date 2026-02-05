/**
 * Layout Audit Rules - professional ergonomic evaluation items
 * Organized into 8 categories
 * Formulas based on docs/ergonomic-standards.md
 */

import type { AuditCategory, AuditVariables, AuditResponse } from '@/types/layout-audit';

// ============================================================================
// CALCULATION FUNCTIONS (aligned with ergonomic-standards.md)
// ============================================================================

/**
 * Entrance wardrobe length (Formula #5)
 * Rule: 0.6m/adult + 0.4m/child + 0.6m seasonal buffer
 */
export const calculateEntranceWardrobe = (adults: number, children: number): string => {
  const length = adults * 0.6 + children * 0.4 + 0.6;
  return length.toFixed(1);
};

/**
 * Master bedroom wardrobe length (Formula #6)
 * Rule: 1.8m for 1 adult, 2.4m for 2 adults
 */
export const calculateMasterWardrobe = (adults: number): string => {
  return adults >= 2 ? "2.4" : "1.8";
};

/**
 * Kids wardrobe length (Formula #7)
 * Rule: 0.8m/child + 0.4m shared buffer
 */
export const calculateKidsWardrobe = (children: number): string => {
  const length = children * 0.8 + 0.4;
  return length.toFixed(1);
};

/**
 * General storage / utility wardrobe (Formula #8)
 * Rule: 1.0m base + 0.4m/person
 */
export const calculateGeneralStorage = (people: number): string => {
  const length = 1.0 + people * 0.4;
  return length.toFixed(1);
};

/**
 * Total storage wardrobe length (Combined Formula)
 * Sum of: Entrance + Master Bedroom + Kids (if any) + General Storage
 */
export const calculateTotalStorage = (adults: number, children: number): string => {
  const people = adults + children;

  // Entrance: 0.6m/adult + 0.4m/child + 0.6m buffer
  const entrance = adults * 0.6 + children * 0.4 + 0.6;

  // Master bedroom: 1.8m for 1 adult, 2.4m for 2+ adults
  const masterBedroom = adults >= 2 ? 2.4 : 1.8;

  // Kids: 0.8m/child + 0.4m buffer (only if children > 0)
  const kids = children > 0 ? children * 0.8 + 0.4 : 0;

  // General storage: 1.0m base + 0.4m/person
  const general = 1.0 + people * 0.4;

  const total = entrance + masterBedroom + kids + general;
  return total.toFixed(1);
};

/**
 * Get breakdown of storage components
 */
export const getStorageBreakdown = (adults: number, children: number): {
  entrance: number;
  masterBedroom: number;
  kids: number;
  general: number;
  total: number;
} => {
  const people = adults + children;

  const entrance = adults * 0.6 + children * 0.4 + 0.6;
  const masterBedroom = adults >= 2 ? 2.4 : 1.8;
  const kids = children > 0 ? children * 0.8 + 0.4 : 0;
  const general = 1.0 + people * 0.4;

  return {
    entrance: parseFloat(entrance.toFixed(1)),
    masterBedroom: parseFloat(masterBedroom.toFixed(1)),
    kids: parseFloat(kids.toFixed(1)),
    general: parseFloat(general.toFixed(1)),
    total: parseFloat((entrance + masterBedroom + kids + general).toFixed(1)),
  };
};

/**
 * Kitchen linear length (Formula #1)
 * Rule: 3m base + 0.6m per adult + 0.2m per child
 */
export const calculateKitchenLinear = (adults: number, children: number): string => {
  const length = 3 + adults * 0.6 + children * 0.2;
  return length.toFixed(1);
};

/**
 * Tall kitchen storage units (Formula #2)
 * Rule: 1 tall unit per 2 people (rounded up)
 */
export const calculateTallUnits = (people: number): string => {
  return String(Math.ceil(people / 2));
};

/**
 * Dining table seating capacity (Formula #10)
 * Rule: household members + 2 guest seats
 */
export const calculateDiningSeats = (people: number): string => {
  return String(people + 2);
};

/**
 * Living room / sofa seating capacity (Formula #11)
 * Rule: household members + 1 lounging buffer
 */
export const calculateLivingSeats = (people: number): string => {
  return String(people + 1);
};

/**
 * Laundry setup type (Formula #4)
 * Returns the recommended setup type based on household size
 */
export const calculateLaundrySetup = (people: number): 'integrated' | 'niche' | 'room' => {
  if (people <= 3) return 'integrated';
  if (people <= 5) return 'niche';
  return 'room';
};

// Legacy function for backward compatibility
export const calculateWardrobeLength = (numberOfPeople: number): string => {
  // Approximate: assume half adults, half children for legacy calls
  return calculateEntranceWardrobe(Math.ceil(numberOfPeople / 2), Math.floor(numberOfPeople / 2));
};

// Legacy function for backward compatibility
export const calculateDiningPerimeter = (numberOfPeople: number): string => {
  return calculateDiningSeats(numberOfPeople);
};

// Legacy function for backward compatibility
export const calculateSofaLength = (numberOfPeople: number): string => {
  return calculateLivingSeats(numberOfPeople);
};

/**
 * All audit categories with their items
 * Updated to use value-based tier selection for measurable items
 * and Yes/No for boolean items
 */
export const auditCategories: AuditCategory[] = [
  {
    id: 'storage',
    titleKey: 'audit.category.storage.title',
    descriptionKey: 'audit.category.storage.description',
    items: [
      {
        id: 'storage-hallway-wardrobe',
        labelKey: 'audit.label.storage.hallwayWardrobe',
        tooltipKey: 'audit.tooltip.storage.hallwayWardrobe',
        type: 'measurable',
        unit: 'm',
        thresholds: (v: AuditVariables) => {
          const formula = v.numberOfAdults * 0.6 + v.numberOfChildren * 0.4 + 0.6;
          return { minimal: Math.round((formula - 0.8) * 10) / 10, optimal: Math.round((formula - 0.3) * 10) / 10 };
        },
        functionalTags: {
          underbuilt: 'audit.tag.storage.hallwayWardrobe.underbuilt',
          minimal: 'audit.tag.storage.hallwayWardrobe.minimal',
          optimal: 'audit.tag.storage.hallwayWardrobe.optimal',
        },
      },
      {
        id: 'storage-master-wardrobe',
        labelKey: 'audit.label.storage.masterWardrobe',
        tooltipKey: 'audit.tooltip.storage.masterWardrobe',
        type: 'measurable',
        unit: 'm',
        thresholds: (v: AuditVariables) => {
          // For couple: minimal 1.8m, optimal 2.4m
          return v.numberOfAdults >= 2
            ? { minimal: 1.8, optimal: 2.4 }
            : { minimal: 1.2, optimal: 1.8 };
        },
        functionalTags: {
          underbuilt: 'audit.tag.storage.masterWardrobe.underbuilt',
          minimal: 'audit.tag.storage.masterWardrobe.minimal',
          optimal: 'audit.tag.storage.masterWardrobe.optimal',
        },
      },
      {
        id: 'storage-kids-wardrobe',
        labelKey: 'audit.label.storage.kidsWardrobe',
        tooltipKey: 'audit.tooltip.storage.kidsWardrobe',
        type: 'measurable',
        unit: 'm',
        thresholds: (v: AuditVariables) => {
          const formula = v.numberOfChildren * 0.8 + 0.4;
          return { minimal: Math.round((formula - 0.5) * 10) / 10, optimal: Math.round((formula - 0.2) * 10) / 10 };
        },
        functionalTags: {
          underbuilt: 'audit.tag.storage.kidsWardrobe.underbuilt',
          minimal: 'audit.tag.storage.kidsWardrobe.minimal',
          optimal: 'audit.tag.storage.kidsWardrobe.optimal',
        },
        showIf: (v: AuditVariables) => v.numberOfChildren > 0,
      },
      {
        id: 'storage-general',
        labelKey: 'audit.label.storage.general',
        tooltipKey: 'audit.tooltip.storage.general',
        type: 'measurable',
        unit: 'm',
        thresholds: (v: AuditVariables) => {
          const formula = 1.0 + v.numberOfPeople * 0.4;
          return { minimal: Math.round((formula - 0.6) * 10) / 10, optimal: Math.round((formula - 0.2) * 10) / 10 };
        },
        functionalTags: {
          underbuilt: 'audit.tag.storage.general.underbuilt',
          minimal: 'audit.tag.storage.general.minimal',
          optimal: 'audit.tag.storage.general.optimal',
        },
      },
      {
        id: 'storage-entry-drop',
        labelKey: 'audit.label.storage.entryDrop',
        tooltipKey: 'audit.tooltip.storage.entryDrop',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.storage.entryDrop.no',
          yes: 'audit.tag.storage.entryDrop.yes',
        },
      },
    ],
  },
  {
    id: 'social',
    titleKey: 'audit.category.social.title',
    descriptionKey: 'audit.category.social.description',
    items: [
      {
        id: 'social-dining-count',
        labelKey: 'audit.label.social.diningCount',
        tooltipKey: 'audit.tooltip.social.diningCount',
        type: 'measurable',
        unit: 'seats',
        thresholds: (v: AuditVariables) => ({
          minimal: v.numberOfPeople,
          optimal: v.numberOfPeople + 2,
        }),
        functionalTags: {
          underbuilt: 'audit.tag.social.diningCount.underbuilt',
          minimal: 'audit.tag.social.diningCount.minimal',
          optimal: 'audit.tag.social.diningCount.optimal',
        },
      },
      {
        id: 'social-chair-clearance',
        labelKey: 'audit.label.social.chairClearance',
        tooltipKey: 'audit.tooltip.social.chairClearance',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.social.chairClearance.no',
          yes: 'audit.tag.social.chairClearance.yes',
        },
      },
      {
        id: 'social-sofa-capacity',
        labelKey: 'audit.label.social.sofaCapacity',
        tooltipKey: 'audit.tooltip.social.sofaCapacity',
        type: 'measurable',
        unit: 'seats',
        thresholds: (v: AuditVariables) => ({
          minimal: v.numberOfPeople,
          optimal: v.numberOfPeople + 1,
        }),
        functionalTags: {
          underbuilt: 'audit.tag.social.sofaCapacity.underbuilt',
          minimal: 'audit.tag.social.sofaCapacity.minimal',
          optimal: 'audit.tag.social.sofaCapacity.optimal',
        },
      },
      {
        id: 'social-conversation',
        labelKey: 'audit.label.social.conversation',
        tooltipKey: 'audit.tooltip.social.conversation',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.social.conversation.no',
          yes: 'audit.tag.social.conversation.yes',
        },
      },
      {
        id: 'social-traffic-paths',
        labelKey: 'audit.label.social.trafficPaths',
        tooltipKey: 'audit.tooltip.social.trafficPaths',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.social.trafficPaths.no',
          yes: 'audit.tag.social.trafficPaths.yes',
        },
      },
    ],
  },
  {
    id: 'kitchen',
    titleKey: 'audit.category.kitchen.title',
    descriptionKey: 'audit.category.kitchen.description',
    items: [
      {
        id: 'kitchen-linear',
        labelKey: 'audit.label.kitchen.linear',
        tooltipKey: 'audit.tooltip.kitchen.linear',
        type: 'measurable',
        unit: 'm',
        thresholds: (v: AuditVariables) => {
          const formula = 3.0 + v.numberOfAdults * 0.6 + v.numberOfChildren * 0.4;
          return {
            minimal: Math.max(2.4, Math.round((formula - 1.5) * 10) / 10),
            optimal: Math.round((formula - 0.6) * 10) / 10,
          };
        },
        functionalTags: {
          underbuilt: 'audit.tag.kitchen.linear.underbuilt',
          minimal: 'audit.tag.kitchen.linear.minimal',
          optimal: 'audit.tag.kitchen.linear.optimal',
        },
      },
      {
        id: 'kitchen-tall-units',
        labelKey: 'audit.label.kitchen.tallUnits',
        tooltipKey: 'audit.tooltip.kitchen.tallUnits',
        type: 'measurable',
        unit: 'units',
        thresholds: (v: AuditVariables) => {
          const required = Math.ceil(v.numberOfPeople / 2);
          return { minimal: Math.max(1, required - 1), optimal: required };
        },
        functionalTags: {
          underbuilt: 'audit.tag.kitchen.tallUnits.underbuilt',
          minimal: 'audit.tag.kitchen.tallUnits.minimal',
          optimal: 'audit.tag.kitchen.tallUnits.optimal',
        },
      },
      {
        id: 'kitchen-triangle',
        labelKey: 'audit.label.kitchen.triangle',
        tooltipKey: 'audit.tooltip.kitchen.triangle',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.kitchen.triangle.no',
          yes: 'audit.tag.kitchen.triangle.yes',
        },
      },
      {
        id: 'kitchen-prep-zone',
        labelKey: 'audit.label.kitchen.prepZone',
        tooltipKey: 'audit.tooltip.kitchen.prepZone',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.kitchen.prepZone.no',
          yes: 'audit.tag.kitchen.prepZone.yes',
        },
      },
      {
        id: 'kitchen-aisle-width',
        labelKey: 'audit.label.kitchen.aisleWidth',
        tooltipKey: 'audit.tooltip.kitchen.aisleWidth',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.kitchen.aisleWidth.no',
          yes: 'audit.tag.kitchen.aisleWidth.yes',
        },
      },
      {
        id: 'kitchen-dishwasher-trap',
        labelKey: 'audit.label.kitchen.dishwasherTrap',
        tooltipKey: 'audit.tooltip.kitchen.dishwasherTrap',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.kitchen.dishwasherTrap.no',
          yes: 'audit.tag.kitchen.dishwasherTrap.yes',
        },
      },
      {
        id: 'kitchen-fridge-door',
        labelKey: 'audit.label.kitchen.fridgeDoor',
        tooltipKey: 'audit.tooltip.kitchen.fridgeDoor',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.kitchen.fridgeDoor.no',
          yes: 'audit.tag.kitchen.fridgeDoor.yes',
        },
      },
      {
        id: 'kitchen-fridge-oven',
        labelKey: 'audit.label.kitchen.fridgeOven',
        tooltipKey: 'audit.tooltip.kitchen.fridgeOven',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.kitchen.fridgeOven.no',
          yes: 'audit.tag.kitchen.fridgeOven.yes',
        },
      },
    ],
  },
  {
    id: 'bedroom',
    titleKey: 'audit.category.bedroom.title',
    descriptionKey: 'audit.category.bedroom.description',
    items: [
      {
        id: 'bedroom-bed-access',
        labelKey: 'audit.label.bedroom.bedAccess',
        tooltipKey: 'audit.tooltip.bedroom.bedAccess',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bedroom.bedAccess.no',
          yes: 'audit.tag.bedroom.bedAccess.yes',
        },
      },
      {
        id: 'bedroom-nightstands',
        labelKey: 'audit.label.bedroom.nightstands',
        tooltipKey: 'audit.tooltip.bedroom.nightstands',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bedroom.nightstands.no',
          yes: 'audit.tag.bedroom.nightstands.yes',
        },
      },
      {
        id: 'bedroom-door-conflict',
        labelKey: 'audit.label.bedroom.doorConflict',
        tooltipKey: 'audit.tooltip.bedroom.doorConflict',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bedroom.doorConflict.no',
          yes: 'audit.tag.bedroom.doorConflict.yes',
        },
      },
      {
        id: 'bedroom-sightlines',
        labelKey: 'audit.label.bedroom.sightlines',
        tooltipKey: 'audit.tooltip.bedroom.sightlines',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bedroom.sightlines.no',
          yes: 'audit.tag.bedroom.sightlines.yes',
        },
      },
      {
        id: 'bedroom-acoustics',
        labelKey: 'audit.label.bedroom.acoustics',
        tooltipKey: 'audit.tooltip.bedroom.acoustics',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bedroom.acoustics.no',
          yes: 'audit.tag.bedroom.acoustics.yes',
        },
      },
    ],
  },
  {
    id: 'bathroom',
    titleKey: 'audit.category.bathroom.title',
    descriptionKey: 'audit.category.bathroom.description',
    items: [
      {
        id: 'bathroom-door-swing',
        labelKey: 'audit.label.bathroom.doorSwing',
        tooltipKey: 'audit.tooltip.bathroom.doorSwing',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bathroom.doorSwing.no',
          yes: 'audit.tag.bathroom.doorSwing.yes',
        },
      },
      {
        id: 'bathroom-elbow-room',
        labelKey: 'audit.label.bathroom.elbowRoom',
        tooltipKey: 'audit.tooltip.bathroom.elbowRoom',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bathroom.elbowRoom.no',
          yes: 'audit.tag.bathroom.elbowRoom.yes',
        },
      },
      {
        id: 'bathroom-shower-head',
        labelKey: 'audit.label.bathroom.showerHead',
        tooltipKey: 'audit.tooltip.bathroom.showerHead',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.bathroom.showerHead.no',
          yes: 'audit.tag.bathroom.showerHead.yes',
        },
      },
    ],
  },
  {
    id: 'homeOffice',
    titleKey: 'audit.category.homeOffice.title',
    descriptionKey: 'audit.category.homeOffice.description',
    showIf: (v: AuditVariables) => v.workFromHome,
    items: [
      {
        id: 'homeOffice-work-zone',
        labelKey: 'audit.label.homeOffice.workZone',
        tooltipKey: 'audit.tooltip.homeOffice.workZone',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.homeOffice.workZone.no',
          yes: 'audit.tag.homeOffice.workZone.yes',
        },
      },
      {
        id: 'homeOffice-natural-light',
        labelKey: 'audit.label.homeOffice.naturalLight',
        tooltipKey: 'audit.tooltip.homeOffice.naturalLight',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.homeOffice.naturalLight.no',
          yes: 'audit.tag.homeOffice.naturalLight.yes',
        },
      },
    ],
  },
  {
    id: 'power',
    titleKey: 'audit.category.power.title',
    descriptionKey: 'audit.category.power.description',
    items: [
      {
        id: 'power-bed-charging',
        labelKey: 'audit.label.power.bedCharging',
        tooltipKey: 'audit.tooltip.power.bedCharging',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.power.bedCharging.no',
          yes: 'audit.tag.power.bedCharging.yes',
        },
      },
      {
        id: 'power-sofa-power',
        labelKey: 'audit.label.power.sofaPower',
        tooltipKey: 'audit.tooltip.power.sofaPower',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.power.sofaPower.no',
          yes: 'audit.tag.power.sofaPower.yes',
        },
      },
      {
        id: 'power-entry-charging',
        labelKey: 'audit.label.power.entryCharging',
        tooltipKey: 'audit.tooltip.power.entryCharging',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.power.entryCharging.no',
          yes: 'audit.tag.power.entryCharging.yes',
        },
      },
      {
        id: 'power-work-power',
        labelKey: 'audit.label.power.workPower',
        tooltipKey: 'audit.tooltip.power.workPower',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.power.workPower.no',
          yes: 'audit.tag.power.workPower.yes',
        },
      },
      {
        id: 'power-task-lighting',
        labelKey: 'audit.label.power.taskLighting',
        tooltipKey: 'audit.tooltip.power.taskLighting',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.power.taskLighting.no',
          yes: 'audit.tag.power.taskLighting.yes',
        },
      },
    ],
  },
  {
    id: 'doors',
    titleKey: 'audit.category.doors.title',
    descriptionKey: 'audit.category.doors.description',
    items: [
      {
        id: 'doors-door-to-door',
        labelKey: 'audit.label.doors.doorToDoor',
        tooltipKey: 'audit.tooltip.doors.doorToDoor',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.doors.doorToDoor.no',
          yes: 'audit.tag.doors.doorToDoor.yes',
        },
      },
      {
        id: 'doors-appliance-to-person',
        labelKey: 'audit.label.doors.applianceToPerson',
        tooltipKey: 'audit.tooltip.doors.applianceToPerson',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.doors.applianceToPerson.no',
          yes: 'audit.tag.doors.applianceToPerson.yes',
        },
      },
      {
        id: 'doors-appliance-to-appliance',
        labelKey: 'audit.label.doors.applianceToAppliance',
        tooltipKey: 'audit.tooltip.doors.applianceToAppliance',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.doors.applianceToAppliance.no',
          yes: 'audit.tag.doors.applianceToAppliance.yes',
        },
      },
      {
        id: 'doors-circulation-blocking',
        labelKey: 'audit.label.doors.circulationBlocking',
        tooltipKey: 'audit.tooltip.doors.circulationBlocking',
        type: 'boolean',
        functionalTags: {
          no: 'audit.tag.doors.circulationBlocking.no',
          yes: 'audit.tag.doors.circulationBlocking.yes',
        },
      },
    ],
  },
];

/**
 * Calculate audit score
 * Score = (totalPoints / answeredCount) * 100
 * Points: optimal/yes = 1.0, minimal = 0.8, underbuilt/no = 0
 * Items marked "unknown" or "na" are excluded from calculation
 * Only counts items that are visible based on showIf condition
 */
export const calculateAuditScore = (
  responses: Record<string, AuditResponse>,
  variables?: AuditVariables
): number | null => {
  const validItemIds = getAllItemIds(variables);

  let totalPoints = 0;
  let answeredCount = 0;

  for (const id of validItemIds) {
    const response = responses[id];
    if (response === 'optimal' || response === 'yes') {
      totalPoints += 1.0;
      answeredCount++;
    } else if (response === 'minimal') {
      totalPoints += 0.8;
      answeredCount++;
    } else if (response === 'underbuilt' || response === 'no') {
      totalPoints += 0;
      answeredCount++;
    }
    // unknown and na are not counted
  }

  if (answeredCount === 0) {
    return null; // No score if nothing answered
  }

  return Math.round((totalPoints / answeredCount) * 100);
};

/**
 * Get category stats (pass/fail/unknown counts)
 * Pass = minimal, optimal, yes
 * Fail = underbuilt, no
 * Only counts items that are visible based on showIf condition
 */
export const getCategoryStats = (
  categoryId: string,
  responses: Record<string, AuditResponse>,
  variables?: AuditVariables
): { pass: number; fail: number; unknown: number; na: number; total: number; underbuilt: number; minimal: number; optimal: number; yes: number; no: number } => {
  const category = auditCategories.find((c) => c.id === categoryId);
  if (!category) {
    return { pass: 0, fail: 0, unknown: 0, na: 0, total: 0, underbuilt: 0, minimal: 0, optimal: 0, yes: 0, no: 0 };
  }

  // Filter items based on showIf condition
  const visibleItems = variables
    ? category.items.filter((item) => !item.showIf || item.showIf(variables))
    : category.items;

  const stats = { pass: 0, fail: 0, unknown: 0, na: 0, total: visibleItems.length, underbuilt: 0, minimal: 0, optimal: 0, yes: 0, no: 0 };

  visibleItems.forEach((item) => {
    const response = responses[item.id];
    if (response === 'underbuilt') {
      stats.underbuilt++;
      stats.fail++;
    } else if (response === 'no') {
      stats.no++;
      stats.fail++;
    } else if (response === 'minimal') {
      stats.minimal++;
      stats.pass++;
    } else if (response === 'optimal') {
      stats.optimal++;
      stats.pass++;
    } else if (response === 'yes') {
      stats.yes++;
      stats.pass++;
    } else if (response === 'unknown') {
      stats.unknown++;
    } else if (response === 'na') {
      stats.na++;
    }
  });

  return stats;
};

/**
 * Calculate category score with proper weights
 * optimal/yes = 1.0, minimal = 0.8, underbuilt/no = 0
 */
export const calculateCategoryScore = (
  categoryId: string,
  responses: Record<string, AuditResponse>,
  variables?: AuditVariables
): number | null => {
  const stats = getCategoryStats(categoryId, responses, variables);
  const answered = stats.pass + stats.fail;
  if (answered === 0) return null;
  const points = (stats.optimal + stats.yes) * 1.0 + stats.minimal * 0.8;
  return Math.round((points / answered) * 100);
};

/**
 * Get all item IDs (optionally filtered by showIf conditions on both category and item level)
 */
export const getAllItemIds = (variables?: AuditVariables): string[] => {
  return auditCategories
    .filter((c) => !variables || !c.showIf || c.showIf(variables))
    .flatMap((c) =>
      c.items
        .filter((item) => !variables || !item.showIf || item.showIf(variables))
        .map((i) => i.id)
    );
};

/**
 * Default audit variables
 */
export const defaultAuditVariables: AuditVariables = {
  numberOfAdults: 2,
  numberOfChildren: 0,
  numberOfPeople: 2, // adults + children
  workFromHome: false,
};
