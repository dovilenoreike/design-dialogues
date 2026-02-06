import { useState } from "react";
import { User, Baby, Home, Minus, Plus, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { auditCategories, calculateAuditScore, calculateCategoryScore, getAllItemIds, getCategoryStats } from "@/data/layout-audit-rules";
import { AuditCategory } from "./AuditCategory";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AuditResponse, AuditVariables } from "@/types/layout-audit";

/**
 * Calculate progress stats (answered / total)
 */
const getProgressStats = (responses: Record<string, string>, variables: AuditVariables) => {
  const allItemIds = getAllItemIds(variables);
  const total = allItemIds.length;
  const answered = allItemIds.filter(
    (id) => responses[id] === "underbuilt" || responses[id] === "minimal" || responses[id] === "optimal" ||
            responses[id] === "yes" || responses[id] === "no" || responses[id] === "unknown" || responses[id] === "na"
  ).length;
  return { answered, total };
};

/**
 * Get score color based on value AND worst category performance
 * Uses "weakest link" principle - color is capped by the worst category
 * Returns: "green" | "amber" | "red" | null
 */
const getScoreLevel = (
  score: number | null,
  responses: Record<string, AuditResponse>,
  variables: AuditVariables
): "green" | "amber" | "red" | null => {
  if (score === null) return null;

  // Calculate worst category score with proper weights
  const categoryScores = auditCategories
    .filter(cat => !cat.showIf || cat.showIf(variables))
    .map(cat => calculateCategoryScore(cat.id, responses, variables))
    .filter((s): s is number => s !== null);

  const worstCategoryScore = categoryScores.length > 0
    ? Math.min(...categoryScores)
    : score;

  // Determine max allowed color based on worst category
  const hasRedCategory = worstCategoryScore < 50;
  const hasAmberCategory = worstCategoryScore < 80;

  // Apply color with capping
  if (score >= 80 && !hasAmberCategory) return "green";
  if (score >= 50 && !hasRedCategory) return "amber";
  if (hasRedCategory) return "red";
  return "amber"; // fallback
};

/**
 * Get score color class based on level
 */
const getScoreColor = (
  score: number | null,
  responses: Record<string, AuditResponse>,
  variables: AuditVariables
) => {
  const level = getScoreLevel(score, responses, variables);
  if (level === "green") return "text-[#647d75]";
  if (level === "amber") return "text-[#CA8A04]";
  if (level === "red") return "text-[#9A3412]";
  return "text-muted-foreground";
};

/**
 * Generate contextual summary text based on audit responses
 * Returns headline (status) + detail (focus area or progress)
 * Shows the category with the lowest score (explains the color/conclusion)
 */
const generateSummary = (
  responses: Record<string, AuditResponse>,
  variables: AuditVariables,
  t: (key: string) => string
): { headline: string; detail: string } => {
  const { answered, total } = getProgressStats(responses, variables);

  // Not started
  if (answered === 0) {
    return {
      headline: t("audit.summary.notStarted"),
      detail: t("audit.summary.notStartedDetail")
    };
  }

  // Calculate score for each category and find the one with lowest score
  const categoryScores = auditCategories
    .filter(cat => !cat.showIf || cat.showIf(variables)) // Only visible categories
    .map(cat => {
      const stats = getCategoryStats(cat.id, responses, variables);
      const score = calculateCategoryScore(cat.id, responses, variables);
      return {
        id: cat.id,
        title: t(cat.titleKey),
        score,
        hasFails: stats.fail > 0,
      };
    })
    .filter(cat => cat.score !== null && cat.hasFails) // Only categories with answers and failures
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100)); // Sort by lowest score first

  // Generate contextual message
  if (categoryScores.length === 0) {
    // No failures - all passes or unknowns
    if (answered === total) {
      return {
        headline: t("audit.summary.excellent"),
        detail: t("audit.summary.noIssues")
      };
    }

    // Still in progress, no failures yet
    return {
      headline: t("audit.summary.excellent"),
      detail: t("audit.summary.progressDetail")
        .replace("{answered}", String(answered))
        .replace("{total}", String(total))
    };
  }

  // Has failures - show category with lowest score
  const worstCategory = categoryScores[0];
  return {
    headline: t("audit.summary.needsAttention"),
    detail: t("audit.summary.focusCategory")
      .replace("{category}", worstCategory.title)
  };
};

/**
 * Compact widget showing audit score and progress
 * Opens the full checklist drawer when clicked
 */
export const AuditScoreWidget = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    layoutAuditResponses,
    layoutAuditVariables,
    setLayoutAuditResponse,
    setLayoutAuditAdults,
    setLayoutAuditChildren,
    setLayoutAuditWorkFromHome,
  } = useDesign();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const score = calculateAuditScore(layoutAuditResponses, layoutAuditVariables);
  const { answered, total } = getProgressStats(layoutAuditResponses, layoutAuditVariables);
  const summary = generateSummary(layoutAuditResponses, layoutAuditVariables, t);

  // Determine button text based on progress
  const getButtonText = () => {
    if (answered === 0) return t("audit.startAudit");
    if (answered === total) return t("audit.reviewAudit");
    return t("audit.continueAudit");
  };

  // Increment/decrement adults count
  const handleAdultsChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, layoutAuditVariables.numberOfAdults + delta));
    setLayoutAuditAdults(newCount);
  };

  // Increment/decrement children count
  const handleChildrenChange = (delta: number) => {
    const newCount = Math.max(0, Math.min(10, layoutAuditVariables.numberOfChildren + delta));
    setLayoutAuditChildren(newCount);
  };

  // Shared checklist content
  const checklistContent = (
    <div className={isMobile ? "overflow-y-auto px-4 pb-6" : "overflow-y-auto pb-6"}>
      {/* Score Header */}
      <div className="flex items-center gap-4 mb-6">
        <span className={cn(
          "text-5xl font-serif font-bold tabular-nums leading-none",
          getScoreColor(score, layoutAuditResponses, layoutAuditVariables)
        )}>
          {score !== null ? score : "—"}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-neutral-400">
            {t("audit.layoutHealth")}
          </span>
          {score !== null && (
            <span className={cn(
              "text-[10px] uppercase tracking-[0.1em] font-bold mt-0.5",
              getScoreColor(score, layoutAuditResponses, layoutAuditVariables)
            )}>
              {getScoreLevel(score, layoutAuditResponses, layoutAuditVariables) === "green" && t("audit.conclusion.green")}
              {getScoreLevel(score, layoutAuditResponses, layoutAuditVariables) === "amber" && t("audit.conclusion.amber")}
              {getScoreLevel(score, layoutAuditResponses, layoutAuditVariables) === "red" && t("audit.conclusion.red")}
            </span>
          )}
        </div>
      </div>

      {/* Household Settings - Row with Adults + Children + WFH */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Adults Stepper Pill */}
        <div className="flex items-center gap-1 bg-neutral-100 rounded-full px-1 py-1">
          <button
            onClick={() => handleAdultsChange(-1)}
            disabled={layoutAuditVariables.numberOfAdults <= 1}
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <User className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-sm font-medium tabular-nums min-w-[1ch] text-center">
              {layoutAuditVariables.numberOfAdults}
            </span>
          </div>
          <button
            onClick={() => handleAdultsChange(1)}
            disabled={layoutAuditVariables.numberOfAdults >= 10}
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Children Stepper Pill */}
        <div className="flex items-center gap-1 bg-neutral-100 rounded-full px-1 py-1">
          <button
            onClick={() => handleChildrenChange(-1)}
            disabled={layoutAuditVariables.numberOfChildren <= 0}
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <Baby className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-sm font-medium tabular-nums min-w-[1ch] text-center">
              {layoutAuditVariables.numberOfChildren}
            </span>
          </div>
          <button
            onClick={() => handleChildrenChange(1)}
            disabled={layoutAuditVariables.numberOfChildren >= 10}
            className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Work from Home Chip */}
        <button
          onClick={() => setLayoutAuditWorkFromHome(!layoutAuditVariables.workFromHome)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            layoutAuditVariables.workFromHome
              ? "bg-neutral-900 text-white"
              : "border border-neutral-200 text-neutral-500 hover:border-neutral-300"
          )}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t("audit.workFromHome")}</span>
        </button>
      </div>

      {/* Categories list */}
      <div className="space-y-3">
        {auditCategories.map((category, index) => (
          <AuditCategory
            key={category.id}
            category={category}
            responses={layoutAuditResponses}
            variables={layoutAuditVariables}
            onResponse={setLayoutAuditResponse}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Audit Summary Widget */}
      <div className="bg-neutral-50 rounded-2xl p-5 mb-6">
        {/* Score Header Row */}
        <div className="flex items-center gap-4 mb-4">
          <span className={cn(
            "text-5xl font-serif font-bold tabular-nums leading-none",
            getScoreColor(score, layoutAuditResponses, layoutAuditVariables)
          )}>
            {score !== null ? score : "—"}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-neutral-400">
              {t("audit.layoutHealth")}
            </span>
            {score !== null && (
              <span className={cn(
                "text-[10px] uppercase tracking-[0.1em] font-bold mt-0.5",
                getScoreColor(score, layoutAuditResponses, layoutAuditVariables)
              )}>
                {getScoreLevel(score, layoutAuditResponses, layoutAuditVariables) === "green" && t("audit.conclusion.green")}
                {getScoreLevel(score, layoutAuditResponses, layoutAuditVariables) === "amber" && t("audit.conclusion.amber")}
                {getScoreLevel(score, layoutAuditResponses, layoutAuditVariables) === "red" && t("audit.conclusion.red")}
              </span>
            )}
          </div>
        </div>

        {/* Details Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {summary.headline}
            </p>
            {summary.detail && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.detail}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
          >
            {getButtonText()}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Checklist - Drawer for mobile, Dialog for desktop */}
      {isMobile ? (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("audit.title")}</DrawerTitle>
              <DrawerDescription>{t("audit.subtitle")}</DrawerDescription>
            </DrawerHeader>
            {checklistContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DialogContent className="max-w-lg p-6 gap-0 max-h-[85vh] overflow-hidden flex flex-col" hideCloseButton aria-describedby={undefined}>
            <DialogHeader className="text-left pb-4 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle>{t("audit.title")}</DialogTitle>
                  <DialogDescription>{t("audit.subtitle")}</DialogDescription>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {checklistContent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

/**
 * Legacy export - full card component (for backwards compatibility)
 * Now redirects to the widget
 */
export const LayoutAuditCard = AuditScoreWidget;
