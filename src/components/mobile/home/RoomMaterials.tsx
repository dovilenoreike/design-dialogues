import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPaletteById } from "@/data/palettes";
import {
  getMaterialsForRoom,
  getMaterialPurpose,
  getMaterialImageUrl,
  mapSpaceCategoryToRoom,
} from "@/lib/palette-utils";

export default function RoomMaterials() {
  const { design, setActiveTab } = useDesign();
  const { t } = useLanguage();
  const { selectedMaterial, selectedCategory } = design;

  if (!selectedMaterial) return null;

  const palette = getPaletteById(selectedMaterial);
  if (!palette) return null;

  const roomCategory = mapSpaceCategoryToRoom(selectedCategory || "Kitchen");
  const materials = getMaterialsForRoom(palette, roomCategory);

  if (materials.length === 0) return null;

  return (
    <section className="bg-neutral-50 py-5">
      <div className="px-4">
        <div className="grid grid-cols-5 gap-2">
          {materials.map(({ key, material }) => {
            const imageUrl = getMaterialImageUrl(selectedMaterial, key);
            const purpose = getMaterialPurpose(material, roomCategory);
            const translatedPurpose = t(`material.purpose.${purpose}`) || purpose;

            return (
              <button
                key={key}
                onClick={() => setActiveTab("specs")}
                className="flex flex-col items-start gap-1.5 active:scale-95 transition-transform"
              >
                {/* Technical label above swatch */}
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 leading-tight line-clamp-1 w-full">
                  {translatedPurpose}
                </span>
                {/* Material swatch with physical feel */}
                <div className="w-full aspect-square rounded overflow-hidden border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={translatedPurpose}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
