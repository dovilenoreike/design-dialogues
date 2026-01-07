import { useMemo } from "react";
import { format } from "date-fns";
import type { Tier } from "@/config/tiers";
import type { ServiceSelection } from "@/types/calculator";
import { calculateTimeline } from "./timeline-utils";
import { TimelinePhaseCard } from "./TimelinePhaseCard";
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

  const timeline = useMemo(
    () => calculateTimeline(selectedTier, isRenovation, services, t),
    [selectedTier, isRenovation, services, t]
  );

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
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
