/**
 * CostBreakdownPanel - Expandable panel with sliders, service toggles, and cost breakdown
 */

import { ChevronDown, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ServiceCard from "@/components/ServiceCard";
import type { ServiceSelection, FormData } from "@/types/calculator";
import type { Tier } from "@/config/tiers";
import { serviceCardContent } from "@/config/pricing";
import type { CostCalculation } from "@/hooks/useCostCalculation";

interface CostBreakdownPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  localArea: number;
  localIsRenovation: boolean;
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
  localIsRenovation,
  localServices,
  localKitchenLength,
  localWardrobeLength,
  selectedTier,
  calculation,
  onUpdateFormData,
  onToggleService,
  onOpenInsight,
}: CostBreakdownPanelProps) => {
  return (
    <>
      {/* Trigger Link */}
      <button
        onClick={onToggle}
        className="mt-6 text-sm text-text-tertiary hover:text-foreground transition-colors flex items-center gap-1 mx-auto touch-manipulation"
      >
        Adjust Parameters & Breakdown
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="mt-4 bg-surface-muted/50 rounded-xl p-4 space-y-5 animate-fade-in">
          {/* SECTION A: INPUTS */}
          {/* Area slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">Total Area</label>
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

          {/* Kitchen Length slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">Kitchen Length</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {localKitchenLength} lm
              </span>
            </div>
            <Slider
              value={[localKitchenLength]}
              onValueChange={(value) => onUpdateFormData({ kitchenLength: value[0] })}
              min={2}
              max={8}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Wardrobe Length slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">Built-in Wardrobes</label>
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
              Renovation Required
            </label>
            <Switch
              checked={localIsRenovation}
              onCheckedChange={(checked) => onUpdateFormData({ isRenovation: checked })}
            />
          </div>

          {/* Service Selection Cards */}
          <div className="py-3 border-t border-ds-border-default">
            <label className="text-xs font-medium mb-3 block">Services Included</label>
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
                      €{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Renovation Prep (conditional) */}
            {calculation.renovationCost > 0 && (
              <div className="space-y-2 mt-5 pt-2 border-t border-dashed border-ds-border-default">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  RENOVATION
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-tertiary flex items-center">
                    Prep Work
                    <Info
                      size={11}
                      className="ml-1 text-text-subtle cursor-pointer hover:text-text-primary transition-colors"
                      onClick={() => onOpenInsight("Prep Work")}
                    />
                  </span>
                  <span className="font-medium text-text-primary tabular-nums text-right">
                    €{calculation.renovationCost.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground pt-2 italic">
              All figures are preliminary estimates based on typical project costs
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CostBreakdownPanel;
