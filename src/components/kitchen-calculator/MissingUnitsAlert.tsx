import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UNIT_LABELS, type UnitType } from "@/lib/kitchen-calculator";

const OCHRE = "#ca8a04";

interface MissingUnitsAlertProps {
  /** Essential unit types neither present nor excluded from the project. */
  missing: UnitType[];
  onAdd: (type: UnitType) => void;
  /** Mark an essential as intentionally not part of this kitchen (e.g. a
   *  standalone fridge) so it stops being flagged. */
  onExclude: (type: UnitType) => void;
}

/**
 * Non-blocking completeness notice. A kitchen normally needs a sink, hob/oven
 * and fridge — but any of these can be standalone/out of scope, so each missing
 * one can be added or marked not needed. Returns null when nothing is flagged.
 */
export function MissingUnitsAlert({ missing, onAdd, onExclude }: MissingUnitsAlertProps) {
  if (missing.length === 0) return null;

  return (
    <div
      className="rounded-md border px-4 py-3"
      style={{ borderColor: OCHRE, backgroundColor: "rgba(202,138,4,0.06)" }}
      role="status"
    >
      <div className="flex items-center gap-3">
        <Info className="h-4 w-4 shrink-0" style={{ color: OCHRE }} />
        <p className="text-sm" style={{ color: OCHRE }}>
          Some essential units aren&apos;t in the project.
        </p>
      </div>

      <div className="mt-2 flex flex-col gap-2 pl-7">
        {missing.map((t) => (
          <div key={t} className="flex items-center gap-3">
            <span className="flex-1 text-sm" style={{ color: OCHRE }}>
              {UNIT_LABELS[t]}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdd(t)}
              className="shrink-0 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExclude(t)}
              className="shrink-0 text-muted-foreground"
            >
              Not needed
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
