import { useState, useCallback, useMemo, useEffect } from "react";
import { RotateCcw, Plus, Check, X, ChevronRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { palettesV2 } from "@/data/palettes/palettes-v3";
import { getArchetypeById } from "@/data/archetypes";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import MaterialSlotPicker, { type SlotKey, type SlotSelections } from "../controls/MaterialSlotPicker";
import type { MaterialArchetype } from "@/data/archetypes/types";

// ─── Collection swatch preview ────────────────────────────────────────────
// [floor, worktops] [front1, front2] [tile1, tile2] — 2-col × 3-row grid
const COLLECTION_SWATCH_SPEC: Array<{ category: string; count: 1 | 2 }> = [
  { category: "flooring",                    count: 1 },
  { category: "worktops-and-backsplashes",   count: 1 },
  { category: "cabinet-fronts",              count: 2 },
  { category: "tiles",                       count: 2 },
];

function getCollectionSwatches(pool: Record<string, string[]>): (string | null)[] {
  const images: (string | null)[] = [];
  for (const { category, count } of COLLECTION_SWATCH_SPEC) {
    const ids = pool[category] ?? [];
    for (let i = 0; i < count; i++) {
      const img = ids[i] ? (getArchetypeById(ids[i])?.image ?? null) : null;
      images.push(img);
    }
  }
  return images; // always 6 entries: [floor, worktops, front1, front2, tile1, tile2]
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

function resolveArchetype(
  slotKey: SlotKey,
  overrides: Record<string, string>,
  pv2: (typeof palettesV2)[number] | undefined,
  collection: (typeof collectionsV2)[number] | undefined
): MaterialArchetype | null {
  const paletteKey = SLOT_TO_PALETTE_KEY[slotKey];
  if (!paletteKey) return null;

  const overrideId = overrides[paletteKey];
  if (overrideId) return getArchetypeById(overrideId) ?? null;

  if (pv2?.selections?.kitchen) {
    const defaultId = pv2.selections.kitchen[paletteKey];
    if (defaultId) return getArchetypeById(defaultId) ?? null;
  }

  if (slotKey === "mainTiles") {
    const id = collection?.pool["tiles"]?.[0];
    if (id) return getArchetypeById(id) ?? null;
  }
  if (slotKey === "additionalTiles") {
    const id = collection?.pool["tiles"]?.[1] ?? collection?.pool["tiles"]?.[0];
    if (id) return getArchetypeById(id) ?? null;
  }

  return null;
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
}

// Layering order (back → front): floor → additionalTiles → mainTiles → mainFronts → additionalFronts → worktops → accents
// Shadow escalates with zIndex so smaller/higher pieces visually lift off the surface.
const PIECES: Piece[] = [
  // FLOOR — base layer, largest piece
  { slot: "floor",            top: "16%", left: "10%", width: "84%", height: "63%",
    rotate: "0deg", zIndex: 1, shadow: "0 1px 2px rgba(0,0,0,0.06)" },

  // ADDITIONAL TILES — small square, upper-left cluster
  { slot: "additionalTiles",  top: "29%", left: "4%",  width: "25%", height: "23%",
    rotate: "0deg", zIndex: 2, shadow: "0 3px 10px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.06)" },

  // MAIN TILES — tall portrait, upper-left cluster
  { slot: "mainTiles",        top: "13%", left: "24%", width: "24%", height: "34%",
    rotate: "0deg", zIndex: 3, shadow: "0 5px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.07)" },

  // MAIN FRONTS — large square, lower-right
  { slot: "mainFronts",       top: "43%", left: "62%", width: "35%", height: "34%",
    rotate: "0deg", zIndex: 4, shadow: "0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)" },

  // ADDITIONAL FRONTS — medium square, lower-center
  { slot: "additionalFronts", top: "62%", left: "28%", width: "32%", height: "27%",
    rotate: "0deg", zIndex: 5, shadow: "0 6px 18px rgba(0,0,0,0.20), 0 2px 5px rgba(0,0,0,0.08)" },

  // WORKTOPS — sits above additionalFronts/mainFronts
  { slot: "worktops",         top: "58%", left: "44%", width: "24%", height: "21%",
    rotate: "0deg", zIndex: 6, shadow: "0 8px 22px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.09)" },

  // ACCENTS — smallest piece, highest in stack
  { slot: "accents",          top: "74%", left: "67%", width: "15%", height: "12%",
    rotate: "0deg", zIndex: 7, shadow: "0 10px 28px rgba(0,0,0,0.28), 0 3px 8px rgba(0,0,0,0.12)" },
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
  // PLYTELĖS — top white margin → mainTiles (top=13%, left=24%..48%)
  { surfaceKey: "mainTiles",        tx: "8%",  ty: "8%",  x1: "15%", y1: "9.5%",  px: "34%", py: "19%" },
  // GRINDYS  — top white margin → floor (top=16%, left=10%..94%)
  { surfaceKey: "floor",            tx: "56%", ty: "8%",  x1: "62%", y1: "9.5%",  px: "68%", py: "17%" },
  // FASADAI  — bottom white margin → additionalFronts (bottom=89%, left=28%..60%)
  { surfaceKey: "additionalFronts", tx: "10%", ty: "95%", x1: "20%", y1: "91.5%", px: "40%", py: "87%" },
  // AKCENTAI — bottom white margin → accents (bottom=86%, left=67%..82%)
  { surfaceKey: "accents",          tx: "58%", ty: "95%", x1: "65%", y1: "91.5%", px: "73%", py: "83%" },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function MoodboardView() {
  const { design, materialOverrides, setMaterialOverrides, setActiveTab, handleSelectMaterial, setActivePalette } = useDesign();
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [slotSelections, setSlotSelections] = useState<SlotSelections>(() => {
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
    const activePv2 = palettesV2.find((p) => p.id === design.selectedMaterial);
    if (activePv2) {
      const activeCol = collectionsV2.find((c) => c.id === activePv2.collectionId);
      for (const slot of Object.keys(SLOT_TO_PALETTE_KEY) as SlotKey[]) {
        if (initial[slot]) continue;
        initial[slot] = resolveArchetype(slot, {}, activePv2, activeCol)?.id ?? null;
      }
    }
    // Default floor for brand-new users with no prior state
    if (!initial.floor) initial.floor = "01_light_natural_wood";
    return initial;
  });

  // Persist slot selections to localStorage on every change
  useEffect(() => {
    localStorage.setItem("moodboard-slot-selections", JSON.stringify(slotSelections));
  }, [slotSelections]);

  // On mount: sync materialOverrides from restored localStorage data
  useEffect(() => {
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      (Object.keys(slotSelections) as SlotKey[]).forEach((k) => {
        const pk = SLOT_TO_PALETTE_KEY[k];
        if (!pk) return;
        if (slotSelections[k]) next[pk] = slotSelections[k]!;
        else delete next[pk];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  // Which collection is uniquely identified by the current slot selections
  const selectedCollectionId = useMemo(() => {
    const ids = Object.values(slotSelections).filter((id): id is string => id !== null);
    if (!ids.length) return undefined;
    const compatible = collectionsV2.filter((col) =>
      ids.every((id) => Object.values(col.pool).flat().includes(id))
    );
    return compatible.length === 1 ? compatible[0].id : undefined;
  }, [slotSelections]);

  const pv2 = useMemo(
    () => palettesV2.find((p) => p.id === design.selectedMaterial),
    [design.selectedMaterial]
  );
  const collection = useMemo(
    () => (pv2 ? collectionsV2.find((c) => c.id === pv2.collectionId) : undefined),
    [pv2]
  );
  // When changing a filled slot, lock only if the OTHER filled slots uniquely identify one collection
  const pickerLockedCollectionId = useMemo(() => {
    if (!openSlot) return undefined;
    const otherIds = (Object.keys(slotSelections) as SlotKey[])
      .filter((k) => k !== openSlot)
      .map((k) => slotSelections[k])
      .filter((id): id is string => id !== null);
    if (otherIds.length === 0) return undefined;
    const compatible = collectionsV2.filter((col) =>
      otherIds.every((id) => Object.values(col.pool).flat().includes(id))
    );
    return compatible.length === 1 ? compatible[0].id : undefined;
  }, [openSlot, slotSelections]);

  // Pre-compute all materials in one memo to avoid hook-in-loop issues
  const materials = useMemo(
    () => PIECES.map((p) => resolveArchetype(p.slot, materialOverrides, pv2, collection)),
    [materialOverrides, pv2, collection]
  );

  const handleSlotSelect = useCallback(
    (slotKey: SlotKey, materialId: string) => {
      const newSelections = { ...slotSelections, [slotKey]: materialId };
      setSlotSelections(newSelections);
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      if (pk) setMaterialOverrides((prev) => ({ ...prev, [pk]: materialId }));

      // Lock/unlock collection based on how many collections match all current picks
      const selectedIds = Object.values(newSelections).filter((id): id is string => id !== null);
      const compatible = collectionsV2.filter((col) =>
        selectedIds.every((id) => Object.values(col.pool).flat().includes(id))
      );
      if (compatible.length === 1) {
        const firstPalette = palettesV2.find((p) => p.collectionId === compatible[0].id);
        if (firstPalette) setActivePalette(firstPalette.id);
      } else {
        setActivePalette(null); // ambiguous or impossible — release lock
      }
    },
    [slotSelections, pv2, setMaterialOverrides, setActivePalette]
  );

  const allSlotsFilled = Object.values(slotSelections).every(Boolean);
  const filledCount = Object.values(slotSelections).filter(Boolean).length;

  const handleCollectionSelect = useCallback((collectionId: string) => {
    const col = collectionsV2.find((c) => c.id === collectionId);
    if (!col) { setCollectionsOpen(false); return; }

    // Derive slot selections directly from pool (first item per category)
    const pool = col.pool as Record<string, string[]>;
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

    // Still set the active palette when one matches, so palette carousel stays in sync
    const matchingPalette = palettesV2.find((p) => p.collectionId === collectionId);
    if (matchingPalette) handleSelectMaterial(matchingPalette.id);

    setCollectionsOpen(false);
  }, [handleSelectMaterial, setMaterialOverrides]);

  const handleClearSlots = useCallback(() => {
    handleSelectMaterial(null);
    setSlotSelections({ floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(SLOT_TO_PALETTE_KEY).forEach((k) => { if (k) delete next[k]; });
      return next;
    });
  }, [handleSelectMaterial, setMaterialOverrides]);

  const handleSlotClear = useCallback((slotKey: SlotKey) => {
    const newSelections = { ...slotSelections, [slotKey]: null };
    setSlotSelections(newSelections);
    const pk = SLOT_TO_PALETTE_KEY[slotKey];
    if (pk) setMaterialOverrides((prev) => { const next = { ...prev }; delete next[pk]; return next; });

    // Re-evaluate lock: release unless remaining picks uniquely identify one collection
    const remainingIds = Object.values(newSelections).filter((id): id is string => id !== null);
    const compatible = collectionsV2.filter((col) =>
      remainingIds.every((id) => Object.values(col.pool).flat().includes(id))
    );
    if (compatible.length !== 1) setActivePalette(null);
  }, [slotSelections, pv2, setMaterialOverrides, setActivePalette]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className="px-4 pt-4 pb-6">

        {/* ── Contextual instruction ── */}
        <div className="mb-3 flex items-center justify-center relative">
          <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-neutral-400 text-center">
            {filledCount === 0
              ? t("moodboard.pickFirst")
              : allSlotsFilled
                ? t("moodboard.ready")
                : t("moodboard.pickRemaining")}
          </p>
          {filledCount > 0 && (
            <button
              onClick={handleClearSlots}
              className="absolute right-0 flex items-center justify-center opacity-35 hover:opacity-60 transition-opacity active:scale-95">
              <RotateCcw className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1} />
            </button>
          )}
        </div>

        {/* ── Architectural flatlay canvas ── */}
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-neutral-50"
          style={{ aspectRatio: "3/4" }}
        >
          {/* Material cut-sample pieces */}
          {PIECES.map((piece, i) => {
            const mat = slotSelections[piece.slot] ? materials[i] : null;
            return (
              <div
                key={i}
                className="absolute overflow-hidden active:scale-[0.97] transition-transform"
                style={{
                  top: piece.top,
                  left: piece.left,
                  width: piece.width,
                  height: piece.height,
                  borderRadius: "4px",
                  transform: `rotate(${piece.rotate})`,
                  zIndex: piece.zIndex,
                  boxShadow: piece.shadow,
                }}
              >
                <button
                  onClick={() => setOpenSlot(piece.slot)}
                  className="w-full h-full"
                  aria-label={`Pick ${piece.slot}`}
                >
                  {mat?.image ? (
                    <img
                      src={mat.image}
                      alt={mat.displayName[lang] ?? mat.displayName.en}
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
                {mat && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSlotClear(piece.slot); }}
                    className="absolute top-1 right-1 flex items-center justify-center rounded-full"
                    style={{ zIndex: 1 }}
                    aria-label={`Clear ${piece.slot}`}
                  >
                    <X className="w-2.5 h-2.5 text-neutral-100" strokeWidth={1.5} style={{ opacity: 0.7 }} />
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
                  <circle cx={px} cy={py} r="2" fill="#d4d4d4" />
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

        {/* ── Hairline separator ── */}
        <div className="mt-5 border-t border-neutral-100" />

        {/* ── Quiet architectural toolbar ── */}
        <div className="mt-3 flex items-center gap-1.5">
          <button
            onClick={() => setCollectionsOpen(true)}
            className="flex-1 h-10 bg-transparent text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-0.5 hover:text-neutral-900 transition-colors active:scale-[0.98]">
            {t("moodboard.exploreCollections")}
            <ChevronRight className="w-3 h-3 opacity-50" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setActiveTab("design")}
            disabled={!allSlotsFilled}
            className="flex-1 h-10 bg-transparent text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-0.5 hover:text-neutral-900 transition-colors active:scale-[0.98] disabled:opacity-25">
            {t("moodboard.visualize")}
            <ChevronRight className="w-3 h-3 opacity-50" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setActiveTab("specs")}
            disabled={!allSlotsFilled}
            className="flex-1 h-10 bg-transparent text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-0.5 hover:text-neutral-900 transition-colors active:scale-[0.98] disabled:opacity-25">
            {t("moodboard.findMaterials")}
            <ChevronRight className="w-3 h-3 opacity-50" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Collections Sheet ── */}
        <Sheet open={collectionsOpen} onOpenChange={setCollectionsOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-safe" aria-describedby={undefined}>
            <SheetHeader className="mb-4">
              <SheetTitle className="font-serif">{t("moodboard.exploreCollections")}</SheetTitle>
            </SheetHeader>
            <div className="flex gap-3 px-1 overflow-x-auto scrollbar-hide pb-4">
              {collectionsV2.map((col) => {
                const isSelected = selectedCollectionId === col.id;
                const swatches = getCollectionSwatches(col.pool);
                return (
                  <button key={col.id} onClick={() => handleCollectionSelect(col.id)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                    <div className={`relative rounded-xl overflow-hidden border-2 ${
                      isSelected ? "border-neutral-900" : "border-neutral-200"
                    }`}>
                      {/* 2-col × 3-row swatch grid */}
                      <div className="grid grid-cols-2 gap-px bg-neutral-200" style={{ width: 64 }}>
                        {swatches.map((img, i) => (
                          <div key={i} className="bg-neutral-100" style={{ height: 28 }}>
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
                      {col.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <MaterialSlotPicker
        slot={openSlot}
        selections={slotSelections}
        onSelect={handleSlotSelect}
        onClose={() => setOpenSlot(null)}
        lockedCollectionId={pickerLockedCollectionId}
      />
    </div>
  );
}
