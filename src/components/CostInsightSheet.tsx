/**
 * CostInsightSheet - Modal/Sheet showing detailed cost category insights
 */

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, AlertTriangle, Clock, X } from "lucide-react";
import { getCategoryInsight, tierConfig } from "@/data/cost-insights";
import { useLanguage } from "@/contexts/LanguageContext";

/** Maps insightKey to the cost.* translation key for the header */
const insightKeyToCostKey: Record<string, string> = {
  "Interior Design": "cost.interiorDesign",
  "Construction & Finish": "cost.constructionFinish",
  "Materials": "cost.materials",
  "Kitchen": "cost.kitchen",
  "Wardrobes": "cost.wardrobes",
  "Appliances": "cost.appliances",
  "Furniture": "cost.furniture",
  "Prep Work": "cost.prepWork",
};

interface CostInsightSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  tier: "budget" | "standard" | "premium";
}

export const CostInsightSheet = ({ isOpen, onClose, category, tier }: CostInsightSheetProps) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const insight = getCategoryInsight(t, category);

  if (!insight) return null;

  const tierContent = insight[tier];
  const tierCfg = tierConfig[tier];

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-serif text-2xl text-text-primary">{t(insightKeyToCostKey[category] ?? category)}</h2>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${tierCfg.className}`}>
            {t(tierCfg.labelKey)}
          </span>
        </div>
        {!isMobile && (
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Definition */}
      <p className="text-text-tertiary text-sm leading-relaxed">{insight.definition}</p>

      {/* Durability Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-sunken rounded-full text-xs font-medium text-text-secondary">
        <Clock size={12} />
        <span>{t("insights.lifespan")}: {tierContent.lifespan}</span>
      </div>

      {/* Strategy Blocks */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Save Block */}
        <div className="bg-surface-muted border border-ds-border-default rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-text-primary" />
            <span className="font-bold text-[10px] uppercase tracking-widest text-text-primary">{tierContent.save.title}</span>
          </div>
          <ul className="space-y-2">
            {tierContent.save.items.map((item, idx) => (
              <li key={idx} className="text-text-secondary text-sm leading-relaxed">
                — {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Block */}
        <div className="bg-surface-sunken border border-ds-border-default rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-text-primary" />
            <span className="font-bold text-[10px] uppercase tracking-widest text-text-primary">{tierContent.risk.title}</span>
          </div>
          <ul className="space-y-2">
            {tierContent.risk.items.map((item, idx) => (
              <li key={idx} className="text-text-secondary text-sm leading-relaxed">
                — {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 pt-6" aria-describedby={undefined}>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 gap-0" hideCloseButton aria-describedby={undefined}>
        {content}
      </DialogContent>
    </Dialog>
  );
};
