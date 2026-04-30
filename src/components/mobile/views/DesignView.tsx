import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { ArrowLeft, Plus, Sparkles, X as XIcon } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypesByRole } from "@/data/archetypes";
import MaterialSlotPicker, { type SlotKey, type SlotSelections, SLOT_KEY_TO_ROLE } from "../controls/MaterialSlotPicker";
import { UploadDialog } from "../dialogs/UploadDialog";
import PostVizFeedbackPrompt from "@/components/PostVizFeedbackPrompt";
import Stage from "../Stage";
import KonceptasView, { SLOT_TO_PALETTE_KEY, DEFAULT_SLOT_SURFACES, OPTIONAL_SLOTS } from "./KonceptasView";
import CollectionPresetCarousel from "../CollectionPresetCarousel";
import PaletteReviewSheet, { type ReviewMaterial } from "../controls/PaletteReviewSheet";
import { useGraphMaterials, getMaterialByCode, getPairCountByCode } from "@/hooks/useGraphMaterials";
import { surfaces } from "@/data/rooms/surfaces";

// Default-enabled optional slots (all except tertiaryFronts which starts hidden)
const DEFAULT_ENABLED_OPTIONAL: SlotKey[] = ["mainFronts", "additionalFronts", "worktops", "accents"];

// Static role → primary palette key, used only for the ?material= URL param (runs once on mount)
const ROLE_TO_PRIMARY_PK: Record<string, { slot: SlotKey; paletteKey: string }> = {
  floor:   { slot: "floor",      paletteKey: "floor" },
  front:   { slot: "mainFronts", paletteKey: "bottomCabinets" },
  worktop: { slot: "worktops",   paletteKey: "worktops" },
  accent:  { slot: "accents",    paletteKey: "accents" },
  tile:    { slot: "mainTiles",  paletteKey: "tiles" },
};


export default function DesignView() {
  const {
    design,
    generation,
    confirmImageUpload,
    cancelImageUpload,
    setMaterialOverrides,
    materialOverrides,
    setActiveTab,
    isSharedSession,
    sharedMoodboardSlots,
    shareSession,
  } = useDesign();
  const { t, language } = useLanguage();
  const { activeShowroom } = useShowroom();
  const { loading: graphLoading, graphMaterials, getRecommendedCodes, isCompatibleWithOthers } = useGraphMaterials();
  const [searchParams, setSearchParams] = useSearchParams();

  const [subTab, setSubTab] = useState<"vizualas" | "konceptas">("konceptas");
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);
  const [enabledOptionalSlots, setEnabledOptionalSlots] = useState<Set<SlotKey>>(() => {
    try {
      const saved = localStorage.getItem("enabled-optional-slots");
      if (saved !== null) return new Set(JSON.parse(saved) as SlotKey[]);
    } catch {}
    return new Set(DEFAULT_ENABLED_OPTIONAL);
  });
  const [pendingOptionalSlot, setPendingOptionalSlot] = useState<SlotKey | null>(null);
  const [showReviewSheet, setShowReviewSheet] = useState(false);

  // ── User-configurable surface attributes ─────────────────────────────────
  const [slotSurfaces, setSlotSurfaces] = useState<Record<SlotKey, string[]>>(() => {
    try {
      const saved = localStorage.getItem("slot-surfaces");
      if (saved) return { ...DEFAULT_SLOT_SURFACES, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_SLOT_SURFACES };
  });

  useEffect(() => {
    localStorage.setItem("slot-surfaces", JSON.stringify(slotSurfaces));
  }, [slotSurfaces]);

  useEffect(() => {
    localStorage.setItem("enabled-optional-slots", JSON.stringify([...enabledOptionalSlots]));
  }, [enabledOptionalSlots]);

  // Derives palette key → SlotKey, respects user-added surfaces
  const paletteKeyToSlot = useMemo(
    (): Record<string, SlotKey> =>
      Object.fromEntries(
        (Object.entries(slotSurfaces) as [SlotKey, string[]][]).flatMap(([slot, pks]) =>
          pks.map((pk) => [pk, slot])
        )
      ),
    [slotSurfaces]
  );

  // ── Collection preset state (lifted from Stage) ──────────────────────────
  const [presetImageUrl, setPresetImageUrl] = useState<string | null>(null);
  const presetMaterialsRef = useRef<Record<string, string> | null>(null);
  const [collectionSlots, setCollectionSlots] = useState<Set<string>>(new Set());
  const presetIsActive = !!presetImageUrl;

  // Clear preset image when materialOverrides drift from the preset snapshot
  useEffect(() => {
    if (!presetMaterialsRef.current || !presetImageUrl) return;
    const preset = presetMaterialsRef.current;
    const modified = Object.keys(preset).some(k => materialOverrides[k] !== preset[k]);
    if (modified) {
      setPresetImageUrl(null);
      presetMaterialsRef.current = null;
    }
  }, [materialOverrides, presetImageUrl]);

  // Clear preset image on room change
  useEffect(() => {
    setPresetImageUrl(null);
    presetMaterialsRef.current = null;
  }, [design.selectedCategory]);

  const pickerRef = useRef<HTMLDivElement>(null);
  const slotSelectionsRef = useRef<SlotSelections | null>(null);

  // ── slotSelections — shared across both sub-views ────────────────────────
  const [slotSelections, setSlotSelections] = useState<SlotSelections>(() => {
    if (isSharedSession && sharedMoodboardSlots) {
      return {
        floor: null, mainFronts: null, worktops: null,
        additionalFronts: null, tertiaryFronts: null, accents: null, mainTiles: null, additionalTiles: null,
        ...sharedMoodboardSlots,
      } as SlotSelections;
    }

    const ACCENT_ID_MIGRATION: Record<string, string> = {
      "chrome": "silver",
      "wine-red": "colour",
      "aged-bronze": "bronze",
    };
    try {
      const saved = localStorage.getItem("moodboard-slot-selections");
      if (saved) {
        const parsed = JSON.parse(saved) as SlotSelections;
        (Object.keys(parsed) as SlotKey[]).forEach((k) => {
          const id = parsed[k];
          if (!id) return;
          if (k === "accents" && ACCENT_ID_MIGRATION[id]) {
            parsed[k] = ACCENT_ID_MIGRATION[id];
            return;
          }
          const role = SLOT_KEY_TO_ROLE[k];
          const valid = getArchetypesByRole(role).some((a) => a.id === id);
          if (!valid) {
            const pk = SLOT_TO_PALETTE_KEY[k];
            parsed[k] = (pk ? materialOverrides[pk] : null) ?? null;
          }
        });
        return parsed;
      }
    } catch {}

    const initial: SlotSelections = {
      floor: null, mainFronts: null, worktops: null,
      additionalFronts: null, tertiaryFronts: null, accents: null, mainTiles: null, additionalTiles: null,
    };
    const defaultPkToSlot: Record<string, SlotKey> = Object.fromEntries(
      (Object.entries(DEFAULT_SLOT_SURFACES) as [SlotKey, string[]][])
        .flatMap(([slot, pks]) => pks.map((pk) => [pk, slot]))
    );
    for (const [paletteKey, matId] of Object.entries(materialOverrides)) {
      const slotKey = defaultPkToSlot[paletteKey];
      if (slotKey) initial[slotKey] = matId;
    }
    if (!initial.floor) initial.floor = "light-wood";
    return initial;
  });

  slotSelectionsRef.current = slotSelections;

  // Persist slot selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
  }, [slotSelections]);

  // On mount (after graph loads): resolve archetype IDs → product codes in materialOverrides
  useEffect(() => {
    if (graphLoading) return;
    const validCodes = new Set(graphMaterials.map((m) => m.technicalCode));
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(slotSelectionsRef.current!) as SlotKey[]).forEach((k) => {
        const aId = slotSelectionsRef.current![k];
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk || !aId) return;
        if (next[pk] && validCodes.has(next[pk])) return;
        const role = SLOT_KEY_TO_ROLE[k];
        const showroomPool = activeShowroom && activeShowroom.surfaceCategories.includes(role)
          ? graphMaterials.filter((m) => m.showroomIds.includes(activeShowroom.id))
          : graphMaterials;
        const candidates = showroomPool.filter((m) => m.archetypeId === aId && m.role.includes(role));
        const resolved = candidates.length > 0
          ? candidates.reduce((best, m) => getPairCountByCode(m.technicalCode) >= getPairCountByCode(best.technicalCode) ? m : best)
          : undefined;
        if (resolved) {
          next[pk] = resolved.technicalCode;
        } else if (!next[pk]) {
          next[pk] = aId;
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphLoading]);

  // Sync slotSelections when materialOverrides changes (e.g. bubble rail, collection presets)
  useEffect(() => {
    if (graphLoading) return;
    setSlotSelections((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [pk, slotKey] of Object.entries(paletteKeyToSlot)) {
        const matId = materialOverrides[pk];
        if (!matId) continue;
        const graphMat = graphMaterials.find((m) => m.technicalCode === matId);
        let archetypeId: string | null = graphMat?.archetypeId ?? null;
        if (!archetypeId && !next[slotKey] && matId) archetypeId = matId;
        if (archetypeId && next[slotKey] !== archetypeId) {
          next[slotKey] = archetypeId;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialOverrides, graphLoading]);

  // Apply ?material=CODE URL param once graph is loaded (for showroom QR codes)
  useEffect(() => {
    if (graphLoading) return;
    const param = searchParams.get("material");
    if (!param) return;
    const newOverrides: Record<string, string> = {};
    const newSelections: Partial<SlotSelections> = {};
    for (const code of param.split(",").map((c) => c.trim()).filter(Boolean)) {
      const mat = getMaterialByCode(code);
      if (!mat) continue;
      const entry = ROLE_TO_PRIMARY_PK[mat.role[0]];
      if (!entry) continue;
      newOverrides[entry.paletteKey] = code;
      if (mat.archetypeId) newSelections[entry.slot] = mat.archetypeId;
    }
    if (Object.keys(newOverrides).length > 0) {
      setMaterialOverrides((prev) => ({ ...prev, ...newOverrides }));
      setSlotSelections((prev) => ({ ...prev, ...newSelections }));
      setActiveTab("design");
      setSearchParams((prev) => { prev.delete("material"); return prev; }, { replace: true });
    }
  }, [graphLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restrict picker to showroom materials
  const showroomMaterials = useMemo(() => {
    if (!activeShowroom) return graphMaterials;
    const slotRole = activeSlot ? SLOT_KEY_TO_ROLE[activeSlot] : null;
    if (!slotRole || !activeShowroom.surfaceCategories.includes(slotRole)) {
      return graphMaterials;
    }
    return graphMaterials.filter((m) => m.showroomIds.includes(activeShowroom.id));
  }, [graphMaterials, activeShowroom, activeSlot]);

  // Other material codes (excluding active slot) for compatibility scoring
  const otherMaterialCodesForPicker = useMemo(() => {
    return (Object.entries(SLOT_TO_PALETTE_KEY) as [SlotKey, string | null][])
      .filter(([k]) => k !== activeSlot)
      .map(([, pk]) => (pk ? materialOverrides[pk] : null))
      .filter((c): c is string => !!c);
  }, [activeSlot, materialOverrides]);

  // Currently selected material code for the active slot
  const activeSlotMaterialCode = useMemo(() => {
    const pk = activeSlot ? SLOT_TO_PALETTE_KEY[activeSlot] : null;
    return pk ? (materialOverrides[pk] ?? undefined) : undefined;
  }, [activeSlot, materialOverrides]);

  // Close picker when switching sub-tabs
  useEffect(() => {
    setActiveSlot(null);
  }, [subTab]);

  const handleSlotSelect = useCallback(
    (slotKey: SlotKey, archetypeId: string, resolvedCode?: string) => {
      setSlotSelections((prev) => {
        trackEvent(AnalyticsEvents.MOODBOARD_MATERIAL_SELECTED, {
          slot: slotKey,
          material_id: archetypeId,
          was_replacing: prev[slotKey] !== null,
        });
        return { ...prev, [slotKey]: archetypeId };
      });
      const pks = slotSurfaces[slotKey] ?? [SLOT_TO_PALETTE_KEY[slotKey]].filter(Boolean) as string[];
      const matCode = resolvedCode
        ?? showroomMaterials.find((m) => m.archetypeId === archetypeId && m.role.includes(SLOT_KEY_TO_ROLE[slotKey]))?.technicalCode
        ?? archetypeId;
      setMaterialOverrides((prev) => {
        const next = { ...prev };
        for (const pk of pks) next[pk] = matCode;
        return next;
      });
    },
    [setMaterialOverrides, showroomMaterials, slotSurfaces],
  );

  const handleSlotClear = useCallback((slotKey: SlotKey) => {
    setSlotSelections((prev) => ({ ...prev, [slotKey]: null }));
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      for (const pk of (slotSurfaces[slotKey] ?? [])) delete next[pk];
      return next;
    });
    // If this is an optional slot, also remove it from the canvas
    if (OPTIONAL_SLOTS.includes(slotKey)) {
      setEnabledOptionalSlots((prev) => { const s = new Set(prev); s.delete(slotKey); return s; });
    }
    // If the picker was open for this slot, close it
    setActiveSlot((prev) => (prev === slotKey ? null : prev));
  }, [setMaterialOverrides, slotSurfaces]);

  const handleClearAll = useCallback(() => {
    trackEvent(AnalyticsEvents.MOODBOARD_SLOTS_RESET, {});
    setSlotSelections({
      floor: null, mainFronts: null, worktops: null,
      additionalFronts: null, tertiaryFronts: null, accents: null, mainTiles: null, additionalTiles: null,
    });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(slotSurfaces).flat().forEach((pk) => { delete next[pk]; });
      return next;
    });
    setEnabledOptionalSlots(new Set());
    setSlotSurfaces({ ...DEFAULT_SLOT_SURFACES });
    setActiveSlot(null);
    setPendingOptionalSlot(null);
  }, [setMaterialOverrides, slotSurfaces]);

  const handleAddSurface = useCallback((slotKey: SlotKey, paletteKey: string) => {
    setSlotSurfaces((prev) => {
      const next = { ...prev };
      // Each surface type can only belong to one slot — remove it from any other slot first
      for (const k of Object.keys(next) as SlotKey[]) {
        if (k !== slotKey && next[k]?.includes(paletteKey)) {
          next[k] = next[k].filter(pk => pk !== paletteKey);
        }
      }
      next[slotKey] = [...(next[slotKey] ?? []), paletteKey];
      return next;
    });
    const primaryPk = slotSurfaces[slotKey]?.[0] ?? SLOT_TO_PALETTE_KEY[slotKey];
    const currentCode = primaryPk ? materialOverrides[primaryPk] : undefined;
    if (currentCode) setMaterialOverrides((prev) => ({ ...prev, [paletteKey]: currentCode }));
  }, [materialOverrides, setMaterialOverrides, slotSurfaces]);

  const handleRemoveSurface = useCallback((slotKey: SlotKey, paletteKey: string) => {
    setSlotSurfaces((prev) => ({
      ...prev,
      [slotKey]: (prev[slotKey] ?? []).filter((pk) => pk !== paletteKey),
    }));
    setMaterialOverrides((prev) => { const next = { ...prev }; delete next[paletteKey]; return next; });
  }, [setMaterialOverrides]);

  const scrollToPicker = useCallback(() => {
    requestAnimationFrame(() => {
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Addable categories: only show if there are both slots AND surface types still available
  const addableCategories = useMemo((): string[] => {
    const usedByEnabled = new Set(
      (["floor", ...OPTIONAL_SLOTS.filter(s => enabledOptionalSlots.has(s))] as SlotKey[])
        .flatMap(s => slotSurfaces[s] ?? [])
    );
    const cats: string[] = [];
    const frontSlotsLeft = (["mainFronts", "additionalFronts", "tertiaryFronts"] as SlotKey[])
      .some(s => !enabledOptionalSlots.has(s));
    const frontSurfacesLeft = ["bottomCabinets", "topCabinets", "tallCabinets", "shelves"]
      .some(pk => !usedByEnabled.has(pk));
    if (frontSlotsLeft && frontSurfacesLeft) cats.push("front");
    if (!enabledOptionalSlots.has("worktops")) cats.push("worktop");
    if (!enabledOptionalSlots.has("accents")) cats.push("accent");
    return cats;
  }, [enabledOptionalSlots, slotSurfaces]);

  // Add slot by category: assigns first unused surface type, opens picker, prevents ghost square
  const handleAddCategory = useCallback((category: string) => {
    let targetSlot: SlotKey | null = null;
    let defaultPaletteKey: string | null = null;

    // Surface types already used by currently-enabled slots
    const usedByEnabled = new Set(
      (["floor", ...OPTIONAL_SLOTS.filter(s => enabledOptionalSlots.has(s))] as SlotKey[])
        .flatMap(s => slotSurfaces[s] ?? [])
    );

    if (category === "front") {
      const frontOrder: SlotKey[] = ["mainFronts", "additionalFronts", "tertiaryFronts"];
      targetSlot = frontOrder.find(s => !enabledOptionalSlots.has(s)) ?? null;
      if (targetSlot) {
        // Pick the first front surface type not already claimed by an enabled slot
        const frontSurfaces = ["bottomCabinets", "topCabinets", "tallCabinets", "shelves"];
        defaultPaletteKey = frontSurfaces.find(pk => !usedByEnabled.has(pk)) ?? null;
      }
    } else if (category === "worktop") {
      targetSlot = "worktops";
      defaultPaletteKey = "worktops";
    } else if (category === "accent") {
      targetSlot = "accents";
      defaultPaletteKey = "accents";
    }

    if (!targetSlot) return;
    const slot = targetSlot;
    if (defaultPaletteKey) setSlotSurfaces(prev => ({ ...prev, [slot]: [defaultPaletteKey!] }));
    setEnabledOptionalSlots(prev => new Set([...prev, slot]));
    setPendingOptionalSlot(slot);
    setActiveSlot(slot);
    requestAnimationFrame(() => {
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [enabledOptionalSlots, slotSurfaces]);

  // Auto-dismiss: if user navigates away from a freshly added slot without picking a material, remove it
  useEffect(() => {
    if (!pendingOptionalSlot) return;
    if (activeSlot === pendingOptionalSlot) return;
    const hasMaterial = (slotSurfaces[pendingOptionalSlot] ?? []).some(pk => materialOverrides[pk]);
    if (!hasMaterial) {
      setEnabledOptionalSlots(prev => { const s = new Set(prev); s.delete(pendingOptionalSlot); return s; });
    }
    setPendingOptionalSlot(null);
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSlots = useMemo(
    (): SlotKey[] => ["floor", ...OPTIONAL_SLOTS.filter(k => enabledOptionalSlots.has(k))],
    [enabledOptionalSlots]
  );

  const allSlotsFilled = activeSlots.every((k) => Boolean(slotSelections[k]));

  // Compatibility check for the picker idle state
  const hasIncompatibleSlots = useMemo(() => {
    if (graphLoading || !allSlotsFilled) return false;
    return activeSlots.filter((k) => k !== "accents").some((slotKey) => {
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      const code = pk ? (materialOverrides[pk] ?? null) : null;
      if (!code) return false;
      const others = activeSlots
        .filter((k) => k !== slotKey)
        .map((k) => { const p = SLOT_TO_PALETTE_KEY[k]; return p ? (materialOverrides[p] ?? null) : null; })
        .filter((c): c is string => !!c);
      return others.length > 0 && !isCompatibleWithOthers(code, others);
    });
  }, [graphLoading, allSlotsFilled, activeSlots, materialOverrides, isCompatibleWithOthers]);

  const reviewMaterials: ReviewMaterial[] = useMemo(() => {
    if (!allSlotsFilled) return [];
    return activeSlots.map((slotKey) => {
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      const code = pk ? (materialOverrides[pk] ?? "") : "";
      const mat = code ? getMaterialByCode(code) : undefined;
      const others = activeSlots
        .filter((k) => k !== slotKey)
        .map((k) => { const p = SLOT_TO_PALETTE_KEY[k]; return p ? (materialOverrides[p] ?? null) : null; })
        .filter((c): c is string => !!c);
      const compatible = !code || others.length === 0 ? true : isCompatibleWithOthers(code, others);
      return { slot: slotKey, name: mat?.name?.en ?? code, code, compatible };
    });
  }, [allSlotsFilled, activeSlots, materialOverrides, isCompatibleWithOthers]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden lg:overflow-hidden lg:flex lg:flex-row">

      {/* LEFT (desktop) / TOP (mobile): sub-tab content */}
      <div className="lg:flex-1 lg:min-w-0 lg:min-h-0 lg:overflow-y-auto">
        <div className="px-4 pt-3 pb-4 lg:px-8 lg:py-6 lg:max-w-2xl">

          {/* Collection carousel — shared header for both sub-views */}
          <CollectionPresetCarousel
            roomCategory={design.selectedCategory}
            onApplyPreset={(materials, imageUrl) => {
              setMaterialOverrides(materials);

              // Derive covered slots via DEFAULT_SLOT_SURFACES (not user-modified slotSurfaces)
              const defaultPkToSlot: Record<string, SlotKey> = Object.fromEntries(
                (Object.entries(DEFAULT_SLOT_SURFACES) as [SlotKey, string[]][])
                  .flatMap(([slot, pks]) => pks.map((pk) => [pk, slot]))
              );
              const coveredSlots = new Set(
                Object.keys(materials)
                  .map((pk) => defaultPkToSlot[pk])
                  .filter((s): s is SlotKey => !!s)
              );

              // Re-enable every optional slot the collection covers (even if user had removed it)
              setEnabledOptionalSlots(new Set(OPTIONAL_SLOTS.filter(s => coveredSlots.has(s))));

              // Reset surface assignments to defaults so palette key mapping stays clean
              setSlotSurfaces(prev => {
                const next = { ...prev };
                for (const slot of coveredSlots) next[slot] = DEFAULT_SLOT_SURFACES[slot];
                return next;
              });

              setCollectionSlots(coveredSlots);
              setPresetImageUrl(imageUrl);
              presetMaterialsRef.current = materials;
            }}
            hasExistingMaterials={Object.keys(materialOverrides).length > 0}
            isModified={!presetIsActive && Object.keys(materialOverrides).length > 0}
            variant="header"
          />

          {/* Sub-tab switcher */}
          <div className="flex gap-5 pt-3 pb-3">
            {(["konceptas", "vizualas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`text-[11px] font-medium tracking-[0.06em] uppercase pb-1 transition-colors ${
                  subTab === tab
                    ? "text-foreground border-b border-foreground"
                    : "text-foreground/40 hover:text-foreground/60"
                }`}
              >
                {tab === "vizualas" ? t("tab.vizualas") : t("tab.konceptas")}
              </button>
            ))}
          </div>

          {/* Sub-tab content */}
          {subTab === "vizualas" ? (
            <div>
              <div className="relative w-full aspect-square">
                <Stage
                  onSwatchTap={(slotKey) => {
                    setActiveSlot(slotKey as SlotKey);
                    scrollToPicker();
                  }}
                  onGoToMaterials={() => setSubTab("konceptas")}
                  presetImageUrl={presetImageUrl}
                  collectionSlots={collectionSlots}
                  slotSurfaces={slotSurfaces}
                  enabledOptionalSlots={enabledOptionalSlots}
                  addableCategories={addableCategories}
                  onAddCategory={handleAddCategory}
                  onAddSlot={(slotKey) => setCollectionSlots(prev => {
                    const base = prev.size > 0 ? prev : new Set(Object.keys(materialOverrides));
                    return new Set([...base, slotKey]);
                  })}
                />
              </div>
              <div className="mt-14">
                <PostVizFeedbackPrompt />
              </div>
            </div>
          ) : (
            <KonceptasView
              slotSelections={slotSelections}
              slotSurfaces={slotSurfaces}
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
              enabledOptionalSlots={enabledOptionalSlots}
              pendingOptionalSlot={pendingOptionalSlot}
              addableCategories={addableCategories}
              onAddCategory={handleAddCategory}
              handleSlotClear={handleSlotClear}
              onVisualize={() => setSubTab("vizualas")}
              onClearAll={handleClearAll}
              onScrollToPicker={scrollToPicker}
              t={t}
              language={language}
            />
          )}
        </div>
      </div>

      {/* RIGHT (desktop) / BOTTOM (mobile): shared inline picker */}
      <div
        ref={pickerRef}
        className={`${activeSlot ? "h-[320px]" : "h-auto"} lg:h-full lg:flex-1 lg:min-w-0 lg:min-h-0 lg:overflow-hidden mt-3 lg:mt-0 border-t lg:border-t-0 lg:border-l bg-neutral-50`}
        style={{ borderColor: "#e8e4e0", borderWidth: "0.5px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {activeSlot ? (
          <>
            {/* Surface type toggle pills — shown only for roles with multiple options (fronts) */}
            {(() => {
              const assignedPks = slotSurfaces[activeSlot] ?? [];
              const slotRole = SLOT_KEY_TO_ROLE[activeSlot];
              const allForRole = Object.entries(surfaces)
                .filter(([, def]) => def.category === slotRole)
                .map(([pk]) => pk);
              if (allForRole.length <= 1) return null;

              // Which OTHER enabled slot currently owns each palette key
              const enabledSlotKeys: SlotKey[] = ["floor", ...OPTIONAL_SLOTS.filter(s => enabledOptionalSlots.has(s))];
              const ownedByOther = new Map<string, SlotKey>();
              for (const s of enabledSlotKeys) {
                if (s === activeSlot) continue;
                for (const pk of slotSurfaces[s] ?? []) ownedByOther.set(pk, s);
              }

              return (
                <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 pb-1">
                  {allForRole.map((pk) => {
                    const isActive = assignedPks.includes(pk);
                    const otherSlot = ownedByOther.get(pk);
                    const canRemove = isActive && assignedPks.length > 1;

                    return (
                      <button
                        key={pk}
                        onClick={() => {
                          if (isActive) {
                            if (canRemove) handleRemoveSurface(activeSlot, pk);
                            // sole assignment — do nothing (slot must keep at least one surface type)
                          } else {
                            // handleAddSurface removes pk from any other slot's slotSurfaces
                            handleAddSurface(activeSlot, pk);
                            // If the source slot lost its only surface type, remove it from canvas
                            // (don't use handleSlotClear — that would delete the material we just moved)
                            if (otherSlot && (slotSurfaces[otherSlot]?.length ?? 0) <= 1) {
                              setEnabledOptionalSlots(prev => { const s = new Set(prev); s.delete(otherSlot); return s; });
                              setSlotSelections(prev => ({ ...prev, [otherSlot]: null }));
                            }
                          }
                        }}
                        className="flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-medium tracking-[0.03em] active:scale-95 transition-transform"
                        style={{
                          backgroundColor: isActive ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.04)",
                          color: isActive ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.5)",
                          border: isActive ? "none" : `0.5px dashed rgba(0,0,0,${otherSlot ? "0.12" : "0.2"})`,
                          opacity: !isActive && otherSlot ? 0.5 : 1,
                        }}
                      >
                        {t(`surface.${pk}`) || pk}
                        {isActive && canRemove && (
                          <XIcon className="w-2.5 h-2.5 ml-0.5 opacity-50" strokeWidth={2} />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            <MaterialSlotPicker
              slot={activeSlot}
              inline={true}
              selections={slotSelections}
              onSelect={handleSlotSelect}
              onClose={() => {}}
              onClear={handleSlotClear}
              otherMaterialCodes={otherMaterialCodesForPicker}
              selectedMaterialCode={activeSlotMaterialCode}
              getRecommendedCodes={getRecommendedCodes}
              graphMaterials={graphLoading ? undefined : showroomMaterials}
              filterEmptyArchetypes={!graphLoading}
            />
          </>
        ) : allSlotsFilled ? (
          <div className="flex lg:h-full items-center justify-center flex-col gap-3 select-none py-5 lg:py-0 px-6">
            {hasIncompatibleSlots && (
              <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-center"
                 style={{ color: 'rgba(0,0,0,0.45)' }}>
                {t("moodboard.someNotPairing")}
              </p>
            )}
            <div className="flex items-center gap-2">
              {hasIncompatibleSlots && (
                <button
                  onClick={() => setShowReviewSheet(true)}
                  className="h-8 px-3 rounded-full text-[11px] font-medium tracking-[0.03em] active:scale-95 transition-transform"
                  style={{ backgroundColor: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.65)" }}
                >
                  {t("moodboard.requestReview")}
                </button>
              )}
              <button
                onClick={() => setSubTab("vizualas")}
                className="h-8 px-3 rounded-full flex items-center gap-1.5 text-[11px] font-medium tracking-[0.03em] text-white active:scale-95 transition-transform"
                style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
              >
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                {t("moodboard.visualize")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex lg:h-full items-center justify-center flex-col gap-2 select-none py-4 lg:py-0">
            <ArrowLeft className="hidden lg:block w-4 h-4" style={{ color: '#647d75', opacity: 0.5 }} strokeWidth={1.5} />
            <span className="text-[11px] font-medium tracking-[0.04em] uppercase" style={{ color: 'rgba(0,0,0,0.35)' }}>
              {t("moodboard.selectPiece")}
            </span>
          </div>
        )}
      </div>

      {/* Upload confirmation dialog */}
      <UploadDialog
        open={generation.showUploadDialog}
        onConfirm={confirmImageUpload}
        onCancel={cancelImageUpload}
      />

      {/* Palette review sheet */}
      <PaletteReviewSheet
        isOpen={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        materials={reviewMaterials}
        onShare={shareSession}
      />
    </div>
  );
}
