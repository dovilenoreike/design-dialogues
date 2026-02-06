import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCostCalculation } from "@/hooks/useCostCalculation";

export function BudgetSummary() {
  const { formData, selectedTier } = useDesign();
  const { t } = useLanguage();

  if (!formData) return null;

  const calculation = useCostCalculation({
    area: formData.area,
    isRenovation: formData.isRenovation,
    isUrgent: formData.isUrgent,
    services: formData.services,
    kitchenLength: formData.kitchenLength,
    wardrobeLength: formData.wardrobeLength,
    selectedTier,
    t,
  });

  const lowRounded = Math.round(calculation.lowEstimate / 1000) * 1000;
  const highRounded = Math.round(calculation.highEstimate / 1000) * 1000;

  const tierKey = `tier.${selectedTier.toLowerCase()}`;

  // Determine scope based on services
  const serviceCount = Object.values(formData.services).filter(v => v).length;
  const totalServices = Object.values(formData.services).length;
  const scopeKey = serviceCount === totalServices
    ? "budget.fullScope"
    : serviceCount === 0
    ? "budget.noScope"
    : "budget.partialScope";

  return (
    <div>
      <p className="text-2xl font-serif tabular-nums text-neutral-900">
        €{lowRounded.toLocaleString('lt-LT')} – €{highRounded.toLocaleString('lt-LT')}
      </p>
      <p className="text-[9px] uppercase tracking-[0.15em] font-medium text-neutral-400 mt-1">
        {formData.area} m² · {t(tierKey)} · {t(scopeKey)}
      </p>
    </div>
  );
}
