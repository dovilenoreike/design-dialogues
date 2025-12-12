import { Check } from "lucide-react";

interface MaterialPaletteProps {
  selectedMaterial: string | null;
  onSelectMaterial: (material: string) => void;
}

const materials = [
  { name: "Milan Grey", color: "bg-slate-400", temp: "Cool" },
  { name: "Natural Walnut", color: "bg-amber-700", temp: "Warm" },
  { name: "Onyx & Brass", color: "bg-zinc-900", temp: "Bold" },
  { name: "Calacatta White", color: "bg-stone-100 border border-border", temp: "Clean" },
];

const MaterialPalette = ({ selectedMaterial, onSelectMaterial }: MaterialPaletteProps) => {
  return (
    <div>
      <h3 className="text-lg font-serif mb-1">Material Palette</h3>
      <p className="text-sm text-muted-foreground mb-4">Select your texture</p>
      
      <div className="grid grid-cols-2 gap-3">
        {materials.map((material) => (
          <button
            key={material.name}
            onClick={() => onSelectMaterial(material.name)}
            className={`card-interactive text-left ${
              selectedMaterial === material.name ? "card-interactive-selected" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${material.color} flex-shrink-0 flex items-center justify-center`}>
                {selectedMaterial === material.name && (
                  <Check size={16} className={material.name === "Calacatta White" ? "text-foreground" : "text-primary-foreground"} />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{material.name}</p>
                <p className="text-xs text-muted-foreground">{material.temp}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MaterialPalette;
