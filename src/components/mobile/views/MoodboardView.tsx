import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { RotateCcw, Plus, Check, X, ArrowRight, Sparkles } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypeById, getArchetypesByRole } from "@/data/archetypes";
import type { VibeTag } from "@/data/collections/types";
import MaterialSlotPicker, { type SlotKey, type SlotSelections, SLOT_KEY_TO_ROLE } from "../controls/MaterialSlotPicker";
import VibePickerView from "./VibePickerView";
import { useGraphMaterials, getMaterialByCode } from "@/hooks/useGraphMaterials";
import { invalidateCollectionShowroomCache } from "@/lib/collection-utils";


// ─── Palette key mapping ───────────────────────────────────────────────────
const SLOT_TO_PALETTE_KEY: Record<SlotKey, string | null> = {
  floor: "floor",
  mainFronts: "bottomCabinets",
  additionalFronts: "topCabinets",
  worktops: "worktops",
  accents: "accents",
  mainTiles: "tiles",
  additionalTiles: "additionalTiles",
};

// Reverse mapping for restoring state from materialOverrides on mount
const PALETTE_KEY_TO_SLOT: Record<string, SlotKey> = {
  floor: "floor",
  bottomCabinets: "mainFronts",
  topCabinets: "additionalFronts",
  worktops: "worktops",
  accents: "accents",
  tiles: "mainTiles",
  additionalTiles: "additionalTiles",
};

// ─── Piece geometry ────────────────────────────────────────────────────────
interface Piece {
  slot: SlotKey;
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: string;
  zIndex: number;
  shadow: string;
  borderRadius?: string;
}

// Layering order (back → front): floor → additionalTiles → mainTiles → mainFronts → additionalFronts → worktops → accents
const PIECES: Piece[] = [
  { slot: "floor",            top: "13%", left: "10%", width: "84%", height: "66%",
    rotate: "0deg", zIndex: 1, shadow: "0 1px 2px rgba(0,0,0,0.06)" },
  { slot: "additionalFronts", top: "30%", left: "56%", width: "42%", height: "41%",
    rotate: "0deg", zIndex: 4, shadow: "0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)" },
  { slot: "mainFronts",       top: "53%", left: "15%", width: "38%", height: "32%",
    rotate: "0deg", zIndex: 5, shadow: "0 6px 18px rgba(0,0,0,0.20), 0 2px 5px rgba(0,0,0,0.08)" },
  { slot: "worktops",         top: "48%", left: "34%", width: "29%", height: "25%",
    rotate: "0deg", zIndex: 6, shadow: "0 8px 22px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.09)" },
  { slot: "accents",          top: "67%", left: "62%", width: "18%", height: "14%",
    rotate: "0deg", zIndex: 7, shadow: "0 10px 28px rgba(0,0,0,0.28), 0 3px 8px rgba(0,0,0,0.12)", borderRadius: "50%" },
];

// ─── SVG annotation definitions ───────────────────────────────────────────
interface AnnotationDef {
  surfaceKey: SlotKey;
  labelKey?: string;
  tx: string; ty: string;
  x1: string; y1: string;
  px: string; py: string;
}

const ANNOTATION_DEFS: AnnotationDef[] = [
  { surfaceKey: "floor",            tx: "56%", ty: "7%",  x1: "62%", y1: "8.5%",  px: "68%", py: "14%" },
  { surfaceKey: "additionalFronts", labelKey: "fronts", tx: "10%", ty: "93%", x1: "18%", y1: "90.5%", px: "28%", py: "81%" },
  { surfaceKey: "accents",          tx: "58%", ty: "93%", x1: "64%", y1: "90.5%", px: "70%", py: "78%" },
];

const DISPLAYED_SLOTS: SlotKey[] = ["floor", "mainFronts", "additionalFronts", "worktops", "accents"];

// Palette keys (materialOverrides) → moodboard slot keys, for the surfaces shown in the flatlay
const MOODBOARD_PK_TO_SLOT: Record<string, SlotKey> = {
  floor: "floor",
  bottomCabinets: "mainFronts",
  topCabinets: "additionalFronts",
  worktops: "worktops",
  accents: "accents",
};

// ─── Component ────────────────────────────────────────────────────────────
export default function MoodboardView() {
  const { design, materialOverrides, setMaterialOverrides, setActiveTab, handleSelectMaterial, setActivePalette, vibeTag, vibeChosen, setVibeTag, clearVibeTag, skipVibePicker, resetVibeChoice, isSharedSession, sharedMoodboardSlots } = useDesign();
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";
  const { activeShowroom } = useShowroom();

  const { loading: graphLoading, graphMaterials, getBestSwapCode, getRecommendedCodes, isCompatibleWithOthers } = useGraphMaterials();

  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem("moodboard-hint-seen"); } catch { return true; }
  });

  const dismissHint = () => {
    if (!showHint) return;
    try { localStorage.setItem("moodboard-hint-seen", "1"); } catch {}
    setShowHint(false);
  };

  const [slotSelections, setSlotSelections] = useState<SlotSelections>(() => {
    // Shared session: use the host's selections, skip local storage
    if (isSharedSession && sharedMoodboardSlots) {
      return {
        floor: null, mainFronts: null, worktops: null,
        additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null,
        ...sharedMoodboardSlots,
      } as SlotSelections;
    }

    // Restore from localStorage if available, fixing any stale archetype IDs
    try {
      const saved = localStorage.getItem("moodboard-slot-selections");
      if (saved) {
        const parsed = JSON.parse(saved) as SlotSelections;
        // Validate each slot's stored archetypeId against the actual archetypes.
        // Stale values (e.g. 'metallic' for accents) are replaced with the
        // materialOverrides technical code, which for accents equals the archetype ID.
        (Object.keys(parsed) as SlotKey[]).forEach((k) => {
          const id = parsed[k];
          if (!id) return;
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

    // Fallback: derive from current DesignContext state
    const initial: SlotSelections = {
      floor: null, mainFronts: null, worktops: null,
      additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null,
    };
    for (const [paletteKey, matId] of Object.entries(materialOverrides)) {
      const slotKey = PALETTE_KEY_TO_SLOT[paletteKey];
      if (slotKey) initial[slotKey] = matId;
    }
    if (!initial.floor) initial.floor = "light-wood";
    return initial;
  });

  const slotSelectionsRef = useRef(slotSelections);
  slotSelectionsRef.current = slotSelections;

  // Persist slot selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
  }, [slotSelections]);

  // When the Supabase graph cache loads, rebuild the collection showroom index
  // so collectionHasShowroom uses Supabase showroomIds instead of the TS fallback.
  useEffect(() => {
    if (!graphLoading) invalidateCollectionShowroomCache();
  }, [graphLoading]);

  // On mount (after graph loads): resolve archetype IDs → product codes in materialOverrides.
  // Skips slots that already have a valid technical code; replaces stale archetype IDs.
  useEffect(() => {
    if (graphLoading) return;
    const validCodes = new Set(graphMaterials.map((m) => m.technicalCode));
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(slotSelectionsRef.current) as SlotKey[]).forEach((k) => {
        const aId = slotSelectionsRef.current[k];
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk || !aId) return;
        // Skip if already set to a real product code
        if (next[pk] && validCodes.has(next[pk])) return;
        const role = SLOT_KEY_TO_ROLE[k];
        const resolved = graphMaterials.find((m) => m.archetypeId === aId && m.role.includes(role));
        if (resolved) next[pk] = resolved.technicalCode;
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphLoading]);

  // Sync slotSelections when design-tab bubble rail changes a moodboard-relevant surface.
  // Uses graphMaterials to reverse-look-up archetypeId from a product code.
  useEffect(() => {
    if (graphLoading) return;
    setSlotSelections((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [pk, slotKey] of Object.entries(MOODBOARD_PK_TO_SLOT)) {
        const matId = materialOverrides[pk];
        if (!matId) continue;
        const graphMat = graphMaterials.find((m) => m.technicalCode === matId);
        let archetypeId: string | null = graphMat?.archetypeId ?? null;
        // Fallback: matId might itself be an archetype ID (no-graph-match path)
        if (!archetypeId && getArchetypeById(matId, SLOT_KEY_TO_ROLE[slotKey])) archetypeId = matId;
        if (archetypeId && next[slotKey] !== archetypeId) {
          next[slotKey] = archetypeId;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialOverrides, graphLoading]);

  // Actual displayed material codes for all slots other than the open one
  const otherMaterialCodesForPicker = useMemo(() => {
    if (!openSlot) return [];
    return (Object.entries(SLOT_TO_PALETTE_KEY) as [SlotKey, string | null][])
      .filter(([k]) => k !== openSlot)
      .map(([, pk]) => (pk ? materialOverrides[pk] : null))
      .filter((c): c is string => !!c);
  }, [openSlot, materialOverrides]);

  const handleSlotSelect = useCallback(
    (slotKey: SlotKey, archetypeId: string, resolvedCode?: string) => {
      const newSelections = { ...slotSelections, [slotKey]: archetypeId };
      setSlotSelections(newSelections);
      trackEvent(AnalyticsEvents.MOODBOARD_MATERIAL_SELECTED, {
        slot: slotKey,
        material_id: archetypeId,
        was_replacing: slotSelections[slotKey] !== null,
        filled_count: DISPLAYED_SLOTS.filter((k) => Boolean(newSelections[k])).length,
      });

      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      // Use the exact code the picker resolved (image ↔ selection parity).
      // Fall back to first graph candidate, then archetypeId itself — always update
      // materialOverrides so the flatlay image and compatibility icons never lag behind.
      const matCode = resolvedCode
        ?? graphMaterials.find((m) => m.archetypeId === archetypeId && m.role.includes(SLOT_KEY_TO_ROLE[slotKey]))?.technicalCode
        ?? archetypeId;
      if (pk) {
        setMaterialOverrides((prev) => ({ ...prev, [pk]: matCode }));
      }
    },
    [slotSelections, setMaterialOverrides, graphMaterials],
  );

  const allSlotsFilled = DISPLAYED_SLOTS.every((k) => Boolean(slotSelections[k]));
  const filledCount = DISPLAYED_SLOTS.filter((k) => Boolean(slotSelections[k])).length;
  const mainSlotsFilled = (["floor", "mainFronts", "additionalFronts", "worktops"] as SlotKey[]).every((k) => Boolean(slotSelections[k]));

  const handleClearSlots = useCallback(() => {
    trackEvent(AnalyticsEvents.MOODBOARD_SLOTS_RESET, {});
    handleSelectMaterial(null);
    setSlotSelections({ floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(SLOT_TO_PALETTE_KEY).forEach((k) => { if (k) delete next[k]; });
      return next;
    });
  }, [handleSelectMaterial, setMaterialOverrides]);

  const handleSlotClear = useCallback((slotKey: SlotKey) => {
    trackEvent(AnalyticsEvents.MOODBOARD_MATERIAL_CLEARED, {
      slot: slotKey,
      material_id: slotSelections[slotKey],
    });
    const newSelections = { ...slotSelections, [slotKey]: null };
    setSlotSelections(newSelections);
    const pk = SLOT_TO_PALETTE_KEY[slotKey];
    if (pk) setMaterialOverrides((prev) => { const next = { ...prev }; delete next[pk]; return next; });
  }, [slotSelections, setMaterialOverrides]);

  // Show vibe picker until user has made a deliberate choice (pick a vibe or skip to see all)
  if (!vibeTag && !vibeChosen) return <VibePickerView />;


  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className="px-4 pt-4 pb-6 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-10">

        {/* ── Vibe pill + reset row ── */}
        <div className="mb-2 flex items-center justify-between lg:mb-6">
          {vibeTag ? (
            <div className="flex items-center gap-1">
              {/* Tap label → back to picker */}
              <button
                onClick={resetVibeChoice}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors active:scale-95"
              >
                <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-500">
                  {t(`vibe.${vibeTag}`)}
                </span>
              </button>
              {/* × → clear filter, stay in moodboard */}
              <button
                onClick={clearVibeTag}
                className="flex items-center justify-center w-5 h-5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors active:scale-95"
                aria-label={t("vibe.clearFilter")}
              >
                <X className="w-2.5 h-2.5 text-neutral-400" strokeWidth={2} />
              </button>
            </div>
          ) : (
            /* No active vibe — show "All" pill with option to pick a vibe */
            <button
              onClick={resetVibeChoice}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors active:scale-95"
            >
              <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-500">
                {t("vibe.all")}
              </span>
            </button>
          )}
          {/* Right side: room context + optional clear — mobile only */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-400">
              {t("moodboard.room")}
            </span>
            {filledCount > 0 && (
              <button
                onClick={handleClearSlots}
                className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity active:scale-95"
              >
                <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-600">
                  {t("moodboard.clear")}
                </span>
                <RotateCcw className="w-3 h-3 text-neutral-600" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* ── Two-column grid: stacks on mobile, side-by-side on desktop ── */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center">

        {/* LEFT column */}
        <div>

          {/* Desktop-only: room label left, clear right — directly above canvas */}
          <div className="hidden lg:flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-neutral-400">
              {t("moodboard.room")}
            </span>
            {filledCount > 0 && (
              <button
                onClick={handleClearSlots}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity active:scale-95"
              >
                <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-neutral-400">
                  {t("moodboard.clear")}
                </span>
                <RotateCcw className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Canvas */}
          <div
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: "4/4.9" }}
          >
          {/* Background */}
          <div className="absolute inset-2 rounded-2xl bg-neutral-50" />
          {/* Material cut-sample pieces */}
          {PIECES.map((piece, i) => {
            if (piece.slot === "accents" && !mainSlotsFilled) return null;
            const archetypeId = slotSelections[piece.slot];
            const pk = SLOT_TO_PALETTE_KEY[piece.slot];
            const overrideCode = pk ? (materialOverrides[pk] ?? "") : "";
            const tileImage = overrideCode
              ? (getMaterialByCode(overrideCode)?.imageUrl ?? null)
              : null;
            const currentMatId = pk ? (materialOverrides[pk] ?? null) : null;

            // Graph-based best swap for this slot
            const otherCodes = Object.entries(SLOT_TO_PALETTE_KEY)
              .filter(([k]) => k !== piece.slot)
              .map(([, v]) => v ? materialOverrides[v] : null)
              .filter((c): c is string => !!c);
            const graphBestCode = (!graphLoading && currentMatId && otherCodes.length > 0)
              ? getBestSwapCode(currentMatId, otherCodes, SLOT_KEY_TO_ROLE[piece.slot])
              : null;
            const showIndicator = !graphLoading && !!archetypeId && !!currentMatId && otherCodes.length > 0;
            const isCompatible = showIndicator ? isCompatibleWithOthers(currentMatId, otherCodes) : null;
            const showVerified = isCompatible === true;
            const showNudge   = isCompatible === false && !!graphBestCode;
            return (
              <div
                key={i}
                className="absolute active:scale-[0.97] transition-transform"
                style={{
                  top: piece.top,
                  left: piece.left,
                  width: piece.width,
                  height: piece.height,
                  transform: `rotate(${piece.rotate})`,
                  zIndex: piece.zIndex,
                }}
              >
                <div
                  className="w-full h-full overflow-hidden"
                  style={{
                    borderRadius: piece.borderRadius ?? "4px",
                    boxShadow: piece.shadow,
                  }}
                >
                  <button
                    onClick={() => { dismissHint(); setOpenSlot(piece.slot); }}
                    className="w-full h-full"
                    aria-label={`Pick ${piece.slot}`}
                  >
                    {tileImage ? (
                      <img
                        src={tileImage}
                        alt={getArchetypeById(archetypeId, SLOT_KEY_TO_ROLE[piece.slot])?.label[lang] ?? piece.slot}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <Plus
                          className={`w-4 h-4 text-neutral-300 ${filledCount === 0 ? "animate-slot-breathe" : ""}`}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </button>
                </div>
                {archetypeId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSlotClear(piece.slot); }}
                    className="absolute top-1 right-1 flex items-center justify-center rounded-full"
                    style={{ zIndex: 1 }}
                    aria-label={`Clear ${piece.slot}`}
                  >
                    <X className="w-2.5 h-2.5 text-neutral-100" strokeWidth={1.5} style={{ opacity: 0.4 }} />
                  </button>
                )}
                {showVerified && (
                  <div className="absolute top-1 left-1" style={{ zIndex: 1 }}>
                    <Check className="w-3 h-3" style={{ color: '#ffffff', opacity: 0.5 }} strokeWidth={2} />
                  </div>
                )}
                {showNudge && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pk && graphBestCode) setMaterialOverrides((prev) => ({ ...prev, [pk]: graphBestCode }));
                    }}
                    className="absolute top-1 left-1 flex items-center justify-center rounded-full bg-white/20 p-0.5 active:scale-90 transition-transform"
                    style={{ zIndex: 1 }}
                    aria-label={`Sync ${piece.slot} to suggested material`}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: '#ffffff', opacity: 0.85 }} />
                  </button>
                )}
              </div>
            );
          })}

          {/* First-time hint overlay */}
          <div
            className={`absolute inset-x-0 bottom-4 flex justify-center pointer-events-none transition-opacity duration-300 ${showHint && filledCount === 0 ? "opacity-100" : "opacity-0"}`}
          >
            <div
              className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5"
              style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}
            >
              <span className="text-[9px] font-medium text-black/70 whitespace-nowrap">
                {t("moodboard.tapHint")}
              </span>
              <span className="text-black/40 text-[9px]">↑</span>
            </div>
          </div>

          {/* ── Annotation overlay (SVG, pointer-events:none) ── */}
          <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            aria-hidden="true"
          >
            {ANNOTATION_DEFS.map(({ surfaceKey, labelKey, tx, ty, x1, y1, px, py }, i) => {
              if (surfaceKey === "accents" && !mainSlotsFilled) return null;
              const label = t(`surface.${labelKey ?? surfaceKey}`).toUpperCase();
              return (
                <g key={i}>
                  <line
                    x1={x1} y1={y1}
                    x2={px} y2={py}
                    stroke="#d4d4d4"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                  />
                  <circle cx={px} cy={py} r="1.5" fill="#d4d4d4" />
                  <text
                    x={tx} y={ty}
                    dy="-2"
                    fontSize="8"
                    letterSpacing="2.4"
                    fill="#737373"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    textAnchor="start"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
          </div>{/* end canvas */}
        </div>{/* end LEFT column */}

        {/* RIGHT: controls */}
        <div className="mt-4 lg:mt-0">
        <div className="lg:max-w-[400px] lg:mx-auto">

        {/* ── Instruction ── */}
        {!allSlotsFilled && (
          <div className="mt-3 lg:mt-0 lg:mb-6">
            <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center lg:font-serif lg:text-xl lg:normal-case lg:tracking-normal lg:text-neutral-700 lg:text-left">
              {filledCount === 0 ? t("moodboard.pickFirst") : t("moodboard.pickRemaining")}
            </p>
            <div className="hidden lg:block mt-6 border-t border-neutral-100" style={{ borderTopWidth: '0.5px' }} />
          </div>
        )}

        {/* ── CTA buttons ── */}
        <div className="mt-3 flex items-center justify-between gap-2 lg:flex-col lg:items-stretch lg:gap-3 lg:mt-6">

          {/* Visualize — filled black (primary action) */}
          <button
            onClick={() => setActiveTab("design")}
            disabled={!allSlotsFilled}
            className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 transition-colors active:scale-[0.97] disabled:opacity-30 lg:flex-none lg:h-12 lg:px-6">
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-white lg:text-sm lg:normal-case lg:tracking-normal">
              {t("moodboard.visualize")}
            </span>
            <ArrowRight className="w-3 h-3 text-white lg:w-4 lg:h-4" strokeWidth={1} />
          </button>

          {/* Where to find — ghost */}
          <button
            onClick={() => setActiveTab("specs")}
            disabled={!allSlotsFilled}
            className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-transparent hover:bg-neutral-50 transition-colors active:scale-[0.97] disabled:opacity-30 lg:flex-none lg:h-12 lg:px-6">
            <span className={`text-[8px] uppercase tracking-[0.2em] font-medium lg:text-sm lg:normal-case lg:tracking-normal ${allSlotsFilled ? "text-neutral-600" : "text-neutral-400"}`}>
              {t("moodboard.findMaterials")}
            </span>
            <ArrowRight className={`w-3 h-3 lg:w-4 lg:h-4 ${allSlotsFilled ? "text-neutral-600" : "text-neutral-400"}`} strokeWidth={1} />
          </button>
        </div>

        </div>{/* end max-w-[400px] */}
        </div>{/* end RIGHT controls */}
        </div>{/* end two-column grid */}

      </div>

      <MaterialSlotPicker
        slot={openSlot}
        selections={slotSelections}
        onSelect={handleSlotSelect}
        onClose={() => setOpenSlot(null)}
        onClear={handleSlotClear}
        otherMaterialCodes={otherMaterialCodesForPicker}
        selectedMaterialCode={openSlot && SLOT_TO_PALETTE_KEY[openSlot] ? (materialOverrides[SLOT_TO_PALETTE_KEY[openSlot]!] ?? undefined) : undefined}
        getRecommendedCodes={getRecommendedCodes}
        graphMaterials={graphMaterials}
      />

    </div>
  );
}
