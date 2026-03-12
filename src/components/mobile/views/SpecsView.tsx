import { useState, useMemo } from "react";
import { Sparkles, MessageSquare, ChevronDown } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPaletteById } from "@/data/palettes";
import { getDesignerWithFallback } from "@/data/designers";
import { palettesV2 } from "@/data/palettes/palettes-v2";
import { getMaterialById } from "@/data/materials";
import type { RoomType } from "@/data/rooms/surfaces";
import MaterialCard from "@/components/MaterialCard";
import MaterialSourcingSheet, { type MaterialInfo } from "@/components/MaterialSourcingSheet";
import RoomPillBar from "../controls/RoomPillBar";
import TierPill from "../controls/TierPill";
import DesignerCompactCard from "../DesignerCompactCard";
import DesignerProfileSheet from "@/components/DesignerProfileSheet";
import PaletteSelectorSheet from "../controls/PaletteSelectorSheet";
import { ComingSoonPaletteSheet } from "@/components/ComingSoonPaletteSheet";
import { DesignNotificationSheet } from "@/components/DesignNotificationSheet";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const displayNameToRoomType: Record<string, RoomType> = {
  Kitchen: "kitchen",
  Bathroom: "bathroom",
  Bedroom: "bedroom",
  "Living Room": "livingRoom",
};

export default function SpecsView() {
  const { design, materialOverrides, excludedSlots, handleSelectMaterial, selectedTier } = useDesign();
  const { t, language } = useLanguage();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isSourcingSheetOpen, setIsSourcingSheetOpen] = useState(false);
  const [isPaletteSelectorOpen, setIsPaletteSelectorOpen] = useState(false);
  const [isTierWaitlistOpen, setIsTierWaitlistOpen] = useState(false);
  const [isSpecsNotificationOpen, setIsSpecsNotificationOpen] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState<MaterialInfo | null>(null);
  const { selectedMaterial, selectedCategory, freestyleDescription } = design;

  const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;

  // Must be before any conditional returns (rules of hooks)
  const groupedMaterials = useMemo(() => {
    if (!selectedMaterial) return [];

    const roomType = displayNameToRoomType[selectedCategory || "Kitchen"];
    if (!roomType) return [];

    const pv2 = palettesV2.find((p) => p.id === selectedMaterial);
    if (!pv2) return [];

    const slots = pv2.selections[roomType];
    if (!slots) return [];

    const matSlots = new Map<string, string[]>();
    const matOrder: string[] = [];

    for (const [slotKey, defaultMatId] of Object.entries(slots)) {
      if (excludedSlots.has(slotKey)) continue;
      const matId = materialOverrides[slotKey] || defaultMatId;
      const existing = matSlots.get(matId);
      if (existing) {
        existing.push(slotKey);
      } else {
        matSlots.set(matId, [slotKey]);
        matOrder.push(matId);
      }
    }

    return matOrder.map((matId) => ({
      matId,
      slotKeys: matSlots.get(matId)!,
      mat: getMaterialById(matId),
    })).filter((entry) => entry.mat != null);
  }, [selectedMaterial, selectedCategory, materialOverrides, excludedSlots]);

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Full-screen overlay — identical to DesignView */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
        <p className="text-lg font-serif mb-1">{t("comingSoon.screenTitle")}</p>
        <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
          {t("comingSoon.specsSheetDescription")}
        </p>
        <button
          onClick={() => setIsSpecsNotificationOpen(true)}
          className="mt-4 px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation"
        >
          {t("comingSoon.beNotifiedButton")}
        </button>
      </div>

      {/* Content (hidden behind overlay, preserved for future use) */}
      {!selectedMaterial && !freestyleDescription ? (
        <div className="px-4 py-4">
          {/* Sticky Room Pills + Tier */}
          <div className="sticky top-0 z-10 bg-background pb-3 -mx-4 px-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <RoomPillBar />
              </div>
              <div className="flex-shrink-0">
                <TierPill />
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif text-center mb-2">{t("specs.emptyTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {t("specs.emptyDescription")}
            </p>
            <button
              onClick={() => setIsPaletteSelectorOpen(true)}
              className="mt-6 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all active:scale-[0.98]"
            >
              {t("specs.browsePalettes")}
            </button>
          </div>
        </div>
      ) : freestyleDescription ? (
        <div className="px-4 py-4">
          {/* Sticky Room Pills + Tier */}
          <div className="sticky top-0 z-10 bg-background pb-3 -mx-4 px-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <RoomPillBar />
              </div>
              <div className="flex-shrink-0">
                <TierPill />
              </div>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="mb-6">
            <h2 className="text-2xl font-serif mb-1">{t("specs.freestyleTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("specs.freestyleSubtitle")}</p>
          </div>
          <blockquote className="text-sm text-muted-foreground italic border-l-2 border-foreground pl-4 mb-6">
            "{freestyleDescription}"
          </blockquote>
          <button className="w-full py-3 border border-foreground rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted transition-all active:scale-[0.98]">
            <MessageSquare size={16} />
            {t("specs.requestMaterials")}
          </button>
        </div>
      ) : (
        <div className="px-4 py-4">
          {/* Sticky Room Pills + Tier */}
          <div className="sticky top-0 z-10 bg-background pb-3 -mx-4 px-4 pt-1">
            <div className="flex items-center justify-between gap-3">
              <RoomPillBar />
              <TierPill />
            </div>
          </div>

          {/* Editorial Headline */}
          {palette && (
            <div className="mb-6">
              <button
                onClick={() => setIsPaletteSelectorOpen(true)}
                className="flex items-center gap-1.5 group"
              >
                <h2 className="text-2xl font-serif group-hover:text-foreground/80 transition-colors">
                  {t(`palette.${palette.id}`) || palette.name}
                </h2>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              </button>
              <p className="text-sm text-muted-foreground mt-1">{t("result.curatedBy")} {getDesignerWithFallback(palette.designer, palette.designerTitle).name}</p>
            </div>
          )}

          {/* Material Cards */}
          <div className="relative">
            {selectedTier !== "Standard" && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                <p className="text-lg font-serif mb-1">{t("specs.tierComingSoon")}</p>
                <p className="text-sm text-muted-foreground text-center px-4 mb-4">
                  {t("specs.tierComingSoonDescription")}
                </p>
                <button
                  onClick={() => setIsTierWaitlistOpen(true)}
                  className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {t("comingSoon.beNotifiedButton")}
                </button>
              </div>
            )}
            <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
              {groupedMaterials.map(({ matId, slotKeys, mat }) => {
                const translatedSurfaces = slotKeys
                  .map((sk) => t(`surface.${sk}`) || sk)
                  .join(", ");

                const desc = typeof mat!.description === "object"
                  ? mat!.description[language] || mat!.description.en
                  : String(mat!.description || "");

                const typeKey = `material.type.${mat!.type}`;
                const translatedType = mat!.type
                  ? (t(typeKey) === typeKey ? mat!.type : t(typeKey))
                  : "";

                const handleMaterialClick = () => {
                  trackEvent(AnalyticsEvents.MATERIAL_CLICKED, {
                    material_code: mat!.code,
                    room: selectedCategory,
                    tab: "specs",
                  });
                  setSelectedMaterialInfo({
                    name: desc?.split('.')[0] || translatedSurfaces,
                    materialType: mat!.type,
                    technicalCode: mat!.code,
                    imageUrl: mat!.image || undefined,
                    showroomIds: mat!.showroomIds,
                  });
                  setIsSourcingSheetOpen(true);
                };

                return (
                  <MaterialCard
                    key={matId}
                    image={mat!.image || undefined}
                    swatchColors={!mat!.image ? ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100"] : undefined}
                    title={desc?.split('.')[0] || translatedSurfaces}
                    category={translatedSurfaces}
                    materialType={translatedType}
                    technicalCode={mat!.code}
                    onClick={handleMaterialClick}
                  />
                );
              })}
            </div>
          </div>

          {/* Designer Compact Card */}
          {palette && (
            <DesignerCompactCard
              designerId={palette.designer}
              designerTitle={palette.designerTitle}
              onOpenProfile={() => {
                trackEvent(AnalyticsEvents.DESIGNER_PROFILE_OPENED, {
                  designer_id: palette.designer,
                  tab: "specs",
                });
                setIsProfileSheetOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* Designer Profile Sheet */}
      {palette && (
        <DesignerProfileSheet
          isOpen={isProfileSheetOpen}
          onClose={() => setIsProfileSheetOpen(false)}
          designerId={palette.designer}
          designerTitle={palette.designerTitle}
          currentPaletteId={palette.id}
          onSelectPalette={handleSelectMaterial}
        />
      )}

      {/* Material Sourcing Sheet */}
      <MaterialSourcingSheet
        isOpen={isSourcingSheetOpen}
        onClose={() => setIsSourcingSheetOpen(false)}
        material={selectedMaterialInfo}
      />

      {/* Palette Selector Sheet */}
      <PaletteSelectorSheet
        isOpen={isPaletteSelectorOpen}
        onClose={() => setIsPaletteSelectorOpen(false)}
        selectedPaletteId={selectedMaterial}
        onSelectPalette={handleSelectMaterial}
      />

      {/* Tier Waitlist Sheet */}
      <ComingSoonPaletteSheet
        isOpen={isTierWaitlistOpen}
        onClose={() => setIsTierWaitlistOpen(false)}
        paletteId={selectedMaterial || ""}
        paletteName={palette?.id ? t(`palette.${palette.id}`) : palette?.name || ""}
        selectedTier={selectedTier}
      />

      {/* Specs notification sheet */}
      <DesignNotificationSheet
        isOpen={isSpecsNotificationOpen}
        onClose={() => setIsSpecsNotificationOpen(false)}
        featureId="material_specs"
        description={t("comingSoon.specsSheetModalDescription")}
      />
    </div>
  );
}
