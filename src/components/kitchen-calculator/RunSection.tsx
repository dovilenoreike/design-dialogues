import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BASE_TALL_TYPES,
  WALL_TYPES,
  type Run,
  type CabinetUnit,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { CabinetSection } from "./CabinetSection";
import { RunLengthAlert } from "./RunLengthAlert";

const MIN_STORAGE_WIDTH = 150; // mm — don't trim a storage cabinet below this
const WALL_FILL_MIN = 100; // mm — smallest free span worth offering to fill

const m = (mm: number): string => (mm / 1000).toFixed(2);

interface RunSectionProps {
  run: Run;
  removable: boolean;
  presentEssentials?: UnitType[];
  onLengthChange: (runId: string, mm: number) => void;
  onRemoveRun: (runId: string) => void;
  onTypeChange: (runId: string, unitId: string, type: UnitType) => void;
  onWidthChange: (runId: string, unitId: string, width: number) => void;
  onQuantityChange: (runId: string, unitId: string, quantity: number) => void;
  onRemoveUnit: (runId: string, unitId: string) => void;
  onAddBase: (runId: string, type: UnitType) => void;
  onAddWall: (runId: string, type: UnitType) => void;
  onFillGap: (runId: string, gapMm: number) => void;
  onFillWall: (runId: string, spanMm: number) => void;
  onReorderBase: (runId: string, activeId: string, overId: string) => void;
  onReorderWall: (runId: string, activeId: string, overId: string) => void;
}

/** One kitchen leg: header (label + length + remove), fit alert, base & wall sections with meters. */
export function RunSection({
  run,
  removable,
  presentEssentials,
  onLengthChange,
  onRemoveRun,
  onTypeChange,
  onWidthChange,
  onQuantityChange,
  onRemoveUnit,
  onAddBase,
  onAddWall,
  onFillGap,
  onFillWall,
  onReorderBase,
  onReorderWall,
}: RunSectionProps) {
  // --- base run fit -------------------------------------------------------
  const baseSumMm = run.baseUnits.reduce((sum, u) => sum + u.width * u.quantity, 0);
  const runMatches = baseSumMm === run.lengthMm;
  const overflowMm = Math.max(baseSumMm - run.lengthMm, 0);

  const widestStorage = run.baseUnits
    .filter((u) => u.type === "storage")
    .reduce<CabinetUnit | undefined>(
      (widest, u) => (!widest || u.width > widest.width ? u : widest),
      undefined,
    );
  // Trimming shrinks a single cabinet; skip it for a ×N line to avoid overshoot.
  const canTrim =
    overflowMm > 0 &&
    !!widestStorage &&
    widestStorage.quantity === 1 &&
    widestStorage.width - overflowMm >= MIN_STORAGE_WIDTH;

  const runIndicator = (
    <span
      className={`text-xs font-medium tabular-nums ${runMatches ? "text-muted-foreground" : ""}`}
      style={runMatches ? undefined : { color: "#ca8a04" }}
    >
      {m(baseSumMm)} m / {m(run.lengthMm)} m
    </span>
  );

  // --- wall meter ---------------------------------------------------------
  const wallSpanMm = run.baseUnits
    .filter((u) => u.category === "base")
    .reduce((sum, u) => sum + u.width * u.quantity, 0);
  const wallTotalMm = run.wallUnits.reduce((sum, u) => sum + u.width * u.quantity, 0);
  const wallFreeMm = wallSpanMm - wallTotalMm;
  const wallIndicator = (
    <span className="text-xs font-medium tabular-nums text-muted-foreground">
      {m(wallTotalMm)} m / {m(wallSpanMm)} m
      {wallFreeMm > 0 && <span> · {m(wallFreeMm)} m free</span>}
      {wallFreeMm < 0 && <span style={{ color: "#ca8a04" }}> · {m(-wallFreeMm)} m over</span>}
    </span>
  );
  const wallFillButton = wallFreeMm >= WALL_FILL_MIN && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onFillWall(run.id, wallFreeMm)}
      className="gap-1.5"
      style={{ color: "#647d75" }}
    >
      Fill remaining ({m(wallFreeMm)} m)
    </Button>
  );

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{run.label}</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={m(run.lengthMm)}
              onChange={(e) => {
                const meters = Number(e.target.value);
                if (Number.isFinite(meters) && meters > 0) {
                  onLengthChange(run.id, Math.round(meters * 1000));
                }
              }}
              className="h-8 w-24"
              aria-label={`${run.label} length in metres`}
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </div>
        {removable && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemoveRun(run.id)}
            aria-label={`Remove ${run.label}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!runMatches && (
        <div className="mb-3">
          <RunLengthAlert
            runLengthMm={baseSumMm}
            kitchenLengthMm={run.lengthMm}
            onFillGap={(gap) => onFillGap(run.id, gap)}
            onTrimWidest={
              canTrim && widestStorage
                ? () => onWidthChange(run.id, widestStorage.id, widestStorage.width - overflowMm)
                : undefined
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <CabinetSection
          title="Base & tall units"
          units={run.baseUnits}
          typeOptions={BASE_TALL_TYPES}
          addLabel="Add unit"
          indicator={runIndicator}
          presentEssentials={presentEssentials}
          onTypeChange={(id, type) => onTypeChange(run.id, id, type)}
          onWidthChange={(id, width) => onWidthChange(run.id, id, width)}
          onQuantityChange={(id, qty) => onQuantityChange(run.id, id, qty)}
          onRemove={(id) => onRemoveUnit(run.id, id)}
          onAdd={(type) => onAddBase(run.id, type)}
          onReorder={(a, o) => onReorderBase(run.id, a, o)}
        />
        <CabinetSection
          title="Wall units"
          units={run.wallUnits}
          typeOptions={WALL_TYPES}
          addLabel="Add wall unit"
          indicator={wallIndicator}
          footerExtra={wallFillButton}
          onTypeChange={(id, type) => onTypeChange(run.id, id, type)}
          onWidthChange={(id, width) => onWidthChange(run.id, id, width)}
          onQuantityChange={(id, qty) => onQuantityChange(run.id, id, qty)}
          onRemove={(id) => onRemoveUnit(run.id, id)}
          onAdd={(type) => onAddWall(run.id, type)}
          onReorder={(a, o) => onReorderWall(run.id, a, o)}
        />
      </div>
    </div>
  );
}
