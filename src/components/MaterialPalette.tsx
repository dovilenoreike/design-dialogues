import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface MaterialPaletteProps {
  selectedMaterial: string | null;
  onSelectMaterial: (material: string | null) => void;
  freestyleDescription: string;
  onFreestyleChange: (description: string) => void;
}

const materials = [
  { 
    name: "Milan Grey", 
    temp: "Cool",
    swatches: ["bg-slate-300", "bg-slate-400", "bg-slate-500", "bg-zinc-400"]
  },
  { 
    name: "Natural Walnut", 
    temp: "Warm",
    swatches: ["bg-amber-600", "bg-amber-700", "bg-amber-800", "bg-yellow-700"]
  },
  { 
    name: "Onyx & Brass", 
    temp: "Bold",
    swatches: ["bg-zinc-900", "bg-zinc-800", "bg-yellow-600", "bg-zinc-700"]
  },
  { 
    name: "Calacatta White", 
    temp: "Clean",
    swatches: ["bg-stone-100", "bg-stone-200", "bg-gray-100", "bg-stone-50"]
  },
];

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

  const handleSelect = (material: string) => {
    haptic.medium();
    onSelectMaterial(material);
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
        /* Curated Palettes Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materials.map((material) => {
            const isSelected = selectedMaterial === material.name;
            
            return (
              <button
                key={material.name}
                onClick={() => handleSelect(material.name)}
                className={`card-interactive text-left min-h-[60px] touch-manipulation active:scale-[0.98] transition-transform ${
                  isSelected ? "card-interactive-selected" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 4-swatch preview grid */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full rounded-lg overflow-hidden border border-border">
                      {material.swatches.map((swatch, i) => (
                        <div key={i} className={`${swatch}`} />
                      ))}
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-foreground/60 rounded-lg flex items-center justify-center">
                        <Check size={16} className="text-background" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{material.name}</p>
                    <p className="text-xs text-muted-foreground">{material.temp}</p>
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
