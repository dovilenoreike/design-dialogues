/**
 * Deep-link (?material=CODE) detection captured ONCE at module evaluation — i.e. against the
 * original page URL, before React mounts or any client-side navigation can strip the param.
 *
 * This matters because <DesignProvider> lives inside <Index>, which is the element for both "/"
 * and "/design/*". Applying a deep-link navigates "/" → "/design" and removes the param, which
 * REMOUNTS the provider. Anything that re-reads the URL at (re)mount time would then see the
 * stripped URL and misbehave (e.g. seed a default floor, or auto-apply a full collection). A
 * module-level capture is stable across that remount, so a deep-link places ONLY its material.
 */
export const INITIAL_MATERIAL_PARAM: string | null =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("material")
    : null;

export const LOADED_WITH_MATERIAL_PARAM = INITIAL_MATERIAL_PARAM !== null;
