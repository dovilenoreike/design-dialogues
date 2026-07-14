import type { CabinetUnit } from "@/lib/kitchen-calculator";
import { defaultFrontCode, useFrontMaterials } from "./frontMaterialContext";
import { MaterialPicker } from "./MaterialPicker";

interface FrontMaterialPickerProps {
  unit: CabinetUnit;
  /** `undefined` reverts the unit to its category's project-default front. */
  onChange: (code: string | undefined) => void;
}

/**
 * Per-unit front-material control: the swatch on the row shows the material this
 * cabinet's front wears (inherited from the project palette for its category, or
 * pinned per-line), and its popover changes it.
 */
export function FrontMaterialPicker({ unit, onChange }: FrontMaterialPickerProps) {
  const { overrides, customs, palette } = useFrontMaterials();
  return (
    <MaterialPicker
      role="front"
      title="Front material"
      noun="Front"
      inheritedCode={defaultFrontCode(unit.category, overrides, customs)}
      value={unit.frontMaterial}
      palette={palette}
      onChange={onChange}
    />
  );
}
