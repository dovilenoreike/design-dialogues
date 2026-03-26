import { useMemo } from "react";
import { Check, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArchetypesByCategory } from "@/data/archetypes";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getMaterialById } from "@/data/materials";
import type { SurfaceCategory } from "@/data/materials/types";
import type { VibeTag } from "@/data/collections/types";
import type { Archetype } from "@/data/archetypes/types";
import type { ShowroomBrand } from "@/data/sourcing/types";
import { collectionHasShowroom } from "@/lib/collection-utils";
import { matchCollection, type SlotPick } from "@/lib/collection-matching";

export type SlotKey = "floor" | "mainFronts" | "worktops" | "additionalFronts" | "accents" | "mainTiles" | "additionalTiles";
export type SlotSelections = Record<SlotKey, string | null>;

const SLOT_ORDER: SlotKey[] = ["floor", "mainFronts", "worktops", "additionalFronts", "accents", "mainTiles", "additionalTiles"];

export const SLOT_CATEGORY: Record<SlotKey, SurfaceCategory> = {
  floor: "flooring",
  mainFronts: "cabinet-fronts",
  worktops: "worktops-and-backsplashes",
  additionalFronts: "cabinet-fronts",
  accents: "accents",
  mainTiles: "tiles",
  additionalTiles: "tiles",
};

function getAvailableArchetypes(
  slotKey: SlotKey,
  selections: SlotSelections,
  lockedCollectionId?: string,
  vibeTag?: VibeTag | null,
  showroom?: ShowroomBrand | null,
): Archetype[] {
  const category = SLOT_CATEGORY[slotKey];

  if (lockedCollectionId) {
    const col = collectionsV2.find((c) => c.id === lockedCollectionId);
    const poolIds = col?.pool[category] ?? [];
    const archetypeMap = new Map(getArchetypesByCategory(category).map((a) => [a.id, a]));
    const archetypes = poolIds.map((id) => archetypeMap.get(id)).filter((a): a is Archetype => a !== undefined);

    if (showroom && showroom.surfaceCategories.includes(category)) {
      return archetypes.filter((a) =>
        (col?.products[category]?.[a.id] ?? []).some(
          (matId) => getMaterialById(matId)?.showroomIds?.includes(showroom.id)
        )
      );
    }
    return archetypes;
  }

  const vibeFiltered = vibeTag
    ? collectionsV2.filter((col) => col.vibe === vibeTag)
    : collectionsV2;

  // when showroom is active, restrict to collections that carry at least one showroom product
  const baseCollections = showroom
    ? vibeFiltered.filter((col) => collectionHasShowroom(col.id, showroom.id))
    : vibeFiltered;

  const otherPicks = SLOT_ORDER
    .filter((k) => k !== slotKey && selections[k] !== null)
    .map((k) => ({ category: SLOT_CATEGORY[k], archetypeId: selections[k]! }));

  let archetypes: Archetype[];

  if (otherPicks.length === 0) {
    const collectionIds = new Set(baseCollections.flatMap((col) => col.pool[category] ?? []));
    archetypes = getArchetypesByCategory(category).filter((a) => collectionIds.has(a.id));
  } else {
    const compatibleCollections = baseCollections.filter((col) =>
      otherPicks.every(({ category: cat, archetypeId }) =>
        col.pool[cat]?.includes(archetypeId) ?? false
      )
    );

    if (compatibleCollections.length === 0) return [];

    const compatibleIds = new Set<string>(
      compatibleCollections.flatMap((col) => col.pool[category] ?? [])
    );

    archetypes = getArchetypesByCategory(category).filter((a) => compatibleIds.has(a.id));
  }

  if (showroom && showroom.surfaceCategories.includes(category)) {
    return archetypes.filter((a) =>
      baseCollections.some((col) =>
        (col.products[category]?.[a.id] ?? []).some(
          (matId) => getMaterialById(matId)?.showroomIds?.includes(showroom.id)
        )
      )
    );
  }

  return archetypes;
}

function resolveProductImage(
  archetypeId: string,
  category: SurfaceCategory,
  lockedCollectionId: string | undefined,
  vibeTag: VibeTag | null | undefined,
  showroom?: ShowroomBrand | null,
): string | null {
  const relevantCollections = lockedCollectionId
    ? collectionsV2.filter((c) => c.id === lockedCollectionId)
    : vibeTag
      ? collectionsV2.filter((c) => c.vibe === vibeTag)
      : collectionsV2;

  for (const col of relevantCollections) {
    const products = col.products[category]?.[archetypeId] ?? [];
    const productId = showroom
      ? (products.find((id) => getMaterialById(id)?.showroomIds?.includes(showroom.id)) ?? products[0])
      : products[0];
    if (productId) {
      const image = getMaterialById(productId)?.image;
      if (image) return image;
    }
  }
  return null;
}

interface MaterialSlotPickerProps {
  slot: SlotKey | null;
  selections: SlotSelections;
  onSelect: (slotKey: SlotKey, archetypeId: string) => void;
  onClose: () => void;
  onClear?: (slotKey: SlotKey) => void;
  onSelectCollection?: (collectionId: string) => void;
  lockedCollectionId?: string;
  vibeTag?: VibeTag | null;
  showroom?: ShowroomBrand | null;
  currentCollectionId?: string;
}

export default function MaterialSlotPicker({
  slot,
  selections,
  onSelect,
  onClose,
  onClear,
  onSelectCollection,
  lockedCollectionId,
  vibeTag,
  showroom,
  currentCollectionId,
}: MaterialSlotPickerProps) {
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  const availableWithImages = useMemo(() => {
    if (!slot) return [];
    const cat = SLOT_CATEGORY[slot];
    const currentCol = currentCollectionId
      ? collectionsV2.find((c) => c.id === currentCollectionId) ?? null
      : null;
    return getAvailableArchetypes(slot, selections, lockedCollectionId, vibeTag, showroom)
      .map((a) => {
        // Simulate selecting this archetype + all other current picks,
        // then find which collection would actually be matched.
        const simulatedPicks: SlotPick[] = [
          ...Object.entries(selections)
            .filter(([k, v]) => k !== slot && v !== null)
            .map(([k, v]) => ({ category: SLOT_CATEGORY[k as SlotKey], archetypeId: v! })),
          { category: cat, archetypeId: a.id },
        ];
        const isRecommended = currentCol !== null &&
          (currentCol.pool[cat]?.includes(a.id) ?? false);
        // For recommended archetypes, resolve images from the current collection so
        // the shown product matches what the flatlay will actually display after selection.
        const effectiveCollectionId = isRecommended
          ? currentCollectionId
          : (matchCollection(collectionsV2, simulatedPicks, vibeTag ?? null)?.id ?? lockedCollectionId);
        return {
          archetype: a,
          displayImage: resolveProductImage(a.id, cat, effectiveCollectionId, vibeTag, showroom),
          isRecommended,
        };
      })
      .filter((item): item is { archetype: Archetype; displayImage: string; isRecommended: boolean } =>
        item.displayImage !== null
      )
      .sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended));
  }, [slot, selections, lockedCollectionId, vibeTag, showroom, currentCollectionId]);


  const collectionAlternatives = useMemo(() => {
    if (!slot) return [];
    const selectedArchetypeId = selections[slot];
    if (!selectedArchetypeId) return [];

    const cat = SLOT_CATEGORY[slot];
    const allPicks: SlotPick[] = (Object.keys(selections) as SlotKey[])
      .filter((k) => selections[k] !== null)
      .map((k) => ({ category: SLOT_CATEGORY[k], archetypeId: selections[k]! }));
    if (allPicks.length < 1) return [];

    const scope = vibeTag
      ? collectionsV2.filter((c) => c.vibe === vibeTag)
      : collectionsV2;

    return scope
      .filter((col) => {
        if (col.id === currentCollectionId) return false;
        return allPicks.every(({ category, archetypeId }) =>
          col.pool[category]?.includes(archetypeId) ?? false
        );
      })
      .map((col) => {
        const products = col.products[cat]?.[selectedArchetypeId] ?? [];
        const productId = showroom
          ? (products.find((id) => getMaterialById(id)?.showroomIds?.includes(showroom.id)) ?? products[0])
          : products[0];
        if (!productId) return null;
        const material = getMaterialById(productId);
        if (!material?.image) return null;
        return { collectionId: col.id, displayImage: material.image, materialName: material.displayName };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item, idx, arr) => arr.findIndex((o) => o.displayImage === item.displayImage) === idx)
      .filter((item) => item.displayImage !== resolveProductImage(selectedArchetypeId, cat, currentCollectionId, vibeTag, showroom));
  }, [slot, selections, currentCollectionId, vibeTag, showroom]);

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

        {/* Section 1: Kiti atspalviai — same archetype in other collections */}
        {collectionAlternatives.length > 0 && (
          <div className="mb-5">
            <h3 className="font-serif text-sm text-neutral-700 mb-2">{t("surface.alternativeCollections")}</h3>
            <div className="grid grid-cols-5 gap-2">
              {collectionAlternatives.map(({ collectionId, displayImage, materialName }) => (
                <button
                  key={collectionId}
                  onClick={() => { onSelectCollection?.(collectionId); onClose(); }}
                  className="flex flex-col gap-1"
                >
                  <div className="aspect-square rounded-[12px] overflow-hidden w-full">
                    <img src={displayImage} alt={materialName[lang]} className="w-full h-full object-cover" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sections 2 & 3 */}
        {availableWithImages.length > 0 && (() => {
          const recommended = availableWithImages.filter((i) => i.isRecommended);
          const others = availableWithImages.filter((i) => !i.isRecommended);

          const renderSwatch = ({ archetype, displayImage }: { archetype: (typeof availableWithImages)[0]["archetype"]; displayImage: string }) => {
            const isSelected = selectedId === archetype.id;
            return (
              <button
                key={`${archetype.category}-${archetype.id}`}
                onClick={() => { onSelect(slot!, archetype.id); onClose(); }}
                className="flex flex-col gap-1"
              >
                <div
                  className={`relative aspect-square rounded-[12px] overflow-hidden w-full${isSelected ? " ring-2 ring-offset-1 ring-offset-white" : ""}`}
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
                </div>
                <span className="block text-xs text-neutral-500 text-center truncate px-0.5">
                  {archetype.label[lang]}
                </span>
              </button>
            );
          };

          return (
            <>
              {recommended.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-serif text-sm text-neutral-700 mb-2">{t("surface.matchingMaterials")}</h3>
                  <div className="bg-neutral-50 rounded-xl p-3">
                    <div className="grid grid-cols-4 gap-2">
                      {recommended.map((item) => renderSwatch(item))}
                    </div>
                  </div>
                </div>
              )}
              {others.length > 0 && (
                <div className="mb-4">
                  {(recommended.length > 0 || collectionAlternatives.length > 0) && (
                    <h3 className="font-serif text-sm text-neutral-700 mb-2">{t("surface.otherStyles")}</h3>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {others.map((item) => renderSwatch(item))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </SheetContent>
    </Sheet>
  );
}
