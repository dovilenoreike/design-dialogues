import { ChevronRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuditSummary } from "../thread/summaries/AuditSummary";
import { AuditPlaceholder } from "../thread/placeholders/AuditPlaceholder";
import { calculateAuditScore } from "@/data/layout-audit-rules";

export default function HomeAuditSection() {
  const { layoutAuditResponses, layoutAuditVariables, setActiveTab } = useDesign();
  const { t } = useLanguage();

  const score = calculateAuditScore(layoutAuditResponses, layoutAuditVariables);

  return (
    <section className="px-4 py-5">
      <button
        onClick={() => setActiveTab("plan")}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("home.audit")}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        {score !== null ? (
          <AuditSummary />
        ) : (
          <div>
            <AuditPlaceholder />
            <p className="text-xs text-muted-foreground mt-1">
              {t("home.startAudit")}
            </p>
          </div>
        )}
      </button>
    </section>
  );
}
