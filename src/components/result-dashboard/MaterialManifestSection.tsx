/**
 * MaterialManifestSection - Bottom panel showing material palette or freestyle vision
 */

import { Link } from "react-router-dom";
import { ChevronRight, User, MessageSquare, Sparkles } from "lucide-react";
import MaterialCard from "@/components/MaterialCard";
import { getPaletteById } from "@/data/palettes";
import { getMaterialPurpose } from "@/lib/palette-utils";
import { fogMaterialImages, fogMaterialNames, defaultMaterials } from "./constants";

interface MaterialManifestSectionProps {
  mode: "full" | "calculator";
  selectedMaterial: string | null;
  freestyleDescription: string;
  onOpenDesignerSheet: () => void;
  onOpenMaterialMatchModal: () => void;
}

const MaterialManifestSection = ({
  mode,
  selectedMaterial,
  freestyleDescription,
  onOpenDesignerSheet,
  onOpenMaterialMatchModal,
}: MaterialManifestSectionProps) => {
  if (mode === "calculator") {
    // Calculator Mode - Show Visualize CTA
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
        >
          <Sparkles size={16} />
          Visualize Your Space
        </Link>
      </div>
    );
  }

  if (freestyleDescription) {
    // Freestyle Mode - Show description and CTA
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-text-muted" />
          <h4 className="text-sm font-medium text-foreground">Your Vision</h4>
        </div>
        <blockquote className="text-sm text-text-secondary italic border-l-2 border-ds-border-strong pl-3 mb-5">
          "{freestyleDescription}"
        </blockquote>
        <button
          onClick={onOpenMaterialMatchModal}
          className="w-full py-3 border border-foreground rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary transition-all touch-manipulation active:scale-[0.98]"
        >
          <MessageSquare size={16} />
          Request Curated Material List
        </button>
      </div>
    );
  }

  // Curated Mode - Show material cards
  const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;

  return (
    <>
      {/* Header with Designer Credit */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-foreground">Material Palette</h4>
        <button
          onClick={onOpenDesignerSheet}
          className="w-full flex items-center gap-2 mt-2 p-2 -mx-2 rounded-lg hover:bg-surface-sunken transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-text-muted" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-foreground">
              {palette?.designer || "Design Dialogues"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {palette?.designerTitle || "Interior Designer"}
            </p>
          </div>
          <ChevronRight
            size={16}
            className="text-text-muted group-hover:text-text-secondary transition-colors"
          />
        </button>
      </div>

      {/* Material List - Unified Container */}
      <div className="bg-surface-primary border border-ds-border-default rounded-xl overflow-hidden divide-y divide-ds-border-subtle">
        {palette && palette.id === "fog-in-the-forest" ? (
          // Use actual images for fog-in-the-forest
          Object.entries(palette.materials).map(([key, material]) => (
            <MaterialCard
              key={key}
              image={fogMaterialImages[key]}
              title={fogMaterialNames[key] || key}
              category={getMaterialPurpose(material)}
              subtext="Natural Finish"
            />
          ))
        ) : (
          // Fallback for other palettes or no selection
          defaultMaterials.map((material, index) => (
            <MaterialCard
              key={index}
              swatchColors={material.swatchColors}
              title={material.title}
              category={material.category}
              subtext="Standard Finish"
            />
          ))
        )}
      </div>
    </>
  );
};

export default MaterialManifestSection;
