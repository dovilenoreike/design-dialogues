import { useState } from "react";
import { Home, Wrench, UtensilsCrossed, Shirt, Compass, Paintbrush, Sofa } from "lucide-react";
import { useDesign, Tier } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCostCalculation } from "@/hooks/useCostCalculation";
import { useHaptic } from "@/hooks/use-haptic";
import BudgetChip from "../controls/BudgetChip";
import BudgetEditSheet from "../controls/BudgetEditSheet";
import ServiceDetailsSheet from "../controls/ServiceDetailsSheet";
import type { ServiceSelection, FormData } from "@/types/calculator";

const tiers: Tier[] = ["Budget", "Standard", "Premium"];

// Map tier to translation key
const tierTranslationKey: Record<string, string> = {
  "Budget": "tier.budget",
  "Standard": "tier.standard",
  "Premium": "tier.premium",
};

const services = [
  { id: "spacePlanning", icon: Compass },
  { id: "interiorFinishes", icon: Paintbrush },
  { id: "furnishingDecor", icon: Sofa },
] as const;

// Default form data when none exists
const defaultFormData: FormData = {
  area: 60,
  isRenovation: false,
  services: {
    spacePlanning: true,
    interiorFinishes: true,
    furnishingDecor: false,
  },
  kitchenLength: 3,
  wardrobeLength: 2,
};

export default function BudgetView() {
  const { formData, setFormData, selectedTier, setSelectedTier } = useDesign();
  const { t } = useLanguage();
  const haptic = useHaptic();

  // Use formData if available, otherwise use defaults
  const data = formData || defaultFormData;

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);

  // Local state for form inputs
  const [localArea, setLocalArea] = useState(data.area);
  const [localIsRenovation, setLocalIsRenovation] = useState(data.isRenovation);
  const [localServices, setLocalServices] = useState<ServiceSelection>(data.services);
  const [localKitchenLength, setLocalKitchenLength] = useState(data.kitchenLength);
  const [localWardrobeLength, setLocalWardrobeLength] = useState(data.wardrobeLength);

  // Calculate costs
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
    if (updates.area !== undefined) setLocalArea(updates.area);
    if (updates.isRenovation !== undefined) setLocalIsRenovation(updates.isRenovation);
    if (updates.services !== undefined) setLocalServices(updates.services);
    if (updates.kitchenLength !== undefined) setLocalKitchenLength(updates.kitchenLength);
    if (updates.wardrobeLength !== undefined) setLocalWardrobeLength(updates.wardrobeLength);

    // Always update the context (initialize if null)
    const currentData = formData || defaultFormData;
    setFormData({ ...currentData, ...updates });
  };

  const handleToggleService = (service: keyof ServiceSelection) => {
    haptic.light();
    const newServices = {
      ...localServices,
      [service]: !localServices[service],
    };
    setLocalServices(newServices);

    // Always update the context (initialize if null)
    const currentData = formData || defaultFormData;
    setFormData({ ...currentData, services: newServices });
  };

  const handleTierSelect = (tier: Tier) => {
    haptic.light();
    setSelectedTier(tier);
  };

  const openEditSheet = () => {
    haptic.light();
    setIsEditSheetOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-8">
          {/* Tier Toggle */}
          <div className="flex justify-center gap-8 mb-2">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => handleTierSelect(tier)}
                  className={`relative py-2 text-[11px] uppercase tracking-widest transition-colors ${
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {t(tierTranslationKey[tier])}
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tier Description */}
          <p className="text-xs text-muted-foreground text-center mb-6">
            {t(`tier.${selectedTier.toLowerCase()}Desc`)}
          </p>

          {/* Summary Chips */}
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <BudgetChip
              icon={Home}
              label={`${localArea} m²`}
              onClick={openEditSheet}
            />
            <BudgetChip
              icon={UtensilsCrossed}
              label={`${t("budget.kitchen")}: ${localKitchenLength}m`}
              onClick={openEditSheet}
            />
            <BudgetChip
              icon={Shirt}
              label={`${t("budget.wardrobe")}: ${localWardrobeLength}m`}
              onClick={openEditSheet}
            />
            <BudgetChip
              icon={Wrench}
              label={t("budget.renovation")}
              active={localIsRenovation}
              onClick={openEditSheet}
            />
          </div>

          {/* Main Price */}
          <div className="text-center py-6 mb-8">
            <p className="text-4xl font-serif tabular-nums">
              €{calculation.highEstimate.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t("result.conservativeEstimate")} · {t("result.includesDesignFee")} €{calculation.designTotal.toLocaleString()}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-6" />

          {/* Percentage Breakdown */}
          {(() => {
            const nonDesignTotal = calculation.shellTotal + calculation.joineryTotal + calculation.equipTotal;

            const formatPercent = (value: number) => {
              if (nonDesignTotal === 0) return "-";
              const percent = Math.round((value / nonDesignTotal) * 100);
              return percent === 0 ? "-" : `${percent}%`;
            };

            return (
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <p className="text-lg font-medium text-muted-foreground/70">
                    {formatPercent(calculation.shellTotal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{t("result.shell")}</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-muted-foreground/70">
                    {formatPercent(calculation.joineryTotal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{t("result.joinery")}</p>
                </div>
                <div>
                  <p className="text-lg font-medium text-muted-foreground/70">
                    {formatPercent(calculation.equipTotal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{t("result.equip")}</p>
                </div>
              </div>
            );
          })()}

          {/* Services */}
          <div className="flex justify-center gap-4 mt-6">
            {services.map((service) => {
              const isSelected = localServices[service.id as keyof ServiceSelection];
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => handleToggleService(service.id as keyof ServiceSelection)}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all active:scale-95 border ${
                    isSelected
                      ? "border-foreground"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    }`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t(`service.${service.id}`)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* See Details Link */}
          <button
            onClick={() => setIsServiceSheetOpen(true)}
            className="w-full text-center mt-4 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("result.seeDetails")}
          </button>
        </div>
      </div>

      {/* Edit Sheet */}
      <BudgetEditSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        localArea={localArea}
        localIsRenovation={localIsRenovation}
        localKitchenLength={localKitchenLength}
        localWardrobeLength={localWardrobeLength}
        calculation={calculation}
        onUpdateFormData={handleUpdateFormData}
      />

      {/* Service Details Sheet */}
      <ServiceDetailsSheet
        isOpen={isServiceSheetOpen}
        onClose={() => setIsServiceSheetOpen(false)}
        selectedTier={selectedTier}
        calculation={calculation}
        services={localServices}
      />
    </div>
  );
}
