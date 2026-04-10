/**
 * MaterialManifestSection - Bottom panel showing material palette or freestyle vision
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, User, MessageSquare, Sparkles } from "lucide-react";
import MaterialCard from "@/components/MaterialCard";
import MaterialSourcingSheet, { type MaterialInfo } from "@/components/MaterialSourcingSheet";
import { getMaterialByCode } from "@/hooks/useGraphMaterials";
import { defaultMaterials } from "./constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface MaterialManifestSectionProps {
  mode: "full" | "calculator";
  selectedCategory: string | null;
  freestyleDescription: string;
  materialOverrides: Record<string, string>;
  onOpenDesignerSheet: () => void;
  onOpenMaterialMatchModal: () => void;
}

const MaterialManifestSection = ({
  mode,
  freestyleDescription,
  materialOverrides,
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
  const designerName = "Dizaino Dialogai";
  const designerTitle = "Interior Designer";

  // Build deduplicated material list from materialOverrides
  const materialEntries: { matId: string; slotKeys: string[] }[] = [];
  const seen = new Map<string, string[]>();
  for (const [slotKey, matId] of Object.entries(materialOverrides)) {
    const existing = seen.get(matId);
    if (existing) {
      existing.push(slotKey);
    } else {
      seen.set(matId, [slotKey]);
      materialEntries.push({ matId, slotKeys: seen.get(matId)! });
    }
  }

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
            <p className="text-xs font-medium text-foreground">{designerName}</p>
            <p className="text-[10px] text-muted-foreground">{designerTitle}</p>
          </div>
          <ChevronRight
            size={16}
            className="text-text-muted group-hover:text-text-secondary transition-colors"
          />
        </button>
      </div>

      {/* Material List - Unified Container */}
      <div className="bg-surface-primary border border-ds-border-default rounded-xl overflow-hidden divide-y divide-ds-border-subtle">
        {materialEntries.length > 0 ? (
          materialEntries.map(({ matId, slotKeys }) => {
            const mat = getMaterialByCode(matId);
            if (!mat) return null;

            const desc = mat.description?.[language as "en" | "lt"] || mat.description?.en || mat.texturePrompt || "";
            const title = desc?.split('.')[0] || slotKeys[0];
            const category = slotKeys.join(", ");
            const materialType = mat.materialType || "";

            const handleMaterialClick = () => {
              setSelectedMaterialInfo({
                name: title,
                materialType: mat.materialType,
                technicalCode: mat.technicalCode,
                imageUrl: mat.imageUrl || undefined,
                showroomIds: mat.showroomIds,
              });
              setIsSourcingSheetOpen(true);
            };

            return (
              <MaterialCard
                key={matId}
                image={mat.imageUrl || undefined}
                swatchColors={!mat.imageUrl ? ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100"] : undefined}
                title={title}
                category={category}
                materialType={materialType}
                technicalCode={mat.technicalCode}
                onClick={handleMaterialClick}
              />
            );
          })
        ) : (
          // Fallback only when no overrides
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
