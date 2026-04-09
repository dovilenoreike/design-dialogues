import { useMemo } from "react";
import { Check, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
  // resolvedCode: the specific product code to land on the flatlay (from the picker's recommendation logic)
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

  // All other shades within the same archetype as the current selection
  const otherShadesForSelected = useMemo(() => {
    if (!slot || !selectedMaterialCode || !selections[slot] || !graphMaterials) return [];
    const role = SLOT_KEY_TO_ROLE[slot];
    const currentArchetypeId = selections[slot];

    const recommendedCodes = new Set(
      getRecommendedCodes
        ? getRecommendedCodes(null, otherMaterialCodes ?? [], role)
        : []
    );

    return graphMaterials
      .filter(m =>
        m.archetypeId === currentArchetypeId &&
        m.role.includes(role) &&
        m.technicalCode !== selectedMaterialCode
      )
      .map(m => {
        const image = m.imageUrl;
        const isRecommended = recommendedCodes.size > 0 && recommendedCodes.has(m.technicalCode);
        return image ? { code: m.technicalCode, image, isRecommended } : null;
      })
      .filter((s): s is { code: string; image: string; isRecommended: boolean } => s !== null);
  }, [slot, selections, selectedMaterialCode, graphMaterials, getRecommendedCodes, otherMaterialCodes]);

  const availableWithImages = useMemo(() => {
    if (!slot) return [];
    const role = SLOT_KEY_TO_ROLE[slot];

    const recommendedCodes = new Set(
      getRecommendedCodes
        ? getRecommendedCodes(null, otherMaterialCodes ?? [], role)
        : []
    );

    const mats = graphMaterials ?? [];
    // If mats is non-empty the graph has loaded; exclude archetypes with no matching materials.
    const graphLoaded = mats.length > 0;

    return getArchetypesByRole(role)
      .map((a) => {
        const archetypeMats = mats.filter((m) => m.archetypeId === a.id && m.role.includes(role));

        // The recommended material for this archetype (first one in recommendedCodes).
        // This drives both the badge and the image — ensuring what you see is what gets selected.
        const recommendedMat = archetypeMats.find((m) => recommendedCodes.has(m.technicalCode));

        let displayImage: string | null | undefined;
        let resolvedCode: string | undefined;
        let isRecommended: boolean;

        if (selectedMaterialCode && a.id === selections[slot]) {
          // Currently selected slot: show the actual flatlay override image.
          // isRecommended must reflect the PLACED code, not a sibling in the same archetype.
          displayImage = getMaterialByCode(selectedMaterialCode)?.imageUrl ?? a.image;
          resolvedCode = selectedMaterialCode;
          isRecommended = recommendedCodes.size > 0 && recommendedCodes.has(selectedMaterialCode);
        } else {
          // Use the recommended material if available, otherwise the material with the most pairs
          // (so the most globally relevant product represents the archetype tile).
          const primaryMat = recommendedMat ?? (
            archetypeMats.length > 0
              ? archetypeMats.reduce((best, m) =>
                  getPairCountByCode(m.technicalCode) > getPairCountByCode(best.technicalCode) ? m : best
                )
              : undefined
          );
          resolvedCode = primaryMat?.technicalCode;
          // When the graph is loaded but this archetype has no materials (e.g. showroom filter
          // applied and showroom doesn't carry this archetype), exclude it from the grid.
          // Only apply this for roles that are actually in the graph — roles like accent use
          // archetype IDs directly and would be incorrectly filtered otherwise.
          // Accent archetypes (gold, chrome, etc.) are direct picks — always show them.
          // For all other roles, skip archetypes with no graph materials when showroom-filtering.
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

  const selectedId = slot ? selections[slot] : null;

  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] overflow-y-auto sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2" aria-describedby={undefined}>
        <SheetHeader className="mb-3">
          <SheetTitle className="font-serif text-base">
            {slot ? t(`surface.${slot}`) : ""}
          </SheetTitle>
        </SheetHeader>

        {selectedId && onClear && slot && (
          <button
            onClick={() => { onClear(slot); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-[11px] uppercase tracking-[0.15em] font-medium">{t("surface.remove")}</span>
          </button>
        )}

        {otherShadesForSelected.length > 0 && slot !== "accents" && (
          <div className="mb-4">
            <p className="text-[9px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-2">
              {t("surface.alternativeCollections")}
            </p>
            <div className="flex gap-2 flex-wrap">
              {otherShadesForSelected.map(shade => (
                <button
                  key={shade.code}
                  onClick={() => { onSelect(slot!, selections[slot!]!, shade.code); onClose(); }}
                  className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-offset-1 ring-offset-white hover:ring-2"
                  style={{ "--tw-ring-color": "#647d75" } as React.CSSProperties}
                >
                  <img src={shade.image} alt={shade.code} className="w-full h-full object-cover" />
                  {shade.isRecommended && (
                    <div className="absolute bottom-1 inset-x-1 flex justify-center">
                      <span className="text-[8px] font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none truncate">
                        {t("surface.matchingMaterials")}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableWithImages.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-4 gap-2">
              {availableWithImages.map(({ archetype, displayImage, isRecommended, resolvedCode }) => {
                const isSelected = selectedId === archetype.id;
                return (
                  <button
                    key={`${archetype.role}-${archetype.id}`}
                    onClick={() => { onSelect(slot!, archetype.id, resolvedCode); onClose(); }}
                    className="flex flex-col gap-1"
                  >
                    <div
                      className={`relative aspect-square rounded-[12px] overflow-hidden w-full${
                        isSelected ? " ring-2 ring-offset-1 ring-offset-white" : ""
                      }`}
                      style={isSelected ? { "--tw-ring-color": "#647d75" } as React.CSSProperties : undefined}
                    >
                      <img src={displayImage} alt={archetype.label[lang]} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#647d75" }}>
                            <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                          </div>
                        </div>
                      )}
                      {isRecommended && (
                        <div className="absolute bottom-1 inset-x-1 flex justify-center">
                          <span className="text-[8px] font-medium text-white bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none truncate">
                            {t("surface.matchingMaterials")}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="block text-xs text-neutral-500 text-center truncate px-0.5">
                      {archetype.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
