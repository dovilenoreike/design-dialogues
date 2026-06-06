import { useState, useMemo } from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMaterialByCode, useGraphMaterials } from "@/hooks/useGraphMaterials";
import { computePaletteHint } from "@/lib/palette-hint";
import MaterialCard from "@/components/MaterialCard";
import MaterialSourcingSheet, { type MaterialInfo } from "@/components/MaterialSourcingSheet";
import RoomPillBar from "../controls/RoomPillBar";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import DesignerCompactCard from "../DesignerCompactCard";
import DesignerProfileSheet from "@/components/DesignerProfileSheet";

interface SpecsViewProps {
  /** Designer key from the active collection preset, if it belongs to an external designer */
  designer?: string | null;
  allNonAccentsVerified?: boolean;
  onRequestReview?: () => void;
}

export default function SpecsView({ designer, allNonAccentsVerified = true, onRequestReview }: SpecsViewProps) {
  const navigate = useNavigate();
  const { design, materialOverrides, excludedSlots, selectedTier, setActiveTab } = useDesign();
  const { t, language } = useLanguage();
  const { graphMaterials, graphLoading } = useGraphMaterials();

  const paletteHint = useMemo(() => {
    if (graphLoading || Object.keys(materialOverrides).length === 0) return null;
    const inputs = Object.entries(materialOverrides)
      .filter(([pk, code]) => pk !== "accents" && !!code)
      .map(([pk, code]) => ({ paletteKey: pk, code: code as string }));
    return computePaletteHint(inputs);
  }, [graphLoading, materialOverrides]);
  const [isSourcingSheetOpen, setIsSourcingSheetOpen] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState<MaterialInfo | null>(null);
  const [isDesignerProfileOpen, setIsDesignerProfileOpen] = useState(false);
  const { selectedCategory, freestyleDescription } = design;

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
  }, [materialOverrides, excludedSlots, graphMaterials]);

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Content */}
      {Object.keys(materialOverrides).length === 0 && !freestyleDescription ? (
        <div className="px-4 py-4 lg:max-w-2xl lg:mx-auto">
          {/* Sticky Room Pills + Tier */}
          <div className="sticky top-0 z-10 bg-background pb-3 -mx-4 px-4 pt-1">
            <RoomPillBar />
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
              onClick={() => navigate("/design")}
              className="mt-6 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all active:scale-[0.98]"
            >
              {t("specs.goToMoodboard")}
            </button>
          </div>
        </div>
      ) : freestyleDescription ? (
        <div className="px-4 py-4 lg:max-w-2xl lg:mx-auto">
          <div className="sticky top-0 z-10 bg-background pb-3 -mx-4 px-4 pt-1">
            <RoomPillBar />
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
            <RoomPillBar />
          </div>

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
                onClick={() => navigate("/design")}
                className="mt-6 px-6 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all active:scale-[0.98]"
              >
                {t("specs.goToMoodboard")}
              </button>
            </div>
          ) : (
            <>
              {/* Palette hint + change set / request review CTA */}
              {(paletteHint || !allNonAccentsVerified) && (
                <div className="flex flex-col items-center gap-2 pb-4 text-center">
                  {paletteHint && (
                    <>
                      <span
                        className="text-[13px] font-medium tracking-[0.08em] uppercase"
                        style={{ color: "rgba(0,0,0,0.7)" }}
                      >
                        {t(`paletteHint.${paletteHint.key}.label`)}
                      </span>
                      <span
                        className="text-[13px] leading-snug"
                        style={{ color: "rgba(0,0,0,0.55)" }}
                      >
                        {t(`paletteHint.${paletteHint.key}.desc`)}
                      </span>
                    </>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {!allNonAccentsVerified && onRequestReview && (
                      <button
                        onClick={onRequestReview}
                        className="h-8 px-3 rounded-full text-[11px] font-medium tracking-[0.03em] active:scale-95 transition-transform whitespace-nowrap"
                        style={{ backgroundColor: "rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.65)" }}
                      >
                        {t("moodboard.requestReview")}
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/design")}
                      className="h-8 px-3 rounded-full text-[11px] font-medium tracking-[0.03em] active:scale-95 transition-transform whitespace-nowrap text-white"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      {t("specs.changeSet")}
                    </button>
                  </div>
                </div>
              )}

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
                    const modalName = mat!.name?.[lang] || mat!.name?.en || displayName;
                    setSelectedMaterialInfo({
                      name: modalName,
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

              {designer && (
                <DesignerCompactCard
                  designerId={designer}
                  designerTitle=""
                  onOpenProfile={() => setIsDesignerProfileOpen(true)}
                />
              )}

              <div className="flex justify-center pt-4 pb-6">
                <button
                  onClick={() => { setActiveTab("budget"); navigate("/budget"); }}
                  className="text-[11px] underline underline-offset-2"
                  style={{ color: "rgba(0,0,0,0.38)" }}
                >
                  {t("nav.budget")} →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Material Sourcing Sheet */}
      <MaterialSourcingSheet
        isOpen={isSourcingSheetOpen}
        onClose={() => setIsSourcingSheetOpen(false)}
        material={selectedMaterialInfo}
      />

      {/* Designer profile sheet — only mounted when a non-DD designer preset is active */}
      {designer && (
        <DesignerProfileSheet
          isOpen={isDesignerProfileOpen}
          onClose={() => setIsDesignerProfileOpen(false)}
          designerId={designer}
          designerTitle=""
        />
      )}

    </div>
  );
}
