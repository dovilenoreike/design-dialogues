import { useEffect, useRef, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const m = (mm: number): string => (mm / 1000).toFixed(2);

interface WorktopSectionProps {
  /** Worktop is part of this quote (dropped = bought from another producer). */
  included: boolean;
  /** Bottom-cabinet span this run's worktop follows by default. */
  autoLengthMm: number;
  /** Manual length override in mm; null = follow the cabinets. */
  overrideLengthMm: number | null;
  backsplash: boolean;
  onToggle: (value: boolean) => void;
  onLengthChange: (mm: number) => void;
  onLengthReset: () => void;
  onBacksplashChange: (value: boolean) => void;
}

/** Per-run worktop — same Card structure as the unit sections: header + row + remove. */
export function WorktopSection({
  included,
  autoLengthMm,
  overrideLengthMm,
  backsplash,
  onToggle,
  onLengthChange,
  onLengthReset,
  onBacksplashChange,
}: WorktopSectionProps) {
  const effectiveMm = overrideLengthMm ?? autoLengthMm;
  const isOverridden = overrideLengthMm != null;

  // Free-typing draft for the length (metres), like the run length field.
  const [draft, setDraft] = useState(m(effectiveMm));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(m(effectiveMm));
  }, [effectiveMm]);
  const commit = (raw: string) => {
    const meters = Number(raw);
    if (Number.isFinite(meters) && meters > 0) onLengthChange(Math.round(meters * 1000));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base font-medium text-foreground">Worktop</CardTitle>
          {included && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {m(effectiveMm)} m
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {included ? (
          <div className="flex items-center gap-3 py-2">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Length</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={draft}
                    onFocus={(e) => {
                      focused.current = true;
                      e.currentTarget.select();
                    }}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      commit(e.target.value);
                    }}
                    onBlur={(e) => {
                      focused.current = false;
                      const meters = Number(e.target.value);
                      if (!Number.isFinite(meters) || meters <= 0) setDraft(m(effectiveMm));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    className="h-8 w-24"
                    aria-label="Worktop length in metres"
                  />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
                {isOverridden ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLengthReset}
                    className="h-7 gap-1 text-xs text-muted-foreground"
                    title="Follow the bottom cabinets"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Follow cabinets
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">follows cabinets</span>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={backsplash}
                  onCheckedChange={(v) => onBacksplashChange(v === true)}
                />
                Backsplash
              </label>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggle(false)}
              aria-label="Remove worktop"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <p className="py-2 text-sm text-muted-foreground">
              Supplied separately — not in the estimate.
            </p>
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(true)}
                className="gap-1.5"
                style={{ color: "#647d75" }}
              >
                <Plus className="h-4 w-4" />
                Add worktop
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
