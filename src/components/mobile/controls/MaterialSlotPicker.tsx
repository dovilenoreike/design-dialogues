import { useMemo, useState, useEffect } from "react";
import { Check, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArchetypesByRole } from "@/data/archetypes";
import { getMaterialByCode, getPairCountByCode, getCompatibilityScore } from "@/hooks/useGraphMaterials";
import type { MaterialRole } from "@/types/material-types";
import type { Archetype } from "@/data/archetypes/types";
import type { SupabaseMaterial } from "@/hooks/useGraphMaterials";

// ─── Warmth sub-category logic ────────────────────────────────────────────────

type WarmthGroup = "warm" | "neutral" | "cold";
const WARMTH_GROUPS: WarmthGroup[] = ["warm", "neutral", "cold"];
const WARMTH_THRESHOLDS = { warm: 0.35, cold: -0.35 };
const WARMTH_GROUP_COLORS: Record<WarmthGroup, string> = {
  warm:    "#d4b870",
  neutral: "#c8c0b4",
  cold:    "#b4bcc8",
};

function getWarmthGroup(warmth: number | null | undefined): WarmthGroup {
  const w = warmth ?? 50;
  if (w > WARMTH_THRESHOLDS.warm) return "warm";
  if (w < WARMTH_THRESHOLDS.cold) return "cold";
  return "neutral";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotKey = "floor" | "mainFronts" | "worktops" | "additionalFronts" | "accents" | "mainTiles" | "additionalTiles";
export type SlotSelections = Record<SlotKey, string | null>;

export const SLOT_KEY_TO_ROLE: Record<SlotKey, MaterialRole> = {
  floor: "floor",
  mainFronts: "front",
  additionalFronts: "front",
  worktops: "worktop",
  accents: "accent",
  mainTiles: "tile",
  additionalTiles: "tile",
};

interface MaterialSlotPickerProps {
  slot: SlotKey | null;
  selections: SlotSelections;
  onSelect: (slotKey: SlotKey, archetypeId: string, resolvedCode?: string) => void;
  onClose: () => void;
  onClear?: (slotKey: SlotKey) => void;
  otherMaterialCodes?: string[];
  selectedMaterialCode?: string;
  getRecommendedCodes?: (currentCode: string | null, otherCodes: string[], role?: string) => string[];
  graphMaterials?: SupabaseMaterial[];
  /** Only hide archetypes with no matching graph materials when the showroom actively covers this slot's role */
  filterEmptyArchetypes?: boolean;
  /** Render as an always-visible inline panel instead of a bottom-sheet modal */
  inline?: boolean;
  /** Called when user taps the X in inline mode (e.g. reset to default slot) */
  onResetSlot?: () => void;
}

export default function MaterialSlotPicker({
  slot,
  selections,
  onSelect,
  onClose,
  onClear,
  otherMaterialCodes,
  selectedMaterialCode,
  getRecommendedCodes,
  graphMaterials,
  filterEmptyArchetypes = false,
  inline = false,
  onResetSlot,
}: MaterialSlotPickerProps) {
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  // Which archetype chip is expanded (user-driven)
  const [activeArchetypeId, setActiveArchetypeId] = useState<string | null>(null);
  // Warmth sub-category selection (inline mode only)
  const [activeWarmthGroup, setActiveWarmthGroup] = useState<WarmthGroup | null>(null);

  // Reset internal state when slot changes
  useEffect(() => {
    setActiveArchetypeId(null);
    setActiveWarmthGroup(null);
  }, [slot]);

  // ─── Archetype chips data (sorted by priority) ────────────────────────────
  const availableWithImages = useMemo(() => {
    if (!slot) return [];
    const role = SLOT_KEY_TO_ROLE[slot];

    const recommendedCodes = new Set(
      getRecommendedCodes
        ? getRecommendedCodes(null, otherMaterialCodes ?? [], role)
        : []
    );

    const mats = graphMaterials ?? [];
    const graphLoaded = mats.length > 0;

    return getArchetypesByRole(role)
      .map((a) => {
        const archetypeMats = mats.filter((m) => m.archetypeId === a.id && m.role.includes(role));
        const recommendedMat = archetypeMats.find((m) => recommendedCodes.has(m.technicalCode));

        let displayImage: string | null | undefined;
        let resolvedCode: string | undefined;
        let isRecommended: boolean;

        if (selectedMaterialCode && a.id === selections[slot]) {
          displayImage = getMaterialByCode(selectedMaterialCode)?.imageUrl ?? a.image;
          resolvedCode = selectedMaterialCode;
          isRecommended = recommendedCodes.size > 0 && recommendedCodes.has(selectedMaterialCode);
        } else {
          const primaryMat = recommendedMat ?? (
            archetypeMats.length > 0
              ? archetypeMats.reduce((best, m) =>
                  getPairCountByCode(m.technicalCode) > getPairCountByCode(best.technicalCode) ? m : best
                )
              : undefined
          );
          resolvedCode = primaryMat?.technicalCode;
          if (filterEmptyArchetypes && graphLoaded && !resolvedCode && role !== "accent") {
            return { archetype: a, displayImage: null as null, isRecommended: false, resolvedCode: undefined };
          }
          if (!resolvedCode) {
            resolvedCode = a.id;
          }
          displayImage = (resolvedCode ? getMaterialByCode(resolvedCode)?.imageUrl : null) ?? a.image;
          isRecommended = recommendedCodes.size > 0 && !!recommendedMat;
        }

        const archetypePairScore = archetypeMats.reduce(
          (sum, m) => sum + getPairCountByCode(m.technicalCode), 0
        );
        const archetypePartialScore = archetypeMats.reduce((max, m) =>
          Math.max(max, getCompatibilityScore(m.technicalCode, otherMaterialCodes ?? [])), 0
        );
        return { archetype: a, displayImage, isRecommended, resolvedCode, archetypePairScore, archetypePartialScore };
      })
      .filter((item): item is { archetype: Archetype; displayImage: string; isRecommended: boolean; resolvedCode: string | undefined; archetypePairScore: number; archetypePartialScore: number } =>
        item.displayImage !== null && item.displayImage !== undefined
      )
      .sort((a, b) =>
        Number(b.isRecommended) - Number(a.isRecommended) ||
        b.archetypePartialScore - a.archetypePartialScore ||
        b.archetypePairScore - a.archetypePairScore
      );
  }, [slot, selections, otherMaterialCodes, selectedMaterialCode, getRecommendedCodes, graphMaterials, filterEmptyArchetypes]);

  // ─── Effective active archetype ───────────────────────────────────────────
  const effectiveActiveId = useMemo(() => {
    if (activeArchetypeId && availableWithImages.some(i => i.archetype.id === activeArchetypeId)) return activeArchetypeId;
    const selId = slot ? selections[slot] : null;
    if (selId && availableWithImages.some(i => i.archetype.id === selId)) return selId;
    return availableWithImages[0]?.archetype.id ?? null;
  }, [activeArchetypeId, availableWithImages, slot, selections]);

  // ─── Warmth groups for active archetype (inline mode) ────────────────────
  const warmthGroups = useMemo(() => {
    if (!inline || !slot || !effectiveActiveId || !graphMaterials) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const archetypeMats = graphMaterials.filter(m => m.archetypeId === effectiveActiveId && m.role.includes(role));
    if (archetypeMats.length === 0) return [];
    const presentGroups = new Set(archetypeMats.map(m => getWarmthGroup(m.warmth)));
    return WARMTH_GROUPS
      .filter(g => presentGroups.has(g))
      .map(g => {
        const groupMats = archetypeMats.filter(m => getWarmthGroup(m.warmth) === g);
        const best = groupMats.reduce((b, m) =>
          getPairCountByCode(m.technicalCode) >= getPairCountByCode(b.technicalCode) ? m : b
        );
        return { group: g, imageUrl: best.imageUrl ?? null, color: WARMTH_GROUP_COLORS[g], bestCode: best.technicalCode };
      });
  }, [inline, slot, effectiveActiveId, graphMaterials]);

  // ─── Variants for active archetype (+ warmth filter in inline mode) ───────
  const activeVariants = useMemo(() => {
    if (!slot || !effectiveActiveId || !graphMaterials) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const mats = graphMaterials;
    const recommendedCodes = new Set(
      getRecommendedCodes ? getRecommendedCodes(null, otherMaterialCodes ?? [], role) : []
    );
    return mats
      .filter(m =>
        m.archetypeId === effectiveActiveId &&
        m.role.includes(role) &&
        m.imageUrl &&
        // In inline mode, filter by warmth group when one is selected
        (!inline || activeWarmthGroup === null || getWarmthGroup(m.warmth) === activeWarmthGroup)
      )
      .map(m => ({
        code: m.technicalCode,
        image: m.imageUrl!,
        name: m.name?.[lang] ?? m.technicalCode,
        isSelected: m.technicalCode === selectedMaterialCode,
        isRecommended: recommendedCodes.size > 0 && recommendedCodes.has(m.technicalCode),
      }))
      .sort((a, b) =>
        Number(b.isSelected) - Number(a.isSelected) ||
        Number(b.isRecommended) - Number(a.isRecommended) ||
        getPairCountByCode(b.code) - getPairCountByCode(a.code)
      );
  }, [slot, effectiveActiveId, graphMaterials, otherMaterialCodes, getRecommendedCodes, selectedMaterialCode, lang, inline, activeWarmthGroup]);

  const selectedId = slot ? selections[slot] : null;
  const isFirstPick = !selectedId;
  const activeArchetypeLabel = availableWithImages.find(i => i.archetype.id === effectiveActiveId)?.archetype.label[lang] ?? "";

  // ─── Modal-mode handlers ──────────────────────────────────────────────────
  const handleArchetypeClick = (archetypeId: string, resolvedCode?: string) => {
    if (slot && SLOT_KEY_TO_ROLE[slot] === "accent") {
      onSelect(slot, archetypeId, archetypeId);
      setTimeout(onClose, 200);
      return;
    }
    if (isFirstPick) {
      onSelect(slot!, archetypeId, resolvedCode);
      setTimeout(onClose, 200);
      return;
    }
    setActiveArchetypeId(archetypeId);
  };

  const handleVariantSelect = (code: string) => {
    if (!slot || !effectiveActiveId) return;
    onSelect(slot, effectiveActiveId, code);
    setTimeout(onClose, 200);
  };

  // ─── Inline-mode handlers ─────────────────────────────────────────────────
  const handleArchetypeClickInline = (archetypeId: string, resolvedCode?: string) => {
    setActiveArchetypeId(archetypeId);
    setActiveWarmthGroup(null);
    if (!slot) return;
    if (SLOT_KEY_TO_ROLE[slot] === "accent") {
      onSelect(slot, archetypeId, archetypeId);
    } else {
      onSelect(slot, archetypeId, resolvedCode);
    }
  };

  const handleWarmthGroupClickInline = (group: WarmthGroup, bestCode?: string) => {
    setActiveWarmthGroup(group);
    if (!slot || !effectiveActiveId) return;
    if (bestCode) {
      onSelect(slot, effectiveActiveId, bestCode);
    }
  };

  const handleVariantSelectInline = (code: string) => {
    if (!slot || !effectiveActiveId) return;
    onSelect(slot, effectiveActiveId, code);
  };

  // ─── Inline render ────────────────────────────────────────────────────────

  // Shared swatch size for all 3 rows — uniform grid feel
  const SWATCH_SIZE = 52;
  const SWATCH_RADIUS = 13;

  const SwatchRow = ({ children, alignItems = "center" }: { children: React.ReactNode; alignItems?: "center" | "start" }) => (
    <div
      className="flex gap-2.5 px-4 overflow-x-auto flex-shrink-0"
      style={{ scrollbarWidth: "none", alignItems } as React.CSSProperties}
    >
      {children}
    </div>
  );

  const SwatchButton = ({ children, onClick, isActive }: { children: React.ReactNode; onClick: () => void; isActive: boolean }) => (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 active:scale-95"
      style={{
        width: SWATCH_SIZE, height: SWATCH_SIZE,
        borderRadius: SWATCH_RADIUS,
        overflow: "hidden",
        border: isActive ? "2px solid #647d75" : "2px solid transparent",
        transition: "border-color 0.15s, transform 0.1s",
      }}
    >
      {children}
    </button>
  );

  const SwatchDot = ({ position, withBorder }: { position: "top-left" | "bottom-right"; withBorder?: boolean }) => (
    <div
      className="absolute"
      style={{
        ...(position === "top-left" ? { top: 5, left: 5 } : { bottom: 4, right: 4 }),
        width: 6, height: 6,
        borderRadius: "50%",
        backgroundColor: "#647d75",
        ...(withBorder ? { border: "1.5px solid white", width: 7, height: 7 } : {}),
      }}
    />
  );

  const SwatchDivider = () => (
    <div className="mx-4 flex-shrink-0" style={{ height: "0.5px", backgroundColor: "#e8e4e0" }} />
  );

  if (inline) {
    if (!slot) return null;

    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: "var(--color-background-primary, #fff)" }}>
        {/* Header: slot title + optional reset button */}
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: "0.5px solid #e8e4e0" }}
        >
          <span className="text-[15px] font-medium" style={{ color: "#1a1a1a" }}>
            {t(`surface.${slot}`)}
          </span>
          {onResetSlot && (
            <button
              onClick={onResetSlot}
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#f5f2ef", color: "#6b7280" }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Three swatch rows — uniform 52px swatches, each row scrolls independently */}
        <div className="flex-1 flex flex-col justify-evenly py-1 min-h-0">

          {/* Row 1 — Archetypes */}
          <SwatchRow>
            {availableWithImages.map(({ archetype, displayImage, resolvedCode, isRecommended }) => {
              const isActive = archetype.id === effectiveActiveId;
              const hasSelection = selectedId === archetype.id;
              return (
                <SwatchButton
                  key={`inline-arch-${archetype.role}-${archetype.id}`}
                  onClick={() => handleArchetypeClickInline(archetype.id, resolvedCode)}
                  isActive={isActive}
                >
                  <img src={displayImage} alt="" className="w-full h-full object-cover" />
                  {isRecommended && <SwatchDot position="top-left" />}
                  {hasSelection && <SwatchDot position="bottom-right" withBorder />}
                </SwatchButton>
              );
            })}
          </SwatchRow>

          <SwatchDivider />

          {/* Row 2 — Warmth sub-categories */}
          <SwatchRow>
            {warmthGroups.map(({ group, imageUrl, color, bestCode }) => (
              <SwatchButton
                key={`warmth-${group}`}
                onClick={() => handleWarmthGroupClickInline(group, bestCode)}
                isActive={activeWarmthGroup === group}
              >
                {imageUrl
                  ? <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ backgroundColor: color }} />
                }
              </SwatchButton>
            ))}
          </SwatchRow>

          <SwatchDivider />

          {/* Row 3 — Individual variants */}
          <SwatchRow alignItems="start">
            {activeVariants.map((v) => (
              <div key={v.code} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: SWATCH_SIZE }}>
                <SwatchButton
                  onClick={() => handleVariantSelectInline(v.code)}
                  isActive={v.isSelected}
                >
                  <img src={v.image} alt="" className="w-full h-full object-cover" />
                  {v.isRecommended && <SwatchDot position="top-left" />}
                  {v.isSelected && (
                    <div
                      className="absolute flex items-center justify-center"
                      style={{ bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#647d75" }}
                    >
                      <Check className="w-2 h-2 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </SwatchButton>
                <span
                  className="text-[10px] font-medium text-center w-full truncate leading-tight"
                  style={{ color: v.isSelected ? "#1a1a1a" : "transparent", transition: "color 0.15s", minHeight: "1.2em" }}
                >
                  {v.name}
                </span>
              </div>
            ))}
          </SwatchRow>

        </div>

        {/* Remove material button (inline) */}
        {selectedId && onClear && slot && (
          <button
            onClick={() => onClear(slot)}
            className="mx-4 mb-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] flex-shrink-0"
            style={{ border: "0.5px solid #e8e4e0", color: "#9ca3af" }}
          >
            <Trash2 className="w-3 h-3 flex-shrink-0" strokeWidth={1.8} />
            {t("surface.remove")}
          </button>
        )}
      </div>
    );
  }

  // ─── Modal (Sheet) render — unchanged ─────────────────────────────────────
  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      {/* [&>button.absolute]:hidden suppresses the SheetContent built-in X button */}
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl overflow-hidden sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2 [&>button.absolute]:hidden"
        aria-describedby={undefined}
      >
        {/* Accessible title (screen-reader only) */}
        <SheetTitle className="sr-only">{slot ? t(`surface.${slot}`) : ""}</SheetTitle>

        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full mx-auto mt-2.5" style={{ backgroundColor: "#e0dbd5" }} />

        {/* Header: slot title + close button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-[17px] font-medium" style={{ color: "#1a1a1a" }}>
            {slot ? t(`surface.${slot}`) : ""}
          </span>
          <SheetClose asChild>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#f5f2ef", color: "#6b7280" }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </SheetClose>
        </div>

        {/* "Material type" label */}
        <p className="text-[11px] font-medium tracking-[0.06em] uppercase px-4 mt-0.5 mb-2" style={{ color: "#9ca3af" }}>
          {t("surface.materialType")}
        </p>

        {/* Archetype chips — horizontal scroll */}
        <div
          className="flex gap-2.5 px-4 pb-1 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {availableWithImages.map(({ archetype, displayImage, resolvedCode, isRecommended }) => {
            const isActive = !isFirstPick && archetype.id === effectiveActiveId;
            const hasSelection = selectedId === archetype.id;
            return (
              <button
                key={`chip-${archetype.role}-${archetype.id}`}
                onClick={() => handleArchetypeClick(archetype.id, resolvedCode)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className="w-[52px] h-[52px] rounded-xl overflow-hidden relative flex-shrink-0"
                  style={{
                    border: isActive ? "2px solid #647d75" : "2px solid transparent",
                    transition: "border-color 0.15s",
                  }}
                >
                  <img src={displayImage} alt={archetype.label[lang]} className="w-full h-full object-cover" />
                  {isRecommended && (
                    <div className="absolute bottom-1 inset-x-1 flex justify-center">
                      <span className="text-[8px] font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none truncate">
                        {t("surface.matchingMaterials")}
                      </span>
                    </div>
                  )}
                  {hasSelection && !isRecommended && (
                    <div
                      className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#647d75" }}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] whitespace-nowrap leading-none"
                  style={{
                    color: isActive ? "#647d75" : "#9ca3af",
                    fontWeight: isActive ? 500 : 400,
                    transition: "color 0.15s",
                  }}
                >
                  {archetype.label[lang]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Variants row — only when changing an existing selection */}
        {!isFirstPick && activeVariants.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 mt-3.5 mb-2">
              <span className="text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: "#9ca3af" }}>
                {activeArchetypeLabel}
              </span>
              <span
                className="text-[10px] rounded-full px-2 py-0.5"
                style={{ backgroundColor: "#f3f4f6", color: "#9ca3af" }}
              >
                {activeVariants.length}
              </span>
            </div>

            <div
              className="flex gap-2.5 px-4 pb-1 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              {activeVariants.map((v) => (
                <button
                  key={v.code}
                  onClick={() => handleVariantSelect(v.code)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px]"
                >
                  <div
                    className="w-[72px] h-[72px] rounded-[14px] overflow-hidden relative flex-shrink-0"
                    style={{
                      border: v.isSelected ? "2px solid #647d75" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                    {v.isRecommended && (
                      <div className="absolute top-1 inset-x-1 flex justify-center">
                        <span className="text-[8px] font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none truncate">
                          {t("surface.matchingMaterials")}
                        </span>
                      </div>
                    )}
                    {v.isSelected && (
                      <div
                        className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#647d75" }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[11px] w-full text-center truncate leading-tight"
                    style={{
                      color: v.isSelected ? "#1a1a1a" : "#9ca3af",
                      fontWeight: v.isSelected ? 500 : 400,
                    }}
                  >
                    {v.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Remove material button */}
        {selectedId && onClear && slot && (
          <button
            onClick={() => { onClear(slot); onClose(); }}
            className="mx-4 mt-3.5 mb-4 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl w-[calc(100%-32px)] text-[13px]"
            style={{
              border: "0.5px solid #e8e4e0",
              color: "#9ca3af",
            }}
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
            {t("surface.remove")}
          </button>
        )}

        {!(selectedId && onClear && slot) && <div className="pb-4" />}
      </SheetContent>
    </Sheet>
  );
}
