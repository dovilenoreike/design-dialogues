import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPaletteById } from "@/data/palettes";
import { getPaletteMaterialImages } from "@/data/palettes/material-images";
import { getDesignerWithFallback } from "@/data/designers";
import type { LocalizedString } from "@/types/palette";

function getLocalizedName(name: string | LocalizedString | undefined, lang: string): string {
  if (!name) return "";
  if (typeof name === "string") return name;
  return lang === "lt" ? (name.lt || name.en) : (name.en || name.lt);
}

export function MaterialsSummary() {
  const { design, setActiveTab, setActiveMode } = useDesign();
  const { t, language } = useLanguage();

  if (!design.selectedMaterial) return null;

  const palette = getPaletteById(design.selectedMaterial);
  if (!palette) return null;

  const materialImages = getPaletteMaterialImages(palette.id);
  const materials = Object.values(palette.materials);
  const designer = getDesignerWithFallback(palette.designer, palette.designerTitle);

  // Get first 5 materials for the grid
  const displayImages = materialImages.slice(0, 5);
  const primaryMaterial = materials[0];

  // Get primary material info for the label below swatches
  const primaryName = primaryMaterial
    ? getLocalizedName(primaryMaterial.name, language)
    : "";
  const handleMaterialClick = () => {
    setActiveTab("design");
    setActiveMode("palettes");
  };

  return (
    <div className="space-y-2 max-w-md">
      {/* Tight Header Block */}
      <div className="space-y-0.5">
        <h3 className="font-serif text-base text-neutral-900 leading-tight">
          {t(`palette.${palette.id}`)}
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-neutral-500">
          {t("thread.curatedBy")}: {designer.name}
        </p>
      </div>

      {/* 5-Column Swatch Grid - Full Width */}
      {displayImages.length > 0 && (
        <div
          onClick={handleMaterialClick}
          className="grid grid-cols-5 gap-1.5 cursor-pointer"
        >
          {displayImages.map((img, index) => (
            <div
              key={index}
              className="aspect-square rounded-md overflow-hidden bg-neutral-100"
              style={{
                boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.08)"
              }}
            >
              <img
                src={img}
                alt={materials[index]?.name ? getLocalizedName(materials[index].name, language) : `Material ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Technical Label Below Swatches */}
      {primaryMaterial && (
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          {primaryName}
        </p>
      )}
    </div>
  );
}
