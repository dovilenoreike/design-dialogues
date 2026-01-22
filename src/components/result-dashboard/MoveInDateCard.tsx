import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Home, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MoveInDateCardProps {
  moveInDate: Date | null;
  onDateChange: (date: Date) => void;
  hasConflicts: boolean;
  minDate: Date;
}

export const MoveInDateCard = ({
  moveInDate,
  onDateChange,
  hasConflicts,
  minDate,
}: MoveInDateCardProps) => {
  const { t, dateLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Timeline dot - color based on conflict state */}
      <div className={`absolute -left-8 top-2 w-3 h-3 rounded-full border-2 border-background ${
        hasConflicts ? "bg-[#9A3412]" : "bg-[#647d75]"
      }`} />

      {/* Card */}
      <div className="bg-white border border-ds-border-default rounded-xl p-4 md:p-5">
        <div className="space-y-3">
          {/* Icon and Date Display */}
          <div className="flex items-start gap-3">
            <Home className={`w-6 h-6 flex-shrink-0 mt-1 ${
              hasConflicts ? "text-[#9A3412]" : "text-[#647d75]"
            }`} />
            <div className="flex-1">
              {moveInDate ? (
                <p className="text-2xl font-serif font-bold text-foreground">
                  {format(moveInDate, "MMMM dd, yyyy", { locale: dateLocale })}
                </p>
              ) : (
                <p className="text-2xl font-serif font-bold text-text-muted">
                  {t("timeline.moveIn.notSet")}
                </p>
              )}
            </div>
          </div>

          {/* Label */}
          <p className="text-xs uppercase tracking-wide text-text-muted font-medium">
            {t("timeline.moveIn.title")}
          </p>

          {/* Date Picker Button */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {moveInDate ? t("timeline.moveIn.changeDate") : t("timeline.moveIn.selectDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                key={moveInDate?.getTime() || "no-date"}
                mode="single"
                selected={moveInDate || undefined}
                defaultMonth={moveInDate || undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < minDate}
                initialFocus
                fixedWeeks
              />
            </PopoverContent>
          </Popover>

          {/* Status Message */}
          {moveInDate && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                hasConflicts
                  ? "bg-red-50 text-[#9A3412]"
                  : "bg-[#647d75]/10 text-[#647d75]"
              }`}
            >
              {hasConflicts ? (
                <>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    {t("timeline.moveIn.warning")}
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    {t("timeline.moveIn.noConflicts")}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
