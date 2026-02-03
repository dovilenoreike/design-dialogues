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
 * Kitchen linear length (Formula #1)
 * Rule: 3.0m base for 2 people + 0.6m per extra adult + 0.4m per child
 */
export const calculateKitchenLinear = (adults: number, children: number): string => {
  const extraAdults = Math.max(0, adults - 2);
  const length = 3.0 + extraAdults * 0.6 + children * 0.4;
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
 */
export const auditCategories: AuditCategory[] = [
  {
    id: 'storage',
    titleKey: 'audit.category.storage.title',
    descriptionKey: 'audit.category.storage.description',
    items: [
      {
        id: 'storage-hallway-wardrobe',
        questionKey: 'audit.item.storage.hallwayWardrobe',
        tooltipKey: 'audit.tooltip.storage.hallwayWardrobe',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateEntranceWardrobe(v.numberOfAdults, v.numberOfChildren),
      },
      {
        id: 'storage-master-wardrobe',
        questionKey: 'audit.item.storage.masterWardrobe',
        tooltipKey: 'audit.tooltip.storage.masterWardrobe',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateMasterWardrobe(v.numberOfAdults),
      },
      {
        id: 'storage-kids-wardrobe',
        questionKey: 'audit.item.storage.kidsWardrobe',
        tooltipKey: 'audit.tooltip.storage.kidsWardrobe',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateKidsWardrobe(v.numberOfChildren),
        showIf: (v: AuditVariables) => v.numberOfChildren > 0,
      },
      {
        id: 'storage-general',
        questionKey: 'audit.item.storage.general',
        tooltipKey: 'audit.tooltip.storage.general',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateGeneralStorage(v.numberOfPeople),
      },
      {
        id: 'storage-utility',
        questionKey: 'audit.item.storage.utility',
        tooltipKey: 'audit.tooltip.storage.utility',
      },
      {
        id: 'storage-entry-drop',
        questionKey: 'audit.item.storage.entryDrop',
        tooltipKey: 'audit.tooltip.storage.entryDrop',
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
        questionKey: 'audit.item.social.diningCount',
        tooltipKey: 'audit.tooltip.social.diningCount',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateDiningSeats(v.numberOfPeople),
      },
      {
        id: 'social-chair-clearance',
        questionKey: 'audit.item.social.chairClearance',
        tooltipKey: 'audit.tooltip.social.chairClearance',
      },
      {
        id: 'social-sofa-capacity',
        questionKey: 'audit.item.social.sofaCapacity',
        tooltipKey: 'audit.tooltip.social.sofaCapacity',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateLivingSeats(v.numberOfPeople),
      },
      {
        id: 'social-conversation',
        questionKey: 'audit.item.social.conversation',
        tooltipKey: 'audit.tooltip.social.conversation',
      },
      {
        id: 'social-traffic-paths',
        questionKey: 'audit.item.social.trafficPaths',
        tooltipKey: 'audit.tooltip.social.trafficPaths',
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
        questionKey: 'audit.item.kitchen.linear',
        tooltipKey: 'audit.tooltip.kitchen.linear',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateKitchenLinear(v.numberOfAdults, v.numberOfChildren),
      },
      {
        id: 'kitchen-tall-units',
        questionKey: 'audit.item.kitchen.tallUnits',
        tooltipKey: 'audit.tooltip.kitchen.tallUnits',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => calculateTallUnits(v.numberOfPeople),
      },
      {
        id: 'kitchen-triangle',
        questionKey: 'audit.item.kitchen.triangle',
        tooltipKey: 'audit.tooltip.kitchen.triangle',
      },
      {
        id: 'kitchen-prep-zone',
        questionKey: 'audit.item.kitchen.prepZone',
        tooltipKey: 'audit.tooltip.kitchen.prepZone',
      },
      {
        id: 'kitchen-aisle-width',
        questionKey: 'audit.item.kitchen.aisleWidth',
        tooltipKey: 'audit.tooltip.kitchen.aisleWidth',
      },
      {
        id: 'kitchen-dishwasher-trap',
        questionKey: 'audit.item.kitchen.dishwasherTrap',
        tooltipKey: 'audit.tooltip.kitchen.dishwasherTrap',
      },
      {
        id: 'kitchen-fridge-door',
        questionKey: 'audit.item.kitchen.fridgeDoor',
        tooltipKey: 'audit.tooltip.kitchen.fridgeDoor',
      },
      {
        id: 'kitchen-fridge-oven',
        questionKey: 'audit.item.kitchen.fridgeOven',
        tooltipKey: 'audit.tooltip.kitchen.fridgeOven',
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
        questionKey: 'audit.item.bedroom.bedAccess',
        tooltipKey: 'audit.tooltip.bedroom.bedAccess',
      },
      {
        id: 'bedroom-nightstands',
        questionKey: 'audit.item.bedroom.nightstands',
        tooltipKey: 'audit.tooltip.bedroom.nightstands',
      },
      {
        id: 'bedroom-door-conflict',
        questionKey: 'audit.item.bedroom.doorConflict',
        tooltipKey: 'audit.tooltip.bedroom.doorConflict',
      },
      {
        id: 'bedroom-sightlines',
        questionKey: 'audit.item.bedroom.sightlines',
        tooltipKey: 'audit.tooltip.bedroom.sightlines',
      },
      {
        id: 'bedroom-acoustics',
        questionKey: 'audit.item.bedroom.acoustics',
        tooltipKey: 'audit.tooltip.bedroom.acoustics',
      },
    ],
  },
  {
    id: 'bathroom',
    titleKey: 'audit.category.bathroom.title',
    descriptionKey: 'audit.category.bathroom.description',
    items: [
      {
        id: 'bathroom-ratio',
        questionKey: 'audit.item.bathroom.ratio',
        tooltipKey: 'audit.tooltip.bathroom.ratio',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => String(Math.ceil(v.numberOfPeople / 3)),
        showIf: (v: AuditVariables) => v.numberOfPeople > 3,
      },
      {
        id: 'bathroom-laundry',
        questionKey: 'audit.item.bathroom.laundry',
        tooltipKey: 'audit.tooltip.bathroom.laundry',
        variableKey: 'numberOfPeople',
        calculateValue: (v: AuditVariables) => {
          const setup = calculateLaundrySetup(v.numberOfPeople);
          // Return a key that will be translated in the UI
          return setup;
        },
        showIf: (v: AuditVariables) => v.numberOfPeople > 3,
      },
      {
        id: 'bathroom-door-swing',
        questionKey: 'audit.item.bathroom.doorSwing',
        tooltipKey: 'audit.tooltip.bathroom.doorSwing',
      },
      {
        id: 'bathroom-elbow-room',
        questionKey: 'audit.item.bathroom.elbowRoom',
        tooltipKey: 'audit.tooltip.bathroom.elbowRoom',
      },
      {
        id: 'bathroom-shower-head',
        questionKey: 'audit.item.bathroom.showerHead',
        tooltipKey: 'audit.tooltip.bathroom.showerHead',
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
        questionKey: 'audit.item.homeOffice.workZone',
        tooltipKey: 'audit.tooltip.homeOffice.workZone',
      },
      {
        id: 'homeOffice-natural-light',
        questionKey: 'audit.item.homeOffice.naturalLight',
        tooltipKey: 'audit.tooltip.homeOffice.naturalLight',
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
        questionKey: 'audit.item.power.bedCharging',
        tooltipKey: 'audit.tooltip.power.bedCharging',
      },
      {
        id: 'power-sofa-power',
        questionKey: 'audit.item.power.sofaPower',
        tooltipKey: 'audit.tooltip.power.sofaPower',
      },
      {
        id: 'power-entry-charging',
        questionKey: 'audit.item.power.entryCharging',
        tooltipKey: 'audit.tooltip.power.entryCharging',
      },
      {
        id: 'power-work-power',
        questionKey: 'audit.item.power.workPower',
        tooltipKey: 'audit.tooltip.power.workPower',
        variableKey: 'workFromHome',
      },
      {
        id: 'power-task-lighting',
        questionKey: 'audit.item.power.taskLighting',
        tooltipKey: 'audit.tooltip.power.taskLighting',
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
        questionKey: 'audit.item.doors.doorToDoor',
        tooltipKey: 'audit.tooltip.doors.doorToDoor',
      },
      {
        id: 'doors-appliance-to-person',
        questionKey: 'audit.item.doors.applianceToPerson',
        tooltipKey: 'audit.tooltip.doors.applianceToPerson',
      },
      {
        id: 'doors-appliance-to-appliance',
        questionKey: 'audit.item.doors.applianceToAppliance',
        tooltipKey: 'audit.tooltip.doors.applianceToAppliance',
      },
      {
        id: 'doors-circulation-blocking',
        questionKey: 'audit.item.doors.circulationBlocking',
        tooltipKey: 'audit.tooltip.doors.circulationBlocking',
      },
    ],
  },
];

/**
 * Calculate audit score
 * Score = (passCount / (passCount + failCount)) * 100
 * Items marked "unknown" are excluded from calculation
 * Only counts items that are visible based on showIf condition
 */
export const calculateAuditScore = (
  responses: Record<string, AuditResponse>,
  variables?: AuditVariables
): number | null => {
  const validItemIds = getAllItemIds(variables);

  let passCount = 0;
  let failCount = 0;

  for (const id of validItemIds) {
    const response = responses[id];
    if (response === 'pass') passCount++;
    else if (response === 'fail') failCount++;
  }

  const answeredCount = passCount + failCount;

  if (answeredCount === 0) {
    return null; // No score if nothing answered
  }

  return Math.round((passCount / answeredCount) * 100);
};

/**
 * Get category stats (pass/fail/unknown counts)
 * Only counts items that are visible based on showIf condition
 */
export const getCategoryStats = (
  categoryId: string,
  responses: Record<string, AuditResponse>,
  variables?: AuditVariables
): { pass: number; fail: number; unknown: number; na: number; total: number } => {
  const category = auditCategories.find((c) => c.id === categoryId);
  if (!category) {
    return { pass: 0, fail: 0, unknown: 0, na: 0, total: 0 };
  }

  // Filter items based on showIf condition
  const visibleItems = variables
    ? category.items.filter((item) => !item.showIf || item.showIf(variables))
    : category.items;

  const stats = { pass: 0, fail: 0, unknown: 0, na: 0, total: visibleItems.length };

  visibleItems.forEach((item) => {
    const response = responses[item.id];
    if (response === 'pass') stats.pass++;
    else if (response === 'fail') stats.fail++;
    else if (response === 'unknown') stats.unknown++;
    else if (response === 'na') stats.na++;
  });

  return stats;
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
