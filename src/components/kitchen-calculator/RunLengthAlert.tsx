import { AlertTriangle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const OCHRE = "#ca8a04";
const meters = (mm: number): string => (mm / 1000).toFixed(2);

interface RunLengthAlertProps {
  runLengthMm: number;
  kitchenLengthMm: number;
  /** Add a cabinet sized to fill the remaining gap (under-run). */
  onFillGap: (gapMm: number) => void;
  /** Reduce the widest storage cabinet by the overflow. Undefined when no
   *  storage unit can absorb it (then the message falls back to guidance). */
  onTrimWidest?: () => void;
}

/**
 * Non-blocking warning when the base + tall units no longer fit the entered
 * kitchen length. The kitchen length is the fixed physical constraint (the
 * wall), so the fix is to add/remove/resize cabinets — not to move the wall.
 * Uses the brand ochre warning color (not error red). Returns null when they fit.
 */
export function RunLengthAlert({
  runLengthMm,
  kitchenLengthMm,
  onFillGap,
  onTrimWidest,
}: RunLengthAlertProps) {
  const delta = runLengthMm - kitchenLengthMm;
  if (delta === 0) return null;

  const abs = Math.abs(delta);
  const underFilled = delta < 0;

  return (
    <div
      className="flex items-start gap-3 rounded-md border px-4 py-3"
      style={{ borderColor: OCHRE, backgroundColor: "rgba(202,138,4,0.06)" }}
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: OCHRE }} />
      <p className="flex-1 text-sm" style={{ color: OCHRE }}>
        {underFilled ? (
          <>
            {abs} mm of empty run — cabinets total {meters(runLengthMm)} m but the kitchen is{" "}
            {meters(kitchenLengthMm)} m. Add a cabinet to fill it.
          </>
        ) : (
          <>
            {abs} mm past the {meters(kitchenLengthMm)} m kitchen length — cabinets total{" "}
            {meters(runLengthMm)} m.{" "}
            {onTrimWidest ? "Reduce the widest storage cabinet to fit." : "Resize a unit to fit."}
          </>
        )}
      </p>

      {underFilled ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFillGap(abs)}
          className="shrink-0 gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add cabinet ({abs} mm)
        </Button>
      ) : (
        onTrimWidest && (
          <Button variant="outline" size="sm" onClick={onTrimWidest} className="shrink-0 gap-1.5">
            <Minus className="h-4 w-4" />
            Reduce widest storage ({abs} mm)
          </Button>
        )
      )}
    </div>
  );
}
