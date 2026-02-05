import { cn } from "@/lib/utils";
import type { AuditItem as AuditItemType, AuditResponse, AuditVariables } from "@/types/layout-audit";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";

interface AuditItemProps {
  item: AuditItemType;
  response?: AuditResponse;
  variables: AuditVariables;
  onResponse: (response: AuditResponse | undefined) => void;
}

export const AuditItem = ({ item, response, variables, onResponse }: AuditItemProps) => {
  const { t } = useLanguage();

  // Get the label text
  const getLabelText = () => {
    return t(item.labelKey);
  };

  // Get threshold values for measurable items
  const getThresholds = () => {
    if (item.type === 'measurable' && item.thresholds) {
      return item.thresholds(variables);
    }
    return null;
  };

  // Handle button click - toggle if already selected
  const handleResponseClick = (buttonType: AuditResponse) => {
    if (response === buttonType) {
      // Clicking selected button unchecks it (becomes unknown)
      onResponse(undefined);
    } else {
      onResponse(buttonType);
    }
  };

  // Get functional tag for current response
  const getFunctionalTag = () => {
    if (!response || !item.functionalTags) return null;
    const tagKey = item.functionalTags[response as keyof typeof item.functionalTags];
    return tagKey ? t(tagKey) : null;
  };

  // Get tag color based on response
  const getTagColor = () => {
    if (response === 'underbuilt' || response === 'no') {
      return 'text-[#9A3412]';
    }
    if (response === 'minimal') {
      return 'text-[#CA8A04]';
    }
    if (response === 'optimal' || response === 'yes') {
      return 'text-[#647D75]';
    }
    return 'text-muted-foreground';
  };

  // Segment button classes for measurable items (3 buttons)
  const getMeasurableSegmentClasses = (buttonType: AuditResponse, position: 'first' | 'middle' | 'last') => {
    const isSelected = response === buttonType;
    const baseClasses = "flex-1 py-2 px-3 text-xs font-medium transition-all touch-manipulation text-center";
    const roundedClasses = position === 'first' ? 'rounded-l-full' : position === 'last' ? 'rounded-r-full' : '';

    if (buttonType === "underbuilt") {
      return cn(
        baseClasses,
        roundedClasses,
        isSelected
          ? "bg-[#9A3412]/10 text-[#9A3412]"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    if (buttonType === "minimal") {
      return cn(
        baseClasses,
        roundedClasses,
        isSelected
          ? "bg-[#CA8A04]/10 text-[#CA8A04]"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    if (buttonType === "optimal") {
      return cn(
        baseClasses,
        roundedClasses,
        isSelected
          ? "bg-[#647D75]/10 text-[#647D75]"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    return cn(baseClasses, roundedClasses, "text-neutral-500 hover:text-neutral-700");
  };

  // Segment button classes for boolean items (2 buttons)
  const getBooleanSegmentClasses = (buttonType: AuditResponse, position: 'first' | 'last') => {
    const isSelected = response === buttonType;
    const baseClasses = "flex-1 py-2 px-4 text-xs font-medium transition-all touch-manipulation text-center";
    const roundedClasses = position === 'first' ? 'rounded-l-full' : 'rounded-r-full';

    if (buttonType === "no") {
      return cn(
        baseClasses,
        roundedClasses,
        isSelected
          ? "bg-[#9A3412]/10 text-[#9A3412]"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    if (buttonType === "yes") {
      return cn(
        baseClasses,
        roundedClasses,
        isSelected
          ? "bg-[#647D75]/10 text-[#647D75]"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    return cn(baseClasses, roundedClasses, "text-neutral-500 hover:text-neutral-700");
  };

  // Format threshold value with unit
  const formatThreshold = (value: number, unit?: string) => {
    if (unit === 'seats' || unit === 'units') {
      return `${value}`;
    }
    return `${value}${unit || ''}`;
  };

  // N/A selected state - show muted label with undo option
  if (response === "na") {
    return (
      <div className="flex flex-col gap-2 py-5 opacity-50">
        {/* Top row: Title and undo */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground leading-relaxed line-through">
            {getLabelText()}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">N/A</span>
            <button
              onClick={() => onResponse(undefined)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("audit.undo")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const thresholds = getThresholds();
  const functionalTag = getFunctionalTag();

  // Render measurable item with value-based buttons
  if (item.type === 'measurable' && thresholds) {
    return (
      <div className="flex flex-col gap-3 py-5">
        {/* Top row: Title and X button */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-foreground leading-relaxed">{getLabelText()}</p>
          <button
            onClick={() => onResponse("na")}
            className="shrink-0 p-1 -mt-1 -mr-1 text-neutral-300 hover:text-neutral-500 transition-colors"
            aria-label={t("audit.notRelevant")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Middle row: Value-based segmented control */}
        <div className="flex items-center bg-neutral-100 rounded-full w-full max-w-sm">
          <button
            onClick={() => handleResponseClick("underbuilt")}
            className={getMeasurableSegmentClasses("underbuilt", "first")}
            aria-label={`Less than ${formatThreshold(thresholds.minimal, item.unit)}`}
          >
            &lt; {formatThreshold(thresholds.minimal, item.unit)}
          </button>
          <button
            onClick={() => handleResponseClick("minimal")}
            className={getMeasurableSegmentClasses("minimal", "middle")}
            aria-label={`${formatThreshold(thresholds.minimal, item.unit)} or more`}
          >
            {formatThreshold(thresholds.minimal, item.unit)}+
          </button>
          <button
            onClick={() => handleResponseClick("optimal")}
            className={getMeasurableSegmentClasses("optimal", "last")}
            aria-label={`${formatThreshold(thresholds.optimal, item.unit)} or more`}
          >
            {formatThreshold(thresholds.optimal, item.unit)}+
          </button>
        </div>

        {/* Bottom row: Functional tag (status text) */}
        {functionalTag && (
          <p className={cn("text-xs leading-relaxed", getTagColor())}>
            {functionalTag}
          </p>
        )}
      </div>
    );
  }

  // Render boolean item with Yes/No buttons
  return (
    <div className="flex flex-col gap-3 py-5">
      {/* Top row: Title and X button */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground leading-relaxed">{getLabelText()}</p>
        <button
          onClick={() => onResponse("na")}
          className="shrink-0 p-1 -mt-1 -mr-1 text-neutral-300 hover:text-neutral-500 transition-colors"
          aria-label={t("audit.notRelevant")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Middle row: Yes/No segmented control */}
      <div className="flex items-center bg-neutral-100 rounded-full w-full max-w-sm">
        <button
          onClick={() => handleResponseClick("no")}
          className={getBooleanSegmentClasses("no", "first")}
          aria-label={t("audit.no")}
        >
          {t("audit.no")}
        </button>
        <button
          onClick={() => handleResponseClick("yes")}
          className={getBooleanSegmentClasses("yes", "last")}
          aria-label={t("audit.yes")}
        >
          {t("audit.yes")}
        </button>
      </div>

      {/* Bottom row: Functional tag (status text) */}
      {functionalTag && (
        <p className={cn("text-xs leading-relaxed", getTagColor())}>
          {functionalTag}
        </p>
      )}
    </div>
  );
};
