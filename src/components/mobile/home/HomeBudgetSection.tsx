import { ChevronRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BudgetSummary } from "../thread/summaries/BudgetSummary";
import { BudgetPlaceholder } from "../thread/placeholders/BudgetPlaceholder";

export default function HomeBudgetSection() {
  const { formData, setActiveTab } = useDesign();
  const { t } = useLanguage();

  return (
    <section className="px-4 py-5">
      <button
        onClick={() => setActiveTab("budget")}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("home.budget")}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {formData ? (
          <BudgetSummary />
        ) : (
          <div>
            <BudgetPlaceholder />
            <p className="text-xs text-muted-foreground mt-1">
              {t("home.configureBudget")}
            </p>
          </div>
        )}
      </button>
    </section>
  );
}
