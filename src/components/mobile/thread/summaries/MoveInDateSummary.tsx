import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Home, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MoveInDateSummaryProps {
  moveInDate: Date;
  hasConflicts: boolean;
}

export function MoveInDateSummary({ moveInDate, hasConflicts }: MoveInDateSummaryProps) {
  const { t, dateLocale } = useLanguage();

  return (
    <div className="space-y-2">
      {/* Icon and Date Display */}
      <div className="flex items-start gap-3">
        <Home className={`w-5 h-5 flex-shrink-0 mt-1 ${
          hasConflicts ? "text-[#9A3412]" : "text-[#647d75]"
        }`} />
        <div className="flex-1">
          <p className="text-xl font-serif font-bold text-foreground">
            {format(moveInDate, "MMMM dd, yyyy", { locale: dateLocale })}
          </p>
        </div>
      </div>

      {/* Label */}
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
        {t("timeline.moveIn.title")}
      </p>

      {/* Status Message */}
      <div
        className={`flex items-start gap-2 p-2.5 rounded-lg ${
          hasConflicts
            ? "bg-red-50 text-[#9A3412]"
            : "bg-[#647d75]/10 text-[#647d75]"
        }`}
      >
        {hasConflicts ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              {t("timeline.moveIn.warning")}
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              {t("timeline.moveIn.noConflicts")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
