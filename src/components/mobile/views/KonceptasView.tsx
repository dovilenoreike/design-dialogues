import { useState, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { RotateCcw, Plus, Check, X, Sparkles, Layers, Search, Camera, ArrowLeftRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypeById } from "@/data/archetypes";
import { type SlotKey, type SlotSelections, SLOT_KEY_TO_ROLE } from "../controls/MaterialSlotPicker";
import { useGraphMaterials, getMaterialByCode, getCachedImageUrl } from "@/hooks/useGraphMaterials";

// ─── Palette key mapping ───────────────────────────────────────────────────
export const SLOT_TO_PALETTE_KEY: Record<SlotKey, string | null> = {
  floor: "floor",
  mainFronts: "bottomCabinets",
  additionalFronts: "topCabinets",
  tertiaryFronts: "tallCabinets",
  worktops: "worktops",
  accents: "accents",
  mainTiles: "tiles",
  additionalTiles: "additionalTiles",
};

// Default surface assignment — strictly 1:1. User can add secondary keys via the picker pills.
export const DEFAULT_SLOT_SURFACES: Record<SlotKey, string[]> = {
  floor:            ["floor"],
  mainFronts:       ["bottomCabinets"],
  additionalFronts: ["topCabinets"],
  tertiaryFronts:   ["tallCabinets"],
  worktops:         ["worktops"],
  accents:          ["accents"],
  mainTiles:        ["tiles"],
  additionalTiles:  ["additionalTiles"],
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

// Layering order (back → front): floor → tertiaryFronts → additionalFronts → mainFronts → worktops → accents
const PIECES: Piece[] = [
  { slot: "floor",            top: "13%", left: "10%", width: "84%", height: "66%",
    rotate: "0deg", zIndex: 1, shadow: "0 1px 2px rgba(0,0,0,0.06)" },
  { slot: "tertiaryFronts",   top: "35%", left: "23%", width: "52%", height: "47%",
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


// All non-floor slots are optional — enabled by default, but user can remove them
export const OPTIONAL_SLOTS: SlotKey[] = ["mainFronts", "additionalFronts", "tertiaryFronts", "worktops", "accents"];

const SLOT_PLACEHOLDER: Partial<Record<SlotKey, string>> = {
  floor:            "/placeholders/floor.webp",
  mainFronts:       "/placeholders/mainFronts.webp",
  additionalFronts: "/placeholders/additionalFronts.webp",
  tertiaryFronts:   "/placeholders/tertiaryFronts.webp",
  worktops:         "/placeholders/worktops.webp",
  accents:          "/placeholders/accents.webp",
};

// ─── Info modal content ────────────────────────────────────────────────────
export function InfoRows({ t }: { t: (key: string) => string }) {
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

export function PhotoInfoRows({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col gap-4">
      <InfoRow icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.infoStep1Title")} desc={t("moodboard.infoStep1Desc")} />
      <InfoRow icon={<Check className="w-3.5 h-3.5" strokeWidth={2} />} title={t("moodboard.infoCheckTitle")} desc={t("moodboard.infoCheckDesc")} />
      <InfoRow icon={<Camera className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.photoInfoUploadTitle")} desc={t("moodboard.photoInfoUploadDesc")} />
      <InfoRow icon={<ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.photoInfoConceptTitle")} desc={t("moodboard.photoInfoConceptDesc")} />
      <InfoRow icon={<Search className="w-3.5 h-3.5" strokeWidth={1.6} />} title={t("moodboard.infoSearchTitle")} desc={t("moodboard.infoSearchDesc")} />
    </div>
  );
}

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

// ─── Category labels ──────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  front: "Fronts",
  worktop: "Worktops",
  accent: "Accents",
};

// Maps slot key → addable category (for on-canvas placeholder squares)
const SLOT_TO_CATEGORY: Partial<Record<SlotKey, string>> = {
  mainFronts: "front",
  additionalFronts: "front",
  tertiaryFronts: "front",
  worktops: "worktop",
  accents: "accent",
};

// ─── Props ─────────────────────────────────────────────────────────────────
interface KonceptasViewProps {
  slotSelections: SlotSelections;
  slotSurfaces: Record<SlotKey, string[]>;
  activeSlot: SlotKey | null;
  setActiveSlot: (slot: SlotKey | null) => void;
  enabledOptionalSlots: Set<SlotKey>;
  addableCategories: string[];
  onAddCategory: (category: string) => void;
  handleSlotClear: (slot: SlotKey) => void;
  onVisualize: () => void;
  onClearAll: () => void;
  onScrollToPicker: () => void;
  requiredMissing: SlotKey | null;
  hasIncompatibleSlots: boolean;
  onRequestReview: () => void;
  t: (key: string) => string;
  language: string;
}

// ─── Component ────────────────────────────────────────────────────────────
export default function KonceptasView({
  slotSelections,
  slotSurfaces,
  activeSlot,
  setActiveSlot,
  enabledOptionalSlots,
  addableCategories,
  onAddCategory,
  handleSlotClear,
  onVisualize,
  onClearAll,
  onScrollToPicker,
  requiredMissing,
  hasIncompatibleSlots,
  onRequestReview,
  t,
  language,
}: KonceptasViewProps) {
  const { materialOverrides, setMaterialOverrides } = useDesign();
  const { activeShowroom } = useShowroom();
  const lang = language as "en" | "lt";

  const { loading: graphLoading, getBestSwapCode, isCompatibleWithOthers } = useGraphMaterials();

  const [lastSwap, setLastSwap] = useState<{ pk: string; fromCode: string; toCode: string } | null>(null);
  const swapJustAppliedRef = useRef(false);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem("moodboard-hint-seen"); } catch { return true; }
  });

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

  const activeSlots: SlotKey[] = ["floor", ...OPTIONAL_SLOTS.filter(k => enabledOptionalSlots.has(k))];
  const allSlotsFilled = activeSlots.every((k) => Boolean(slotSelections[k]));
  const filledCount = activeSlots.filter((k) => Boolean(slotSelections[k])).length;
  const mainSlotsFilled = (["floor", "mainFronts", "additionalFronts", "worktops"] as SlotKey[])
    .filter(k => k === "floor" || enabledOptionalSlots.has(k))
    .every((k) => Boolean(slotSelections[k]));

  return (
    <div className="-mt-3" onClick={() => setActiveSlot(null)}>
      {/* Canvas */}
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: "4/4.9" }}
        onClick={(e) => { e.stopPropagation(); setActiveSlot(null); }}
      >
        {/* Background */}
        <div className="absolute rounded-2xl bg-neutral-50" style={{ top: "8px", left: "8px", right: "8px", bottom: "10%" }} />

        {/* Pieces wrapper — shifted up relative to the background */}
        <div className="absolute inset-0" style={{ transform: "translateY(-5%)" }}>

        {/* Material cut-sample pieces */}
        {PIECES.map((piece, i) => {
          if (piece.slot === "accents" && !mainSlotsFilled) return null;
          if (OPTIONAL_SLOTS.includes(piece.slot) && !enabledOptionalSlots.has(piece.slot)) return null;
          const archetypeId = slotSelections[piece.slot];
          // Use the dynamic primary key (set by handleAddSurfaceKey) so the flatlay
          // always mirrors what was actually written to materialOverrides
          const pk = slotSurfaces[piece.slot]?.[0] ?? SLOT_TO_PALETTE_KEY[piece.slot];
          const overrideCode = pk ? (materialOverrides[pk] ?? "") : "";
          const tileImage = overrideCode
            ? (getMaterialByCode(overrideCode)?.imageUrl ?? getCachedImageUrl(overrideCode))
            : null;
          const displayImage = tileImage;
          const currentMatId = pk ? (materialOverrides[pk] ?? null) : null;

          const otherCodes = (Object.keys(slotSurfaces) as SlotKey[])
            .filter(k => k !== piece.slot)
            .map(k => { const v = slotSurfaces[k]?.[0]; return v ? materialOverrides[v] : null; })
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
          const showNudge = isCompatible === false && !!graphBestCode;
          const isActive = piece.slot === activeSlot;

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
                      onScrollToPicker();
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
                          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center gap-0.5">
                            <Plus
                              className={`w-4 h-4 text-white/80 ${filledCount === 0 ? "animate-slot-breathe" : ""}`}
                              strokeWidth={1.5}
                            />
                            <span className="text-[7px] font-semibold tracking-[0.14em] uppercase text-white/65 select-none">
                              {t(`surface.${piece.slot}`) || piece.slot}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex flex-col items-center justify-center gap-0.5">
                          <Plus
                            className={`w-4 h-4 text-neutral-300 ${filledCount === 0 ? "animate-slot-breathe" : ""}`}
                            strokeWidth={1.5}
                          />
                          <span className="text-[7px] font-semibold tracking-[0.14em] uppercase text-neutral-300 select-none">
                            {t(`surface.${piece.slot}`) || piece.slot}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              </div>
              {(archetypeId || OPTIONAL_SLOTS.includes(piece.slot)) && (
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

        {/* Addable-category placeholders — dashed squares at natural positions inside the canvas */}
        {PIECES.map(piece => {
          if (enabledOptionalSlots.has(piece.slot)) return null;
          const category = SLOT_TO_CATEGORY[piece.slot];
          if (!category || !addableCategories.includes(category)) return null;
          // For fronts only show the next available slot (not all three at once)
          if (["mainFronts", "additionalFronts", "tertiaryFronts"].includes(piece.slot)) {
            const nextFront = (["mainFronts", "additionalFronts", "tertiaryFronts"] as SlotKey[])
              .find(s => !enabledOptionalSlots.has(s));
            if (piece.slot !== nextFront) return null;
          }
          return (
            <div
              key={`add-${piece.slot}`}
              className="absolute"
              style={{ top: piece.top, left: piece.left, width: piece.width, height: piece.height, zIndex: piece.zIndex }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); dismissHint(); onAddCategory(category); }}
                className="w-full h-full flex flex-col items-center justify-center gap-1 active:scale-[0.97] transition-transform"
                style={{
                  borderRadius: piece.borderRadius ?? "4px",
                  border: "1.5px dashed rgba(0,0,0,0.18)",
                  backgroundColor: "rgba(255,255,255,0.55)",
                }}
              >
                <Plus className="w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} strokeWidth={1.5} />
                <span
                  className="text-[7px] font-semibold tracking-[0.14em] uppercase select-none"
                  style={{ color: "rgba(0,0,0,0.35)" }}
                >
                  {t(`category.${category}`) || CATEGORY_LABEL[category] || category}
                </span>
              </button>
            </div>
          );
        })}

        </div>{/* end pieces wrapper */}

        {/* Visualize + review buttons — sits just below the piece arrangement */}
        <div className="absolute inset-x-0 flex justify-center gap-2 bottom-[8%] md:bottom-[12%]">
          {hasIncompatibleSlots && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestReview(); }}
              className="h-8 px-3 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform text-[11px] font-medium tracking-[0.03em] whitespace-nowrap"
              style={{ backgroundColor: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
            >
              {t("moodboard.requestReview")}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!requiredMissing) {
                onVisualize();
              } else {
                setActiveSlot(requiredMissing);
                onScrollToPicker();
                toast(t("mobile.stage.selectMaterialsFirst"));
              }
            }}
            className="h-8 px-3 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          >
            <Sparkles className="w-3 h-3 text-white" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-white tracking-[0.03em] whitespace-nowrap">
              {t("moodboard.visualize")}
            </span>
          </button>
        </div>

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

      </div>

    </div>
  );
}
