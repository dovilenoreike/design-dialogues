import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditItem as AuditItemType, AuditResponse, AuditVariables } from "@/types/layout-audit";
import { useLanguage } from "@/contexts/LanguageContext";

interface AuditItemProps {
  item: AuditItemType;
  response?: AuditResponse;
  variables: AuditVariables;
  onResponse: (response: AuditResponse | undefined) => void;
}

export const AuditItem = ({ item, response, variables, onResponse }: AuditItemProps) => {
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);

  // Get the question text with variable interpolation
  const getQuestionText = () => {
    let text = t(item.questionKey);

    // Replace {value} placeholder with calculated value if present
    if (item.calculateValue) {
      let value = item.calculateValue(variables);

      // Special handling for laundry setup - translate the setup type
      if (item.id === "bathroom-laundry") {
        const laundryKey = `audit.item.bathroom.laundry${value.charAt(0).toUpperCase() + value.slice(1)}`;
        value = t(laundryKey);
      }

      text = text.replace("{value}", value);
    }

    return text;
  };

  // Segmented control segment classes
  const getSegmentClasses = (buttonType: AuditResponse) => {
    const isSelected = response === buttonType;
    const baseClasses = "flex-1 py-1.5 text-xs font-medium transition-all touch-manipulation";

    if (buttonType === "pass") {
      return cn(
        baseClasses,
        "rounded-l-full",
        isSelected
          ? "bg-neutral-900 text-white"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    if (buttonType === "fail") {
      return cn(
        baseClasses,
        isSelected
          ? "bg-[#9A3412]/10 text-[#9A3412]"
          : "text-neutral-500 hover:text-neutral-700"
      );
    }

    // unknown
    return cn(
      baseClasses,
      "rounded-r-full",
      isSelected
        ? "bg-neutral-200 text-neutral-700"
        : "text-neutral-500 hover:text-neutral-700"
    );
  };

  // N/A selected state - show muted question with undo option
  if (response === "na") {
    return (
      <div className="flex items-start gap-3 py-3 opacity-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground leading-relaxed line-through">
            {getQuestionText()}
          </p>
        </div>
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
    );
  }

  // Normal state - show question with segmented control
  return (
    <div className="flex items-start gap-3 py-3">
      {/* Question text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">{getQuestionText()}</p>

        {/* Tooltip on fail */}
        {response === "fail" && (
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="mt-1.5 flex items-center gap-1 text-xs text-[#9A3412] hover:text-[#9A3412]/80"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{t("audit.whyItMatters")}</span>
          </button>
        )}

        {response === "fail" && showTooltip && (
          <div className="mt-2 p-2.5 bg-[#9A3412]/5 rounded-lg">
            <p className="text-xs text-[#9A3412] leading-relaxed">{t(item.tooltipKey)}</p>
          </div>
        )}

        {/* "Not relevant" link */}
        <button
          onClick={() => onResponse("na")}
          className="mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("audit.notRelevant")}
        </button>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center bg-neutral-100 rounded-full shrink-0 min-w-[120px]">
        <button
          onClick={() => onResponse("pass")}
          className={getSegmentClasses("pass")}
          aria-label="Yes"
        >
          {t("audit.yes")}
        </button>
        <button
          onClick={() => onResponse("fail")}
          className={getSegmentClasses("fail")}
          aria-label="No"
        >
          {t("audit.no")}
        </button>
        <button
          onClick={() => onResponse("unknown")}
          className={getSegmentClasses("unknown")}
          aria-label="Unknown"
        >
          ?
        </button>
      </div>
    </div>
  );
};
