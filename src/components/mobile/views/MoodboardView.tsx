import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { RotateCcw, Plus, Check, X, ChevronDown, ArrowRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArchetypeById } from "@/data/archetypes";
import { getMaterialById } from "@/data/materials";
import { collectionsV2 } from "@/data/collections/collections-v2";
import type { CollectionV2 } from "@/data/collections/types";
import type { SurfaceCategory } from "@/data/materials/types";
import { matchCollection, type SlotPick } from "@/lib/collection-matching";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import MaterialSlotPicker, { type SlotKey, type SlotSelections, SLOT_CATEGORY } from "../controls/MaterialSlotPicker";
import VibePickerView from "./VibePickerView";

// ─── Collection swatch preview ────────────────────────────────────────────
// [floor, worktops, front1, front2] — 2-col × 2-row grid
const COLLECTION_SWATCH_SPEC: Array<{ category: SurfaceCategory; count: 1 | 2 }> = [
  { category: "flooring",                    count: 1 },
  { category: "worktops-and-backsplashes",   count: 1 },
  { category: "cabinet-fronts",              count: 2 },
];

function resolveSwatchImage(
  archetypeId: string | null | undefined,
  category: SurfaceCategory,
  products: CollectionV2["products"],
): string | null {
  if (!archetypeId) return null;
  const productId = products[category]?.[archetypeId]?.[0];
  if (productId) {
    const mat = getMaterialById(productId);
    if (mat?.image) return mat.image;
  }
  return getArchetypeById(archetypeId, category)?.image ?? null;
}

function getCollectionSwatches(pool: CollectionV2["pool"], products: CollectionV2["products"]): (string | null)[] {
  const images: (string | null)[] = [];
  for (const { category, count } of COLLECTION_SWATCH_SPEC) {
    const ids = pool[category] ?? [];
    for (let i = 0; i < count; i++) {
      images.push(resolveSwatchImage(ids[i], category, products));
    }
  }
  return images; // always 4 entries: [floor, worktops, front1, front2]
}

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
): string | null {
  if (!archetypeId) return null;
  // Priority 1: real product photo from matched collection
  if (matchedCollection) {
    const materialId = matchedCollection.products[category]?.[archetypeId]?.[0];
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
    const materialId = col.products[category]?.[archetypeId]?.[0];
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
  { slot: "floor",            top: "13%", left: "10%", width: "84%", height: "63%",
    rotate: "0deg", zIndex: 1, shadow: "0 1px 2px rgba(0,0,0,0.06)" },

  // MAIN FRONTS — large square, lower-right
  { slot: "mainFronts",       top: "30%", left: "56%", width: "42%", height: "41%",
    rotate: "0deg", zIndex: 4, shadow: "0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)" },

  // ADDITIONAL FRONTS — medium square, lower-center
  { slot: "additionalFronts", top: "53%", left: "15%", width: "38%", height: "32%",
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
  tx: string; ty: string;  // label text anchor
  x1: string; y1: string;  // leader line start
  px: string; py: string;  // terminus dot on piece
}

const ANNOTATION_DEFS: AnnotationDef[] = [
  // GRINDYS  — top white margin, perfectly horizontal at ty="4%"
  { surfaceKey: "floor",            tx: "56%", ty: "7%",  x1: "62%", y1: "8.5%",  px: "68%", py: "14%" },
  // FASADAI  — bottom margin, baseline locked at ty="93%"
  { surfaceKey: "additionalFronts", tx: "10%", ty: "93%", x1: "18%", y1: "90.5%", px: "28%", py: "81%" },
  // AKCENTAI — bottom margin, same baseline ty="93%"
  { surfaceKey: "accents",          tx: "58%", ty: "93%", x1: "64%", y1: "90.5%", px: "70%", py: "78%" },
];

const DISPLAYED_SLOTS: SlotKey[] = ["floor", "mainFronts", "additionalFronts", "worktops", "accents"];

function toSlotPicks(selections: SlotSelections, exclude?: SlotKey): SlotPick[] {
  return (Object.keys(selections) as SlotKey[])
    .filter((k) => k !== exclude && selections[k] !== null)
    .map((k) => ({ category: SLOT_CATEGORY[k], archetypeId: selections[k]! }));
}

// ─── Component ────────────────────────────────────────────────────────────
export default function MoodboardView() {
  const { design, materialOverrides, setMaterialOverrides, setActiveTab, handleSelectMaterial, setActivePalette, vibeTag, setVibeTag, clearVibeTag, isSharedSession, sharedMoodboardSlots } = useDesign();
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";
  const isMobile = useIsMobile();

  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
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

  // Persist slot selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
  }, [slotSelections]);

  // On mount: sync materialOverrides from restored localStorage data.
  // Resolve through matchCollection so real product IDs are used (not raw archetype IDs),
  // matching the same logic in handleSlotSelect.
  useEffect(() => {
    const matched = matchCollection(collectionsV2, toSlotPicks(slotSelections), vibeTag);
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(slotSelections) as SlotKey[]).forEach((k) => {
        const aId = slotSelections[k];
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk) return;
        if (!aId) { delete next[pk]; return; }
        if (matched) {
          const resolvedMatId = matched.products[SLOT_CATEGORY[k]]?.[aId]?.[0];
          if (resolvedMatId) next[pk] = resolvedMatId;
          else delete next[pk];
        } else {
          next[pk] = aId;
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

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
        if (!slotsToKeep.has(k)) {
          const pk = SLOT_TO_PALETTE_KEY[k];
          if (pk) delete next[pk];
        }
      });
      return next;
    });
  }, [vibeTag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Which collection matches current picks (requires 2+ picks and vibe filter)
  const selectedCollectionId = useMemo(() => {
    return matchCollection(collectionsV2, toSlotPicks(slotSelections), vibeTag)?.id;
  }, [slotSelections, vibeTag]);

  const matchedCollection = useMemo(
    () => collectionsV2.find(c => c.id === selectedCollectionId) ?? null,
    [selectedCollectionId]
  );

  // Lock picker to one collection only when other picks (≥1) uniquely identify it (vibe-filtered)
  const pickerLockedCollectionId = useMemo(() => {
    if (!openSlot) return undefined;
    const otherPicks = toSlotPicks(slotSelections, openSlot);
    if (otherPicks.length === 0) return undefined;
    const compatible = collectionsV2.filter((col) => {
      if (vibeTag && col.vibe !== vibeTag) return false;
      return otherPicks.every(({ category, archetypeId }) =>
        col.pool[category]?.includes(archetypeId) ?? false
      );
    });
    return compatible.length === 1 ? compatible[0].id : undefined;
  }, [openSlot, slotSelections, vibeTag]);

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

      const matched = matchCollection(collectionsV2, toSlotPicks(newSelections), vibeTag);

      setMaterialOverrides((prev) => {
        const next = { ...prev };
        if (matched) {
          (Object.keys(newSelections) as SlotKey[]).forEach((k) => {
            const aId = newSelections[k];
            if (!aId) return;
            const pk = SLOT_TO_PALETTE_KEY[k];
            if (!pk) return;
            const resolvedMatId = matched.products[SLOT_CATEGORY[k]]?.[aId]?.[0];
            if (resolvedMatId) next[pk] = resolvedMatId;
            else delete next[pk];
          });
        } else {
          const pk = SLOT_TO_PALETTE_KEY[slotKey];
          if (pk) next[pk] = archetypeId;
        }
        return next;
      });

      if (matched) {
        setActivePalette(matched.id); // selectedMaterial is now the collection ID
      } else {
        setActivePalette(null);
      }
    },
    [slotSelections, setMaterialOverrides, setActivePalette, vibeTag],
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

    // Sync overrides so Stage renders the picked archetypes
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(newSelections) as SlotKey[]).forEach((k) => {
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk) return;
        if (newSelections[k]) next[pk] = newSelections[k]!;
        else delete next[pk];
      });
      return next;
    });

    // Sync vibe to match the selected collection so matchCollection resolves correctly
    if (col.vibe !== vibeTag) setVibeTag(col.vibe);

    // Sync palette carousel to the selected collection ID
    handleSelectMaterial(collectionId);

    setCollectionsOpen(false);
  }, [handleSelectMaterial, setMaterialOverrides, vibeTag, setVibeTag]);

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

    // Re-evaluate: release palette lock unless remaining picks still match
    if (!matchCollection(collectionsV2, toSlotPicks(newSelections), vibeTag)) setActivePalette(null);
  }, [slotSelections, setMaterialOverrides, setActivePalette]);

  // Show vibe picker if no vibe has been selected yet
  if (!vibeTag) return <VibePickerView />;


  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className="px-4 pt-4 pb-6">

        {/* ── Vibe pill + reset row ── */}
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={clearVibeTag}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors active:scale-95"
            title={t("vibe.change")}
          >
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-500">
              {t(`vibe.${vibeTag}`)}
            </span>
          </button>
          {filledCount > 0 && (
            <button
              onClick={handleClearSlots}
              className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity active:scale-95">
              <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-600">Išvalyti</span>
              <RotateCcw className="w-3 h-3 text-neutral-600" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* ── Architectural flatlay canvas ── */}
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
            const tileImage = resolveTileImage(archetypeId, category, matchedCollection, vibeTag);
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
                    onClick={() => setOpenSlot(piece.slot)}
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
              </div>
            );
          })}

          {/* ── Annotation overlay (SVG, pointer-events:none) ── */}
          <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            aria-hidden="true"
          >
            {ANNOTATION_DEFS.map(({ surfaceKey, tx, ty, x1, y1, px, py }, i) => {
              if (surfaceKey === "accents" && !mainSlotsFilled) return null;
              const label = t(`surface.${surfaceKey}`).toUpperCase();
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
        </div>

        {/* ── Contextual instruction — hidden once filled ── */}
        {!allSlotsFilled && (
          <div className="mt-3 flex items-center justify-center">
            <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center">
              {filledCount === 0 ? t("moodboard.pickFirst") : t("moodboard.pickRemaining")}
            </p>
          </div>
        )}

        {/* ── Hairline separator — hidden once filled ── */}
        {!allSlotsFilled && <div className="mt-3 border-t border-neutral-100" />}

        {/* ── CTA pills ── */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Kolekcijos — ghost */}
          <button
            onClick={() => setCollectionsOpen(true)}
            className="flex-1 h-10 px-4 flex items-center justify-center gap-1 rounded-full border border-neutral-200 bg-transparent hover:bg-neutral-50 transition-colors active:scale-[0.97]">
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-600">
              {t("moodboard.exploreCollections")}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
          </button>

          {/* Vizualizuoti — filled black */}
          <button
            onClick={() => setActiveTab("design")}
            disabled={!allSlotsFilled}
            className="flex-1 h-10 px-4 flex items-center justify-center gap-1 rounded-full bg-neutral-900 hover:bg-neutral-800 transition-colors active:scale-[0.97] disabled:opacity-30">
            <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-white">
              {t("moodboard.visualize")}
            </span>
            <ArrowRight className="w-3 h-3 text-white" strokeWidth={1} />
          </button>

          {/* Kur rasti? — ghost */}
          <button
            onClick={() => setActiveTab("specs")}
            disabled={!allSlotsFilled}
            className="flex-1 h-10 px-4 flex items-center justify-center gap-1 rounded-full border border-neutral-200 bg-transparent hover:bg-neutral-50 transition-colors active:scale-[0.97] disabled:opacity-30">
            <span className={`text-[8px] uppercase tracking-[0.2em] font-medium ${allSlotsFilled ? "text-neutral-600" : "text-neutral-400"}`}>
              {t("moodboard.findMaterials")}
            </span>
            <ArrowRight className={`w-3 h-3 ${allSlotsFilled ? "text-neutral-600" : "text-neutral-400"}`} strokeWidth={1} />
          </button>
        </div>

        {/* ── Collections Sheet (mobile) / Dialog (desktop) ── */}
        {(() => {
          const collectionsBody = (
            <div className="flex gap-3 px-1 overflow-x-auto scrollbar-hide pb-4">
              {collectionsV2.filter((col) => !vibeTag || col.vibe === vibeTag).map((col) => {
                const isSelected = selectedCollectionId === col.id;
                const swatches = getCollectionSwatches(col.pool, col.products);
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
                    <span className="text-[8px] uppercase tracking-[0.15em] text-neutral-500 text-center max-w-[64px] truncate">
                      {col.name[language as keyof typeof col.name] ?? col.name.en}
                    </span>
                  </button>
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
        lockedCollectionId={pickerLockedCollectionId}
        vibeTag={vibeTag}
      />
    </div>
  );
}
