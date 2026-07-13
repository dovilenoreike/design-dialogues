/**
 * Kitchen Furniture Price Calculator — engine barrel.
 * Pure BOM pricing engine; see kitchen-calculator-spec.md.
 */

export * from "./types";
export {
  APPLIANCE_ITEMS,
  defaultAppliances,
  projectAppliancesFor,
  primaryApplianceId,
  type ProjectAppliance,
} from "./appliances";
export { defaultSettings, mockMaterialConfig, mockHardwareDB, hardwarePrice } from "./mock-config";
export {
  generateKitchen,
  makeUnit,
  makeRun,
  makeWallRun,
  makeExtraCost,
  nextRunLabel,
  nextUnitId,
  retypeUnit,
  effectiveRunFor,
  LAYOUT_RUN_COUNT,
  LAYOUT_CORNER_JUNCTIONS,
  type AssignableFixture,
  type RunAssignment,
} from "./autofill";
export {
  unitParts,
  UNIT_LABELS,
  UNIT_CATEGORY,
  DEFAULT_APPLIANCE,
  DEFAULT_APPLIANCES,
  BASE_TALL_TYPES,
  WALL_TYPES,
  ISLAND_TYPES,
  ESSENTIAL_TYPES,
  unitHasSink,
  categoryDims,
} from "./units";
export { priceKitchen, buildContext, effectiveExtraAmount, AUTO_EXTRA_PCT } from "./calculate";
export { pricePart, priceParts } from "./parts";
