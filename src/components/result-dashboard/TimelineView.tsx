import { useMemo, useState } from "react";
import { format, addMonths } from "date-fns";
import type { Tier } from "@/config/tiers";
import type { ServiceSelection } from "@/types/calculator";
import { calculateTimeline, calculatePhaseStates } from "./timeline-utils";
import { TimelinePhaseCard } from "./TimelinePhaseCard";
import { MoveInDateCard } from "./MoveInDateCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineViewProps {
  selectedTier: Tier;
  isRenovation: boolean;
  services: ServiceSelection;
}

const TimelineView = ({
  selectedTier,
  isRenovation,
  services
}: TimelineViewProps) => {
  const { t } = useLanguage();

  // Initialize move-in date to 3 months from today
  const [moveInDate, setMoveInDate] = useState<Date>(() => {
    const today = new Date();
    return addMonths(today, 3);
  });

  const timeline = useMemo(
    () => calculateTimeline(selectedTier, isRenovation, services, t, { moveInDate }),
    [selectedTier, isRenovation, services, t, moveInDate]
  );

  // Calculate phase states based on current date
  const stateMap = useMemo(
    () => calculatePhaseStates(timeline.phases, timeline.startDate),
    [timeline.phases, timeline.startDate]
  );

  // Check if ANY phase is overdue (for move-in date warning)
  const hasOverdueTasks = Array.from(stateMap.values()).some(state => {
    // A phase is overdue if it's urgent but NOT active (passed its end date)
    return state.isUrgent && !state.isActive;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-serif text-foreground">
          {t("timeline.title").replace("{weeks}", String(timeline.totalWeeks))}
        </h3>
        <p className="text-sm text-text-muted mt-2">
          {t("timeline.subtitle").replace(
            "{date}",
            format(timeline.startDate, "MMMM d, yyyy")
          )}
        </p>
      </div>

      {/* Timeline Phases */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-ds-border-default" />

        {/* Phase cards */}
        <div className="space-y-6 pl-6">
          {timeline.phases.map((phase, index) => (
            <TimelinePhaseCard
              key={phase.id}
              phase={phase}
              isFirst={index === 0}
              isLast={index === timeline.phases.length - 1}
              phaseState={stateMap.get(phase.id)}
            />
          ))}

          {/* Move-in date milestone */}
          <MoveInDateCard
            moveInDate={moveInDate}
            onDateChange={setMoveInDate}
            hasConflicts={hasOverdueTasks}
            minDate={new Date()}
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
