import { useState, useEffect, useCallback } from "react";

const OVERRIDES_KEY = "material-overrides";
const EXCLUDED_SLOTS_KEY = "excluded-slots";

/**
 * Manages material slot overrides and excluded slots.
 * Both are persisted to localStorage so page reloads restore the exact user state.
 */
export function useMaterialOverrides() {
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(OVERRIDES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [excludedSlots, setExcludedSlots] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(EXCLUDED_SLOTS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set(["shelves", "tallCabinets"]);
    } catch {
      return new Set(["shelves", "tallCabinets"]);
    }
  });

  useEffect(() => {
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(materialOverrides)); } catch {}
  }, [materialOverrides]);

  useEffect(() => {
    try { localStorage.setItem(EXCLUDED_SLOTS_KEY, JSON.stringify([...excludedSlots])); } catch {}
  }, [excludedSlots]);

  const resetOverrides = useCallback(() => {
    setMaterialOverrides({});
    setExcludedSlots(new Set(["shelves", "tallCabinets"]));
  }, []);

  return {
    materialOverrides,
    setMaterialOverrides,
    excludedSlots,
    setExcludedSlots,
    resetOverrides,
  };
}
