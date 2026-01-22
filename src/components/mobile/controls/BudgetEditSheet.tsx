import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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

interface BudgetEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  localArea: number;
  localIsRenovation: boolean;
  localKitchenLength: number;
  localWardrobeLength: number;
  calculation: CostCalculation;
  onUpdateFormData: (updates: Partial<FormData>) => void;
}

export default function BudgetEditSheet({
  isOpen,
  onClose,
  localArea,
  localIsRenovation,
  localKitchenLength,
  localWardrobeLength,
  calculation,
  onUpdateFormData,
}: BudgetEditSheetProps) {
  const { t } = useLanguage();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-serif">{t("result.adjustParameters")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
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

          {/* Kitchen Length slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs text-muted-foreground">{t("result.kitchenLength")}</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {localKitchenLength} m
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
              <label className="text-xs text-muted-foreground">{t("result.wardrobeLength")}</label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {localWardrobeLength} m
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
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <label className="font-medium text-sm">
              {t("result.renovationRequired")}
            </label>
            <Switch
              checked={localIsRenovation}
              onCheckedChange={(checked) => onUpdateFormData({ isRenovation: checked })}
            />
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("result.costBreakdown")}
            </p>
            {calculation.groupedLineItems.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {group.header}
                </p>
                {group.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center">
                      {item.label}
                      <Info
                        size={11}
                        className="ml-1 text-muted-foreground/50 cursor-pointer hover:text-foreground transition-colors"
                      />
                    </span>
                    <span className="font-medium tabular-nums">
                      €{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <p className="text-[10px] text-muted-foreground pt-2 italic">
              {t("result.disclaimer")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
