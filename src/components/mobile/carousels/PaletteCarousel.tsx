import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { palettes } from "@/data/palettes";
import { paletteThumbnails } from "@/data/palettes/thumbnails";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaletteBadge } from "@/components/PaletteBadge";

export default function PaletteCarousel() {
  const { t } = useLanguage();
  const { design, handleSelectMaterial, handleFreestyleChange } = useDesign();
  const { selectedMaterial, selectedStyle, freestyleDescription } = design;
  const [isFreestyleOpen, setIsFreestyleOpen] = useState(false);
  const [freestyleInput, setFreestyleInput] = useState(freestyleDescription);

  const handleSaveFreestyle = () => {
    handleFreestyleChange(freestyleInput);
    setIsFreestyleOpen(false);
  };

  const hasFreestyle = freestyleDescription.trim().length > 0;

  return (
    <>
      <div
        className={`h-full flex items-center justify-center ${
          selectedStyle && !selectedMaterial && !hasFreestyle ? "animate-pulse-subtle" : ""
        }`}
      >
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {palettes.map((palette) => {
            const isSelected = selectedMaterial === palette.id;

            return (
              <button
                key={palette.id}
                onClick={() => handleSelectMaterial(palette.id)}
                className="flex-shrink-0 transition-transform active:scale-95"
              >
                <div
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    isSelected
                      ? "border-foreground"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={paletteThumbnails[palette.id]}
                    alt={palette.name}
                    className="w-full h-full object-cover"
                  />
                  <PaletteBadge status={palette.status} />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Create Your Own button */}
          <button
            onClick={() => {
              setFreestyleInput(freestyleDescription);
              setIsFreestyleOpen(true);
            }}
            className="flex-shrink-0 transition-transform active:scale-95"
          >
            <div
              className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center ${
                hasFreestyle
                  ? "border-foreground bg-foreground"
                  : "border-dashed border-muted-foreground/50 bg-muted/50"
              }`}
            >
              {hasFreestyle ? (
                <Check className="w-4 h-4 text-background" strokeWidth={2.5} />
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Freestyle Modal */}
      <Dialog open={isFreestyleOpen} onOpenChange={setIsFreestyleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("mobile.freestyle.title")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("mobile.freestyle.placeholder")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea
              value={freestyleInput}
              onChange={(e) => setFreestyleInput(e.target.value)}
              placeholder={t("mobile.freestyle.placeholder")}
              className="w-full h-32 p-4 text-sm bg-white border border-border rounded-xl resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsFreestyleOpen(false)}
                className="flex-1 py-3 px-4 text-sm font-medium rounded-full border border-border hover:bg-muted transition-colors"
              >
                {t("mobile.freestyle.cancel")}
              </button>
              <button
                onClick={handleSaveFreestyle}
                className="flex-1 py-3 px-4 text-sm font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                {t("mobile.freestyle.apply")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
