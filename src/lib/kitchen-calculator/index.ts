/**
 * Kitchen Furniture Price Calculator — engine barrel.
 * Pure BOM pricing engine; see kitchen-calculator-spec.md.
 */

export * from "./types";
export { defaultSettings, mockMaterialConfig, mockHardwareDB, hardwarePrice } from "./mock-config";
export {
  generateKitchen,
  makeUnit,
  makeRun,
  makeWallRun,
  nextRunLabel,
  retypeUnit,
  LAYOUT_RUN_COUNT,
  LAYOUT_CORNER_JUNCTIONS,
} from "./autofill";
export {
  unitParts,
  UNIT_LABELS,
  UNIT_CATEGORY,
  BASE_TALL_TYPES,
  WALL_TYPES,
  ISLAND_TYPES,
} from "./units";
export { priceKitchen, buildContext } from "./calculate";
export { pricePart, priceParts } from "./parts";
