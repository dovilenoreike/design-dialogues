import { Check, Minus, Circle, Square, Hexagon } from "lucide-react";

interface ArchitecturalStyleProps {
  selectedStyle: string | null;
  onSelectStyle: (style: string) => void;
}

const styles = [
  { name: "Minimalist", icon: Minus, desc: "Less is more" },
  { name: "Mid-Century Modern", icon: Circle, desc: "Organic curves" },
  { name: "Bauhaus", icon: Square, desc: "Form follows function" },
  { name: "Contemporary Luxury", icon: Hexagon, desc: "Bold statements" },
];

const ArchitecturalStyle = ({ selectedStyle, onSelectStyle }: ArchitecturalStyleProps) => {
  return (
    <div>
      <h3 className="text-lg font-serif mb-1">Architectural Style</h3>
      <p className="text-sm text-muted-foreground mb-4">Define your shape</p>
      
      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.name;
          
          return (
            <button
              key={style.name}
              onClick={() => onSelectStyle(style.name)}
              className={`card-interactive text-left ${
                isSelected ? "card-interactive-selected" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg border flex-shrink-0 flex items-center justify-center transition-colors ${
                  isSelected ? "bg-foreground border-foreground" : "bg-secondary border-border"
                }`}>
                  {isSelected ? (
                    <Check size={16} className="text-background" />
                  ) : (
                    <Icon size={18} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{style.name}</p>
                  <p className="text-xs text-muted-foreground">{style.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ArchitecturalStyle;
