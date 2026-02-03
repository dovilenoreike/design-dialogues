import { useMemo } from "react";
import { format } from "date-fns";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateTimeline, calculatePhaseStates } from "@/components/result-dashboard/timeline-utils";
import { TimelinePhaseCard } from "@/components/result-dashboard/TimelinePhaseCard";
import { MoveInDateCard } from "@/components/result-dashboard/MoveInDateCard";
import { AuditScoreWidget } from "@/components/result-dashboard/LayoutAuditCard";
import type { ServiceSelection } from "@/types/calculator";

// Default values when no form data exists
const defaultServices: ServiceSelection = {
  spacePlanning: true,
  interiorFinishes: true,
  furnishingDecor: false,
};

export default function PlanView() {
  const { formData, selectedTier, userMoveInDate, setUserMoveInDate, completedTasks, toggleTask } = useDesign();
  const { t, dateLocale } = useLanguage();

  // Use formData if available, otherwise use defaults
  const isRenovation = formData?.isRenovation ?? false;
  const services = formData?.services ?? defaultServices;

  // Calculate timeline based on direction
  const timeline = useMemo(() => {
    if (userMoveInDate) {
      // User set date: backward calculation from move-in date
      return calculateTimeline(selectedTier, isRenovation, services, t, { moveInDate: userMoveInDate });
    }
    // Default: forward calculation from today
    return calculateTimeline(selectedTier, isRenovation, services, t, { startDate: new Date() });
  }, [selectedTier, isRenovation, services, t, userMoveInDate]);

  // The displayed move-in date (user-set or calculated)
  const displayedMoveInDate = userMoveInDate || timeline.endDate;

  // Subtitle text based on calculation direction, includes tier
  const translatedTier = t(`tier.${selectedTier.toLowerCase()}`);
  const subtitleText = userMoveInDate
    ? `${translatedTier} · ${t("timeline.subtitleFromMoveIn").replace("{date}", format(userMoveInDate, "MMMM d, yyyy", { locale: dateLocale }))}`
    : `${translatedTier} · ${t("timeline.subtitleFromToday")}`;

  // Calculate phase states based on current date
  const stateMap = useMemo(
    () => calculatePhaseStates(timeline.phases, timeline.startDate),
    [timeline.phases, timeline.startDate]
  );

  // Check if ANY phase is overdue with incomplete tasks
  const hasOverdueTasks = timeline.phases.some(phase => {
    const state = stateMap.get(phase.id);
    if (!state || !state.isUrgent || state.isActive) return false;

    // Phase is past due - check if it has any incomplete tasks
    const hasIncompleteTasks = phase.tasks.some(task => !completedTasks.has(task.id));
    return hasIncompleteTasks;
  });

  return (
    <div className="relative flex-1">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="px-4 py-6 pb-8">
        {/* Header */}
        <h3 className="text-2xl font-serif mb-2">
          {t("timeline.title").replace("{weeks}", String(timeline.totalWeeks))}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {subtitleText}
        </p>

        {/* Layout Audit Widget */}
        <AuditScoreWidget />

        {/* Timeline Phases */}
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border" />

          {/* Phase cards */}
          <div className="space-y-6 pl-8">
            {timeline.phases.map((phase, index) => (
              <TimelinePhaseCard
                key={phase.id}
                phase={phase}
                isFirst={index === 0}
                isLast={index === timeline.phases.length - 1}
                phaseState={stateMap.get(phase.id)}
                completedTasks={completedTasks}
                onToggleTask={toggleTask}
              />
            ))}

            {/* Move-in date milestone */}
            <MoveInDateCard
              moveInDate={displayedMoveInDate}
              onDateChange={setUserMoveInDate}
              hasConflicts={hasOverdueTasks}
              minDate={new Date()}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
