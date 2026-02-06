import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateAuditScore, auditCategories, calculateCategoryScore, getAllItemIds } from "@/data/layout-audit-rules";
import { cn } from "@/lib/utils";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";

/**
 * Get score level based on value AND worst category performance
 */
const getScoreLevel = (
  score: number | null,
  responses: Record<string, AuditResponse>,
  variables: AuditVariables
): "green" | "amber" | "red" | null => {
  if (score === null) return null;

  const categoryScores = auditCategories
    .filter(cat => !cat.showIf || cat.showIf(variables))
    .map(cat => calculateCategoryScore(cat.id, responses, variables))
    .filter((s): s is number => s !== null);

  const worstCategoryScore = categoryScores.length > 0
    ? Math.min(...categoryScores)
    : score;

  const hasRedCategory = worstCategoryScore < 50;
  const hasAmberCategory = worstCategoryScore < 80;

  if (score >= 80 && !hasAmberCategory) return "green";
  if (score >= 50 && !hasRedCategory) return "amber";
  if (hasRedCategory) return "red";
  return "amber";
};

const getScoreColor = (level: "green" | "amber" | "red" | null) => {
  if (level === "green") return "text-[#647d75]";
  if (level === "amber") return "text-[#CA8A04]";
  if (level === "red") return "text-[#9A3412]";
  return "text-neutral-500";
};

const getStatusText = (level: "green" | "amber" | "red" | null, t: (key: string) => string) => {
  if (level === "green") return t("audit.conclusion.green");
  if (level === "amber") return t("audit.conclusion.amber");
  if (level === "red") return t("audit.conclusion.red");
  return "";
};

export function AuditSummary() {
  const { layoutAuditResponses, layoutAuditVariables } = useDesign();
  const { t } = useLanguage();

  const score = calculateAuditScore(layoutAuditResponses, layoutAuditVariables);
  const level = getScoreLevel(score, layoutAuditResponses, layoutAuditVariables);

  // Calculate progress percentage
  const allItemIds = getAllItemIds(layoutAuditVariables);
  const total = allItemIds.length;
  const answered = allItemIds.filter(
    (id) => layoutAuditResponses[id] !== undefined
  ).length;
  const progressPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  if (score === null) return null;

  return (
    <div className="flex items-center gap-3">
      <span className={cn(
        "text-3xl font-serif font-bold tabular-nums",
        getScoreColor(level)
      )}>
        {score}
      </span>
      <div>
        <p className={cn(
          "text-sm font-medium",
          getScoreColor(level)
        )}>
          {getStatusText(level, t)}
        </p>
        <p className="text-xs text-neutral-500">
          {t("thread.assessment")}: {progressPercent}%
        </p>
      </div>
    </div>
  );
}
