/**
 * MaterialManifestSection - Bottom panel showing material palette or freestyle vision
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, User, MessageSquare, Sparkles } from "lucide-react";
import MaterialCard from "@/components/MaterialCard";
import MaterialSourcingSheet, { type MaterialInfo } from "@/components/MaterialSourcingSheet";
import { getPaletteById } from "@/data/palettes";
import { getMaterialPurpose, getMaterialImageUrl, getMaterialsForRoom, mapSpaceCategoryToRoom, getMaterialDescription } from "@/lib/palette-utils";
import { defaultMaterials } from "./constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface MaterialManifestSectionProps {
  mode: "full" | "calculator";
  selectedMaterial: string | null;
  selectedCategory: string | null;
  freestyleDescription: string;
  onOpenDesignerSheet: () => void;
  onOpenMaterialMatchModal: () => void;
}

const MaterialManifestSection = ({
  mode,
  selectedMaterial,
  selectedCategory,
  freestyleDescription,
  onOpenDesignerSheet,
  onOpenMaterialMatchModal,
}: MaterialManifestSectionProps) => {
  const { language } = useLanguage();
  const [isSourcingSheetOpen, setIsSourcingSheetOpen] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState<MaterialInfo | null>(null);

  if (mode === "calculator") {
    // Calculator Mode - Show Visualize CTA
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
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
        {palette ? (
          // Filter materials by room category
          (() => {
            const roomCategory = selectedCategory
              ? mapSpaceCategoryToRoom(selectedCategory)
              : "all";
            const filteredMaterials = getMaterialsForRoom(palette, roomCategory);

            return filteredMaterials.map(({ key, material }) => {
              const imageUrl = getMaterialImageUrl(palette.id, key);
              const materialPurpose = getMaterialPurpose(material, roomCategory);
              const description = getMaterialDescription(material, language);

              const materialTypeDisplay = material.materialType || "Natural Finish";

              const handleMaterialClick = () => {
                setSelectedMaterialInfo({
                  name: description?.split('.')[0] || materialPurpose,
                  materialType: material.materialType,
                  technicalCode: material.technicalCode,
                  imageUrl: imageUrl || undefined,
                  showroomIds: material.showroomIds,
                });
                setIsSourcingSheetOpen(true);
              };

              return (
                <MaterialCard
                  key={key}
                  image={imageUrl || undefined}
                  swatchColors={!imageUrl ? ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100"] : undefined}
                  title={description?.split('.')[0] || materialPurpose}
                  category={materialPurpose}
                  materialType={materialTypeDisplay}
                  technicalCode={material.technicalCode}
                  onClick={handleMaterialClick}
                />
              );
            });
          })()
        ) : (
          // Fallback only when no palette is selected
          defaultMaterials.map((material, index) => (
            <MaterialCard
              key={index}
              swatchColors={material.swatchColors}
              title={material.title}
              category={material.category}
              materialType="Standard Finish"
            />
          ))
        )}
      </div>

      {/* Material Sourcing Sheet */}
      <MaterialSourcingSheet
        isOpen={isSourcingSheetOpen}
        onClose={() => setIsSourcingSheetOpen(false)}
        material={selectedMaterialInfo}
      />
    </>
  );
};

export default MaterialManifestSection;
