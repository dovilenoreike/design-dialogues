import { Info, Minus, Plus, User, Baby } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { KitchenSlider, getKitchenStatus, getRecommendedKitchen } from "@/components/ui/kitchen-slider";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FormData } from "@/types/calculator";
import type { CostCalculation } from "@/hooks/useCostCalculation";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateTotalStorage } from "@/data/layout-audit-rules";

interface BudgetEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  localArea: number;
  localNumberOfAdults: number;
  localNumberOfChildren: number;
  localIsRenovation: boolean;
  localIsUrgent: boolean;
  localKitchenLength: number;
  localWardrobeLength: number;
  calculation: CostCalculation;
  onUpdateFormData: (updates: Partial<FormData>) => void;
}

/**
 * Calculate recommended total storage length based on household
 * Combines: Entrance + Master Bedroom + Kids + General Storage
 */
const getRecommendedTotalStorage = (adults: number, children: number): number => {
  const safeAdults = (typeof adults === 'number' && !isNaN(adults)) ? adults : 2;
  const safeChildren = (typeof children === 'number' && !isNaN(children)) ? children : 0;
  return parseFloat(calculateTotalStorage(safeAdults, safeChildren)) || 6.0;
};

/**
 * Get storage status
 */
const getStorageStatus = (value: number, adults: number, children: number): 'optimal' | 'underbuilt' | 'overbuilt' => {
  const recommended = getRecommendedTotalStorage(adults, children);
  // Allow more tolerance for total storage (±20%)
  const toleranceLow = recommended * 0.2;
  const toleranceHigh = recommended * 0.25;
  if (value < recommended - toleranceLow) return 'underbuilt';
  if (value > recommended + toleranceHigh) return 'overbuilt';
  return 'optimal';
};

/**
 * Architectural Slider - Clean minimal design with sage green optimal range and recommendation marker
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

  // Calculate ergonomic standard range
  const rangeStart = Math.max(min, recommended - toleranceLow);
  const rangeEnd = Math.min(max, recommended + toleranceHigh);

  // Calculate percentages for positioning
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
        {/* Ergonomic Standard Range - Sage Green segment */}
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: 'rgba(100, 125, 117, 0.25)',
          }}
        />
        {/* Recommended marker | (optional) */}
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

export default function BudgetEditSheet({
  isOpen,
  onClose,
  localArea,
  localNumberOfAdults,
  localNumberOfChildren,
  localIsRenovation,
  localIsUrgent,
  localKitchenLength,
  localWardrobeLength,
  calculation,
  onUpdateFormData,
}: BudgetEditSheetProps) {
  const { t } = useLanguage();

  // Calculate recommendations and statuses
  const recommendedKitchen = getRecommendedKitchen(localNumberOfAdults, localNumberOfChildren);
  const recommendedStorage = getRecommendedTotalStorage(localNumberOfAdults, localNumberOfChildren);
  const kitchenStatus = getKitchenStatus(localKitchenLength, localNumberOfAdults, localNumberOfChildren);
  const storageStatus = getStorageStatus(localWardrobeLength, localNumberOfAdults, localNumberOfChildren);

  // Check for storage deficit
  const hasStorageDeficit = kitchenStatus === 'underbuilt' || storageStatus === 'underbuilt';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif text-neutral-900">{t("result.adjustParameters")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* HOUSEHOLD - Technical Label */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-3 block">
              {t("budget.household")}
            </label>
            <div className="flex items-center gap-3">
              {/* Adults Stepper */}
              <div className="flex items-center gap-1 border border-neutral-200 rounded-full px-1 py-1">
                <button
                  onClick={() => onUpdateFormData({ numberOfAdults: Math.max(1, localNumberOfAdults - 1) })}
                  disabled={localNumberOfAdults <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <User className="w-3.5 h-3.5 text-neutral-900" />
                  <span className="font-serif text-sm tabular-nums min-w-[1ch] text-center text-neutral-900">
                    {localNumberOfAdults}
                  </span>
                </div>
                <button
                  onClick={() => onUpdateFormData({ numberOfAdults: Math.min(10, localNumberOfAdults + 1) })}
                  disabled={localNumberOfAdults >= 10}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Children Stepper */}
              <div className="flex items-center gap-1 border border-neutral-200 rounded-full px-1 py-1">
                <button
                  onClick={() => onUpdateFormData({ numberOfChildren: Math.max(0, localNumberOfChildren - 1) })}
                  disabled={localNumberOfChildren <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <Baby className="w-3.5 h-3.5 text-neutral-900" />
                  <span className="font-serif text-sm tabular-nums min-w-[1ch] text-center text-neutral-900">
                    {localNumberOfChildren}
                  </span>
                </div>
                <button
                  onClick={() => onUpdateFormData({ numberOfChildren: Math.min(10, localNumberOfChildren + 1) })}
                  disabled={localNumberOfChildren >= 10}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSIONS - Technical Label */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-4 block">
              {t("result.dimensions")}
            </label>

            {/* Area slider - dynamic range based on household */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm text-neutral-600">{t("result.totalArea")}</span>
                <span className="font-serif text-sm tabular-nums text-neutral-900">
                  {localArea} m²
                </span>
              </div>
              {(() => {
                // Dynamic area range based on household size
                // 1 person: 30-55 m², 2+ people: 20-35 m² per person
                const people = localNumberOfAdults + localNumberOfChildren;
                const minComfortable = Math.max(30, people * 20);
                const maxComfortable = Math.max(55, people * 35);
                const midpoint = (minComfortable + maxComfortable) / 2;
                return (
                  <ArchitecturalSlider
                    value={localArea}
                    onValueChange={(value) => onUpdateFormData({ area: value })}
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
                onValueChange={(value) => onUpdateFormData({ kitchenLength: value })}
                numberOfAdults={localNumberOfAdults}
                numberOfChildren={localNumberOfChildren}
                min={2}
                max={8}
                step={0.5}
              />
              {kitchenStatus !== 'optimal' && (
                <div className="flex justify-center mt-1.5">
                  <span className="text-[10px] text-[#647D75]">
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
                onValueChange={(value) => onUpdateFormData({ wardrobeLength: value })}
                min={0}
                max={20}
                step={0.5}
                recommended={recommendedStorage}
                toleranceLow={recommendedStorage * 0.2}
                toleranceHigh={recommendedStorage * 0.25}
              />
              {storageStatus !== 'optimal' && (
                <div className="flex justify-center mt-1.5">
                  <span className="text-[10px] text-[#647D75]">
                    {t("budget.recommended")}: {recommendedStorage.toFixed(1)}m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Technical Feedback Area */}
          {hasStorageDeficit && (
            <div className="py-3 px-4 rounded-lg bg-[#9A3412]/5 border border-[#9A3412]/10">
              <p className="text-xs font-medium text-[#9A3412]">
                {t("budget.storageDeficit")}
              </p>
              <p className="text-[11px] text-[#9A3412]/70 mt-0.5">
                {kitchenStatus === 'underbuilt' && storageStatus === 'underbuilt'
                  ? t("budget.storageDeficitBoth")
                  : kitchenStatus === 'underbuilt'
                  ? t("budget.storageDeficitKitchen")
                  : t("budget.storageDeficitStorage")}
              </p>
            </div>
          )}

          {/* CONDITIONS - Technical Label */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-4 block">
              {t("result.conditions")}
            </label>

            {/* Renovation toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-600">
                {t("result.renovationRequired")}
              </span>
              <Switch
                checked={localIsRenovation}
                onCheckedChange={(checked) => onUpdateFormData({ isRenovation: checked })}
              />
            </div>

            {/* Urgency toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-neutral-600">
                  {t("result.urgentProject")}
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t("result.urgentProjectHint")}
                </p>
              </div>
              <Switch
                checked={localIsUrgent}
                onCheckedChange={(checked) => onUpdateFormData({ isUrgent: checked })}
              />
            </div>
          </div>

          {/* COST BREAKDOWN - Technical Label */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 mb-4 block">
              {t("result.costBreakdown")}
            </label>

            {calculation.groupedLineItems.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4 last:mb-0">
                <p className="text-[10px] uppercase tracking-[0.15em] font-medium text-neutral-400 mb-2">
                  {group.header}
                </p>
                {group.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-neutral-600 flex items-center">
                      {item.label}
                      <Info
                        size={11}
                        className="ml-1 text-neutral-300 cursor-pointer hover:text-neutral-500 transition-colors"
                      />
                    </span>
                    <span className="font-serif text-sm tabular-nums text-neutral-900">
                      €{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <p className="text-[10px] text-neutral-400 pt-3 border-t border-neutral-100 italic">
              {t("result.disclaimer")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
