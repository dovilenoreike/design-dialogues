import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BASE_TALL_TYPES,
  unitHasSink,
  WALL_TYPES,
  type GlobalSettings,
  type KitchenLayout,
  type Run,
  type CabinetUnit,
  type ProjectAppliance,
  type UnitFinish,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { CabinetSection } from "./CabinetSection";
import { LayoutLegGlyph } from "./LayoutLegGlyph";
import { RunLengthAlert } from "./RunLengthAlert";
import { WorktopSection } from "./WorktopSection";

const MIN_STORAGE_WIDTH = 150; // mm — don't trim a storage cabinet below this
const WALL_FILL_MIN = 100; // mm — smallest free span worth offering to fill
const HOUSING_WIDTH = 600; // mm — standard width of an appliance housing gap fill

const m = (mm: number): string => (mm / 1000).toFixed(2);

interface RunSectionProps {
  run: Run;
  /** Kitchen layout + this run's leg index — drives the header leg glyph. */
  layout: KitchenLayout;
  /** Global heights/depths — passed through so unit rows can show full dimensions. */
  settings: GlobalSettings;
  legIndex: number;
  removable: boolean;
  /** Per-unit line subtotals keyed by unit id — drives section + unit prices. */
  unitPrices?: Map<string, number>;
  /** This run's worktop subtotal — shown on the worktop section. */
  worktopPrice?: number;
  presentEssentials?: UnitType[];
  declaredAppliances?: Set<ProjectAppliance>;
  placedAppliances?: Set<ProjectAppliance>;
  /** Declared-but-unplaced base housings offered as gap fills in the length alert. */
  missingBaseHousings?: UnitType[];
  onLengthChange: (runId: string, mm: number) => void;
  onRemoveRun: (runId: string) => void;
  onTypeChange: (runId: string, unitId: string, type: UnitType) => void;
  onApplianceChange: (runId: string, unitId: string, appliances: ProjectAppliance[]) => void;
  onConfigChange: (runId: string, unitId: string, config: UnitFinish) => void;
  onWidthChange: (runId: string, unitId: string, width: number) => void;
  onQuantityChange: (runId: string, unitId: string, quantity: number) => void;
  onRemoveUnit: (runId: string, unitId: string) => void;
  onDuplicateUnit: (runId: string, unitId: string) => void;
  onAddBase: (runId: string, type: UnitType) => void;
  onAddWall: (runId: string, type: UnitType) => void;
  onFillGap: (runId: string, gapMm: number) => void;
  onFillWall: (runId: string, spanMm: number) => void;
  onReorderBase: (runId: string, activeId: string, overId: string) => void;
  onReorderWall: (runId: string, activeId: string, overId: string) => void;
  onWorktopToggle: (runId: string, value: boolean) => void;
  onWorktopLengthChange: (runId: string, mm: number) => void;
  onWorktopLengthReset: (runId: string) => void;
  onBacksplashChange: (runId: string, value: boolean) => void;
  onWorktopMaterialChange: (runId: string, code: string | undefined) => void;
}

/** One kitchen leg: header (label + length + remove), fit alert, base & wall sections with meters. */
export function RunSection({
  run,
  layout,
  settings,
  legIndex,
  removable,
  unitPrices,
  worktopPrice,
  presentEssentials,
  declaredAppliances,
  placedAppliances,
  missingBaseHousings,
  onLengthChange,
  onRemoveRun,
  onTypeChange,
  onApplianceChange,
  onConfigChange,
  onWidthChange,
  onQuantityChange,
  onRemoveUnit,
  onDuplicateUnit,
  onAddBase,
  onAddWall,
  onFillGap,
  onFillWall,
  onReorderBase,
  onReorderWall,
  onWorktopToggle,
  onWorktopLengthChange,
  onWorktopLengthReset,
  onBacksplashChange,
  onWorktopMaterialChange,
}: RunSectionProps) {
  // --- editable run length (metres) ---------------------------------------
  // Free-typing draft so the field can be cleared and retyped; commits live on
  // a valid value and never snaps back mid-edit.
  const [lengthDraft, setLengthDraft] = useState(m(run.lengthMm));
  const lengthFocused = useRef(false);
  useEffect(() => {
    if (!lengthFocused.current) setLengthDraft(m(run.lengthMm));
  }, [run.lengthMm]);
  const commitLength = (raw: string) => {
    const meters = Number(raw);
    if (Number.isFinite(meters) && meters > 0) onLengthChange(run.id, Math.round(meters * 1000));
  };

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

  // Header summary — the appliances (and sink) that actually landed in this run,
  // so the assignment made before generating is visible on the drawn kitchen.
  const runAppliances = Array.from(
    new Set([...run.baseUnits, ...run.wallUnits].flatMap((u) => u.appliances)),
  );
  const runHasSink = run.baseUnits.some(unitHasSink);

  return (
    <div className="rounded-xl border bg-muted/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <LayoutLegGlyph
            layout={layout}
            leg={legIndex}
            size={24}
            className="shrink-0 text-muted-foreground"
          />
          <span className="font-serif text-xl">{run.label}</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={lengthDraft}
              onFocus={(e) => {
                lengthFocused.current = true;
                e.currentTarget.select();
              }}
              onChange={(e) => {
                setLengthDraft(e.target.value);
                commitLength(e.target.value);
              }}
              onBlur={(e) => {
                lengthFocused.current = false;
                const meters = Number(e.target.value);
                if (!Number.isFinite(meters) || meters <= 0) setLengthDraft(m(run.lengthMm));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="h-8 w-24"
              aria-label={`${run.label} length in metres`}
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
          {(runHasSink || runAppliances.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
              {runHasSink && <ApplianceGlyph id="sink" size={15} />}
              {runAppliances.map((a) => (
                <ApplianceGlyph key={a} id={a} size={15} />
              ))}
            </div>
          )}
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
            applianceFills={(missingBaseHousings ?? []).map((type) => ({
              type,
              width: HOUSING_WIDTH,
            }))}
            onFillGap={(gap) => onFillGap(run.id, gap)}
            onFillAppliance={(type) => onAddBase(run.id, type)}
            onTrimWidest={
              canTrim && widestStorage
                ? () => onWidthChange(run.id, widestStorage.id, widestStorage.width - overflowMm)
                : undefined
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <CabinetSection
          title="Base & tall units"
          units={run.baseUnits}
          settings={settings}
          typeOptions={BASE_TALL_TYPES}
          addLabel="Add unit"
          indicator={runIndicator}
          unitPrices={unitPrices}
          presentEssentials={presentEssentials}
          declaredAppliances={declaredAppliances}
          placedAppliances={placedAppliances}
          onTypeChange={(id, type) => onTypeChange(run.id, id, type)}
          onApplianceChange={(id, app) => onApplianceChange(run.id, id, app)}
          onConfigChange={(id, config) => onConfigChange(run.id, id, config)}
          onWidthChange={(id, width) => onWidthChange(run.id, id, width)}
          onQuantityChange={(id, qty) => onQuantityChange(run.id, id, qty)}
          onRemove={(id) => onRemoveUnit(run.id, id)}
          onDuplicate={(id) => onDuplicateUnit(run.id, id)}
          onAdd={(type) => onAddBase(run.id, type)}
          onReorder={(a, o) => onReorderBase(run.id, a, o)}
        />
        <WorktopSection
          included={run.worktop}
          autoLengthMm={wallSpanMm}
          overrideLengthMm={run.worktopLengthMm}
          backsplash={run.backsplash}
          material={run.worktopMaterial}
          price={worktopPrice}
          onToggle={(v) => onWorktopToggle(run.id, v)}
          onLengthChange={(mm) => onWorktopLengthChange(run.id, mm)}
          onLengthReset={() => onWorktopLengthReset(run.id)}
          onBacksplashChange={(v) => onBacksplashChange(run.id, v)}
          onMaterialChange={(code) => onWorktopMaterialChange(run.id, code)}
        />
        <CabinetSection
          title="Wall units"
          units={run.wallUnits}
          settings={settings}
          typeOptions={WALL_TYPES}
          addLabel="Add wall unit"
          indicator={wallIndicator}
          footerExtra={wallFillButton}
          unitPrices={unitPrices}
          declaredAppliances={declaredAppliances}
          placedAppliances={placedAppliances}
          onTypeChange={(id, type) => onTypeChange(run.id, id, type)}
          onApplianceChange={(id, app) => onApplianceChange(run.id, id, app)}
          onConfigChange={(id, config) => onConfigChange(run.id, id, config)}
          onWidthChange={(id, width) => onWidthChange(run.id, id, width)}
          onQuantityChange={(id, qty) => onQuantityChange(run.id, id, qty)}
          onRemove={(id) => onRemoveUnit(run.id, id)}
          onDuplicate={(id) => onDuplicateUnit(run.id, id)}
          onAdd={(type) => onAddWall(run.id, type)}
          onReorder={(a, o) => onReorderWall(run.id, a, o)}
        />
      </div>
    </div>
  );
}
