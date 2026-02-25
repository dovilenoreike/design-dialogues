import { useState } from "react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPaletteById } from "@/data/palettes";
import { getDesignerWithFallback } from "@/data/designers";
import {
  getMaterialsForRoom,
  getMaterialPurpose,
  getMaterialDescription,
  getMaterialImageUrl,
  mapSpaceCategoryToRoom,
} from "@/lib/palette-utils";

export function MaterialsSummary() {
  const { design, setActiveTab } = useDesign();
  const { t, language } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!design.selectedMaterial) return null;

  const palette = getPaletteById(design.selectedMaterial);
  if (!palette) return null;

  const roomCategory = mapSpaceCategoryToRoom(design.selectedCategory || "Kitchen");
  const roomMaterials = getMaterialsForRoom(palette, roomCategory);
  const displayMaterials = roomMaterials.slice(0, 5);
  const designer = getDesignerWithFallback(palette.designer, palette.designerTitle);

  const handleSwatchClick = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const expandedMaterial = expandedIndex !== null ? displayMaterials[expandedIndex] : null;

  return (
    <div className="space-y-1.5 max-w-md">
      {/* Header */}
      <div className="space-y-0.5">
        <h3 className="font-serif text-[13px] text-neutral-900 leading-tight">
          {t(`palette.${palette.id}`)}
        </h3>
        <p className="text-[8px] uppercase tracking-widest text-neutral-500">
          {t("thread.curatedBy")}: {designer.name}
        </p>
      </div>

      {/* 5-Column Swatch Grid */}
      {displayMaterials.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5 pb-2">
          {displayMaterials.map(({ key }, index) => {
            const imageUrl = getMaterialImageUrl(palette.id, key);
            const isSelected = expandedIndex === index;
            return (
              <div
                key={key}
                onClick={() => handleSwatchClick(index)}
                className={`aspect-square rounded-md overflow-hidden bg-neutral-100 cursor-pointer transition-shadow ${
                  isSelected ? "ring-2 ring-neutral-800 ring-offset-1" : ""
                }`}
                style={{
                  boxShadow: isSelected ? undefined : "inset 0 0 0 1.5px rgba(0,0,0,0.08)",
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={getMaterialDescription(displayMaterials[index].material, language)}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Technical Block */}
      {expandedMaterial && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-neutral-400">
            {t(`material.purpose.${getMaterialPurpose(expandedMaterial.material, roomCategory)}`)}
            {expandedMaterial.material.materialType && (
              <> · {t(`material.type.${expandedMaterial.material.materialType}`)}</>
            )}
          </p>
          <p
            className="font-serif text-sm text-neutral-800 leading-snug cursor-pointer"
            onClick={() => setActiveTab("specs")}
          >
            {getMaterialDescription(expandedMaterial.material, language)}
            <span className="text-neutral-400"> →</span>
          </p>
        </div>
      )}
    </div>
  );
}
