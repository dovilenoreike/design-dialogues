import React, { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { RotateCcw, Plus, Check, X, Sparkles, Camera, Info, Layers, Search, Settings } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useShowroom } from "@/contexts/ShowroomContext";
import { getArchetypeById } from "@/data/archetypes";
import { type SlotKey, type SlotSelections, SLOT_KEY_TO_ROLE } from "../controls/MaterialSlotPicker";
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
import { useGraphMaterials, getMaterialByCode } from "@/hooks/useGraphMaterials";

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
  tertiaryFronts:   "/placeholders/tertiaryFronts.webp",
  worktops:         "/placeholders/worktops.webp",
  accents:          "/placeholders/accents.webp",
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

// ─── Props ─────────────────────────────────────────────────────────────────
interface KonceptasViewProps {
  slotSelections: SlotSelections;
  activeSlot: SlotKey | null;
  setActiveSlot: (slot: SlotKey | null) => void;
  enabledOptionalSlots: Set<SlotKey>;
  setEnabledOptionalSlots: React.Dispatch<React.SetStateAction<Set<SlotKey>>>;
  handleSlotClear: (slot: SlotKey) => void;
  onVisualize: () => void;
  onClearAll: () => void;
  onScrollToPicker: () => void;
  t: (key: string) => string;
  language: string;
}

// ─── Component ────────────────────────────────────────────────────────────
export default function KonceptasView({
  slotSelections,
  activeSlot,
  setActiveSlot,
  enabledOptionalSlots,
  setEnabledOptionalSlots,
  handleSlotClear,
  onVisualize,
  onClearAll,
  onScrollToPicker,
  t,
  language,
}: KonceptasViewProps) {
  const { materialOverrides, setMaterialOverrides } = useDesign();
  const { activeShowroom } = useShowroom();
  const isMobile = useIsMobile();
  const lang = language as "en" | "lt";

  const { loading: graphLoading, graphMaterials, getBestSwapCode, isCompatibleWithOthers } = useGraphMaterials();

  const [lastSwap, setLastSwap] = useState<{ pk: string; fromCode: string; toCode: string } | null>(null);
  const swapJustAppliedRef = useRef(false);
  const [showHint, setShowHint] = useState(() => {
    try { return !localStorage.getItem("moodboard-hint-seen"); } catch { return true; }
  });
  const [showInspirationDialog, setShowInspirationDialog] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showConfigSheet, setShowConfigSheet] = useState(false);

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

  const allSlotsFilled = DISPLAYED_SLOTS.every((k) => Boolean(slotSelections[k]));
  const filledCount = DISPLAYED_SLOTS.filter((k) => Boolean(slotSelections[k])).length;
  const mainSlotsFilled = (["floor", "mainFronts", "additionalFronts", "worktops"] as SlotKey[]).every((k) => Boolean(slotSelections[k]));

  return (
    <div onClick={() => setActiveSlot(null)}>
      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2">
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
          {/* Visualize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (allSlotsFilled) {
                onVisualize();
              } else {
                const firstEmpty = DISPLAYED_SLOTS.find((k) => !slotSelections[k]) ?? DISPLAYED_SLOTS[0];
                setActiveSlot(firstEmpty);
                onScrollToPicker();
                toast(t("mobile.stage.selectMaterialsFirst"));
              }
            }}
            className="h-8 px-3 rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            <span className="text-[11px] font-medium text-white tracking-[0.03em] whitespace-nowrap">
              {t("moodboard.visualize")}
            </span>
          </button>
          {/* Clear — only when slots are filled */}
          {filledCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearAll(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: "rgba(255,255,255,0.72)", border: "0.5px solid rgba(0,0,0,0.08)" }}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.55)" }} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
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
