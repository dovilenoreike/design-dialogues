import { useState, useCallback } from "react";

/**
 * Manages material slot overrides and excluded slots.
 * Extracted from DesignContext to isolate the material-swap sub-domain.
 */
export function useMaterialOverrides() {
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, string>>({});
  const [excludedSlots, setExcludedSlots] = useState<Set<string>>(new Set());

  const resetOverrides = useCallback(() => {
    setMaterialOverrides({});
    setExcludedSlots(new Set());
  }, []);

  return {
    materialOverrides,
    setMaterialOverrides,
    excludedSlots,
    setExcludedSlots,
    resetOverrides,
  };
}
