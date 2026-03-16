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
): Archetype[] {
  const category = SLOT_CATEGORY[slotKey];

  if (lockedCollectionId) {
    const col = collectionsV2.find((c) => c.id === lockedCollectionId);
    const poolIds = col?.pool[category] ?? [];
    const archetypeMap = new Map(getArchetypesByCategory(category).map((a) => [a.id, a]));
    return poolIds.map((id) => archetypeMap.get(id)).filter((a): a is Archetype => a !== undefined);
  }

  const vibeFiltered = vibeTag
    ? collectionsV2.filter((col) => col.vibe === vibeTag)
    : collectionsV2;

  const otherPicks = SLOT_ORDER
    .filter((k) => k !== slotKey && selections[k] !== null)
    .map((k) => ({ category: SLOT_CATEGORY[k], archetypeId: selections[k]! }));

  if (otherPicks.length === 0) {
    const collectionIds = new Set(vibeFiltered.flatMap((col) => col.pool[category] ?? []));
    return getArchetypesByCategory(category).filter((a) => collectionIds.has(a.id));
  }

  const compatibleCollections = vibeFiltered.filter((col) =>
    otherPicks.every(({ category: cat, archetypeId }) =>
      col.pool[cat]?.includes(archetypeId) ?? false
    )
  );

  if (compatibleCollections.length === 0) return [];

  const compatibleIds = new Set<string>(
    compatibleCollections.flatMap((col) => col.pool[category] ?? [])
  );

  return getArchetypesByCategory(category).filter((a) => compatibleIds.has(a.id));
}

function resolveProductImage(
  archetypeId: string,
  category: SurfaceCategory,
  lockedCollectionId: string | undefined,
  vibeTag: VibeTag | null | undefined,
): string | null {
  const relevantCollections = lockedCollectionId
    ? collectionsV2.filter((c) => c.id === lockedCollectionId)
    : vibeTag
      ? collectionsV2.filter((c) => c.vibe === vibeTag)
      : collectionsV2;

  for (const col of relevantCollections) {
    const productId = col.products[category]?.[archetypeId]?.[0];
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
  lockedCollectionId?: string;
  vibeTag?: VibeTag | null;
}

export default function MaterialSlotPicker({
  slot,
  selections,
  onSelect,
  onClose,
  onClear,
  lockedCollectionId,
  vibeTag,
}: MaterialSlotPickerProps) {
  const { t, language } = useLanguage();
  const lang = language as "en" | "lt";

  const availableWithImages = useMemo(() => {
    if (!slot) return [];
    const cat = SLOT_CATEGORY[slot];
    return getAvailableArchetypes(slot, selections, lockedCollectionId, vibeTag)
      .map((a) => ({
        archetype: a,
        displayImage: resolveProductImage(a.id, cat, lockedCollectionId, vibeTag),
      }))
      .filter((item): item is { archetype: Archetype; displayImage: string } =>
        item.displayImage !== null
      );
  }, [slot, selections, lockedCollectionId, vibeTag]);

  const selectedId = slot ? selections[slot] : null;

  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2" aria-describedby={undefined}>
        <SheetHeader className="mb-4">
          <SheetTitle className="font-serif">
            {slot ? t(`surface.${slot}`) : ""}
          </SheetTitle>
        </SheetHeader>

        {selectedId && onClear && slot && (
          <button
            onClick={() => { onClear(slot); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 mb-3 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-[11px] uppercase tracking-[0.15em] font-medium">{t("surface.remove")}</span>
          </button>
        )}

        <div className="grid grid-cols-3 gap-2 pb-4">
          {availableWithImages.map(({ archetype, displayImage }) => {
            const isSelected = selectedId === archetype.id;
            return (
              <button
                key={`${archetype.category}-${archetype.id}`}
                onClick={() => { onSelect(slot!, archetype.id); onClose(); }}
                className="relative flex flex-col gap-1 group"
              >
                <div className={`relative aspect-square rounded-xl overflow-hidden w-full ${isSelected ? "ring-2 ring-foreground" : ""}`}>
                  <img
                    src={displayImage}
                    alt={archetype.label[lang]}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                </div>
                <span className="block text-[9px] tracking-[0.1em] uppercase font-medium text-neutral-500 text-center truncate px-0.5">
                  {archetype.label[lang]}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
