import { useState } from "react";
import { Check, Sparkles, User, ChevronRight } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { palettes, getPaletteById } from "@/data/palettes";
import DesignerProfileSheet from "./DesignerProfileSheet";

// Import thumbnail images for palette cards
import fogInTheForestImg from "@/assets/materials/fog-in-the-forest.jpg";
import behindTheLightsImg from "@/assets/materials/behind-the-lights.jpg";
import chocolateWabiSabiImg from "@/assets/materials/chocolate-wabi-sabi.jpg";
import morningForestImg from "@/assets/materials/morning-forest.jpg";

interface MaterialPaletteProps {
  selectedMaterial: string | null;
  onSelectMaterial: (material: string | null) => void;
  freestyleDescription: string;
  onFreestyleChange: (description: string) => void;
}

// Map palette IDs to thumbnail images
const paletteThumbnails: Record<string, string> = {
  "fog-in-the-forest": fogInTheForestImg,
  "behind-the-lights": behindTheLightsImg,
  "chocolate-wabi-sabi": chocolateWabiSabiImg,
  "morning-forest": morningForestImg,
};

type PaletteMode = "curated" | "freestyle";

const MaterialPalette = ({ 
  selectedMaterial, 
  onSelectMaterial,
  freestyleDescription,
  onFreestyleChange
}: MaterialPaletteProps) => {
  const haptic = useHaptic();
  const [mode, setMode] = useState<PaletteMode>("curated");
  const [designerSheetOpen, setDesignerSheetOpen] = useState(false);

  // Get selected palette for designer info
  const selectedPalette = selectedMaterial ? getPaletteById(selectedMaterial) : palettes[0];
  const currentDesigner = selectedPalette?.designer || "Sigita Kulikajeva";
  const currentDesignerTitle = selectedPalette?.designerTitle || "Interior Designer";

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

  const handleSelect = (paletteId: string) => {
    haptic.medium();
    onSelectMaterial(paletteId);
  };

  const handleDesignerClick = () => {
    haptic.light();
    setDesignerSheetOpen(true);
  };

  return (
    <div>
      <h3 className="text-base md:text-lg font-serif mb-1">Material Palette</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-3">Select your texture</p>
      
      {/* Designer Row - Clickable */}
      <button
        onClick={handleDesignerClick}
        className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl bg-surface-muted hover:bg-surface-sunken transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-ds-border-default">
          <User size={18} className="text-text-tertiary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-text-primary">{currentDesigner}</p>
          <p className="text-xs text-text-tertiary">{currentDesignerTitle}</p>
        </div>
        <ChevronRight size={18} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
      </button>

      {/* Designer Profile Sheet */}
      <DesignerProfileSheet
        open={designerSheetOpen}
        onOpenChange={setDesignerSheetOpen}
        designer={currentDesigner}
        designerTitle={currentDesignerTitle}
        currentPaletteId={selectedMaterial || "fog-in-the-forest"}
        onSelectPalette={onSelectMaterial}
      />
      
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
          {palettes.map((palette) => {
            const isSelected = selectedMaterial === palette.id;
            
            return (
              <button
                key={palette.id}
                onClick={() => handleSelect(palette.id)}
                className={`card-interactive text-left touch-manipulation active:scale-[0.98] transition-transform w-32 md:w-auto flex-shrink-0 snap-start p-0 overflow-hidden ${
                  isSelected ? "card-interactive-selected" : ""
                }`}
              >
                {/* Vertical Stack: Image on top, Text below */}
                <div className="flex flex-col">
                  {/* Square Image */}
                  <div className="relative aspect-square w-full">
                    <img 
                      src={paletteThumbnails[palette.id]} 
                      alt={palette.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                        <Check size={20} className="text-background" />
                      </div>
                    )}
                  </div>
                  {/* Text below image */}
                  <div className="p-2 text-center">
                    <p className="font-serif text-sm">{palette.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{palette.temp}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Freestyle Input */
        <div className="space-y-3">
          <textarea
            value={freestyleDescription}
            onChange={(e) => onFreestyleChange(e.target.value)}
            placeholder="Describe your vision...&#10;e.g., Black matte kitchen facades, white quartz worktops, warm oak flooring, brass accents"
            className="w-full h-32 p-4 text-sm bg-white border border-ds-border-default rounded-xl resize-none placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-interactive-default/10 focus:border-ds-border-strong transition-all"
          />
          <p className="text-[11px] text-muted-foreground">
            Our designers will curate a personalized material selection based on your description
          </p>
        </div>
      )}
    </div>
  );
};

export default MaterialPalette;
