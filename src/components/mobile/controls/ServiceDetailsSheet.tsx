import { Compass, Paintbrush, Sofa } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tier } from "@/config/tiers";
import type { CostCalculation } from "@/hooks/useCostCalculation";
import type { ServiceSelection } from "@/types/calculator";

interface ServiceDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: Tier;
  calculation: CostCalculation;
  services: ServiceSelection;
}

const serviceConfig = [
  { id: "spacePlanning", icon: Compass },
  { id: "interiorFinishes", icon: Paintbrush },
  { id: "furnishingDecor", icon: Sofa },
] as const;

export default function ServiceDetailsSheet({
  isOpen,
  onClose,
  selectedTier,
  calculation,
  services,
}: ServiceDetailsSheetProps) {
  const { t } = useLanguage();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif">{t("result.budgetDetails")}</SheetTitle>
        </SheetHeader>

        {/* Section 1: Cost Breakdown */}
        <div className="space-y-4 mb-8">
          {calculation.groupedLineItems.map((group) => (
            <div key={group.header}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">
                {group.header}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className="text-sm font-medium tabular-nums">
                      €{item.lowValue.toLocaleString('lt-LT')} – €{item.highValue.toLocaleString('lt-LT')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="border-t border-border pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t("result.total")}</span>
              <span className="text-lg font-serif tabular-nums">
                €{calculation.total.toLocaleString('lt-LT')}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              ±15% {t("budget.varianceNote")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Section 2: What's Included */}
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
            {t("result.whatsIncluded")}
          </p>
        </div>

        <div className="space-y-5">
          {serviceConfig.map((service) => {
            const Icon = service.icon;
            const titleKey = `service.${service.id}` as const;
            const descKey = `service.${service.id}${selectedTier}` as const;
            const isIncluded = services[service.id as keyof ServiceSelection];

            return (
              <div
                key={service.id}
                className={`flex gap-4 ${!isIncluded ? "opacity-50" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                    isIncluded ? "border-foreground/20" : "border-dashed border-muted-foreground/30"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isIncluded ? "text-foreground" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium text-sm ${!isIncluded ? "text-muted-foreground" : ""}`}>
                      {t(titleKey)}
                    </p>
                    {!isIncluded && (
                      <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t("result.notIncluded")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
