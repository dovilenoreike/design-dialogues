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
}: MaterialSlotPickerProps) {
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  // Which archetype chip is expanded in the variants row (user-driven)
  const [activeArchetypeId, setActiveArchetypeId] = useState<string | null>(null);

  // Reset when a different slot opens
  useEffect(() => { setActiveArchetypeId(null); }, [slot]);

  // ─── Archetype chips data (sorted by priority) ──────────────────────────────
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

  // ─── Effective active archetype ─────────────────────────────────────────────
  // Priority: user click → current flatlay selection → first in sorted list
  const effectiveActiveId = useMemo(() => {
    if (activeArchetypeId && availableWithImages.some(i => i.archetype.id === activeArchetypeId)) return activeArchetypeId;
    const selId = slot ? selections[slot] : null;
    if (selId && availableWithImages.some(i => i.archetype.id === selId)) return selId;
    return availableWithImages[0]?.archetype.id ?? null;
  }, [activeArchetypeId, availableWithImages, slot, selections]);

  // ─── Variants for active archetype ──────────────────────────────────────────
  const activeVariants = useMemo(() => {
    if (!slot || !effectiveActiveId || !graphMaterials) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const mats = graphMaterials ?? [];
    const recommendedCodes = new Set(
      getRecommendedCodes ? getRecommendedCodes(null, otherMaterialCodes ?? [], role) : []
    );
    return mats
      .filter(m => m.archetypeId === effectiveActiveId && m.role.includes(role) && m.imageUrl)
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
  }, [slot, effectiveActiveId, graphMaterials, otherMaterialCodes, getRecommendedCodes, selectedMaterialCode, lang]);

  const selectedId = slot ? selections[slot] : null;
  const isFirstPick = !selectedId;
  const activeArchetypeLabel = availableWithImages.find(i => i.archetype.id === effectiveActiveId)?.archetype.label[lang] ?? "";

  const handleArchetypeClick = (archetypeId: string, resolvedCode?: string) => {
    // Accents have no individual materials — always select directly
    if (slot && SLOT_KEY_TO_ROLE[slot] === "accent") {
      onSelect(slot, archetypeId, archetypeId);
      setTimeout(onClose, 200);
      return;
    }
    // First pick: no material placed yet — select the archetype's best material immediately
    if (isFirstPick) {
      onSelect(slot!, archetypeId, resolvedCode);
      setTimeout(onClose, 200);
      return;
    }
    // Changing existing selection: expand variants row
    setActiveArchetypeId(archetypeId);
  };

  const handleVariantSelect = (code: string) => {
    if (!slot || !effectiveActiveId) return;
    onSelect(slot, effectiveActiveId, code);
    setTimeout(onClose, 200);
  };

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
                  {/* "Goes together" badge */}
                  {isRecommended && (
                    <div className="absolute bottom-1 inset-x-1 flex justify-center">
                      <span className="text-[8px] font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none truncate">
                        {t("surface.matchingMaterials")}
                      </span>
                    </div>
                  )}
                  {/* Dot indicator: this archetype contains the placed material */}
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
            {/* Variants header: archetype name + count */}
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

            {/* Variants horizontal scroll */}
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
                    {/* "Goes together" badge — top, dark pill */}
                    {v.isRecommended && (
                      <div className="absolute top-1 inset-x-1 flex justify-center">
                        <span className="text-[8px] font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none truncate">
                          {t("surface.matchingMaterials")}
                        </span>
                      </div>
                    )}
                    {/* Check icon — bottom right when selected */}
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

        {/* Bottom safe-area spacer when no remove button */}
        {!(selectedId && onClear && slot) && <div className="pb-4" />}
      </SheetContent>
    </Sheet>
  );
}
