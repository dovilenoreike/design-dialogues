/**
 * CostBreakdownPanel - Expandable panel with sliders, service toggles, and cost breakdown
 */

import { useState } from "react";
import { ChevronDown, Info, Minus, Plus, User, Baby } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { KitchenSlider } from "@/components/ui/kitchen-slider";
import { Switch } from "@/components/ui/switch";
import ServiceCard from "@/components/ServiceCard";
import FeedbackDialog from "@/components/FeedbackDialog";
import type { ServiceSelection, FormData } from "@/types/calculator";
import type { Tier } from "@/config/tiers";
import { getServiceCardContent } from "@/config/pricing";
import type { CostCalculation } from "@/hooks/useCostCalculation";
import { useLanguage } from "@/contexts/LanguageContext";

interface CostBreakdownPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  localArea: number;
  localNumberOfAdults: number;
  localNumberOfChildren: number;
  localIsRenovation: boolean;
  localIsUrgent: boolean;
  localServices: ServiceSelection;
  localKitchenLength: number;
  localWardrobeLength: number;
  selectedTier: Tier;
  calculation: CostCalculation;
  onUpdateFormData: (updates: Partial<FormData>) => void;
  onToggleService: (service: keyof ServiceSelection) => void;
  onOpenInsight: (label: string) => void;
}

const CostBreakdownPanel = ({
  isOpen,
  onToggle,
  localArea,
  localNumberOfAdults,
  localNumberOfChildren,
  localIsRenovation,
  localIsUrgent,
  localServices,
  localKitchenLength,
  localWardrobeLength,
  selectedTier,
  calculation,
  onUpdateFormData,
  onToggleService,
  onOpenInsight,
}: CostBreakdownPanelProps) => {
  const { t } = useLanguage();
  const serviceCardContent = getServiceCardContent(t);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      {/* Trigger Link */}
      <button
        onClick={onToggle}
        className="mt-6 text-sm text-text-tertiary hover:text-foreground transition-colors flex items-center gap-1 mx-auto touch-manipulation"
      >
        {t("result.adjustParameters")}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="mt-4 bg-surface-muted/50 rounded-xl p-4 space-y-5 animate-fade-in">
          {/* SECTION A: INPUTS */}
          {/* Household Size - Pill Steppers */}
          <div className="pb-4 border-b border-ds-border-subtle">
            <label className="text-xs text-muted-foreground mb-3 block">{t("budget.household")}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Adults Stepper Pill */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-1 py-1">
                <button
                  onClick={() => onUpdateFormData({ numberOfAdults: Math.max(1, localNumberOfAdults - 1) })}
                  disabled={localNumberOfAdults <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-sm font-medium tabular-nums min-w-[1ch] text-center">
                    {localNumberOfAdults}
                  </span>
                </div>
                <button
                  onClick={() => onUpdateFormData({ numberOfAdults: Math.min(10, localNumberOfAdults + 1) })}
                  disabled={localNumberOfAdults >= 10}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Children Stepper Pill */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-1 py-1">
                <button
                  onClick={() => onUpdateFormData({ numberOfChildren: Math.max(0, localNumberOfChildren - 1) })}
                  disabled={localNumberOfChildren <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  <Baby className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-sm font-medium tabular-nums min-w-[1ch] text-center">
                    {localNumberOfChildren}
                  </span>
                </div>
                <button
                  onClick={() => onUpdateFormData({ numberOfChildren: Math.min(10, localNumberOfChildren + 1) })}
                  disabled={localNumberOfChildren >= 10}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Area slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">{t("result.totalArea")}</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {localArea} m²
              </span>
            </div>
            <Slider
              value={[localArea]}
              onValueChange={(value) => onUpdateFormData({ area: value[0] })}
              min={20}
              max={200}
              step={5}
              className="w-full"
            />
          </div>

          {/* Kitchen Length slider with recommendations */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">{t("result.kitchenLength")}</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {localKitchenLength} lm
              </span>
            </div>
            <KitchenSlider
              value={localKitchenLength}
              onValueChange={(value) => onUpdateFormData({ kitchenLength: value })}
              numberOfAdults={localNumberOfAdults}
              numberOfChildren={localNumberOfChildren}
              min={2}
              max={12}
              step={0.2}
              recommendedLabel={t("budget.recommended")}
            />
          </div>

          {/* Wardrobe Length slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">{t("result.wardrobeLength")}</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {localWardrobeLength} lm
              </span>
            </div>
            <Slider
              value={[localWardrobeLength]}
              onValueChange={(value) => onUpdateFormData({ wardrobeLength: value[0] })}
              min={0}
              max={12}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Renovation toggle */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-ds-border-subtle">
            <label className="font-medium text-sm text-text-primary">
              {t("result.renovationRequired")}
            </label>
            <Switch
              checked={localIsRenovation}
              onCheckedChange={(checked) => onUpdateFormData({ isRenovation: checked })}
            />
          </div>

          {/* Urgency toggle */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-ds-border-subtle">
            <div>
              <label className="font-medium text-sm text-text-primary">
                {t("result.urgentProject")}
              </label>
              <p className="text-xs text-text-muted mt-0.5">
                {t("result.urgentProjectHint")}
              </p>
            </div>
            <Switch
              checked={localIsUrgent}
              onCheckedChange={(checked) => onUpdateFormData({ isUrgent: checked })}
            />
          </div>

          {/* Service Selection Cards */}
          <div className="py-3 border-t border-ds-border-default">
            <label className="text-xs font-medium mb-3 block">{t("result.services")}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <ServiceCard
                title={serviceCardContent.spacePlanning.title}
                description={serviceCardContent.spacePlanning.descriptions[selectedTier]}
                isSelected={localServices.spacePlanning}
                onToggle={() => onToggleService("spacePlanning")}
              />
              <ServiceCard
                title={serviceCardContent.interiorFinishes.title}
                description={serviceCardContent.interiorFinishes.descriptions[selectedTier]}
                isSelected={localServices.interiorFinishes}
                onToggle={() => onToggleService("interiorFinishes")}
              />
              <ServiceCard
                title={serviceCardContent.furnishingDecor.title}
                description={serviceCardContent.furnishingDecor.descriptions[selectedTier]}
                isSelected={localServices.furnishingDecor}
                onToggle={() => onToggleService("furnishingDecor")}
              />
            </div>
          </div>

          {/* SECTION B: OUTPUTS - Grouped Line Items */}
          <div className="space-y-4 pt-3 border-t border-ds-border-default">
            {calculation.groupedLineItems.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2 mt-5 first:mt-0">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  {group.header}
                </p>
                {group.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-text-tertiary flex items-center">
                      {item.label}
                      <Info
                        size={11}
                        className="ml-1 text-text-subtle cursor-pointer hover:text-text-primary transition-colors"
                        onClick={() => onOpenInsight(item.label)}
                      />
                    </span>
                    <span className="font-medium text-text-primary tabular-nums text-right">
                      €{item.lowValue.toLocaleString('lt-LT')} – €{item.highValue.toLocaleString('lt-LT')}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <p className="text-[10px] text-muted-foreground pt-2 italic">
              {t("result.disclaimer")}
            </p>

            {/* Feedback Link */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="mt-3 text-[10px] text-muted-foreground hover:text-text-primary transition-colors italic inline-flex items-center gap-1"
            >
              {t("budget.foundInaccuracies")} →
            </button>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
};

export default CostBreakdownPanel;
