import { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditCategory as AuditCategoryType, AuditResponse, AuditVariables } from "@/types/layout-audit";
import { getCategoryStats } from "@/data/layout-audit-rules";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuditItem } from "./AuditItem";

/**
 * Calculate category score (pass / (pass + fail) * 100)
 */
const getCategoryScore = (stats: { pass: number; fail: number }): number | null => {
  const total = stats.pass + stats.fail;
  if (total === 0) return null;
  return Math.round((stats.pass / total) * 100);
};

/**
 * Get score color based on value
 */
const getScoreColor = (score: number | null) => {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-[#647d75]";
  if (score >= 50) return "text-[#CA8A04]";
  return "text-[#9A3412]";
};

interface AuditCategoryProps {
  category: AuditCategoryType;
  responses: Record<string, AuditResponse>;
  variables: AuditVariables;
  onResponse: (itemId: string, response: AuditResponse | undefined) => void;
  defaultExpanded?: boolean;
}

export const AuditCategory = ({
  category,
  responses,
  variables,
  onResponse,
  defaultExpanded = false,
}: AuditCategoryProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Don't render category if it has a showIf condition that returns false
  if (category.showIf && !category.showIf(variables)) {
    return null;
  }

  const stats = getCategoryStats(category.id, responses, variables);
  const answered = stats.pass + stats.fail + stats.unknown + stats.na;
  const categoryScore = getCategoryScore(stats);

  // Filter items based on showIf condition
  const visibleItems = category.items.filter(
    (item) => !item.showIf || item.showIf(variables)
  );

  // Don't render category if no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="border border-ds-border-default rounded-xl overflow-hidden bg-white">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse icon */}
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>

          {/* Category title */}
          <span className="font-medium text-sm">{t(category.titleKey)}</span>
        </div>

        {/* Score or stats */}
        <div className="flex items-center gap-2">
          {/* N/A indicator */}
          {stats.na > 0 && (
            <span className="flex items-center gap-0.5 text-neutral-400">
              <Minus className="w-3.5 h-3.5" />
              <span className="text-xs">{stats.na}</span>
            </span>
          )}

          {/* Unknown indicator */}
          {stats.unknown > 0 && (
            <span className="flex items-center gap-0.5 text-neutral-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="text-xs">{stats.unknown}</span>
            </span>
          )}

          {/* Score display */}
          {categoryScore !== null ? (
            <span className={cn("text-sm font-semibold tabular-nums", getScoreColor(categoryScore))}>
              {categoryScore}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{stats.total} items</span>
          )}
        </div>
      </button>

      {/* Importance message when collapsed and in red zone */}
      {!isExpanded && categoryScore !== null && categoryScore < 50 && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-[#9A3412]">
            {t(`audit.category.${category.id}.importance`)}
          </p>
        </div>
      )}

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-4 pb-2 border-t border-ds-border-default">
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(index < visibleItems.length - 1 && "border-b border-ds-border-default")}
            >
              <AuditItem
                item={item}
                response={responses[item.id]}
                variables={variables}
                onResponse={(response) => onResponse(item.id, response)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
