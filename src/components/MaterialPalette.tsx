import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getCollectionSwatches } from "@/lib/collection-utils";

interface MaterialPaletteProps {
  selectedMaterial: string | null;
  onSelectMaterial: (material: string | null) => void;
  freestyleDescription: string;
  onFreestyleChange: (description: string) => void;
}

type PaletteMode = "curated" | "freestyle";

const MaterialPalette = ({
  selectedMaterial,
  onSelectMaterial,
  freestyleDescription,
  onFreestyleChange
}: MaterialPaletteProps) => {
  const haptic = useHaptic();
  const [mode, setMode] = useState<PaletteMode>("curated");

  const handleModeChange = (newMode: PaletteMode) => {
    haptic.light();
    setMode(newMode);
    // Clear selections when switching modes
    if (newMode === "curated") {
      onFreestyleChange("");
    } else {
      onSelectMaterial(null);
    }
  };

  const handleSelect = (collectionId: string) => {
    haptic.medium();
    onSelectMaterial(collectionId);
  };

  return (
    <div>
      <h3 className="text-base md:text-lg font-serif mb-1">Material Palette</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-4">Select your texture</p>

      {/* Mode Toggle */}
      <div className="relative flex p-1 bg-surface-muted rounded-full mb-4">
        <div
          className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
          style={{
            width: "calc(50% - 4px)",
            left: mode === "curated" ? "4px" : "calc(50%)",
          }}
        />
        <button
          onClick={() => handleModeChange("curated")}
          className={`relative z-10 flex-1 py-2 text-xs font-medium rounded-full transition-colors duration-200 ${
            mode === "curated" ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          Designer Collections
        </button>
        <button
          onClick={() => handleModeChange("freestyle")}
          className={`relative z-10 flex-1 py-2 text-xs font-medium rounded-full transition-colors duration-200 flex items-center justify-center gap-1.5 ${
            mode === "freestyle" ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          <Sparkles size={12} />
          Create Your Own
        </button>
      </div>

      {mode === "curated" ? (
        /* Mobile: Horizontal scroll | Desktop: Grid */
        <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide pb-2 md:pb-0">
          {collectionsV2.map((collection) => {
            const isSelected = selectedMaterial === collection.id;
            const displayName = typeof collection.name === "object" ? collection.name.en : collection.name;

            return (
              <button
                key={collection.id}
                onClick={() => handleSelect(collection.id)}
                className={`card-interactive text-left touch-manipulation active:scale-[0.98] transition-transform w-32 md:w-auto flex-shrink-0 snap-start p-0 overflow-hidden ${
                  isSelected ? "card-interactive-selected" : ""
                }`}
              >
                {/* Vertical Stack: Image on top, Text below */}
                <div className="flex flex-col">
                  {/* Square swatch grid */}
                  <div className="relative aspect-square w-full">
                    <div className="grid grid-cols-2 gap-px bg-neutral-200 w-full h-full">
                      {getCollectionSwatches(collection).map((img, i) => (
                        <div key={i} className="bg-neutral-100 overflow-hidden">
                          {img && <img src={img} className="w-full h-full object-cover" alt="" />}
                        </div>
                      ))}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                        <Check size={20} className="text-background" />
                      </div>
                    )}
                  </div>
                  {/* Text below image */}
                  <div className="p-2 text-center min-h-[60px] flex flex-col justify-start">
                    <p className="font-serif text-sm">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{collection.vibe}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Freestyle Input */
        <div>
          <textarea
            value={freestyleDescription}
            onChange={(e) => onFreestyleChange(e.target.value)}
            placeholder="Describe your vision...&#10;e.g., Black matte kitchen facades, white quartz worktops, warm oak flooring, brass accents"
            className="w-full h-32 p-4 text-sm bg-white border border-ds-border-default rounded-xl resize-none placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-interactive-default/10 focus:border-ds-border-strong transition-all"
          />
        </div>
      )}
    </div>
  );
};

export default MaterialPalette;
