import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useHaptic } from "@/hooks/use-haptic";
import { styles, styleImages } from "@/data/styles";

interface ArchitecturalStyleProps {
  selectedStyle: string | null;
  onSelectStyle: (style: string | null) => void;
}

const ArchitecturalStyle = ({ selectedStyle, onSelectStyle }: ArchitecturalStyleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const haptic = useHaptic();

  const handleCheckboxChange = (checked: boolean) => {
    haptic.light();
    setIsExpanded(checked);
    if (!checked) {
      onSelectStyle(null);
    }
  };

  const handleStyleSelect = (styleName: string) => {
    haptic.medium();
    onSelectStyle(styleName);
  };

  return (
    <div>
      {/* Checkbox toggle */}
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:border-foreground/30 transition-all duration-300 min-h-[52px] touch-manipulation active:bg-secondary/50">
        <Checkbox 
          checked={isExpanded} 
          onCheckedChange={handleCheckboxChange}
          className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground w-5 h-5"
        />
        <span className="text-sm font-medium flex-1">I want to try a specific style</span>
        <ChevronDown 
          size={18} 
          className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </label>

      {/* Expandable section with header and style grid */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${
        isExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
      }`}>
        <h3 className="text-base md:text-lg font-serif mb-1">Architectural Style</h3>
        <p className="text-xs md:text-sm text-muted-foreground mb-4">Define your shape</p>
        
        {/* Mobile: Horizontal scroll | Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide pb-2 md:pb-0">
          {styles.map((style) => {
            const isSelected = selectedStyle === style.id;
            
            return (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`card-interactive text-left overflow-hidden touch-manipulation active:scale-[0.98] transition-transform w-32 md:w-auto flex-shrink-0 snap-start p-0 ${
                  isSelected ? "card-interactive-selected" : ""
                }`}
              >
                {/* Preview image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={styleImages[style.id]} 
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                        <Check size={12} className="text-background" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 min-h-[68px] flex flex-col justify-start">
                  <p className="font-medium text-xs">{style.name}</p>
                  <p className="text-[10px] text-muted-foreground">{style.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ArchitecturalStyle;
