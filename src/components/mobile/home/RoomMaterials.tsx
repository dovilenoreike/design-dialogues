import { useMemo } from "react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMaterialByCode } from "@/hooks/useGraphMaterials";

const MAX_SWATCHES = 5;

export default function RoomMaterials() {
  const { materialOverrides, excludedSlots, setActiveTab } = useDesign();
  const { t } = useLanguage();

  const uniqueMaterials = useMemo(() => {
    if (Object.keys(materialOverrides).length === 0) return [];

    const seen = new Set<string>();
    const result: { matId: string; slotKey: string; image: string }[] = [];

    for (const [slotKey, matId] of Object.entries(materialOverrides)) {
      if (excludedSlots.has(slotKey)) continue;
      if (seen.has(matId)) continue;
      seen.add(matId);

      const mat = getMaterialByCode(matId);
      if (!mat?.imageUrl) continue;

      result.push({ matId, slotKey, image: mat.imageUrl });
      if (result.length >= MAX_SWATCHES) break;
    }

    return result;
  }, [materialOverrides, excludedSlots]);

  if (uniqueMaterials.length === 0) return null;

  return (
    <section className="bg-neutral-50 py-5">
      <div className="px-4">
        <div className="grid grid-cols-5 gap-2">
          {uniqueMaterials.map(({ matId, slotKey, image }) => {
            const translatedLabel = t(`surface.${slotKey}`) || slotKey;

            return (
              <button
                key={matId}
                onClick={() => setActiveTab("specs")}
                className="flex flex-col items-start gap-1.5 active:scale-95 transition-transform"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 leading-tight line-clamp-1 w-full">
                  {translatedLabel}
                </span>
                <div className="w-full aspect-square rounded overflow-hidden border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <img
                    src={image}
                    alt={translatedLabel}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
