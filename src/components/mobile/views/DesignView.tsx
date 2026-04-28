import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypesByRole } from "@/data/archetypes";
import MaterialSlotPicker, { type SlotKey, type SlotSelections, SLOT_KEY_TO_ROLE } from "../controls/MaterialSlotPicker";
import { UploadDialog } from "../dialogs/UploadDialog";
import PostVizFeedbackPrompt from "@/components/PostVizFeedbackPrompt";
import Stage from "../Stage";
import KonceptasView, { SLOT_TO_PALETTE_KEY } from "./KonceptasView";
import CollectionPresetCarousel from "../CollectionPresetCarousel";
import PaletteReviewSheet, { type ReviewMaterial } from "../controls/PaletteReviewSheet";
import { useGraphMaterials, getMaterialByCode, getPairCountByCode } from "@/hooks/useGraphMaterials";

// Reverse: palette key → SlotKey (for syncing slotSelections from materialOverrides)
const PALETTE_KEY_TO_SLOT: Record<string, SlotKey> = {
  floor: "floor",
  bottomCabinets: "mainFronts",
  topCabinets: "additionalFronts",
  tallCabinets: "tertiaryFronts",
  worktops: "worktops",
  accents: "accents",
  tiles: "mainTiles",
  additionalTiles: "additionalTiles",
};

// Role → flatlay slot, for applying ?material= URL param
const ROLE_TO_SLOT_ENTRY: Record<string, { slot: SlotKey; paletteKey: string }> = {
  floor:   { slot: "floor",      paletteKey: "floor" },
  front:   { slot: "mainFronts", paletteKey: "bottomCabinets" },
  worktop: { slot: "worktops",   paletteKey: "worktops" },
  accent:  { slot: "accents",    paletteKey: "accents" },
  tile:    { slot: "mainTiles",  paletteKey: "tiles" },
};

const DISPLAYED_SLOTS: SlotKey[] = ["floor", "mainFronts", "additionalFronts", "worktops", "accents"];

// Maps swatch rail palette key → SlotKey for vizualas swatch tap
function paletteKeyToSlot(paletteKey: string, room: string): SlotKey | null {
  switch (paletteKey) {
    case "floor": return "floor";
    case "worktops": return "worktops";
    case "bottomCabinets": return room === "Kitchen" ? "mainFronts" : null;
    case "cabinetFurniture": return room === "Living Room" ? "mainFronts" : null;
    case "wardrobes": return room === "Bedroom" ? "mainFronts" : null;
    case "vanityUnit": return room === "Bathroom" ? "mainFronts" : null;
    case "topCabinets": return room === "Kitchen" ? "additionalFronts" : null;
    case "shelves": return room === "Kitchen" ? "accents" : "additionalFronts";
    case "tallCabinets": return "tertiaryFronts";
    default: return null;
  }
}

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
  const [enabledOptionalSlots, setEnabledOptionalSlots] = useState<Set<SlotKey>>(new Set());
  const [showReviewSheet, setShowReviewSheet] = useState(false);

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
    for (const [paletteKey, matId] of Object.entries(materialOverrides)) {
      const slotKey = PALETTE_KEY_TO_SLOT[paletteKey];
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
      for (const [pk, slotKey] of Object.entries(PALETTE_KEY_TO_SLOT)) {
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
      const entry = ROLE_TO_SLOT_ENTRY[mat.role[0]];
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
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      const matCode = resolvedCode
        ?? showroomMaterials.find((m) => m.archetypeId === archetypeId && m.role.includes(SLOT_KEY_TO_ROLE[slotKey]))?.technicalCode
        ?? archetypeId;
      if (pk) setMaterialOverrides((prev) => ({ ...prev, [pk]: matCode }));
    },
    [setMaterialOverrides, showroomMaterials],
  );

  const handleSlotClear = useCallback((slotKey: SlotKey) => {
    setSlotSelections((prev) => ({ ...prev, [slotKey]: null }));
    const pk = SLOT_TO_PALETTE_KEY[slotKey];
    if (pk) setMaterialOverrides((prev) => { const next = { ...prev }; delete next[pk]; return next; });
  }, [setMaterialOverrides]);

  const handleClearAll = useCallback(() => {
    trackEvent(AnalyticsEvents.MOODBOARD_SLOTS_RESET, {});
    setSlotSelections({
      floor: null, mainFronts: null, worktops: null,
      additionalFronts: null, tertiaryFronts: null, accents: null, mainTiles: null, additionalTiles: null,
    });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(SLOT_TO_PALETTE_KEY).forEach((k) => { if (k) delete next[k]; });
      return next;
    });
  }, [setMaterialOverrides]);

  const scrollToPicker = useCallback(() => {
    requestAnimationFrame(() => {
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const allSlotsFilled = DISPLAYED_SLOTS.every((k) => Boolean(slotSelections[k]));

  // Compatibility check for the picker idle state
  const hasIncompatibleSlots = useMemo(() => {
    if (graphLoading || !allSlotsFilled) return false;
    return DISPLAYED_SLOTS.filter((k) => k !== "accents").some((slotKey) => {
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      const code = pk ? (materialOverrides[pk] ?? null) : null;
      if (!code) return false;
      const others = DISPLAYED_SLOTS
        .filter((k) => k !== slotKey)
        .map((k) => { const p = SLOT_TO_PALETTE_KEY[k]; return p ? (materialOverrides[p] ?? null) : null; })
        .filter((c): c is string => !!c);
      return others.length > 0 && !isCompatibleWithOthers(code, others);
    });
  }, [graphLoading, allSlotsFilled, materialOverrides, isCompatibleWithOthers]);

  const reviewMaterials: ReviewMaterial[] = useMemo(() => {
    if (!allSlotsFilled) return [];
    return DISPLAYED_SLOTS.map((slotKey) => {
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      const code = pk ? (materialOverrides[pk] ?? "") : "";
      const mat = code ? getMaterialByCode(code) : undefined;
      const others = DISPLAYED_SLOTS
        .filter((k) => k !== slotKey)
        .map((k) => { const p = SLOT_TO_PALETTE_KEY[k]; return p ? (materialOverrides[p] ?? null) : null; })
        .filter((c): c is string => !!c);
      const compatible = !code || others.length === 0 ? true : isCompatibleWithOthers(code, others);
      return { slot: slotKey, name: mat?.name?.en ?? code, code, compatible };
    });
  }, [allSlotsFilled, materialOverrides, isCompatibleWithOthers]);

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
              setCollectionSlots(new Set(Object.keys(materials)));
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
                  onSwatchTap={(paletteKey) => {
                    const slotKey = paletteKeyToSlot(paletteKey, design.selectedCategory || "Kitchen");
                    if (slotKey) {
                      setActiveSlot(slotKey);
                      scrollToPicker();
                    }
                  }}
                  onGoToMaterials={() => setSubTab("konceptas")}
                  presetImageUrl={presetImageUrl}
                  collectionSlots={collectionSlots}
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
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
              enabledOptionalSlots={enabledOptionalSlots}
              setEnabledOptionalSlots={setEnabledOptionalSlots}
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
