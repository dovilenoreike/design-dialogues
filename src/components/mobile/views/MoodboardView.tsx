import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { RotateCcw, Plus, Check, X, ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypeById } from "@/data/archetypes";
import { getMaterialById } from "@/data/materials";
import { collectionsV2 } from "@/data/collections/collections-v2";
import type { CollectionV2, VibeTag } from "@/data/collections/types";
import type { SurfaceCategory } from "@/data/materials/types";
import { matchCollection, findBestMatchCollection, resolveArchetypeToMaterial, resolveProductFromCollection, type SlotPick } from "@/lib/collection-matching";
import { collectionHasShowroom, getCollectionSwatches } from "@/lib/collection-utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import MaterialSlotPicker, { type SlotKey, type SlotSelections, SLOT_CATEGORY } from "../controls/MaterialSlotPicker";
import VibePickerView from "./VibePickerView";


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

// ─── Tile image resolution ─────────────────────────────────────────────────
function resolveTileImage(
  archetypeId: string | null,
  category: SurfaceCategory,
  matchedCollection?: CollectionV2 | null,
  vibeTag?: string | null,
  showroomId?: string | null,
): string | null {
  if (!archetypeId) return null;
  // Priority 1: real product photo from matched collection
  if (matchedCollection) {
    const products = matchedCollection.products[category]?.[archetypeId] ?? [];
    let materialId = showroomId
      ? products.find((id) => getMaterialById(id)?.showroomIds?.includes(showroomId))
      : undefined;
    materialId ??= products[0];
    if (materialId) {
      const mat = getMaterialById(materialId);
      if (mat?.image) return mat.image;
    }
    // Collection is identified — don't bleed into other collections; fall back to archetype image
    return getArchetypeById(archetypeId, category)?.image ?? null;
  }
  // Priority 2: product photo from vibe-filtered collections (no match yet)
  const vibeFiltered = vibeTag
    ? collectionsV2.filter((c) => c.vibe === vibeTag)
    : collectionsV2;
  for (const col of vibeFiltered) {
    const products = col.products[category]?.[archetypeId] ?? [];
    let materialId = showroomId
      ? products.find((id) => getMaterialById(id)?.showroomIds?.includes(showroomId))
      : undefined;
    materialId ??= products[0];
    if (materialId) {
      const mat = getMaterialById(materialId);
      if (mat?.image) return mat.image;
    }
  }
  // Priority 3: archetype image fallback
  return getArchetypeById(archetypeId, category)?.image ?? null;
}

// ─── Piece geometry ────────────────────────────────────────────────────────
interface Piece {
  slot: SlotKey;
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: string;
  zIndex: number;
  // Shadow: tighter for large/low elements, deeper/softer for small/high ones
  shadow: string;
  borderRadius?: string;
}

// Layering order (back → front): floor → additionalTiles → mainTiles → mainFronts → additionalFronts → worktops → accents
// Shadow escalates with zIndex so smaller/higher pieces visually lift off the surface.
const PIECES: Piece[] = [
  // FLOOR — base layer, largest piece
  { slot: "floor",            top: "13%", left: "10%", width: "84%", height: "66%",
    rotate: "0deg", zIndex: 1, shadow: "0 1px 2px rgba(0,0,0,0.06)" },

  // ADDITIONAL FRONTS — large square, lower-right
  { slot: "additionalFronts", top: "30%", left: "56%", width: "42%", height: "41%",
    rotate: "0deg", zIndex: 4, shadow: "0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)" },

  // MAIN FRONTS — medium square, lower-center
  { slot: "mainFronts",       top: "53%", left: "15%", width: "38%", height: "32%",
    rotate: "0deg", zIndex: 5, shadow: "0 6px 18px rgba(0,0,0,0.20), 0 2px 5px rgba(0,0,0,0.08)" },

  // WORKTOPS — sits above additionalFronts/mainFronts
  { slot: "worktops",         top: "48%", left: "34%", width: "29%", height: "25%",
    rotate: "0deg", zIndex: 6, shadow: "0 8px 22px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.09)" },

  // ACCENTS — smallest piece, highest in stack
  { slot: "accents",          top: "67%", left: "62%", width: "18%", height: "14%",
    rotate: "0deg", zIndex: 7, shadow: "0 10px 28px rgba(0,0,0,0.28), 0 3px 8px rgba(0,0,0,0.12)", borderRadius: "50%" },
];

// ─── SVG annotation definitions ───────────────────────────────────────────
// All coordinates as SVG % relative to container width/height.
// tx/ty  = label text anchor (baseline-start)
// x1/y1  = leader line start (near label, in white margin)
// px/py  = leader line end / terminus dot (on the piece surface)
interface AnnotationDef {
  surfaceKey: SlotKey;
  labelKey?: string;
  tx: string; ty: string;  // label text anchor
  x1: string; y1: string;  // leader line start
  px: string; py: string;  // terminus dot on piece
}

const ANNOTATION_DEFS: AnnotationDef[] = [
  // GRINDYS  — top white margin, perfectly horizontal at ty="4%"
  { surfaceKey: "floor",            tx: "56%", ty: "7%",  x1: "62%", y1: "8.5%",  px: "68%", py: "14%" },
  // FASADAI  — bottom margin, baseline locked at ty="93%"
  { surfaceKey: "additionalFronts", labelKey: "fronts", tx: "10%", ty: "93%", x1: "18%", y1: "90.5%", px: "28%", py: "81%" },
  // AKCENTAI — bottom margin, same baseline ty="93%"
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

function toSlotPicks(selections: SlotSelections, exclude?: SlotKey): SlotPick[] {
  return (Object.keys(selections) as SlotKey[])
    .filter((k) => k !== exclude && selections[k] !== null)
    .map((k) => ({ category: SLOT_CATEGORY[k], archetypeId: selections[k]! }));
}

// ─── Component ────────────────────────────────────────────────────────────
export default function MoodboardView() {
  const { design, materialOverrides, setMaterialOverrides, setActiveTab, handleSelectMaterial, setActivePalette, vibeTag, vibeChosen, setVibeTag, clearVibeTag, skipVibePicker, resetVibeChoice, isSharedSession, sharedMoodboardSlots } = useDesign();
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";
  const isMobile = useIsMobile();
  const { activeShowroom } = useShowroom();

  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem("moodboard-hint-seen"); } catch { return true; }
  });

  const dismissHint = () => {
    if (!showHint) return;
    try { localStorage.setItem("moodboard-hint-seen", "1"); } catch {}
    setShowHint(false);
  };
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [slotSelections, setSlotSelections] = useState<SlotSelections>(() => {
    // Shared session: use the host's selections, skip local storage
    if (isSharedSession && sharedMoodboardSlots) {
      return {
        floor: null, mainFronts: null, worktops: null,
        additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null,
        ...sharedMoodboardSlots,
      } as SlotSelections;
    }

    // Restore from localStorage if available
    try {
      const saved = localStorage.getItem("moodboard-slot-selections");
      if (saved) return JSON.parse(saved) as SlotSelections;
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
    // Default floor for brand-new users with no prior state
    if (!initial.floor) initial.floor = "light-wood";
    return initial;
  });

  const slotSelectionsRef = useRef(slotSelections);
  slotSelectionsRef.current = slotSelections; // kept current on every render (no useEffect needed)

  // Tracks whether the current selectedCollectionId was set by an explicit user action
  // (handleCollectionSelect / handleSwitchCollection). When true, handleSlotSelect will
  // not overwrite selectedCollectionId as long as the new archetype still fits.
  const isCollectionManuallySelected = useRef(false);

  // Persist slot selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
  }, [slotSelections]);

  // On mount: sync materialOverrides from restored localStorage data.
  // Resolve through matchCollection so real product IDs are used (not raw archetype IDs),
  // matching the same logic in handleSlotSelect.
  // IMPORTANT: only fills in slots that have NO existing override — this preserves
  // any specific product choices the user made in the design tab bubble rail, so the
  // funnel moodboard → design → specs stays coherent across tab navigation.
  useEffect(() => {
    const matched = matchCollection(collectionsV2, toSlotPicks(slotSelections), vibeTag);
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(slotSelections) as SlotKey[]).forEach((k) => {
        const aId = slotSelections[k];
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk) return;
        if (pk in next) return; // preserve design-tab overrides — never overwrite on remount
        if (!aId) return; // nothing to set for unfilled slots
        if (matched) {
          const products = matched.products[SLOT_CATEGORY[k]]?.[aId] ?? [];
          let resolvedMatId = activeShowroom
            ? products.find((id) => getMaterialById(id)?.showroomIds?.includes(activeShowroom.id))
            : undefined;
          resolvedMatId ??= products[0];
          if (resolvedMatId) next[pk] = resolvedMatId;
        } else {
          next[pk] = aId;
        }
      });
      return next;
    });
    // Sync design.selectedMaterial so the Design tab's bubble rail and MaterialsSummary
    // are visible without the user having to interact with the moodboard first.
    // Only sets if currently null — the DB reload effect will overwrite with the persisted
    // value anyway if one exists.
    if (matched) setActivePalette(matched.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  // Sync slotSelections when design-tab bubble rail changes a moodboard-relevant surface.
  // Maps palette keys → slot keys, then reverse-looks-up the archetype ID so the flatlay
  // reflects the same archetype chosen in the design tab.
  useEffect(() => {
    setSlotSelections((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [pk, slotKey] of Object.entries(MOODBOARD_PK_TO_SLOT)) {
        const matId = materialOverrides[pk];
        if (!matId) continue;

        const category = SLOT_CATEGORY[slotKey];

        // Find which archetype this product belongs to across all collections
        let archetypeId: string | null = null;
        outer: for (const col of collectionsV2) {
          const byArchetype = col.products[category];
          if (!byArchetype) continue;
          for (const [aId, matIds] of Object.entries(byArchetype)) {
            if ((matIds as string[]).includes(matId)) { archetypeId = aId; break outer; }
          }
        }
        // Fallback: matId might itself be an archetype ID (no-collection-match path)
        if (!archetypeId && getArchetypeById(matId, category)) archetypeId = matId;

        if (archetypeId && next[slotKey] !== archetypeId) {
          next[slotKey] = archetypeId;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialOverrides]);

  // Reset moodboard when user picks a new vibe
  const lastNonNullVibeRef = useRef<VibeTag | null>(vibeTag);
  useEffect(() => {
    if (vibeTag === null) return; // user opened picker — preserve state

    const previousVibe = lastNonNullVibeRef.current;
    lastNonNullVibeRef.current = vibeTag;

    if (vibeTag === previousVibe) return; // returned to same vibe — do nothing

    // Different vibe: find best-matching collection and remap
    const current = slotSelectionsRef.current;
    const hasAnyPick = (Object.keys(SLOT_TO_PALETTE_KEY) as SlotKey[]).some((k) => Boolean(current[k]));
    if (!hasAnyPick) return;

    // Score each collection in the new vibe by how many current archetypes it contains
    const vibeCollections = collectionsV2.filter((c) => c.vibe === vibeTag);
    let bestCol: typeof vibeCollections[0] | null = null;
    let bestScore = 0;
    for (const col of vibeCollections) {
      let score = 0;
      for (const k of Object.keys(SLOT_TO_PALETTE_KEY) as SlotKey[]) {
        const aId = current[k];
        if (aId && col.pool[SLOT_CATEGORY[k]]?.includes(aId)) score++;
      }
      if (score > bestScore) { bestScore = score; bestCol = col; }
    }

    if (!bestCol) { handleClearSlots(); return; }

    // Keep only slots whose archetype exists in the best collection
    const slotsToKeep = new Set<SlotKey>(
      (Object.keys(SLOT_TO_PALETTE_KEY) as SlotKey[]).filter((k) => {
        const aId = current[k];
        return aId ? (bestCol!.pool[SLOT_CATEGORY[k]]?.includes(aId) ?? false) : false;
      })
    );

    setSlotSelections((prev) => {
      const next = { ...prev };
      (Object.keys(SLOT_TO_PALETTE_KEY) as SlotKey[]).forEach((k) => {
        if (!slotsToKeep.has(k)) next[k] = null;
      });
      return next;
    });

    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(SLOT_TO_PALETTE_KEY) as SlotKey[]).forEach((k) => {
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk) return;
        if (!slotsToKeep.has(k)) {
          delete next[pk];
        } else {
          // Re-resolve the kept slot through the new vibe's best collection so
          // the flatlay shows products from the new vibe, not the old one (Bug 3).
          const aId = current[k];
          if (aId && bestCol) {
            const resolvedMatId = resolveProductFromCollection(bestCol, aId, SLOT_CATEGORY[k], activeShowroom);
            if (resolvedMatId) next[pk] = resolvedMatId;
            else delete next[pk];
          }
        }
      });
      return next;
    });

    setSelectedCollectionId(bestCol.id);
  }, [vibeTag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Which collection matches current picks — stored as state so sticky logic in
  // handlers can't be overwritten by a useMemo re-running "first match wins".
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>(
    () => matchCollection(collectionsV2, toSlotPicks(slotSelections), vibeTag)?.id
  );

  const matchedCollection = useMemo(
    () => collectionsV2.find(c => c.id === selectedCollectionId) ?? null,
    [selectedCollectionId]
  );

  const handleSlotSelect = useCallback(
    (slotKey: SlotKey, archetypeId: string) => {
      const newSelections = { ...slotSelections, [slotKey]: archetypeId };
      setSlotSelections(newSelections);
      trackEvent(AnalyticsEvents.MOODBOARD_MATERIAL_SELECTED, {
        slot: slotKey,
        material_id: archetypeId,
        was_replacing: slotSelections[slotKey] !== null,
        filled_count: DISPLAYED_SLOTS.filter((k) => Boolean(newSelections[k])).length,
      });

      // Resolve material ID using the same collection + showroom priority the picker used
      // to display the image, guaranteeing picker ↔ flatlay parity.
      // Priority: current selected collection (if archetype is in it) → matchCollection → global first-match fallback
      const category = SLOT_CATEGORY[slotKey];
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      const newPicks = toSlotPicks(newSelections);

      const currentCol = selectedCollectionId
        ? collectionsV2.find((c) => c.id === selectedCollectionId) ?? null
        : null;
      const effectiveCol =
        (currentCol?.pool[category]?.includes(archetypeId) ? currentCol : null) ??
        matchCollection(collectionsV2, newPicks, vibeTag);

      let resolvedMatId: string | null = null;
      if (effectiveCol) {
        const products = effectiveCol.products[category]?.[archetypeId] ?? [];
        resolvedMatId = activeShowroom
          ? (products.find((id) => getMaterialById(id)?.showroomIds?.includes(activeShowroom.id)) ?? products[0] ?? null)
          : (products[0] ?? null);
      }
      resolvedMatId ??= resolveArchetypeToMaterial(archetypeId, category);

      if (pk) {
        setMaterialOverrides((prev) => ({ ...prev, [pk]: resolvedMatId ?? archetypeId }));
      }

      // Update suggested collection for the ✨ chip.
      // If the user manually picked a collection and the new archetype still fits in it,
      // keep it anchored — don't let scored matching overwrite an explicit choice (Bug 2).
      const stickyCol = isCollectionManuallySelected.current && selectedCollectionId
        ? collectionsV2.find((c) => c.id === selectedCollectionId) ?? null
        : null;
      const stickyStillFits = stickyCol !== null && (stickyCol.pool[category]?.includes(archetypeId) ?? false);
      if (!stickyStillFits) {
        isCollectionManuallySelected.current = false;
        const suggested = findBestMatchCollection(collectionsV2, newPicks, vibeTag);
        setSelectedCollectionId(suggested?.id ?? undefined);
        setActivePalette(suggested?.id ?? null);
      }
    },
    [slotSelections, setMaterialOverrides, setActivePalette, vibeTag, selectedCollectionId, activeShowroom],
  );

  const allSlotsFilled = DISPLAYED_SLOTS.every((k) => Boolean(slotSelections[k]));
  const filledCount = DISPLAYED_SLOTS.filter((k) => Boolean(slotSelections[k])).length;
  const mainSlotsFilled = (["floor", "mainFronts", "additionalFronts", "worktops"] as SlotKey[]).every((k) => Boolean(slotSelections[k]));

  const handleCollectionSelect = useCallback((collectionId: string) => {
    const col = collectionsV2.find((c) => c.id === collectionId);
    if (!col) { setCollectionsOpen(false); return; }
    trackEvent(AnalyticsEvents.MOODBOARD_COLLECTION_SELECTED, { collection_id: collectionId });

    // Derive slot selections directly from pool (first item per category)
    const pool = col.pool;
    const newSelections: SlotSelections = {
      floor:             pool["flooring"]?.[0]                      ?? null,
      mainFronts:        pool["cabinet-fronts"]?.[0]                ?? null,
      additionalFronts:  pool["cabinet-fronts"]?.[1] ?? pool["cabinet-fronts"]?.[0] ?? null,
      worktops:          pool["worktops-and-backsplashes"]?.[0]     ?? null,
      accents:           pool["accents"]?.[0]                       ?? null,
      mainTiles:         pool["tiles"]?.[0]                         ?? null,
      additionalTiles:   pool["tiles"]?.[1] ?? pool["tiles"]?.[0]   ?? null,
    };
    setSlotSelections(newSelections);

    // Sync overrides — resolve each archetype to a real product ID using the collection's
    // products map (with showroom preference), not raw archetype IDs (Bug 1).
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(newSelections) as SlotKey[]).forEach((k) => {
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk) return;
        const aId = newSelections[k];
        if (!aId) { delete next[pk]; return; }
        const resolvedMatId = resolveProductFromCollection(col, aId, SLOT_CATEGORY[k], activeShowroom);
        next[pk] = resolvedMatId ?? aId;
      });
      return next;
    });

    // Sync vibe only if a vibe filter was already active (don't impose one when user had none)
    if (vibeTag !== null && col.vibe !== vibeTag) setVibeTag(col.vibe);

    // Anchor the selected collection; mark as manual so handleSlotSelect won't overwrite it
    isCollectionManuallySelected.current = true;
    setSelectedCollectionId(collectionId);

    // Sync palette carousel to the selected collection ID
    handleSelectMaterial(collectionId);

    setCollectionsOpen(false);
  }, [handleSelectMaterial, setMaterialOverrides, vibeTag, setVibeTag, activeShowroom]);

  const handleClearSlots = useCallback(() => {
    trackEvent(AnalyticsEvents.MOODBOARD_SLOTS_RESET, {});
    isCollectionManuallySelected.current = false;
    handleSelectMaterial(null);
    setSlotSelections({ floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(SLOT_TO_PALETTE_KEY).forEach((k) => { if (k) delete next[k]; });
      return next;
    });
    setSelectedCollectionId(undefined);
  }, [handleSelectMaterial, setMaterialOverrides]);

  const handleSwitchCollection = useCallback((collectionId: string, slotKey?: SlotKey, materialId?: string) => {
    const col = collectionsV2.find((c) => c.id === collectionId);
    if (!col) return;

    if (slotKey) {
      // Per-slot path (from "Other Shades"): only update the tapped slot.
      // Use the exact materialId passed from the picker to guarantee picker ↔ flatlay parity.
      // Fall back to [0] only if no materialId provided (e.g., future non-picker callers).
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      if (pk) {
        const aId = slotSelections[slotKey];
        const matId = materialId ?? col.products[SLOT_CATEGORY[slotKey]]?.[aId ?? ""]?.[0];
        if (matId) setMaterialOverrides((prev) => ({ ...prev, [pk]: matId }));
      }
    } else {
      // Full-alignment path (collections explorer): re-resolve all slots with showroom filter
      setMaterialOverrides((prev) => {
        const next = { ...prev };
        (Object.keys(slotSelections) as SlotKey[]).forEach((k) => {
          const aId = slotSelections[k];
          if (!aId) return;
          const pk = SLOT_TO_PALETTE_KEY[k];
          if (!pk) return;
          const resolvedMatId = resolveProductFromCollection(col, aId, SLOT_CATEGORY[k], activeShowroom);
          if (resolvedMatId) next[pk] = resolvedMatId;
          else delete next[pk];
        });
        return next;
      });
    }

    isCollectionManuallySelected.current = true;
    setSelectedCollectionId(collectionId);
    setActivePalette(collectionId);
  }, [slotSelections, setMaterialOverrides, setActivePalette, activeShowroom]);

  const handleSlotClear = useCallback((slotKey: SlotKey) => {
    trackEvent(AnalyticsEvents.MOODBOARD_MATERIAL_CLEARED, {
      slot: slotKey,
      material_id: slotSelections[slotKey],
    });
    const newSelections = { ...slotSelections, [slotKey]: null };
    setSlotSelections(newSelections);
    const pk = SLOT_TO_PALETTE_KEY[slotKey];
    if (pk) setMaterialOverrides((prev) => { const next = { ...prev }; delete next[pk]; return next; });

    // Re-evaluate collection with sticky logic: keep current if it still fits remaining picks
    const remainingPicks = toSlotPicks(newSelections);
    const currentCol = selectedCollectionId
      ? collectionsV2.find((c) => c.id === selectedCollectionId) ?? null
      : null;
    const canKeepCurrent =
      currentCol !== null &&
      remainingPicks.length >= 1 &&
      remainingPicks.every(({ category, archetypeId }) =>
        currentCol.pool[category]?.includes(archetypeId) ?? false
      );
    if (!canKeepCurrent) isCollectionManuallySelected.current = false;
    const nextCollectionId = canKeepCurrent
      ? selectedCollectionId
      : matchCollection(collectionsV2, remainingPicks, vibeTag)?.id;
    setSelectedCollectionId(nextCollectionId);
    if (!nextCollectionId) setActivePalette(null);
  }, [slotSelections, setMaterialOverrides, setActivePalette, selectedCollectionId, vibeTag]);

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
          {/* Right side: room context + optional clear — mobile only (desktop version lives above canvas) */}
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
          {/* Background — slightly inset from the container edges */}
          <div className="absolute inset-2 rounded-2xl bg-neutral-50" />
          {/* Material cut-sample pieces */}
          {PIECES.map((piece, i) => {
            if (piece.slot === "accents" && !mainSlotsFilled) return null;
            const archetypeId = slotSelections[piece.slot];
            const category = SLOT_CATEGORY[piece.slot];
            // Use the stored material override image as the primary source of truth —
            // this preserves "Other Shades" picks even when selectedCollectionId changes.
            const pk = SLOT_TO_PALETTE_KEY[piece.slot];
            const overrideMat = pk ? getMaterialById(materialOverrides[pk] ?? "") : null;
            const tileImage = overrideMat?.image
              ?? resolveTileImage(archetypeId, category, matchedCollection, vibeTag, activeShowroom?.id);
            const suggestedCol = selectedCollectionId
              ? collectionsV2.find((c) => c.id === selectedCollectionId) ?? null
              : null;
            const suggestedMatId = suggestedCol?.products[category]?.[archetypeId ?? ""]?.[0] ?? null;
            const currentMatId = pk ? (materialOverrides[pk] ?? null) : null;
            const showNudge = !!(archetypeId && suggestedMatId && suggestedMatId !== currentMatId);
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
                        alt={getArchetypeById(archetypeId, category)?.label[lang] ?? piece.slot}
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
                {showNudge && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pk && suggestedMatId) setMaterialOverrides((prev) => ({ ...prev, [pk]: suggestedMatId }));
                    }}
                    className="absolute top-1 left-1 flex items-center justify-center"
                    style={{ zIndex: 1 }}
                    aria-label={`Sync ${piece.slot} to suggested collection`}
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
                  {/* Hairline leader — neutral-300, 0.5px */}
                  <line
                    x1={x1} y1={y1}
                    x2={px} y2={py}
                    stroke="#d4d4d4"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                  />
                  {/* Terminus dot on piece surface */}
                  <circle cx={px} cy={py} r="1.5" fill="#d4d4d4" />
                  {/* Technical label — 8px, tracking-[0.3em], neutral-500 */}
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

        {/* RIGHT: controls — vertically centered by grid items-center */}
        <div className="mt-4 lg:mt-0">
        <div className="lg:max-w-[400px] lg:mx-auto">

        {/* ── Instruction — serif, sits directly above buttons ── */}
        {!allSlotsFilled && (
          <div className="mt-3 lg:mt-0 lg:mb-6">
            <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center lg:font-serif lg:text-xl lg:normal-case lg:tracking-normal lg:text-neutral-700 lg:text-left">
              {filledCount === 0 ? t("moodboard.pickFirst") : t("moodboard.pickRemaining")}
            </p>
            {/* Hairline between instruction and buttons — desktop only */}
            <div className="hidden lg:block mt-6 border-t border-neutral-100" style={{ borderTopWidth: '0.5px' }} />
          </div>
        )}

        {/* ── CTA buttons — row on mobile, column on desktop ── */}
        {/* Order: Visualize (primary) → Collections (outline) → Find (ghost) */}
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

          {/* Explore Collections — outline */}
          <button
            onClick={() => setCollectionsOpen(true)}
            className="flex-1 h-10 px-4 flex items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-transparent hover:bg-neutral-50 transition-colors active:scale-[0.97] lg:flex-none lg:h-12 lg:px-6">
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-600 lg:text-sm lg:normal-case lg:tracking-normal">
              {t("moodboard.exploreCollections")}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400 lg:w-4 lg:h-4" strokeWidth={1.5} />
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

        {/* ── Collections Sheet (mobile) / Dialog (desktop) ── */}
        {(() => {
          const VIBE_ORDER: VibeTag[] = ["light-and-airy", "warm-and-grounded", "bold-and-moody"];
          const collectionsBody = (
            <div className="flex flex-col gap-4 pb-4">
              {VIBE_ORDER.map((vibe) => {
                const cols = collectionsV2.filter((col) =>
                  col.vibe === vibe &&
                  (!activeShowroom || collectionHasShowroom(col.id, activeShowroom.id))
                );
                if (cols.length === 0) return null;
                return (
                  <div key={vibe}>
                    <p className="px-1 mb-2 text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-400">
                      {t(`vibe.${vibe}`)}
                    </p>
                    <div className="flex gap-3 px-1 overflow-x-auto scrollbar-hide">
                      {cols.map((col) => {
                        const isSelected = selectedCollectionId === col.id;
                        const swatches = getCollectionSwatches(col);
                        return (
                          <button key={col.id} onClick={() => handleCollectionSelect(col.id)}
                            className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                            <div className={`relative rounded-xl overflow-hidden border-2 ${
                              isSelected ? "border-neutral-900" : "border-neutral-200"
                            }`}>
                              <div className="grid grid-cols-2 gap-px bg-neutral-200" style={{ width: 64 }}>
                                {swatches.map((img, i) => (
                                  <div key={i} className="bg-neutral-100" style={{ height: 30 }}>
                                    {img && <img src={img} className="w-full h-full object-cover" />}
                                  </div>
                                ))}
                              </div>
                              {isSelected && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );

          if (isMobile) {
            return (
              <Sheet open={collectionsOpen} onOpenChange={setCollectionsOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl pb-safe" aria-describedby={undefined}>
                  <SheetHeader className="mb-4">
                    <SheetTitle className="font-serif">{t("moodboard.exploreCollections")}</SheetTitle>
                  </SheetHeader>
                  {collectionsBody}
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Dialog open={collectionsOpen} onOpenChange={setCollectionsOpen}>
              <DialogContent className="max-w-2xl" aria-describedby={undefined}>
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-serif">{t("moodboard.exploreCollections")}</DialogTitle>
                </DialogHeader>
                {collectionsBody}
              </DialogContent>
            </Dialog>
          );
        })()}
      </div>

      <MaterialSlotPicker
        slot={openSlot}
        selections={slotSelections}
        onSelect={handleSlotSelect}
        onClose={() => setOpenSlot(null)}
        onClear={handleSlotClear}
        onSelectCollection={handleSwitchCollection}
        suggestedCollectionId={selectedCollectionId}
        vibeTag={vibeTag}
        showroom={activeShowroom}
        currentCollectionId={selectedCollectionId}
      />

    </div>
  );
}
