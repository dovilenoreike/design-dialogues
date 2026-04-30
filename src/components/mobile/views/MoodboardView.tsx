import React, { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { toast } from "sonner";
import { RotateCcw, Plus, Check, X, ArrowLeft, Sparkles, Camera, Info, Layers, Search, Settings } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypeById, getArchetypesByRole } from "@/data/archetypes";
import MaterialSlotPicker, { type SlotKey, type SlotSelections, SLOT_KEY_TO_ROLE } from "../controls/MaterialSlotPicker";

import PaletteReviewSheet, { type ReviewMaterial } from "../controls/PaletteReviewSheet";
import InspirationUploadDialog from "../controls/InspirationUploadDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGraphMaterials, getMaterialByCode, getPairCountByCode } from "@/hooks/useGraphMaterials";


// ─── Palette key mapping ───────────────────────────────────────────────────
const SLOT_TO_PALETTE_KEY: Record<SlotKey, string | null> = {
  floor: "floor",
  mainFronts: "bottomCabinets",
  additionalFronts: "topCabinets",
  tertiaryFronts: "tallCabinets",
  worktops: "worktops",
  accents: "accents",
  mainTiles: "tiles",
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

// Reverse mapping for restoring state from materialOverrides on mount
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

// Layering order (back → front): floor → additionalTiles → mainTiles → tertiaryFronts → additionalFronts → mainFronts → worktops → accents
const PIECES: Piece[] = [
  { slot: "floor",            top: "13%", left: "10%", width: "84%", height: "66%",
    rotate: "0deg", zIndex: 1, shadow: "0 1px 2px rgba(0,0,0,0.06)" },
  { slot: "tertiaryFronts",       top: "35%", left: "23%", width: "52%", height: "47%",
    rotate: "0deg", zIndex: 2, shadow: "0 3px 10px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)" },
  { slot: "mainFronts",       top: "30%", left: "56%", width: "42%", height: "41%",
    rotate: "0deg", zIndex: 4, shadow: "0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)" },
  { slot: "additionalFronts", top: "53%", left: "15%", width: "38%", height: "32%",
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

// Optional slots — hidden by default, toggled via the config sheet
const OPTIONAL_SLOTS: SlotKey[] = ["tertiaryFronts"];

const SLOT_PLACEHOLDER: Partial<Record<SlotKey, string>> = {
  floor:            "/placeholders/floor.webp",
  mainFronts:       "/placeholders/mainFronts.webp",
  additionalFronts: "/placeholders/additionalFronts.webp",
  tertiaryFronts:       "/placeholders/tertiaryFronts.webp",
  worktops:         "/placeholders/worktops.webp",
  accents:          "/placeholders/accents.webp",
};

// Palette keys (materialOverrides) → moodboard slot keys, for the surfaces shown in the flatlay
const MOODBOARD_PK_TO_SLOT: Record<string, SlotKey> = {
  floor: "floor",
  bottomCabinets: "mainFronts",
  topCabinets: "additionalFronts",
  tallCabinets: "tertiaryFronts",
  worktops: "worktops",
  accents: "accents",
};

// ─── Info modal content ────────────────────────────────────────────────────
function InfoRows({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col gap-4">
      <InfoRow icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.infoStep1Title")} desc={t("moodboard.infoStep1Desc")} />
      <InfoRow icon={<Check className="w-3.5 h-3.5" strokeWidth={2} />} title={t("moodboard.infoCheckTitle")} desc={t("moodboard.infoCheckDesc")} />
      <InfoRow icon={<Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />} title={t("moodboard.infoSparklesTitle")} desc={t("moodboard.infoSparklesDesc")} />
      <InfoRow icon={<RotateCcw className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.infoUndoTitle")} desc={t("moodboard.infoUndoDesc")} />
      <div style={{ height: "0.5px", backgroundColor: "rgba(0,0,0,0.08)" }} />
      <InfoRow icon={<Layers className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.infoGoesTitle")} desc={t("moodboard.infoGoesDesc")} />
      <InfoRow icon={<Search className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.infoSearchTitle")} desc={t("moodboard.infoSearchDesc")} />
    </div>
  );
}

// ─── Info sheet row helper ─────────────────────────────────────────────────
function InfoRow({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
      >
        {icon}
      </span>
      <div>
        <p className="text-[12px] font-medium text-black/70">{title}</p>
        <p className="text-[11px] text-black/45 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ─── Surface config list ──────────────────────────────────────────────────
function SurfaceConfigList({
  optionalSlots, enabledOptionalSlots, setEnabledOptionalSlots, handleSlotClear, t, language,
}: {
  optionalSlots: SlotKey[];
  enabledOptionalSlots: Set<SlotKey>;
  setEnabledOptionalSlots: React.Dispatch<React.SetStateAction<Set<SlotKey>>>;
  handleSlotClear: (slot: SlotKey) => void;
  t: (key: string) => string;
  language: string;
}) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
      {optionalSlots.map(slotKey => {
        const enabled = enabledOptionalSlots.has(slotKey);
        const label = t(`surface.${slotKey}`) || slotKey;
        return (
          <div key={slotKey} className="flex items-center justify-between py-3">
            <div>
              <p className="text-[13px] text-black/70">{label}</p>
              <p className="text-[11px] text-black/35 mt-0.5">
                {language === "lt" ? "Papildomas paviršius" : "Optional surface"}
              </p>
            </div>
            <button
              onClick={() => {
                if (enabled) {
                  setEnabledOptionalSlots(prev => { const s = new Set(prev); s.delete(slotKey); return s; });
                  handleSlotClear(slotKey);
                } else {
                  setEnabledOptionalSlots(prev => new Set([...prev, slotKey]));
                }
              }}
              className="w-10 h-6 rounded-full flex items-center px-0.5 transition-colors"
              style={{ backgroundColor: enabled ? "#647d75" : "rgba(0,0,0,0.12)" }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: enabled ? "translateX(16px)" : "translateX(0)" }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────
export default function MoodboardView() {
  const { materialOverrides, setMaterialOverrides, setActiveTab, vibeTag, clearVibeTag, resetVibeChoice, isSharedSession, sharedMoodboardSlots, shareSession } = useDesign();
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";
  const { activeShowroom } = useShowroom();
  const isMobile = useIsMobile();

  const { loading: graphLoading, graphMaterials, getBestSwapCode, getRecommendedCodes, isCompatibleWithOthers } = useGraphMaterials();
  const [searchParams, setSearchParams] = useSearchParams();

  // Apply ?material=CODE url param once graph is loaded (for showroom QR codes)
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
      setActiveTab("moodboard");
      setSearchParams((prev) => { prev.delete("material"); return prev; }, { replace: true });
    }
  }, [graphLoading]);

  // Always-active slot — picker is always visible (no open/close)
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const flatlayRef = useRef<HTMLDivElement>(null);
  const [lastSwap, setLastSwap] = useState<{ pk: string; fromCode: string; toCode: string } | null>(null);
  const swapJustAppliedRef = useRef(false);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem("moodboard-hint-seen"); } catch { return true; }
  });

  const [showInspirationDialog, setShowInspirationDialog] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showConfigSheet, setShowConfigSheet] = useState(false);
  const [enabledOptionalSlots, setEnabledOptionalSlots] = useState<Set<SlotKey>>(new Set());

  const dismissHint = () => {
    if (!showHint) return;
    try { localStorage.setItem("moodboard-hint-seen", "1"); } catch {}
    setShowHint(false);
  };

  // Clear undo state on any subsequent materialOverrides change (skip the swap itself)
  useEffect(() => {
    if (!lastSwap) return;
    if (swapJustAppliedRef.current) { swapJustAppliedRef.current = false; return; }
    setLastSwap(null);
  }, [materialOverrides]); // eslint-disable-line react-hooks/exhaustive-deps

  const [slotSelections, setSlotSelections] = useState<SlotSelections>(() => {
    // Shared session: use the host's selections, skip local storage
    if (isSharedSession && sharedMoodboardSlots) {
      return {
        floor: null, mainFronts: null, worktops: null,
        additionalFronts: null, tertiaryFronts: null, accents: null, mainTiles: null, additionalTiles: null,
        ...sharedMoodboardSlots,
      } as SlotSelections;
    }

    // Restore from localStorage if available, fixing any stale archetype IDs
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
          // Migrate renamed accent archetype IDs
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

    // Fallback: derive from current DesignContext state
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

  const slotSelectionsRef = useRef(slotSelections);
  slotSelectionsRef.current = slotSelections;

  // Persist slot selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
  }, [slotSelections]);

  // On mount (after graph loads): resolve archetype IDs → product codes in materialOverrides.
  useEffect(() => {
    if (graphLoading) return;
    const validCodes = new Set(graphMaterials.map((m) => m.technicalCode));
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(slotSelectionsRef.current) as SlotKey[]).forEach((k) => {
        const aId = slotSelectionsRef.current[k];
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

  // Sync slotSelections when design-tab bubble rail changes a moodboard-relevant surface.
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
        if (!archetypeId && getArchetypeById(matId, SLOT_KEY_TO_ROLE[slotKey])) archetypeId = matId;
        // Fallback: if we still can't derive an archetype ID but the slot is currently empty,
        // use matId so the slot is marked as filled (icons, X, isFirstPick all depend on this)
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

  // Restrict picker to showroom materials for the showroom's own surface categories
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
      const matCode = resolvedCode
        ?? showroomMaterials.find((m) => m.archetypeId === archetypeId && m.role.includes(SLOT_KEY_TO_ROLE[slotKey]))?.technicalCode
        ?? archetypeId;
      if (pk) {
        setMaterialOverrides((prev) => ({ ...prev, [pk]: matCode }));
      }
      // Only scroll to flatlay on first pick — refinement clicks (row2/row3) should
      // keep the picker in view so the user can continue drilling down.
      const isFirstPick = slotSelections[slotKey] === null;
      if (isFirstPick) {
        flatlayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [slotSelections, setMaterialOverrides, showroomMaterials],
  );

  const allSlotsFilled = DISPLAYED_SLOTS.every((k) => Boolean(slotSelections[k]));
  const filledCount = DISPLAYED_SLOTS.filter((k) => Boolean(slotSelections[k])).length;
  const mainSlotsFilled = (["floor", "mainFronts", "additionalFronts", "worktops"] as SlotKey[]).every((k) => Boolean(slotSelections[k]));

  const [showReviewSheet, setShowReviewSheet] = useState(false);

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
      return {
        slot: slotKey,
        name: mat?.name?.en ?? code,
        code,
        compatible,
      };
    });
  }, [allSlotsFilled, materialOverrides, isCompatibleWithOthers]);

  const handleClearSlots = useCallback(() => {
    trackEvent(AnalyticsEvents.MOODBOARD_SLOTS_RESET, {});
    setSlotSelections({ floor: null, mainFronts: null, worktops: null, additionalFronts: null, tertiaryFronts: null, accents: null, mainTiles: null, additionalTiles: null });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(SLOT_TO_PALETTE_KEY).forEach((k) => { if (k) delete next[k]; });
      return next;
    });
  }, [setMaterialOverrides]);

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


  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden lg:overflow-hidden lg:flex lg:flex-row" onClick={() => setActiveSlot(null)}>

      {/* ── LEFT (desktop) / TOP (mobile): Flatlay ──────────────────────────── */}
      <div ref={flatlayRef} className="lg:flex-1 lg:min-w-0 lg:min-h-0 lg:overflow-y-auto">
      <div className="px-4 pt-4 pb-4 lg:px-8 lg:py-6 lg:max-w-2xl">

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 lg:pb-4">
          <span
            className="text-[11px] font-medium tracking-[0.04em] uppercase"
            style={{ color: "rgba(0,0,0,0.45)" }}
          >
            {t("moodboard.room")}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Inspiration upload button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowInspirationDialog(true); }}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: "rgba(255,255,255,0.72)", border: "0.5px solid rgba(0,0,0,0.08)" }}
              aria-label={t("inspiration.buttonLabel")}
            >
              <Camera className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.55)" }} strokeWidth={1.6} />
            </button>
            {/* Info button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowInfoSheet(true); }}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: "rgba(255,255,255,0.72)", border: "0.5px solid rgba(0,0,0,0.08)" }}
              aria-label={t("moodboard.infoButtonLabel")}
            >
              <Info className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.55)" }} strokeWidth={1.6} />
            </button>
            {/* Configure surfaces button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfigSheet(true); }}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: enabledOptionalSlots.size > 0 ? "rgba(100,125,117,0.15)" : "rgba(255,255,255,0.72)", border: enabledOptionalSlots.size > 0 ? "0.5px solid rgba(100,125,117,0.4)" : "0.5px solid rgba(0,0,0,0.08)" }}
              aria-label="Configure surfaces"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: enabledOptionalSlots.size > 0 ? "#647d75" : "rgba(0,0,0,0.55)" }} strokeWidth={1.6} />
            </button>
            {/* Clear — only when slots are filled */}
            {filledCount > 0 && (
              <button
                onClick={handleClearSlots}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: "rgba(255,255,255,0.72)", border: "0.5px solid rgba(0,0,0,0.08)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.55)" }} strokeWidth={1.6} />
              </button>
            )}
          </div>
        </div>

        {/* Canvas — original aspect ratio, no squishing */}
        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: "4/4.9" }}
          onClick={(e) => { e.stopPropagation(); setActiveSlot(null); }}
        >
            {/* Background */}
            <div className="absolute inset-2 rounded-2xl bg-neutral-50" />

            {/* Material cut-sample pieces */}
            {PIECES.map((piece, i) => {
              if (piece.slot === "accents" && !mainSlotsFilled) return null;
              if (OPTIONAL_SLOTS.includes(piece.slot) && !enabledOptionalSlots.has(piece.slot)) return null;
              const archetypeId = slotSelections[piece.slot];
              const pk = SLOT_TO_PALETTE_KEY[piece.slot];
              const overrideCode = pk ? (materialOverrides[pk] ?? "") : "";
              const tileImage = overrideCode
                ? (getMaterialByCode(overrideCode)?.imageUrl ?? null)
                : null;
              const displayImage = tileImage;
              const currentMatId = pk ? (materialOverrides[pk] ?? null) : null;

              // Graph-based best swap for this slot
              const otherCodes = Object.entries(SLOT_TO_PALETTE_KEY)
                .filter(([k]) => k !== piece.slot)
                .map(([, v]) => v ? materialOverrides[v] : null)
                .filter((c): c is string => !!c);
              const slotRole = SLOT_KEY_TO_ROLE[piece.slot];
              const rawBestCode = (!graphLoading && currentMatId && otherCodes.length > 0)
                ? getBestSwapCode(currentMatId, otherCodes, slotRole)
                : null;
              const showroomCoversSlot = activeShowroom && activeShowroom.surfaceCategories.includes(slotRole);
              const graphBestCode = (rawBestCode && showroomCoversSlot)
                ? (getMaterialByCode(rawBestCode)?.showroomIds.includes(activeShowroom!.id) ? rawBestCode : null)
                : rawBestCode;
              const showIndicator = !graphLoading && !!archetypeId && !!currentMatId && otherCodes.length > 0;
              const isCompatible = showIndicator ? isCompatibleWithOthers(currentMatId, otherCodes) : null;
              const showVerified = isCompatible === true;
              const showNudge   = isCompatible === false && !!graphBestCode;
              const isActive    = piece.slot === activeSlot;

              return (
                <div
                  key={i}
                  className="absolute active:scale-[0.97] transition-transform"
                  style={{
                    top: piece.top,
                    left: piece.left,
                    width: piece.width,
                    height: piece.height,
                    transform: `rotate(${piece.rotate})${isActive ? " scale(1.025)" : ""}`,
                    zIndex: piece.zIndex,
                  }}
                >
                  <div
                    className="w-full h-full overflow-hidden"
                    style={{
                      borderRadius: piece.borderRadius ?? "4px",
                      boxShadow: isActive
                        ? `${piece.shadow}, 0 0 0 2px rgba(255,255,255,0.72)`
                        : piece.shadow,
                      transition: "box-shadow 200ms ease",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissHint();
                        if (activeSlot === piece.slot) {
                          setActiveSlot(null);
                        } else {
                          setActiveSlot(piece.slot);
                          requestAnimationFrame(() => {
                            pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          });
                        }
                      }}
                      className="w-full h-full"
                      aria-label={`Pick ${piece.slot}`}
                    >
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={getArchetypeById(archetypeId, SLOT_KEY_TO_ROLE[piece.slot])?.label[lang] ?? piece.slot}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          {SLOT_PLACEHOLDER[piece.slot] ? (
                            <>
                              <img
                                src={SLOT_PLACEHOLDER[piece.slot]}
                                alt={piece.slot}
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Plus
                                  className={`w-4 h-4 text-white/80 ${filledCount === 0 ? "animate-slot-breathe" : ""}`}
                                  strokeWidth={1.5}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                              <Plus
                                className={`w-4 h-4 text-neutral-300 ${filledCount === 0 ? "animate-slot-breathe" : ""}`}
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
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
                        if (pk && graphBestCode && currentMatId) {
                          swapJustAppliedRef.current = true;
                          setLastSwap({ pk, fromCode: currentMatId, toCode: graphBestCode });
                          setMaterialOverrides((prev) => ({ ...prev, [pk]: graphBestCode }));
                        }
                      }}
                      className="absolute top-0 left-0 flex items-center justify-center p-3.5 active:scale-90 transition-transform"
                      style={{ zIndex: 1 }}
                      aria-label={`Sync ${piece.slot} to suggested material`}
                    >
                      <span className="flex items-center justify-center rounded-full bg-white/20 p-0.5">
                        <Sparkles className="w-3 h-3" style={{ color: '#ffffff', opacity: 0.85 }} />
                      </span>
                    </button>
                  )}
                  {pk && lastSwap?.pk === pk && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMaterialOverrides((prev) => ({ ...prev, [lastSwap.pk]: lastSwap.fromCode }));
                        setLastSwap(null);
                      }}
                      className="absolute top-0 left-0 flex items-center justify-center p-3.5 active:scale-90 transition-transform"
                      style={{ zIndex: 1 }}
                      aria-label="Undo swap"
                    >
                      <span className="flex items-center justify-center rounded-full bg-white/20 p-0.5">
                        <RotateCcw className="w-3 h-3" style={{ color: '#ffffff', opacity: 0.85 }} />
                      </span>
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

            {/* Annotation overlay (SVG) */}
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
        </div>

        {/* Visualize button — below flatlay */}
        <div className="flex items-center justify-center pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (allSlotsFilled) {
                setActiveTab("design");
              } else {
                const firstEmpty = DISPLAYED_SLOTS.find((k) => !slotSelections[k]) ?? DISPLAYED_SLOTS[0];
                setActiveSlot(firstEmpty);
                requestAnimationFrame(() => {
                  pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
                toast(t("mobile.stage.selectMaterialsFirst"));
              }
            }}
            className="h-8 px-3 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          >
            <Sparkles className="w-3 h-3 text-white" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-white tracking-[0.03em] whitespace-nowrap">
              {t("moodboard.visualize")}
            </span>
          </button>
        </div>

      </div>
      </div>

      {/* ── RIGHT (desktop) / BOTTOM (mobile): Inline picker ───────────────── */}
      <div
        ref={pickerRef}
        className={`${activeSlot ? 'h-[320px]' : 'h-auto'} lg:h-full lg:flex-1 lg:min-w-0 lg:min-h-0 lg:overflow-hidden mt-3 lg:mt-0 border-t lg:border-t-0 lg:border-l bg-neutral-50`}
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
            {hasIncompatibleSlots ? (
              <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-center" style={{ color: 'rgba(0,0,0,0.45)' }}>
                {t("moodboard.someNotPairing")}
              </p>
            ) : (
              <p className="text-[11px] font-medium tracking-[0.04em] uppercase text-center" style={{ color: '#647d75' }}>
                {t("moodboard.ready")}
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
                onClick={() => setActiveTab("design")}
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

      {/* Palette review sheet */}
      <PaletteReviewSheet
        isOpen={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        materials={reviewMaterials}
        onShare={shareSession}
      />


      {/* Surfaces config sheet */}
      {isMobile ? (
        <Sheet open={showConfigSheet} onOpenChange={setShowConfigSheet}>
          <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-5">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-[13px] font-semibold tracking-[0.02em]">
                {language === "lt" ? "Paviršiai" : "Surfaces"}
              </SheetTitle>
            </SheetHeader>
            <SurfaceConfigList
              optionalSlots={OPTIONAL_SLOTS}
              enabledOptionalSlots={enabledOptionalSlots}
              setEnabledOptionalSlots={setEnabledOptionalSlots}
              handleSlotClear={handleSlotClear}
              t={t}
              language={language}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showConfigSheet} onOpenChange={setShowConfigSheet}>
          <DialogContent className="max-w-sm rounded-2xl px-6 pb-7 pt-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[13px] font-semibold tracking-[0.02em]">
                {language === "lt" ? "Paviršiai" : "Surfaces"}
              </DialogTitle>
            </DialogHeader>
            <SurfaceConfigList
              optionalSlots={OPTIONAL_SLOTS}
              enabledOptionalSlots={enabledOptionalSlots}
              setEnabledOptionalSlots={setEnabledOptionalSlots}
              handleSlotClear={handleSlotClear}
              t={t}
              language={language}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Inspiration upload dialog */}
      <InspirationUploadDialog
        isOpen={showInspirationDialog}
        onClose={() => setShowInspirationDialog(false)}
      />

      {/* Moodboard info — bottom sheet on mobile, centered dialog on desktop */}
      {isMobile ? (
        <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
          <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-5">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-[13px] font-semibold tracking-[0.02em]">
                {t("moodboard.infoTitle")}
              </SheetTitle>
            </SheetHeader>
            <InfoRows t={t} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showInfoSheet} onOpenChange={setShowInfoSheet}>
          <DialogContent className="max-w-sm rounded-2xl px-6 pb-7 pt-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[13px] font-semibold tracking-[0.02em]">
                {t("moodboard.infoTitle")}
              </DialogTitle>
            </DialogHeader>
            <InfoRows t={t} />
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
