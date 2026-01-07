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

      {/* Card content */}
      <div className="bg-surface-secondary border border-ds-border-default rounded-xl p-4 md:p-5">
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:grid md:grid-cols-[180px_1fr_1fr] md:gap-6 md:items-start">
          {/* Date */}
          <div>
            <p className="text-sm font-serif font-semibold text-foreground">
              {phase.dateRange}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {phase.title}
            </p>
          </div>

          {/* Site Status */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              {t("timeline.labels.onSite")}
            </p>
            <p className="text-sm text-text-secondary">
              {phase.siteStatus}
            </p>
          </div>

          {/* Tasks */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              {t("timeline.labels.myTasks")}
            </p>
            <div className="flex flex-wrap gap-2">
              {phase.tasks.map(task => (
                <button
                  key={task.id}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    touch-manipulation active:scale-95
                    ${task.buttonVariant === "solid"
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-foreground text-foreground hover:bg-secondary"
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

        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-4">
          {/* Date + Title */}
          <div>
            <p className="text-sm font-serif font-semibold text-foreground">
              {phase.dateRange}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {phase.title}
            </p>
          </div>

          {/* Site Status */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              {t("timeline.labels.onSite")}
            </p>
            <p className="text-sm text-text-secondary">
              {phase.siteStatus}
            </p>
          </div>

          {/* Tasks */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              {t("timeline.labels.myTasks")}
            </p>
            <div className="flex flex-wrap gap-2">
              {phase.tasks.map(task => (
                <button
                  key={task.id}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    touch-manipulation active:scale-95
                    ${task.buttonVariant === "solid"
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-foreground text-foreground hover:bg-secondary"
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
    </div>
  );
};
