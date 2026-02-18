import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ThreadNode } from "./ThreadNode";
import { useDesign, BottomTab } from "@/contexts/DesignContext";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

interface ThreadSectionProps {
  title: string;
  ctaText: string;
  placeholder?: ReactNode;
  targetTab: BottomTab;
  completed: boolean;
  active?: boolean;
  isLast?: boolean;
  children?: ReactNode;
}

export function ThreadSection({
  title,
  ctaText,
  placeholder,
  targetTab,
  completed,
  active = false,
  isLast = false,
  children,
}: ThreadSectionProps) {
  const { setActiveTab } = useDesign();

  const handleClick = () => {
    trackEvent(AnalyticsEvents.THREAD_SECTION_CLICKED, {
      section: title,
      target_tab: targetTab,
      tab: "thread",
    });
    setActiveTab(targetTab);
  };

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border" />
      )}

      {/* Node */}
      <div className="absolute left-0 top-0.5 -translate-x-1/2 z-10">
        <ThreadNode completed={completed} active={active} />
      </div>

      {/* Content - entire section is clickable */}
      <button
        onClick={handleClick}
        className="w-full pb-12 text-left group"
      >
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-3">
          {title}
        </h2>

        {completed && children ? (
          children
        ) : (
          <div>
            <span className="flex items-center gap-2 mb-3">
              <span className="font-serif text-neutral-900">
                {ctaText}
              </span>
              <ArrowRight
                className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors"
                strokeWidth={1}
              />
            </span>
            {placeholder && (
              <div className="mt-2">
                {placeholder}
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
