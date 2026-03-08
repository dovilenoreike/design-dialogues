import { useMemo } from "react";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMaterialsByCategory, getMaterialById } from "@/data/materials";
import { collections } from "@/data/collections";
import type { SurfaceCategory } from "@/data/materials/types";

export type SlotKey = "floor" | "mainFronts" | "worktops" | "additionalFronts" | "accents" | "mainTiles" | "additionalTiles";
export type SlotSelections = Record<SlotKey, string | null>;

const SLOT_ORDER: SlotKey[] = ["floor", "mainFronts", "worktops", "additionalFronts", "accents", "mainTiles", "additionalTiles"];

const SLOT_CATEGORY: Record<SlotKey, SurfaceCategory> = {
  floor: "flooring",
  mainFronts: "cabinet-fronts",
  worktops: "worktops-and-backsplashes",
  additionalFronts: "cabinet-fronts",
  accents: "cabinet-fronts",
  mainTiles: "tiles",
  additionalTiles: "tiles",
};

function getAvailableMaterials(slotKey: SlotKey, selections: SlotSelections) {
  const category = SLOT_CATEGORY[slotKey];
  const otherIds = SLOT_ORDER
    .filter((k) => k !== slotKey)
    .map((k) => selections[k])
    .filter((id): id is string => id !== null);

  if (otherIds.length === 0) {
    return getMaterialsByCategory(category);
  }

  const compatibleCollections = collections.filter((col) =>
    otherIds.every((id) =>
      Object.values(col.pool).flat().includes(id)
    )
  );

  if (compatibleCollections.length === 0) {
    return getMaterialsByCategory(category);
  }

  const compatibleIds = new Set<string>(
    compatibleCollections.flatMap((col) => col.pool[category] ?? [])
  );

  return getMaterialsByCategory(category).filter((m) => compatibleIds.has(m.id));
}

interface MaterialSlotPickerProps {
  slot: SlotKey | null;
  selections: SlotSelections;
  onSelect: (slotKey: SlotKey, materialId: string) => void;
  onClose: () => void;
}

export default function MaterialSlotPicker({
  slot,
  selections,
  onSelect,
  onClose,
}: MaterialSlotPickerProps) {
  const { t, language } = useLanguage();

  const available = useMemo(() => {
    if (!slot) return [];
    return getAvailableMaterials(slot, selections);
  }, [slot, selections]);

  const handleSelect = (materialId: string) => {
    if (!slot) return;
    onSelect(slot, materialId);
    onClose();
  };

  return (
    <Sheet open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto sm:max-w-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2" aria-describedby={undefined}>
        <SheetHeader className="mb-4">
          <SheetTitle className="font-serif">
            {slot ? t(`surface.${slot}`) : ""}
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 pb-4">
          {available.map((material) => {
            const isSelected = slot !== null && selections[slot] === material.id;
            return (
              <button
                key={material.id}
                onClick={() => handleSelect(material.id)}
                className="relative flex flex-col gap-1 group"
              >
                <div className={`relative aspect-square rounded-xl overflow-hidden w-full ${isSelected ? "ring-2 ring-foreground" : ""}`}>
                  <img
                    src={material.image}
                    alt={material.displayName[language as "en" | "lt"] ?? material.displayName.en}
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
                  {material.displayName[language as "en" | "lt"] ?? material.displayName.en}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
