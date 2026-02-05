import { useState, useEffect, useRef } from "react";
import { Compass, Paintbrush, Sofa, Wrench, Zap, User, Baby, Minus, Plus, Check } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useDesign, Tier } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCostCalculation } from "@/hooks/useCostCalculation";
import { useHaptic } from "@/hooks/use-haptic";
import { useToast } from "@/hooks/use-toast";
import { KitchenSlider, getKitchenStatus, getRecommendedKitchen } from "@/components/ui/kitchen-slider";
import { calculateTotalStorage } from "@/data/layout-audit-rules";
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
  numberOfAdults: 2,
  numberOfChildren: 0,
  isRenovation: false,
  isUrgent: false,
  services: {
    spacePlanning: true,
    interiorFinishes: true,
    furnishingDecor: false,
  },
  kitchenLength: 3,
  wardrobeLength: 2,
};

/**
 * Calculate recommended total storage length based on household
 */
const getRecommendedTotalStorage = (adults: number, children: number): number => {
  const safeAdults = (typeof adults === 'number' && !isNaN(adults)) ? adults : 2;
  const safeChildren = (typeof children === 'number' && !isNaN(children)) ? children : 0;
  return parseFloat(calculateTotalStorage(safeAdults, safeChildren)) || 6.0;
};

/**
 * Get storage status based on ergonomic-standards.md:
 * - Underbuilt: < formula × 0.75
 * - Minimal/Optimal: formula × 0.75 to formula × 1.15 (covered by sage)
 * - Overbuilt: > formula × 1.35
 */
const getStorageStatus = (value: number, adults: number, children: number): 'optimal' | 'underbuilt' | 'overbuilt' => {
  const recommended = getRecommendedTotalStorage(adults, children);
  if (value < recommended * 0.75) return 'underbuilt';
  if (value > recommended * 1.35) return 'overbuilt';
  return 'optimal';
};

/**
 * Architectural Slider - Clean minimal design with sage green optimal range
 */
const ArchitecturalSlider = ({
  value,
  onValueChange,
  min,
  max,
  step,
  recommended,
  toleranceLow = 0.6,
  toleranceHigh = 0.7,
  showMarker = true,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  recommended: number;
  toleranceLow?: number;
  toleranceHigh?: number;
  showMarker?: boolean;
}) => {
  const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : min;

  const rangeStart = Math.max(min, recommended - toleranceLow);
  const rangeEnd = Math.min(max, recommended + toleranceHigh);

  const totalRange = max - min;
  const startPercent = ((rangeStart - min) / totalRange) * 100;
  const widthPercent = ((rangeEnd - rangeStart) / totalRange) * 100;
  const recommendedPercent = ((recommended - min) / totalRange) * 100;

  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center"
      value={[safeValue]}
      onValueChange={(values) => onValueChange(values[0])}
      min={min}
      max={max}
      step={step}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-neutral-100">
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: 'rgba(100, 125, 117, 0.25)',
          }}
        />
        {showMarker && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-[#647D75] pointer-events-none"
            style={{ left: `${recommendedPercent}%` }}
          />
        )}
        <SliderPrimitive.Range className="absolute h-full bg-transparent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-neutral-900 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 z-10" />
    </SliderPrimitive.Root>
  );
};

export default function BudgetView() {
  const { formData, setFormData, selectedTier, setSelectedTier, setLayoutAuditAdults, setLayoutAuditChildren } = useDesign();
  const { t } = useLanguage();
  const haptic = useHaptic();
  const { toast, dismiss } = useToast();

  // Use formData if available, otherwise use defaults
  const data = formData || defaultFormData;

  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);

  // Local state for form inputs
  const [localArea, setLocalArea] = useState(data.area);
  const [localNumberOfAdults, setLocalNumberOfAdults] = useState(
    typeof data.numberOfAdults === 'number' && !isNaN(data.numberOfAdults) ? data.numberOfAdults : 2
  );
  const [localNumberOfChildren, setLocalNumberOfChildren] = useState(
    typeof data.numberOfChildren === 'number' && !isNaN(data.numberOfChildren) ? data.numberOfChildren : 0
  );
  const [localIsRenovation, setLocalIsRenovation] = useState(data.isRenovation);
  const [localIsUrgent, setLocalIsUrgent] = useState(data.isUrgent);
  const [localServices, setLocalServices] = useState<ServiceSelection>(data.services);
  const [localKitchenLength, setLocalKitchenLength] = useState(data.kitchenLength);
  const [localWardrobeLength, setLocalWardrobeLength] = useState(data.wardrobeLength);

  // Calculate costs
  const calculation = useCostCalculation({
    area: localArea,
    isRenovation: localIsRenovation,
    isUrgent: localIsUrgent,
    services: localServices,
    kitchenLength: localKitchenLength,
    wardrobeLength: localWardrobeLength,
    selectedTier,
    t,
  });

  // Calculate recommendations and statuses
  const recommendedKitchen = getRecommendedKitchen(localNumberOfAdults, localNumberOfChildren);
  const recommendedStorage = getRecommendedTotalStorage(localNumberOfAdults, localNumberOfChildren);
  const kitchenStatus = getKitchenStatus(localKitchenLength, localNumberOfAdults, localNumberOfChildren);
  const storageStatus = getStorageStatus(localWardrobeLength, localNumberOfAdults, localNumberOfChildren);
  const hasStorageDeficit = kitchenStatus === 'underbuilt' || storageStatus === 'underbuilt';

  // Track previous deficit state to avoid duplicate toasts
  const prevHasStorageDeficit = useRef(hasStorageDeficit);
  const deficitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show floating toast when storage deficit detected (debounced)
  useEffect(() => {
    // Clear any pending toast when deficit state changes
    if (deficitTimeoutRef.current) {
      clearTimeout(deficitTimeoutRef.current);
      deficitTimeoutRef.current = null;
    }

    if (hasStorageDeficit && !prevHasStorageDeficit.current) {
      // Debounce: only show toast if user stays in deficit zone for 500ms
      deficitTimeoutRef.current = setTimeout(() => {
        const deficitMessage = kitchenStatus === 'underbuilt' && storageStatus === 'underbuilt'
          ? t("budget.storageDeficitBoth")
          : kitchenStatus === 'underbuilt'
          ? t("budget.storageDeficitKitchen")
          : t("budget.storageDeficitStorage");

        const { id } = toast({
          title: t("budget.storageDeficit"),
          description: deficitMessage,
          duration: 4000,
          className: "!bg-amber-50 !border-amber-200 !text-amber-900 shadow-lg",
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => dismiss(id), 4000);
      }, 500);
    }

    prevHasStorageDeficit.current = hasStorageDeficit;

    // Cleanup on unmount
    return () => {
      if (deficitTimeoutRef.current) {
        clearTimeout(deficitTimeoutRef.current);
      }
    };
  }, [hasStorageDeficit, kitchenStatus, storageStatus, toast, dismiss, t]);

  const handleUpdateFormData = (updates: Partial<FormData>) => {
    if (updates.area !== undefined) setLocalArea(updates.area);
    if (updates.numberOfAdults !== undefined) {
      setLocalNumberOfAdults(updates.numberOfAdults);
      setLayoutAuditAdults(updates.numberOfAdults);
    }
    if (updates.numberOfChildren !== undefined) {
      setLocalNumberOfChildren(updates.numberOfChildren);
      setLayoutAuditChildren(updates.numberOfChildren);
    }
    if (updates.isRenovation !== undefined) setLocalIsRenovation(updates.isRenovation);
    if (updates.isUrgent !== undefined) setLocalIsUrgent(updates.isUrgent);
    if (updates.services !== undefined) setLocalServices(updates.services);
    if (updates.kitchenLength !== undefined) setLocalKitchenLength(updates.kitchenLength);
    if (updates.wardrobeLength !== undefined) setLocalWardrobeLength(updates.wardrobeLength);

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

    const currentData = formData || defaultFormData;
    setFormData({ ...currentData, services: newServices });
  };

  const handleTierSelect = (tier: Tier) => {
    haptic.light();
    setSelectedTier(tier);
  };

  const handleToggleCondition = (condition: 'isRenovation' | 'isUrgent') => {
    haptic.light();
    if (condition === 'isRenovation') {
      handleUpdateFormData({ isRenovation: !localIsRenovation });
    } else {
      handleUpdateFormData({ isUrgent: !localIsUrgent });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-4">
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
          <p className="text-xs text-muted-foreground text-center mb-4">
            {t(`tier.${selectedTier.toLowerCase()}Desc`)}
          </p>

          {/* Main Price Range */}
          <div className="text-center">
            <p className="text-3xl font-serif tabular-nums">
              €{(Math.round(calculation.lowEstimate / 1000) * 1000).toLocaleString('lt-LT')} – €{(Math.round(calculation.highEstimate / 1000) * 1000).toLocaleString('lt-LT')}
            </p>
            {/* Technical Subtitle */}
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mt-2">
              {localArea} m² • {t(tierTranslationKey[selectedTier])} • {
                Object.values(localServices).every(v => v)
                  ? t("budget.fullScope")
                  : Object.values(localServices).filter(v => v).length === 0
                  ? t("budget.noScope")
                  : t("budget.partialScope")
              }
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-6">

          {/* HOUSEHOLD */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-3 block">
              {t("budget.household")}
            </label>
            <div className="flex items-center gap-6">
              {/* Adults Stepper */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateFormData({ numberOfAdults: Math.max(1, localNumberOfAdults - 1) })}
                  disabled={localNumberOfAdults <= 1}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                  <span className="font-serif text-base tabular-nums min-w-[1.5ch] text-center text-neutral-900">
                    {localNumberOfAdults}
                  </span>
                </div>
                <button
                  onClick={() => handleUpdateFormData({ numberOfAdults: Math.min(10, localNumberOfAdults + 1) })}
                  disabled={localNumberOfAdults >= 10}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Children Stepper */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateFormData({ numberOfChildren: Math.max(0, localNumberOfChildren - 1) })}
                  disabled={localNumberOfChildren <= 0}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                  <span className="font-serif text-base tabular-nums min-w-[1.5ch] text-center text-neutral-900">
                    {localNumberOfChildren}
                  </span>
                </div>
                <button
                  onClick={() => handleUpdateFormData({ numberOfChildren: Math.min(10, localNumberOfChildren + 1) })}
                  disabled={localNumberOfChildren >= 10}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* PROJECT SCOPE */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-3 block">
              {t("budget.projectScope")}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {services.map((service) => {
                const isSelected = localServices[service.id as keyof ServiceSelection];
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => handleToggleService(service.id as keyof ServiceSelection)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded transition-all active:scale-95 border bg-white ${
                      isSelected
                        ? "border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-neutral-700" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium text-neutral-600">
                      {t(`service.${service.id}`)}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-neutral-900" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DIMENSIONS */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-4 block">
              {t("result.dimensions")}
            </label>

            {/* Area slider */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm text-neutral-600">{t("result.totalArea")}</span>
                <span className="font-serif text-sm tabular-nums text-neutral-900">
                  {localArea} m²
                </span>
              </div>
              {(() => {
                const people = localNumberOfAdults + localNumberOfChildren;
                const minComfortable = Math.max(30, localNumberOfAdults * 20 + localNumberOfChildren * 10);
                const maxComfortable = Math.max(60, people * 40);
                const midpoint = (minComfortable + maxComfortable) / 2;
                return (
                  <ArchitecturalSlider
                    value={localArea}
                    onValueChange={(value) => handleUpdateFormData({ area: value })}
                    min={20}
                    max={200}
                    step={5}
                    recommended={midpoint}
                    toleranceLow={midpoint - minComfortable}
                    toleranceHigh={maxComfortable - midpoint}
                    showMarker={false}
                  />
                );
              })()}
            </div>

            {/* Kitchen Length slider */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm text-neutral-600">{t("result.kitchenLength")}</span>
                <span className="font-serif text-sm tabular-nums text-neutral-900">
                  {localKitchenLength} m
                </span>
              </div>
              <KitchenSlider
                value={localKitchenLength}
                onValueChange={(value) => handleUpdateFormData({ kitchenLength: value })}
                numberOfAdults={localNumberOfAdults}
                numberOfChildren={localNumberOfChildren}
                min={2}
                max={8}
                step={0.2}
              />
              {kitchenStatus === 'underbuilt' && (
                <div className="flex justify-center mt-1.5">
                  <span className="text-[10px] text-[#CA8A04]">
                    {t("budget.recommended")}: {recommendedKitchen.toFixed(1)}m
                  </span>
                </div>
              )}
            </div>

            {/* Total Storage slider */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm text-neutral-600">{t("result.totalStorage")}</span>
                <span className="font-serif text-sm tabular-nums text-neutral-900">
                  {localWardrobeLength} m
                </span>
              </div>
              <ArchitecturalSlider
                value={localWardrobeLength}
                onValueChange={(value) => handleUpdateFormData({ wardrobeLength: value })}
                min={0}
                max={20}
                step={0.5}
                recommended={recommendedStorage}
                toleranceLow={recommendedStorage * 0.25}
                toleranceHigh={recommendedStorage * 0.15}
              />
              {storageStatus === 'underbuilt' && (
                <div className="flex justify-center mt-1.5">
                  <span className="text-[10px] text-[#CA8A04]">
                    {t("budget.recommended")}: {recommendedStorage.toFixed(1)}m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CONDITIONS */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-3 block">
              {t("result.conditions")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {/* Renovation pill */}
              <button
                onClick={() => handleToggleCondition('isRenovation')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all active:scale-95 border bg-white ${
                  localIsRenovation
                    ? "border-neutral-400 text-neutral-700"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium">{t("budget.renovation")}</span>
                {localIsRenovation && <Check className="w-3 h-3" strokeWidth={2.5} />}
              </button>

              {/* Expedited pill */}
              <button
                onClick={() => handleToggleCondition('isUrgent')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all active:scale-95 border bg-white ${
                  localIsUrgent
                    ? "border-neutral-400 text-neutral-700"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                }`}
              >
                <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-[10px] font-medium">{t("budget.urgent")} +20%</span>
                {localIsUrgent && <Check className="w-3 h-3" strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* COST BREAKDOWN */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-3 block">
              {t("result.costBreakdown")}
            </label>

            <div className="space-y-4">
              {calculation.groupedLineItems.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-neutral-400 mb-2">
                    {group.header}
                  </p>
                  {group.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-sm text-neutral-600">
                        {item.label}
                      </span>
                      <span className="font-serif text-sm tabular-nums text-neutral-900">
                        €{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-neutral-400 pt-3 mt-3 border-t border-neutral-100 italic">
              {t("result.disclaimer")}
            </p>
          </div>

        </div>
      </div>

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
