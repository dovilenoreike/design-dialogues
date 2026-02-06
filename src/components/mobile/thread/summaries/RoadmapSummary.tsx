import { useMemo } from "react";
import { format } from "date-fns";
import { Search, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";
import { useDesign } from "@/contexts/DesignContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateTimeline, calculatePhaseStates } from "@/components/result-dashboard/timeline-utils";
import type { ServiceSelection } from "@/types/calculator";
import type { TimelineTask } from "@/types/timeline";

const defaultServices: ServiceSelection = {
  spacePlanning: true,
  interiorFinishes: true,
  furnishingDecor: false,
};

// Get contextual icon based on task type
const getTaskIcon = (task: TimelineTask) => {
  const id = task.id.toLowerCase();

  if (id.includes("hire") || id.includes("schedule")) {
    return Search;
  }
  if (id.includes("order") || id.includes("buy")) {
    return ShoppingBag;
  }
  if (id.includes("approve") || id.includes("check") || id.includes("walkthrough")) {
    return CheckCircle;
  }
  return ArrowRight;
};

export function RoadmapSummary() {
  const { formData, selectedTier, userMoveInDate, completedTasks, toggleTask, setActiveTab } = useDesign();
  const { t, dateLocale } = useLanguage();

  const isRenovation = formData?.isRenovation ?? false;
  const services = formData?.services ?? defaultServices;

  const timeline = useMemo(() => {
    if (userMoveInDate) {
      return calculateTimeline(selectedTier, isRenovation, services, t, { moveInDate: userMoveInDate });
    }
    return calculateTimeline(selectedTier, isRenovation, services, t, { startDate: new Date() });
  }, [selectedTier, isRenovation, services, t, userMoveInDate]);

  const stateMap = useMemo(
    () => calculatePhaseStates(timeline.phases, timeline.startDate),
    [timeline.phases, timeline.startDate]
  );

  // Get overdue incomplete tasks (from past phases that are urgent but not active)
  const overdueTasks = useMemo(() => {
    return timeline.phases
      .filter(phase => {
        const state = stateMap.get(phase.id);
        return state?.isUrgent && !state?.isActive;
      })
      .flatMap(phase =>
        phase.tasks.filter(task => !completedTasks.has(task.id))
      );
  }, [timeline.phases, stateMap, completedTasks]);

  // Find the current/active phase
  const activePhase = timeline.phases.find(phase => {
    const state = stateMap.get(phase.id);
    return state?.isActive;
  }) || timeline.phases[0];

  // Get incomplete tasks from current phase
  const currentTasks = useMemo(() => {
    return activePhase?.tasks.filter(task => !completedTasks.has(task.id)) || [];
  }, [activePhase, completedTasks]);

  const displayDate = userMoveInDate || timeline.endDate;

  const handleTaskClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toggleTask(taskId);
    setActiveTab("plan");
  };

  const getTaskButtonStyle = (isOverdue: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return "text-muted-foreground line-through opacity-50";
    }
    if (isOverdue) {
      return "border border-[#9A3412]/30 text-[#9A3412] hover:bg-[#9A3412]/5";
    }
    return "border border-neutral-400 text-neutral-800 hover:bg-neutral-50";
  };

  const renderTaskButton = (task: TimelineTask, isOverdue: boolean) => {
    const isCompleted = completedTasks.has(task.id);
    const TaskIcon = getTaskIcon(task);

    return (
      <button
        key={task.id}
        onClick={(e) => handleTaskClick(e, task.id)}
        className={`
          inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium transition-all
          touch-manipulation active:scale-95
          ${getTaskButtonStyle(isOverdue, isCompleted)}
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
  };

  return (
    <div className="space-y-3">
      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#9A3412] font-medium mb-1.5">
            {t("thread.overdue")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {overdueTasks.map(task => renderTaskButton(task, true))}
          </div>
        </div>
      )}

      {/* Current phase section */}
      {currentTasks.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">
            {activePhase?.title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {currentTasks.map(task => renderTaskButton(task, false))}
          </div>
        </div>
      )}

      {/* Move-in date */}
      <p className="text-xs text-neutral-500">
        {t("timeline.moveIn.title")}: {format(displayDate, "MMM d, yyyy", { locale: dateLocale })}
      </p>
    </div>
  );
}
