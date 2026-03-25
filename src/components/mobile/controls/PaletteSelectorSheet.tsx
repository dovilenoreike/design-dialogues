import { useMemo } from "react";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { collectionHasShowroom, getCollectionSwatches } from "@/lib/collection-utils";

interface PaletteSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPaletteId: string | null;
  onSelectPalette: (paletteId: string) => void;
  showroomId?: string | null;
}

export default function PaletteSelectorSheet({
  isOpen,
  onClose,
  selectedPaletteId,
  onSelectPalette,
  showroomId,
}: PaletteSelectorSheetProps) {
  const { t, language } = useLanguage();

  const displayCollections = useMemo(
    () => showroomId ? collectionsV2.filter((c) => collectionHasShowroom(c.id, showroomId)) : collectionsV2,
    [showroomId],
  );

  const handleSelect = (collectionId: string) => {
    onSelectPalette(collectionId);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader className="mb-4">
          <SheetTitle className="font-serif">{t("specs.selectPalette")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-2">
          {displayCollections.map((collection) => {
            const isSelected = selectedPaletteId === collection.id;
            const displayName = collection.name[language as keyof typeof collection.name] ?? collection.name.en;

            return (
              <button
                key={collection.id}
                onClick={() => handleSelect(collection.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  isSelected
                    ? "bg-foreground/5 border border-foreground/20"
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                {/* Material swatch grid */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                  <div className="grid grid-cols-2 gap-px bg-neutral-200 w-full h-full">
                    {getCollectionSwatches(collection).map((img, i) => (
                      <div key={i} className="bg-neutral-100 overflow-hidden">
                        {img && <img src={img} className="w-full h-full object-cover" alt="" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-base">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {t(`vibe.${collection.vibe}`) || collection.vibe}
                  </p>
                </div>

                {/* Check */}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
