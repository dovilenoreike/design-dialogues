import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ArchitecturalStyleProps {
  selectedStyle: string | null;
  onSelectStyle: (style: string | null) => void;
}

const styles = [
  { 
    name: "Minimalist", 
    desc: "Less is more",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop"
  },
  { 
    name: "Mid-Century Modern", 
    desc: "Organic curves",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop"
  },
  { 
    name: "Bauhaus", 
    desc: "Form follows function",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&h=200&fit=crop"
  },
  { 
    name: "Contemporary Luxury", 
    desc: "Bold statements",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&h=200&fit=crop"
  },
];

const ArchitecturalStyle = ({ selectedStyle, onSelectStyle }: ArchitecturalStyleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setIsExpanded(checked);
    if (!checked) {
      onSelectStyle(null);
    }
  };

  return (
    <div>
      {/* Checkbox toggle */}
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:border-foreground/30 transition-all duration-300">
        <Checkbox 
          checked={isExpanded} 
          onCheckedChange={handleCheckboxChange}
          className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
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
        
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => {
            const isSelected = selectedStyle === style.name;
            
            return (
              <button
                key={style.name}
                onClick={() => onSelectStyle(style.name)}
                className={`card-interactive text-left overflow-hidden ${
                  isSelected ? "card-interactive-selected" : ""
                }`}
              >
                {/* Preview image */}
                <div className="relative aspect-[4/3] -mx-4 -mt-4 mb-3 overflow-hidden">
                  <img 
                    src={style.image} 
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                        <Check size={16} className="text-background" />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{style.name}</p>
                  <p className="text-xs text-muted-foreground">{style.desc}</p>
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
