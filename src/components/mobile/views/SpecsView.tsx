import { useState, useMemo } from "react";
import { Sparkles, MessageSquare, ChevronDown } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { designers, getDesignerWithFallback } from "@/data/designers";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getMaterialByCode } from "@/hooks/useGraphMaterials";
import MaterialCard from "@/components/MaterialCard";
import MaterialSourcingSheet, { type MaterialInfo } from "@/components/MaterialSourcingSheet";
import RoomPillBar from "../controls/RoomPillBar";
import TierPill from "../controls/TierPill";
import DesignerCompactCard from "../DesignerCompactCard";
import DesignerProfileSheet from "@/components/DesignerProfileSheet";
import PaletteSelectorSheet from "../controls/PaletteSelectorSheet";
import { ComingSoonPaletteSheet } from "@/components/ComingSoonPaletteSheet";
import { useShowroom } from "@/contexts/ShowroomContext";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

export default function SpecsView() {
  const { design, materialOverrides, excludedSlots, handleSelectMaterial, selectedTier, setActiveTab, selectCollection } = useDesign();
  const { activeShowroom } = useShowroom();
  const { t, language } = useLanguage();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isSourcingSheetOpen, setIsSourcingSheetOpen] = useState(false);
  const [isPaletteSelectorOpen, setIsPaletteSelectorOpen] = useState(false);
  const [isTierWaitlistOpen, setIsTierWaitlistOpen] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState<MaterialInfo | null>(null);
  const { selectedMaterial, selectedCategory, freestyleDescription } = design;

  // selectedMaterial is now a collection ID
  const activeCollection = selectedMaterial ? (collectionsV2.find((c) => c.id === selectedMaterial) ?? null) : null;
  const collectionDesignerTitle = activeCollection ? (designers[activeCollection.designer]?.title || "") : "";

  // Single unified materials list from materialOverrides
  const groupedMaterials = useMemo(() => {
    if (Object.keys(materialOverrides).length === 0) return [];

    const matSlots = new Map<string, string[]>();
    const matOrder: string[] = [];

    for (const [slotKey, matId] of Object.entries(materialOverrides)) {
      if (excludedSlots.has(slotKey)) continue;
      const mat = getMaterialByCode(matId);
      if (!mat) continue;
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
      mat: getMaterialByCode(matId),
    })).filter((entry) => entry.mat != null);
  }, [materialOverrides, excludedSlots]);

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Content */}
      {!selectedMaterial && !freestyleDescription && Object.keys(materialOverrides).length === 0 ? (
        <div className="px-4 py-4 lg:max-w-2xl lg:mx-auto">
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
              onClick={() => setActiveTab("moodboard")}
              className="mt-6 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all active:scale-[0.98]"
            >
              {t("specs.goToMoodboard")}
            </button>
          </div>
        </div>
      ) : freestyleDescription ? (
        <div className="px-4 py-4 lg:max-w-2xl lg:mx-auto">
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
        <div className="px-4 py-4 lg:max-w-2xl lg:mx-auto">
          {/* Sticky Room Pills + Tier */}
          <div className="sticky top-0 z-10 bg-background pb-3 -mx-4 px-4 pt-1">
            <div className="flex items-center justify-between gap-3">
              <RoomPillBar />
              <TierPill />
            </div>
          </div>

          {/* Editorial Headline */}
          {activeCollection && (
            <div className="mb-6">
              <button
                onClick={() => setIsPaletteSelectorOpen(true)}
                className="flex items-center gap-1.5 group"
              >
                <h2 className="text-2xl font-serif group-hover:text-foreground/80 transition-colors">
                  {activeCollection.name[language] ?? activeCollection.name.en}
                </h2>
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              </button>
              <p className="text-sm text-muted-foreground mt-1">{t("result.curatedBy")} {getDesignerWithFallback(activeCollection.designer, collectionDesignerTitle).name}</p>
            </div>
          )}

          {groupedMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-serif text-center mb-2">{t("specs.emptyTitle")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {t("specs.emptyDescription")}
              </p>
              <button
                onClick={() => setActiveTab("moodboard")}
                className="mt-6 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all active:scale-[0.98]"
              >
                {t("specs.goToMoodboard")}
              </button>
            </div>
          ) : (
            <>
              {/* Material Cards */}
              <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                {groupedMaterials.map(({ matId, slotKeys, mat }) => {
                  const translatedSurfaces = slotKeys
                    .map((sk) => t(`surface.${sk}`) || sk)
                    .join(", ");

                  const lang = language as "en" | "lt";
                  const displayName = mat!.name?.[lang] || mat!.name?.en || translatedSurfaces;

                  const typeKey = `material.type.${mat!.materialType}`;
                  const translatedType = mat!.materialType
                    ? (t(typeKey) === typeKey ? mat!.materialType : t(typeKey))
                    : "";

                  const handleMaterialClick = () => {
                    trackEvent(AnalyticsEvents.MATERIAL_CLICKED, {
                      material_code: mat!.technicalCode,
                      room: selectedCategory,
                      tab: "specs",
                    });
                    setSelectedMaterialInfo({
                      name: displayName,
                      materialType: mat!.materialType,
                      technicalCode: mat!.technicalCode,
                      imageUrl: mat!.imageUrl || undefined,
                      showroomIds: mat!.showroomIds,
                    });
                    setIsSourcingSheetOpen(true);
                  };

                  return (
                    <MaterialCard
                      key={matId}
                      image={mat!.imageUrl || undefined}
                      swatchColors={!mat!.imageUrl ? ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100"] : undefined}
                      title={displayName}
                      category={translatedSurfaces}
                      materialType={translatedType}
                      technicalCode={mat!.technicalCode}
                      onClick={handleMaterialClick}
                    />
                  );
                })}
              </div>

              {/* Designer Compact Card */}
              {activeCollection && (
                <DesignerCompactCard
                  designerId={activeCollection.designer}
                  designerTitle={collectionDesignerTitle}
                  onOpenProfile={() => {
                    trackEvent(AnalyticsEvents.DESIGNER_PROFILE_OPENED, {
                      designer_id: activeCollection.designer,
                      tab: "specs",
                    });
                    setIsProfileSheetOpen(true);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Designer Profile Sheet */}
      {activeCollection && (
        <DesignerProfileSheet
          isOpen={isProfileSheetOpen}
          onClose={() => setIsProfileSheetOpen(false)}
          designerId={activeCollection.designer}
          designerTitle={collectionDesignerTitle}
          onSelectCollection={handleSelectMaterial}
          activeCollectionId={activeCollection.id}
          showroomId={activeShowroom?.id}
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
        showroomId={activeShowroom?.id}
      />

      {/* Tier Waitlist Sheet */}
      <ComingSoonPaletteSheet
        isOpen={isTierWaitlistOpen}
        onClose={() => setIsTierWaitlistOpen(false)}
        paletteId={selectedMaterial || ""}
        paletteName={activeCollection ? (activeCollection.name[language] ?? activeCollection.name.en) : ""}
        selectedTier={selectedTier}
      />

    </div>
  );
}
