import { useState, useMemo } from "react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMaterialByCode, useGraphMaterials } from "@/hooks/useGraphMaterials";

const MAX_SWATCHES = 5;

export function MaterialsSummary() {
  const { materialOverrides, excludedSlots, setActiveTab } = useDesign();
  const { t, language } = useLanguage();
  const { graphMaterials } = useGraphMaterials();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const uniqueMaterials = useMemo(() => {
    if (Object.keys(materialOverrides).length === 0) return [];

    const seen = new Set<string>();
    const result: { matId: string; slotKey: string; image: string; description: string }[] = [];

    for (const [slotKey, matId] of Object.entries(materialOverrides)) {
      if (excludedSlots.has(slotKey)) continue;
      if (seen.has(matId)) continue;
      seen.add(matId);

      const mat = getMaterialByCode(matId);
      if (!mat?.imageUrl) continue;

      const lang = language as "en" | "lt";
      const displayName = mat.name?.[lang] || mat.name?.en || "";

      result.push({ matId, slotKey, image: mat.imageUrl, description: displayName });
      if (result.length >= MAX_SWATCHES) break;
    }

    return result;
  }, [materialOverrides, excludedSlots, language, graphMaterials]);

  const handleSwatchClick = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const expandedMaterial = expandedIndex !== null ? uniqueMaterials[expandedIndex] : null;

  if (uniqueMaterials.length === 0) return null;

  return (
    <div className="px-4 py-5 space-y-1.5">
      {/* 5-Column Swatch Grid */}
      {uniqueMaterials.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5 pb-2">
          {uniqueMaterials.map(({ matId, image, description }, index) => {
            const isSelected = expandedIndex === index;
            return (
              <div
                key={matId}
                onClick={() => handleSwatchClick(index)}
                className={`aspect-square rounded-md overflow-hidden bg-neutral-100 cursor-pointer transition-shadow ${
                  isSelected ? "ring-2 ring-neutral-800 ring-offset-1" : ""
                }`}
                style={{
                  boxShadow: isSelected ? undefined : "inset 0 0 0 1.5px rgba(0,0,0,0.08)",
                }}
              >
                <img
                  src={image}
                  alt={description}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Technical Block */}
      {expandedMaterial && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-neutral-400">
            {t(`surface.${expandedMaterial.slotKey}`)}
          </p>
          <p
            className="font-serif text-sm text-neutral-800 leading-snug cursor-pointer"
            onClick={() => setActiveTab("specs")}
          >
            {expandedMaterial.description}
            <span className="text-neutral-400"> →</span>
          </p>
        </div>
      )}
    </div>
  );
}
