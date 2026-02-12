import { Check } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { styles, getStyleImage } from "@/data/styles";
import { getVisualization } from "@/data/visualisations";

export default function StyleCarousel() {
  const { design, handleSelectStyle } = useDesign();
  const { t } = useLanguage();
  const { selectedStyle, selectedCategory, selectedMaterial } = design;

  return (
    <div
      className={`h-full flex items-center justify-center ${
        !selectedStyle ? "animate-pulse-subtle" : ""
      }`}
    >
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {styles.map((style) => {
          const isSelected = selectedStyle === style.id;
          // Use style ID for visualization lookup (folder structure is by style)
          const dynamicImageUrl = getVisualization(selectedMaterial, selectedCategory, style.id);
          const fallbackImageUrl = getStyleImage(style.id);

          return (
            <button
              key={style.id}
              onClick={() => handleSelectStyle(style.id)}
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
                  src={dynamicImageUrl}
                  alt={t(`style.${style.id}`) || style.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (fallbackImageUrl) {
                      e.currentTarget.src = fallbackImageUrl;
                    }
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
