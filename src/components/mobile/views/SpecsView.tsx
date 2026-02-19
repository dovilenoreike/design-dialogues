import { useState } from "react";
import { Sparkles, MessageSquare, ChevronDown } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPaletteById, isComingSoon } from "@/data/palettes";
import { getPaletteThumbnail } from "@/data/palettes/thumbnails";
import { getDesignerWithFallback } from "@/data/designers";
import { getMaterialsForRoom, getMaterialPurpose, getMaterialImageUrl, mapSpaceCategoryToRoom, getMaterialDescription } from "@/lib/palette-utils";
import MaterialCard from "@/components/MaterialCard";
import MaterialSourcingSheet, { type MaterialInfo } from "@/components/MaterialSourcingSheet";
import RoomPillBar from "../controls/RoomPillBar";
import TierPill from "../controls/TierPill";
import DesignerCompactCard from "../DesignerCompactCard";
import DesignerProfileSheet from "@/components/DesignerProfileSheet";
import PaletteSelectorSheet from "../controls/PaletteSelectorSheet";
import { ComingSoonPaletteSheet } from "@/components/ComingSoonPaletteSheet";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

export default function SpecsView() {
  const { design, handleSelectMaterial, selectedTier, setActiveTab } = useDesign();
  const { t, language } = useLanguage();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isSourcingSheetOpen, setIsSourcingSheetOpen] = useState(false);
  const [isPaletteSelectorOpen, setIsPaletteSelectorOpen] = useState(false);
  const [isComingSoonSheetOpen, setIsComingSoonSheetOpen] = useState(false);
  const [isTierWaitlistOpen, setIsTierWaitlistOpen] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState<MaterialInfo | null>(null);
  const { selectedMaterial, selectedCategory, freestyleDescription } = design;

  const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;
  const roomCategory = selectedCategory ? mapSpaceCategoryToRoom(selectedCategory) : "all";

  const handleComingSoonClose = () => {
    setIsComingSoonSheetOpen(false);
  };

  // No selection state
  if (!selectedMaterial && !freestyleDescription) {
    return (
      <div className="flex-1 overflow-y-auto">
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

        {/* Palette Selector Sheet */}
        <PaletteSelectorSheet
          isOpen={isPaletteSelectorOpen}
          onClose={() => setIsPaletteSelectorOpen(false)}
          selectedPaletteId={selectedMaterial}
          onSelectPalette={handleSelectMaterial}
        />
      </div>
    );
  }

  // Coming soon palette mode
  if (selectedMaterial && isComingSoon(selectedMaterial)) {
    return (
      <div className="flex-1 overflow-y-auto">
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
            <button
              onClick={() => setIsPaletteSelectorOpen(true)}
              className="flex items-center gap-1.5 group"
            >
              <h2 className="text-2xl font-serif group-hover:text-foreground/80 transition-colors">
                {t(`palette.${palette?.id}`) || palette?.name}
              </h2>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
            </button>
            <p className="text-sm text-muted-foreground mt-1">
              {t("result.curatedBy")} {getDesignerWithFallback(palette?.designer, palette?.designerTitle).name}
            </p>
          </div>

          {/* Palette Preview with Coming Soon Overlay */}
          <div className="relative rounded-xl overflow-hidden w-full max-w-md mx-auto">
            {/* Wrapper for aspect ratio - constrained width so full square fits */}
            <div className="relative aspect-square w-full">
              {palette && getPaletteThumbnail(palette.id) && (
                <img
                  src={getPaletteThumbnail(palette.id)}
                  alt={t(`palette.${palette.id}`) || palette.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Coming Soon overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center py-6 px-4">
              <p className="text-lg font-serif mb-1">{t("comingSoon.screenTitle")}</p>
              <p className="text-xs text-muted-foreground text-center mb-4 line-clamp-2">
                {t("comingSoon.screenDescription").replace("{paletteName}", palette?.id ? t(`palette.${palette.id}`) : "")}
              </p>
              <button
                onClick={() => setIsComingSoonSheetOpen(true)}
                className="px-6 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {t("comingSoon.beNotifiedButton")}
              </button>
            </div>
          </div>
        </div>

        {/* Coming Soon Modal */}
        <ComingSoonPaletteSheet
          isOpen={isComingSoonSheetOpen}
          onClose={handleComingSoonClose}
          paletteId={selectedMaterial}
          paletteName={palette?.id ? t(`palette.${palette.id}`) : ""}
          selectedTier={selectedTier}
        />

        {/* Palette Selector Sheet */}
        <PaletteSelectorSheet
          isOpen={isPaletteSelectorOpen}
          onClose={() => setIsPaletteSelectorOpen(false)}
          selectedPaletteId={selectedMaterial}
          onSelectPalette={handleSelectMaterial}
        />
      </div>
    );
  }

  // Freestyle mode
  if (freestyleDescription) {
    return (
      <div className="flex-1 overflow-y-auto">
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
      </div>
    );
  }

  // Curated palette mode
  const filteredMaterials = palette ? getMaterialsForRoom(palette, roomCategory) : [];

  return (
    <div className="flex-1 overflow-y-auto">
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
            {filteredMaterials.map(({ key, material }) => {
            const imageUrl = palette ? getMaterialImageUrl(palette.id, key) : null;
            const materialPurpose = getMaterialPurpose(material, roomCategory);

            const purposeKey = `material.purpose.${materialPurpose}`;
            const translatedPurpose = t(purposeKey) === purposeKey ? materialPurpose : t(purposeKey);

            const typeKey = `material.type.${material.materialType}`;
            const translatedType = material.materialType
              ? (t(typeKey) === typeKey ? material.materialType : t(typeKey))
              : t("material.type.Natural Stone");

            const description = getMaterialDescription(material, language);


            const handleMaterialClick = () => {
              trackEvent(AnalyticsEvents.MATERIAL_CLICKED, {
                material_code: material.technicalCode,
                room: selectedCategory,
                tab: "specs",
              });
              setSelectedMaterialInfo({
                name: description?.split('.')[0] || translatedPurpose,
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
                title={description?.split('.')[0] || translatedPurpose}
                category={translatedPurpose}
                materialType={translatedType}
                technicalCode={material.technicalCode}
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
    </div>
  );
}
