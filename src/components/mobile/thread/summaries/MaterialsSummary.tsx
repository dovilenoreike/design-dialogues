import { ChevronRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPaletteById } from "@/data/palettes";
import { getDesignerWithFallback } from "@/data/designers";
import { palettesV2 } from "@/data/palettes/palettes-v2";

const ROOM_TO_TYPE: Record<string, string> = {
  Kitchen: "kitchen",
  "Living Room": "livingRoom",
  Bedroom: "bedroom",
  Bathroom: "bathroom",
};

export function MaterialsSummary() {
  const { design, setActiveTab } = useDesign();
  const { t } = useLanguage();

  if (!design.selectedMaterial) return null;

  const palette = getPaletteById(design.selectedMaterial);
  if (!palette) return null;

  const designer = getDesignerWithFallback(palette.designer, palette.designerTitle);
  const pv2 = palettesV2.find((p) => p.id === design.selectedMaterial);

  // First sentence only
  const description = pv2?.promptTweak
    ? pv2.promptTweak.split(". ")[0].replace(/\.$/, "") + "."
    : null;

  // Unique material count (excluding wall) for count
  const roomType = ROOM_TO_TYPE[design.selectedCategory || "Kitchen"] || "kitchen";
  const roomSlots = pv2?.selections[roomType as keyof typeof pv2.selections];
  const materialCount = roomSlots
    ? new Set(
        Object.entries(roomSlots)
          .filter(([k]) => k !== "wall")
          .map(([, v]) => v)
      ).size
    : 0;

  return (
    <section className="px-4 py-5">
      <button
        onClick={() => setActiveTab("specs")}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        {/* Header row — matches HomeBudgetSection exactly */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("thread.projectSummary")}{materialCount > 0 ? ` (${materialCount})` : ""}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Palette name */}
        <p className="font-serif text-[15px] text-neutral-900 leading-tight">
          {t(`palette.${palette.id}`) || palette.name}
        </p>

        {/* Designer credit */}
        <p className="text-[8px] uppercase tracking-[0.25em] text-neutral-400 mt-0.5">
          {t("thread.curatedBy")} {designer.name}
        </p>

        {/* Single sentence description */}
        {description && (
          <p className="text-[11px] font-light italic text-neutral-500 leading-relaxed max-w-[85%] mt-2">
            {description}
          </p>
        )}
      </button>
    </section>
  );
}
