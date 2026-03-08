import { useState, useCallback, useMemo } from "react";
import { RotateCcw, Plus } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { palettesV2 } from "@/data/palettes/palettes-v2";
import { getMaterialById } from "@/data/materials";
import { collections } from "@/data/collections";
import { getDesignerWithFallback } from "@/data/designers/index";
import MaterialSlotPicker, { type SlotKey, type SlotSelections } from "../controls/MaterialSlotPicker";
import type { Material } from "@/data/materials/types";

// ─── Palette key mapping ───────────────────────────────────────────────────
const SLOT_TO_PALETTE_KEY: Record<SlotKey, string | null> = {
  floor: "floor",
  mainFronts: "bottomCabinets",
  additionalFronts: "topCabinets",
  worktops: "worktops",
  accents: "shelves",
  mainTiles: "tiles",
  additionalTiles: "additionalTiles",
};

// Reverse mapping for restoring state from materialOverrides on mount
const PALETTE_KEY_TO_SLOT: Record<string, SlotKey> = {
  floor: "floor",
  bottomCabinets: "mainFronts",
  topCabinets: "additionalFronts",
  worktops: "worktops",
  shelves: "accents",
  tiles: "mainTiles",
  additionalTiles: "additionalTiles",
};

function resolveMaterial(
  slotKey: SlotKey,
  overrides: Record<string, string>,
  pv2: (typeof palettesV2)[number] | undefined,
  collection: (typeof collections)[number] | undefined
): Material | null {
  const paletteKey = SLOT_TO_PALETTE_KEY[slotKey];
  if (!paletteKey) return null;

  const overrideId = overrides[paletteKey];
  if (overrideId) return getMaterialById(overrideId) ?? null;

  if (pv2?.selections?.kitchen) {
    const defaultId = pv2.selections.kitchen[paletteKey];
    if (defaultId) return getMaterialById(defaultId) ?? null;
  }

  if (slotKey === "mainTiles" || slotKey === "additionalTiles") {
    const id = collection?.pool["tiles"]?.[0];
    if (id) return getMaterialById(id) ?? null;
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
  const { design, materialOverrides, setMaterialOverrides } = useDesign();
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [slotSelections, setSlotSelections] = useState<SlotSelections>(() => {
    const initial: SlotSelections = {
      floor: null, mainFronts: null, worktops: null,
      additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null,
    };
    for (const [paletteKey, matId] of Object.entries(materialOverrides)) {
      const slotKey = PALETTE_KEY_TO_SLOT[paletteKey];
      if (slotKey) initial[slotKey] = matId;
    }
    return initial;
  });

  const pv2 = useMemo(
    () => palettesV2.find((p) => p.id === design.selectedMaterial),
    [design.selectedMaterial]
  );
  const collection = useMemo(
    () => (pv2 ? collections.find((c) => c.id === pv2.collectionId) : undefined),
    [pv2]
  );
  const designer = useMemo(
    () => (pv2 ? getDesignerWithFallback(pv2.designer, "") : null),
    [pv2]
  );

  // Pre-compute all materials in one memo to avoid hook-in-loop issues
  const materials = useMemo(
    () => PIECES.map((p) => resolveMaterial(p.slot, materialOverrides, pv2, collection)),
    [materialOverrides, pv2, collection]
  );

  const handleSlotSelect = useCallback(
    (slotKey: SlotKey, materialId: string) => {
      setSlotSelections((prev) => ({ ...prev, [slotKey]: materialId }));
      const pk = SLOT_TO_PALETTE_KEY[slotKey];
      if (pk) setMaterialOverrides((prev) => ({ ...prev, [pk]: materialId }));
    },
    [setMaterialOverrides]
  );

  const handleClearSlots = useCallback(() => {
    setSlotSelections({ floor: null, mainFronts: null, worktops: null, additionalFronts: null, accents: null, mainTiles: null, additionalTiles: null });
    setMaterialOverrides((prev) => {
      const next = { ...prev };
      Object.values(SLOT_TO_PALETTE_KEY).forEach((k) => { if (k) delete next[k]; });
      return next;
    });
  }, [setMaterialOverrides]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className="px-4 pt-4 pb-6">

        {/* ── Architectural flatlay canvas ── */}
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-neutral-50"
          style={{ aspectRatio: "3/4" }}
        >
          {/* Material cut-sample pieces */}
          {PIECES.map((piece, i) => {
            const mat = slotSelections[piece.slot] ? materials[i] : null;
            return (
              <button
                key={i}
                onClick={() => setOpenSlot(piece.slot)}
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
                {mat?.image ? (
                  <img
                    src={mat.image}
                    alt={mat.displayName[lang] ?? mat.displayName.en}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-neutral-300" strokeWidth={1.5} />
                  </div>
                )}
              </button>
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

        {/* ── Palette name + designer + reset ── */}
        <div className="mt-4 flex items-start justify-between">
          {pv2 ? (
            <div className="space-y-0.5">
              <h3 className="font-serif text-[13px] text-neutral-900 leading-tight">
                {t(`palette.${pv2.id}`)}
              </h3>
              {designer && (
                <p className="text-[8px] uppercase tracking-widest text-neutral-500">
                  {t("thread.curatedBy")}: {designer.name}
                </p>
              )}
            </div>
          ) : <div />}
          <button
            onClick={handleClearSlots}
            disabled={!Object.values(slotSelections).some(Boolean)}
            className="w-6 h-6 flex items-center justify-center active:scale-95 transition-all disabled:opacity-20 enabled:opacity-50 enabled:hover:opacity-90"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1} />
          </button>
        </div>
      </div>

      <MaterialSlotPicker
        slot={openSlot}
        selections={slotSelections}
        onSelect={handleSlotSelect}
        onClose={() => setOpenSlot(null)}
      />
    </div>
  );
}
