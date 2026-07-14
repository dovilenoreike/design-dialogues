import { useFrontMaterials, worktopDefaultCode } from "./frontMaterialContext";
import { MaterialPicker } from "./MaterialPicker";

interface WorktopMaterialPickerProps {
  /** The per-run worktop override (undefined = inherit the project worktop). */
  value?: string;
  /** `undefined` reverts the run to the project-default worktop. */
  onChange: (code: string | undefined) => void;
}

/**
 * Per-run worktop-material control. The default is the project's "Worktops"
 * palette choice; a run can pin a different worktop per-line.
 */
export function WorktopMaterialPicker({ value, onChange }: WorktopMaterialPickerProps) {
  const { overrides, customs } = useFrontMaterials();
  return (
    <MaterialPicker
      role="worktop"
      title="Worktop material"
      noun="Worktop"
      inheritedCode={worktopDefaultCode(overrides, customs)}
      value={value}
      onChange={onChange}
    />
  );
}
