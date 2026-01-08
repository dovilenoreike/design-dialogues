import type { TimelinePhase } from "@/types/timeline";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelinePhaseCardProps {
  phase: TimelinePhase;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TimelinePhaseCard = ({
  phase,
  isFirst,
  isLast
}: TimelinePhaseCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-foreground border-2 border-background" />

      {/* Unified White Card */}
      <div className="bg-white border border-ds-border-default rounded-xl p-4 md:p-5">
        <div className="space-y-3">
          {/* Line 1: Date Range */}
          <p className="text-base font-serif font-bold text-foreground">
            {phase.dateRange}
          </p>

          {/* Line 2: Phase Name */}
          <p className="text-xs uppercase tracking-wide text-text-muted font-medium">
            {phase.title}
          </p>

          {/* Line 3: Site Status (no label) */}
          <p className="text-sm text-text-secondary">
            {phase.siteStatus}
          </p>

          {/* Line 4: Action Buttons (no label) */}
          <div className="flex flex-wrap gap-2 pt-1">
            {phase.tasks.map(task => (
              <button
                key={task.id}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  touch-manipulation active:scale-95
                  ${task.buttonVariant === "solid"
                    ? "bg-foreground text-background hover:opacity-90"
                    : "border border-ds-border-default text-foreground hover:bg-neutral-50"
                  }
                `}
              >
                {task.isCritical && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
                )}
                {task.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
