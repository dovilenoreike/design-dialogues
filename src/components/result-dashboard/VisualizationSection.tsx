/**
 * VisualizationSection - Left panel with generated/uploaded image and action buttons
 */

import { RefreshCw, Palette, RotateCcw, Sparkles } from "lucide-react";
import { getPaletteById } from "@/data/palettes";
import { getStyleById } from "@/data/styles";

interface VisualizationSectionProps {
  uploadedImage: string | null;
  generatedImage: string | null;
  selectedMaterial: string | null;
  selectedStyle: string | null;
  freestyleDescription: string;
  onRegenerateVisualization?: () => void;
  onChangeStyle?: () => void;
  onStartFresh?: () => void;
}

const VisualizationSection = ({
  uploadedImage,
  generatedImage,
  selectedMaterial,
  selectedStyle,
  freestyleDescription,
  onRegenerateVisualization,
  onChangeStyle,
  onStartFresh,
}: VisualizationSectionProps) => {
  return (
    <div className="slide-up">
      <div className="aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-secondary">
        {generatedImage ? (
          <img
            src={generatedImage}
            alt="AI generated interior"
            className="w-full h-full object-cover"
          />
        ) : uploadedImage ? (
          <img
            src={uploadedImage}
            alt="Your space"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">AI Rendered Design</p>
          </div>
        )}
      </div>

      {/* Visualization Disclaimer */}
      <p className="text-[10px] md:text-xs text-muted-foreground italic mt-2 text-center">
        Conceptual visualization — actual spaces and materials may vary
      </p>

      {/* Style Badges */}
      <div className="mt-3 md:mt-4 flex gap-2 flex-wrap">
        {freestyleDescription ? (
          <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium flex items-center gap-1">
            <Sparkles size={10} />
            Custom Vision
          </span>
        ) : selectedMaterial ? (
          <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium">
            {getPaletteById(selectedMaterial)?.name || selectedMaterial}
          </span>
        ) : null}
        {selectedStyle && (
          <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium">
            {getStyleById(selectedStyle)?.name || selectedStyle}
          </span>
        )}
      </div>

      {/* Exploration Actions */}
      <div className="mt-5 md:mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRegenerateVisualization}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
        >
          <RefreshCw size={16} />
          Try Another Version
        </button>
        <button
          onClick={onChangeStyle}
          className="flex items-center justify-center gap-2 px-5 py-3 border border-foreground rounded-full font-medium text-sm hover:bg-secondary transition-all touch-manipulation"
        >
          <Palette size={16} />
          Change Style
        </button>
      </div>
      <button
        onClick={onStartFresh}
        className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
      >
        <RotateCcw size={12} />
        Start Fresh
      </button>
    </div>
  );
};

export default VisualizationSection;
