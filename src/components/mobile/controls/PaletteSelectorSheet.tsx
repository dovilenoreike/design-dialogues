import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { palettes } from "@/data/palettes";
import { paletteThumbnails } from "@/data/palettes/thumbnails";

interface PaletteSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPaletteId: string | null;
  onSelectPalette: (paletteId: string) => void;
}

export default function PaletteSelectorSheet({
  isOpen,
  onClose,
  selectedPaletteId,
  onSelectPalette,
}: PaletteSelectorSheetProps) {
  const { t } = useLanguage();

  const handleSelect = (paletteId: string) => {
    onSelectPalette(paletteId);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader className="mb-4">
          <SheetTitle className="font-serif">{t("specs.selectPalette")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-2">
          {palettes.map((palette) => {
            const isSelected = selectedPaletteId === palette.id;

            return (
              <button
                key={palette.id}
                onClick={() => handleSelect(palette.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  isSelected
                    ? "bg-foreground/5 border border-foreground/20"
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={paletteThumbnails[palette.id]}
                    alt={palette.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-base">
                    {t(`palette.${palette.id}`) || palette.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {palette.mood}
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
