/**
 * ResultDashboard - Main results view component
 * Orchestrates sub-components for visualization, cost calculation, and material display
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Share2, X } from "lucide-react";
import { CostInsightSheet } from "./CostInsightSheet";
import Footer from "./Footer";
import MaterialMatchRequestModal from "./MaterialMatchRequestModal";
import DesignerProfileSheet from "./DesignerProfileSheet";
import { FormData, ServiceSelection } from "@/types/calculator";
import { getPaletteById } from "@/data/palettes";
import type { Tier } from "@/config/tiers";
import { useCostCalculation } from "@/hooks/useCostCalculation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  VisualizationSection,
  MaterialManifestSection,
  PassportTabs,
  PassportTabPanel,
  BudgetView,
  TimelineView,
} from "./result-dashboard";
import SpacePlanningWarningModal from "./result-dashboard/SpacePlanningWarningModal";

interface ResultDashboardProps {
  mode?: "full" | "calculator";
  isVisible: boolean;
  formData: FormData | null;
  uploadedImage: string | null;
  generatedImage?: string | null;
  selectedMaterial: string | null;
  selectedCategory: string | null;
  selectedStyle: string | null;
  freestyleDescription?: string;
  onClose?: () => void;
  onFormDataChange?: (formData: FormData) => void;
  onRegenerateVisualization?: () => void;
  onChangeStyle?: () => void;
  onStartFresh?: () => void;
  onSelectPalette?: (paletteId: string) => void;
}

const ResultDashboard = ({
  mode = "full",
  isVisible,
  formData,
  uploadedImage,
  generatedImage,
  selectedMaterial,
  selectedCategory,
  selectedStyle,
  freestyleDescription,
  onClose,
  onFormDataChange,
  onRegenerateVisualization,
  onChangeStyle,
  onStartFresh,
  onSelectPalette,
}: ResultDashboardProps) => {
  const { t } = useLanguage();

  // UI state
  const [selectedTier, setSelectedTier] = useState<Tier>("Standard");
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [isDesignerSheetOpen, setIsDesignerSheetOpen] = useState(false);
  const [isMaterialMatchModalOpen, setIsMaterialMatchModalOpen] = useState(false);
  const [isSpacePlanningWarningOpen, setIsSpacePlanningWarningOpen] = useState(false);

  // Local state for refine inputs
  const [localArea, setLocalArea] = useState(formData?.area ?? 50);
  const [localIsRenovation, setLocalIsRenovation] = useState(formData?.isRenovation ?? false);
  const [localServices, setLocalServices] = useState<ServiceSelection>(
    formData?.services ?? { spacePlanning: true, interiorFinishes: true, furnishingDecor: true }
  );
  const [localKitchenLength, setLocalKitchenLength] = useState(formData?.kitchenLength ?? 4);
  const [localWardrobeLength, setLocalWardrobeLength] = useState(formData?.wardrobeLength ?? 3);

  // Sync local state when formData changes
  useEffect(() => {
    if (formData) {
      setLocalArea(formData.area);
      setLocalIsRenovation(formData.isRenovation);
      setLocalServices(formData.services);
      setLocalKitchenLength(formData.kitchenLength);
      setLocalWardrobeLength(formData.wardrobeLength);
    }
  }, [formData]);

  // Use the extracted cost calculation hook
  const calculation = useCostCalculation({
    area: localArea,
    isRenovation: localIsRenovation,
    services: localServices,
    kitchenLength: localKitchenLength,
    wardrobeLength: localWardrobeLength,
    selectedTier,
    t,
  });

  const handleUpdateFormData = (updates: Partial<FormData>) => {
    const newFormData: FormData = {
      area: updates.area ?? localArea,
      isRenovation: updates.isRenovation ?? localIsRenovation,
      services: updates.services ?? localServices,
      kitchenLength: updates.kitchenLength ?? localKitchenLength,
      wardrobeLength: updates.wardrobeLength ?? localWardrobeLength,
    };

    if (updates.area !== undefined) setLocalArea(updates.area);
    if (updates.isRenovation !== undefined) setLocalIsRenovation(updates.isRenovation);
    if (updates.services !== undefined) setLocalServices(updates.services);
    if (updates.kitchenLength !== undefined) setLocalKitchenLength(updates.kitchenLength);
    if (updates.wardrobeLength !== undefined) setLocalWardrobeLength(updates.wardrobeLength);

    onFormDataChange?.(newFormData);
  };

  const handleToggleService = (service: keyof ServiceSelection) => {
    // Guard: warn if unchecking spacePlanning while interiorFinishes is checked
    if (
      service === "spacePlanning" &&
      localServices.spacePlanning === true &&
      localServices.interiorFinishes === true
    ) {
      setIsSpacePlanningWarningOpen(true);
      return; // Block the toggle until user confirms
    }

    const newServices = { ...localServices, [service]: !localServices[service] };
    handleUpdateFormData({ services: newServices });
  };

  const handleKeepSpacePlanning = () => {
    setIsSpacePlanningWarningOpen(false);
  };

  const handleAcceptRisks = () => {
    setIsSpacePlanningWarningOpen(false);
    const newServices = { ...localServices, spacePlanning: false };
    handleUpdateFormData({ services: newServices });
  };

  if (!isVisible || !formData) return null;

  const isCalculatorMode = mode === "calculator";
  const palette = selectedMaterial ? getPaletteById(selectedMaterial) : null;

  return (
    <div className={isCalculatorMode ? "bg-background" : "fixed inset-0 z-50 bg-background fade-in overflow-auto"}>
      <div className={isCalculatorMode ? "" : "min-h-screen pb-safe"}>
        {/* Header - only in full mode */}
        {!isCalculatorMode && (
          <div className="glass-panel sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <Link to="/" className="text-xl md:text-2xl font-serif font-medium tracking-tight text-foreground">
                Design Dialogues
              </Link>
              <div className="flex items-center gap-1 md:gap-3">
                <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <Download size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                {onClose && (
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors ml-1">
                    <X size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
          <div className={`grid grid-cols-1 gap-6 md:gap-12 ${mode === "full" ? "lg:grid-cols-2" : "max-w-xl mx-auto"}`}>
            {/* Left - Visualization (only in full mode) */}
            {mode === "full" && (
              <VisualizationSection
                uploadedImage={uploadedImage}
                generatedImage={generatedImage || null}
                selectedMaterial={selectedMaterial}
                selectedStyle={selectedStyle}
                freestyleDescription={freestyleDescription || ""}
                onRegenerateVisualization={onRegenerateVisualization}
                onChangeStyle={onChangeStyle}
                onStartFresh={onStartFresh}
              />
            )}

            {/* Right - Project Passport */}
            <div className="slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:sticky lg:top-24">
                <h2 className="text-2xl md:text-3xl font-serif mb-1 md:mb-2">{t("result.title")}</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-8">
                  {t("result.estimatedInvestment")} {localArea}m²
                </p>

                {/* Unified Card Container */}
                <div className="border border-ds-border-default rounded-2xl overflow-hidden">
                  {/* Top Half - Tabs + Content */}
                  <div className="bg-surface-primary p-5 md:p-6">
                    <PassportTabs defaultTab="financial">
                      <PassportTabPanel value="financial">
                        <BudgetView
                          selectedTier={selectedTier}
                          onSelectTier={setSelectedTier}
                          localArea={localArea}
                          localIsRenovation={localIsRenovation}
                          localServices={localServices}
                          localKitchenLength={localKitchenLength}
                          localWardrobeLength={localWardrobeLength}
                          calculation={calculation}
                          isRefineOpen={isRefineOpen}
                          setIsRefineOpen={setIsRefineOpen}
                          onUpdateFormData={handleUpdateFormData}
                          onToggleService={handleToggleService}
                          onOpenInsight={setActiveInsight}
                        />
                      </PassportTabPanel>

                      <PassportTabPanel value="timeline">
                        <TimelineView
                          selectedTier={selectedTier}
                          isRenovation={localIsRenovation}
                          services={localServices}
                        />
                      </PassportTabPanel>
                    </PassportTabs>
                  </div>

                  {/* Subtle Divider */}
                  <div className="border-t border-ds-border-subtle" />

                  {/* Bottom Half - Material Manifest */}
                  <div className="bg-surface-primary p-5 md:p-6">
                    <MaterialManifestSection
                      mode={mode}
                      selectedMaterial={selectedMaterial}
                      selectedCategory={selectedCategory}
                      freestyleDescription={freestyleDescription || ""}
                      onOpenDesignerSheet={() => setIsDesignerSheetOpen(true)}
                      onOpenMaterialMatchModal={() => setIsMaterialMatchModalOpen(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - only in full mode */}
      {mode === "full" && <Footer />}

      {/* Cost Insight Sheet */}
      <CostInsightSheet
        isOpen={activeInsight !== null}
        onClose={() => setActiveInsight(null)}
        category={activeInsight || ""}
        tier={selectedTier.toLowerCase() as "budget" | "standard" | "premium"}
      />

      {/* Designer Profile Sheet */}
      <DesignerProfileSheet
        isOpen={isDesignerSheetOpen}
        onClose={() => setIsDesignerSheetOpen(false)}
        designerName={palette?.designer || "Design Dialogues"}
        designerTitle={palette?.designerTitle || "Interior Designer"}
        currentPaletteId={selectedMaterial || undefined}
        onSelectPalette={onSelectPalette}
      />

      {/* Material Match Request Modal */}
      <MaterialMatchRequestModal
        isOpen={isMaterialMatchModalOpen}
        onClose={() => setIsMaterialMatchModalOpen(false)}
        generatedImage={generatedImage || null}
        freestyleDescription={freestyleDescription || ""}
        selectedTier={selectedTier}
      />

      {/* Space Planning Warning Modal */}
      <SpacePlanningWarningModal
        isOpen={isSpacePlanningWarningOpen}
        onKeepSpacePlanning={handleKeepSpacePlanning}
        onAcceptRisks={handleAcceptRisks}
      />
    </div>
  );
};

export default ResultDashboard;
