import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const m = (mm: number): string => (mm / 1000).toFixed(2);

interface WorktopSectionProps {
  /** Worktop length = sum of the run's bottom-cabinet widths. */
  lengthMm: number;
  backsplash: boolean;
  onBacksplashChange: (value: boolean) => void;
}

/** Per-run worktop: length follows the base cabinets; backsplash is optional. */
export function WorktopSection({ lengthMm, backsplash, onBacksplashChange }: WorktopSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Worktop
          </CardTitle>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {m(lengthMm)} m
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Runs along the bottom cabinets — {m(lengthMm)} m.
        </p>
        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
          <Checkbox
            checked={backsplash}
            onCheckedChange={(v) => onBacksplashChange(v === true)}
          />
          Backsplash — same material &amp; length
        </label>
      </CardContent>
    </Card>
  );
}
