/**
 * BudgetView - Financial passport content (tier selector, pricing, breakdown)
 * Extracted from ResultDashboard for tab-based layout
 */

import TierSelector from "../TierSelector";
import CostBreakdownPanel from "./CostBreakdownPanel";
import { tierPhilosophy } from "@/config/tiers";
import type { Tier } from "@/config/tiers";
import type { ServiceSelection, FormData } from "@/types/calculator";
import type { CostCalculation } from "@/hooks/useCostCalculation";
import { useLanguage } from "@/contexts/LanguageContext";

interface BudgetViewProps {
  selectedTier: Tier;
  onSelectTier: (tier: Tier) => void;
  localArea: number;
  localIsRenovation: boolean;
  localServices: ServiceSelection;
  localKitchenLength: number;
  localWardrobeLength: number;
  calculation: CostCalculation;
  isRefineOpen: boolean;
  setIsRefineOpen: (open: boolean) => void;
  onUpdateFormData: (updates: Partial<FormData>) => void;
  onToggleService: (service: keyof ServiceSelection) => void;
  onOpenInsight: (label: string) => void;
}

const BudgetView = ({
  selectedTier,
  onSelectTier,
  localArea,
  localIsRenovation,
  localServices,
  localKitchenLength,
  localWardrobeLength,
  calculation,
  isRefineOpen,
  setIsRefineOpen,
  onUpdateFormData,
  onToggleService,
  onOpenInsight,
}: BudgetViewProps) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Tier Selector */}
      <TierSelector selectedTier={selectedTier} onSelectTier={onSelectTier} />

      {/* Tier Philosophy */}
      <p className="text-sm text-text-muted italic py-6 text-center">
        {tierPhilosophy[selectedTier]}
      </p>

      {/* Conservative Estimate */}
      <div className="text-center">
        <p className="text-4xl md:text-5xl font-serif tabular-nums">
          €{calculation.highEstimate.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {t("result.conservativeEstimate")}
        </p>
        {calculation.designTotal > 0 && (
          <p className="text-xs text-text-muted mt-1">
            {t("result.includesDesignFee")} €{calculation.designTotal.toLocaleString()} {t("cost.interiorDesign").toLowerCase()}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-ds-border-subtle my-4" />

      {/* Stat Row - 3 Column Breakdown */}
      {(() => {
        const nonDesignTotal = calculation.shellTotal + calculation.joineryTotal + calculation.equipTotal;
        return (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-text-secondary">
                {nonDesignTotal > 0 ? Math.round((calculation.shellTotal / nonDesignTotal) * 100) : 0}%
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{t("result.shell")}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-secondary">
                {nonDesignTotal > 0 ? Math.round((calculation.joineryTotal / nonDesignTotal) * 100) : 0}%
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{t("result.joinery")}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-secondary">
                {nonDesignTotal > 0 ? Math.round((calculation.equipTotal / nonDesignTotal) * 100) : 0}%
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{t("result.equip")}</p>
            </div>
          </div>
        );
      })()}

      {/* Cost Breakdown Panel */}
      <CostBreakdownPanel
        isOpen={isRefineOpen}
        onToggle={() => setIsRefineOpen(!isRefineOpen)}
        localArea={localArea}
        localIsRenovation={localIsRenovation}
        localServices={localServices}
        localKitchenLength={localKitchenLength}
        localWardrobeLength={localWardrobeLength}
        selectedTier={selectedTier}
        calculation={calculation}
        onUpdateFormData={onUpdateFormData}
        onToggleService={onToggleService}
        onOpenInsight={onOpenInsight}
      />
    </>
  );
};

export default BudgetView;
