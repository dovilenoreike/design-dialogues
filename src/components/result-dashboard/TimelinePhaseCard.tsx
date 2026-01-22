import { format } from "date-fns";
import { Search, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";
import type { TimelinePhase } from "@/types/timeline";
import type { TimelineTask } from "@/types/timeline";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Get contextual icon based on task type
const getTaskIcon = (task: TimelineTask) => {
  const id = task.id.toLowerCase();

  // Hire tasks - Search icon
  if (id.includes("hire") || id.includes("schedule")) {
    return Search;
  }

  // Order/Buy tasks - ShoppingBag icon
  if (id.includes("order") || id.includes("buy")) {
    return ShoppingBag;
  }

  // Approve/Check tasks - CheckCircle icon
  if (id.includes("approve") || id.includes("check") || id.includes("walkthrough")) {
    return CheckCircle;
  }

  // Default - ArrowRight
  return ArrowRight;
};

interface TimelinePhaseCardProps {
  phase: TimelinePhase;
  isFirst?: boolean;
  isLast?: boolean;
  phaseState?: { isActive: boolean; isUrgent: boolean };
  completedTasks?: Set<string>;
  onToggleTask?: (taskId: string) => void;
}

export const TimelinePhaseCard = ({
  phase,
  isFirst,
  isLast,
  phaseState,
  completedTasks,
  onToggleTask
}: TimelinePhaseCardProps) => {
  const { t, dateLocale } = useLanguage();

  // Check if all tasks in this phase are completed
  const allTasksCompleted = phase.tasks.length > 0 &&
    phase.tasks.every(task => completedTasks?.has(task.id));

  // Determine card state
  const isOverdue = phaseState?.isUrgent && !phaseState?.isActive && !allTasksCompleted;
  const isHistory = phaseState?.isUrgent && !phaseState?.isActive && allTasksCompleted;
  const isCurrent = phaseState?.isActive;
  const isFuture = !phaseState?.isActive && !phaseState?.isUrgent;

  // Card container classes based on state
  const cardClasses = cn(
    "bg-white rounded-xl p-4 md:p-5",
    isOverdue && "border border-ds-border-default border-l-4 border-l-[#9A3412]",
    isHistory && "border border-ds-border-default opacity-60",
    isCurrent && "border border-foreground/30 shadow-lg",
    isFuture && "border border-dashed border-ds-border-default opacity-80"
  );

  // Timeline dot classes based on state (aligned with date row center)
  const dotClasses = cn(
    "absolute -left-8 top-7 rounded-full",
    isOverdue && "w-3 h-3 bg-[#9A3412] border-2 border-background",
    isHistory && "w-3 h-3 bg-muted-foreground border-2 border-background",
    isCurrent && "w-3.5 h-3.5 bg-foreground ring-4 ring-foreground/10 border-2 border-background",
    isFuture && "w-3 h-3 bg-background border-2 border-muted-foreground"
  );

  const getTaskButtonStyle = (isTaskCompleted: boolean) => {
    // Completed task styling
    if (isTaskCompleted) {
      return "text-muted-foreground line-through opacity-50";
    }

    // Overdue phase - warm accent, lighter border
    if (isOverdue) {
      return "border border-[#9A3412]/30 text-[#9A3412] hover:bg-[#9A3412]/5";
    }

    // Current/Active phase - dark but thinner border
    if (isCurrent) {
      return "border border-neutral-400 text-neutral-800 hover:bg-neutral-50";
    }

    // Future/History - subtle but readable
    return "border border-neutral-300 text-neutral-500 hover:bg-neutral-50";
  };

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className={dotClasses} />

      {/* Phase Card */}
      <div className={cardClasses}>
        <div className="space-y-2">
          {/* Line 1: Phase Name - Chapter Title */}
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            {phase.title}
          </p>

          {/* Line 2: Date Range - Magazine Style */}
          <p className="font-serif text-foreground">
            <span className="text-[10px] uppercase tracking-wide">{format(phase.startDate, "MMM", { locale: dateLocale })}</span>
            <span className="text-lg font-bold"> {format(phase.startDate, "dd")}</span>
            <span className="text-muted-foreground mx-1.5">–</span>
            <span className="text-[10px] uppercase tracking-wide">{format(phase.endDate, "MMM", { locale: dateLocale })}</span>
            <span className="text-lg font-bold"> {format(phase.endDate, "dd")}</span>
          </p>

          {/* Line 3: Site Status */}
          <p className="text-sm text-text-secondary">
            {phase.siteStatus}
          </p>

          {/* Line 4: Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-3">
            {phase.tasks.map(task => {
              const isCompleted = completedTasks?.has(task.id) ?? false;
              const TaskIcon = getTaskIcon(task);
              return (
                <button
                  key={task.id}
                  onClick={() => onToggleTask?.(task.id)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1 rounded text-[10px] uppercase tracking-widest font-medium transition-all
                    touch-manipulation active:scale-95
                    ${getTaskButtonStyle(isCompleted)}
                  `}
                >
                  {isCompleted ? (
                    <span>✓</span>
                  ) : (
                    <TaskIcon className="w-3 h-3 opacity-60" strokeWidth={1.5} />
                  )}
                  <span>{task.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
