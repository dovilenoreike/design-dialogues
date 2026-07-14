import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ISLAND_TYPES,
  unitHasSink,
  type CabinetUnit,
  type ExtraCost,
  type GlobalSettings,
  type KitchenLayout,
  type ProjectAppliance,
  type Run,
  type UnitFinish,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { CabinetSection } from "./CabinetSection";
import { ExtraCostsSection } from "./ExtraCostsSection";
import { IslandGlyph } from "./IslandGlyph";
import { RunSection } from "./RunSection";
import { WorktopSection } from "./WorktopSection";

interface ComponentListProps {
  layout: KitchenLayout;
  /** Global heights/depths — the config modal shows a unit's full W × D × H. */
  settings: GlobalSettings;
  runs: Run[];
  islandUnits: CabinetUnit[];
  extraCosts: ExtraCost[];
  /** Per-unit line subtotals keyed by unit id — drives section + unit prices. */
  unitPrices?: Map<string, number>;
  /** Per-run worktop subtotals, keyed by run id. */
  worktopPrices?: Record<string, number>;
  furnitureSubtotal: number;
  presentEssentials: UnitType[];
  declaredAppliances?: Set<ProjectAppliance>;
  placedAppliances?: Set<ProjectAppliance>;
  /** Declared-but-unplaced base housings (dishwasher/hob-oven/oven/fridge) offered
   *  as gap fills in each run's length alert. */
  missingBaseHousings?: UnitType[];
  // run-scoped unit handlers
  onRunLengthChange: (runId: string, mm: number) => void;
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
  onAddRun: () => void;
  // island handlers (island is not run-scoped)
  onIslandTypeChange: (unitId: string, type: UnitType) => void;
  onIslandApplianceChange: (unitId: string, appliances: ProjectAppliance[]) => void;
  onIslandConfigChange: (unitId: string, config: UnitFinish) => void;
  onIslandWidthChange: (unitId: string, width: number) => void;
  onIslandQuantityChange: (unitId: string, quantity: number) => void;
  onIslandRemove: (unitId: string) => void;
  onIslandDuplicate: (unitId: string) => void;
  onIslandAdd: (type: UnitType) => void;
  onIslandReorder: (activeId: string, overId: string) => void;
  /** Island worktop: included flag (undefined = included), material + subtotal. */
  islandWorktopIncluded: boolean;
  islandWorktopMaterial?: string;
  islandWorktopPrice?: number;
  onIslandWorktopToggle: (value: boolean) => void;
  onIslandWorktopMaterialChange: (code: string | undefined) => void;
  // additional-cost handlers
  onExtraLabelChange: (id: string, label: string) => void;
  onExtraAmountChange: (id: string, amount: number) => void;
  onExtraResetAuto: (id: string) => void;
  onExtraRemove: (id: string) => void;
  onExtraAdd: (label?: string) => void;
}

/** All runs (each a RunSection), the island section, and an add-run control. */
export function ComponentList({
  layout,
  settings,
  runs,
  islandUnits,
  extraCosts,
  unitPrices,
  worktopPrices,
  furnitureSubtotal,
  presentEssentials,
  declaredAppliances,
  placedAppliances,
  missingBaseHousings,
  onRunLengthChange,
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
  onAddRun,
  onIslandTypeChange,
  onIslandApplianceChange,
  onIslandConfigChange,
  onIslandWidthChange,
  onIslandQuantityChange,
  onIslandRemove,
  onIslandDuplicate,
  onIslandAdd,
  onIslandReorder,
  islandWorktopIncluded,
  islandWorktopMaterial,
  islandWorktopPrice,
  onIslandWorktopToggle,
  onIslandWorktopMaterialChange,
  onExtraLabelChange,
  onExtraAmountChange,
  onExtraResetAuto,
  onExtraRemove,
  onExtraAdd,
}: ComponentListProps) {
  // Sink / appliances that landed on the island — mirrored in its header glyphs.
  const islandAppliances = Array.from(new Set(islandUnits.flatMap((u) => u.appliances)));
  const islandHasSink = islandUnits.some(unitHasSink);

  return (
    <div className="flex flex-col gap-6">
      {runs.map((run, i) => (
        <RunSection
          key={run.id}
          run={run}
          layout={layout}
          settings={settings}
          legIndex={i}
          removable={runs.length > 1}
          unitPrices={unitPrices}
          worktopPrice={worktopPrices?.[run.id]}
          presentEssentials={presentEssentials}
          declaredAppliances={declaredAppliances}
          placedAppliances={placedAppliances}
          missingBaseHousings={missingBaseHousings}
          onLengthChange={onRunLengthChange}
          onRemoveRun={onRemoveRun}
          onTypeChange={onTypeChange}
          onApplianceChange={onApplianceChange}
          onConfigChange={onConfigChange}
          onWidthChange={onWidthChange}
          onQuantityChange={onQuantityChange}
          onRemoveUnit={onRemoveUnit}
          onDuplicateUnit={onDuplicateUnit}
          onAddBase={onAddBase}
          onAddWall={onAddWall}
          onFillGap={onFillGap}
          onFillWall={onFillWall}
          onReorderBase={onReorderBase}
          onReorderWall={onReorderWall}
          onWorktopToggle={onWorktopToggle}
          onWorktopLengthChange={onWorktopLengthChange}
          onWorktopLengthReset={onWorktopLengthReset}
          onBacksplashChange={onBacksplashChange}
          onWorktopMaterialChange={onWorktopMaterialChange}
        />
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={onAddRun}
        className="self-start gap-1.5"
        style={{ color: "#647d75" }}
      >
        <Plus className="h-4 w-4" />
        Add run
      </Button>

      {/* The island reads as its own leg — same bordered block as a run, holding
          its cabinets and worktop together. Added/removed via the setup tile. */}
      {islandUnits.length > 0 && (
        <div className="rounded-xl border bg-muted/60 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <IslandGlyph size={24} className="shrink-0 text-muted-foreground" />
            <span className="font-serif text-xl">Island</span>
            {(islandHasSink || islandAppliances.length > 0) && (
              <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                {islandHasSink && <ApplianceGlyph id="sink" size={15} />}
                {islandAppliances.map((a) => (
                  <ApplianceGlyph key={a} id={a} size={15} />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <CabinetSection
              title="Cabinets"
              units={islandUnits}
              settings={settings}
              typeOptions={ISLAND_TYPES}
              addLabel="Add cabinet"
              unitPrices={unitPrices}
              declaredAppliances={declaredAppliances}
              placedAppliances={placedAppliances}
              onTypeChange={onIslandTypeChange}
              onApplianceChange={onIslandApplianceChange}
              onConfigChange={onIslandConfigChange}
              onWidthChange={onIslandWidthChange}
              onQuantityChange={onIslandQuantityChange}
              onRemove={onIslandRemove}
              onDuplicate={onIslandDuplicate}
              onAdd={onIslandAdd}
              onReorder={onIslandReorder}
            />
            <WorktopSection
              title="Worktop"
              showBacksplash={false}
              lengthEditable={false}
              included={islandWorktopIncluded}
              autoLengthMm={islandUnits.reduce((sum, u) => sum + u.width * u.quantity, 0)}
              material={islandWorktopMaterial}
              price={islandWorktopPrice}
              onToggle={onIslandWorktopToggle}
              onMaterialChange={onIslandWorktopMaterialChange}
            />
          </div>
        </div>
      )}

      <ExtraCostsSection
        costs={extraCosts}
        furnitureSubtotal={furnitureSubtotal}
        onLabelChange={onExtraLabelChange}
        onAmountChange={onExtraAmountChange}
        onResetAuto={onExtraResetAuto}
        onRemove={onExtraRemove}
        onAdd={onExtraAdd}
      />
    </div>
  );
}
