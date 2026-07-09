import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ISLAND_TYPES,
  type CabinetUnit,
  type ExtraCost,
  type ProjectAppliance,
  type Run,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { CabinetSection } from "./CabinetSection";
import { ExtraCostsSection } from "./ExtraCostsSection";
import { RunSection } from "./RunSection";

interface ComponentListProps {
  runs: Run[];
  islandUnits: CabinetUnit[];
  extraCosts: ExtraCost[];
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
  onWidthChange: (runId: string, unitId: string, width: number) => void;
  onQuantityChange: (runId: string, unitId: string, quantity: number) => void;
  onRemoveUnit: (runId: string, unitId: string) => void;
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
  onAddRun: () => void;
  // island handlers (island is not run-scoped)
  onIslandTypeChange: (unitId: string, type: UnitType) => void;
  onIslandApplianceChange: (unitId: string, appliances: ProjectAppliance[]) => void;
  onIslandWidthChange: (unitId: string, width: number) => void;
  onIslandQuantityChange: (unitId: string, quantity: number) => void;
  onIslandRemove: (unitId: string) => void;
  onIslandAdd: (type: UnitType) => void;
  onIslandReorder: (activeId: string, overId: string) => void;
  // additional-cost handlers
  onExtraLabelChange: (id: string, label: string) => void;
  onExtraAmountChange: (id: string, amount: number) => void;
  onExtraResetAuto: (id: string) => void;
  onExtraRemove: (id: string) => void;
  onExtraAdd: (label?: string) => void;
}

/** All runs (each a RunSection), the island section, and an add-run control. */
export function ComponentList({
  runs,
  islandUnits,
  extraCosts,
  furnitureSubtotal,
  presentEssentials,
  declaredAppliances,
  placedAppliances,
  missingBaseHousings,
  onRunLengthChange,
  onRemoveRun,
  onTypeChange,
  onApplianceChange,
  onWidthChange,
  onQuantityChange,
  onRemoveUnit,
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
  onAddRun,
  onIslandTypeChange,
  onIslandApplianceChange,
  onIslandWidthChange,
  onIslandQuantityChange,
  onIslandRemove,
  onIslandAdd,
  onIslandReorder,
  onExtraLabelChange,
  onExtraAmountChange,
  onExtraResetAuto,
  onExtraRemove,
  onExtraAdd,
}: ComponentListProps) {
  return (
    <div className="flex flex-col gap-6">
      {runs.map((run) => (
        <RunSection
          key={run.id}
          run={run}
          removable={runs.length > 1}
          presentEssentials={presentEssentials}
          declaredAppliances={declaredAppliances}
          placedAppliances={placedAppliances}
          missingBaseHousings={missingBaseHousings}
          onLengthChange={onRunLengthChange}
          onRemoveRun={onRemoveRun}
          onTypeChange={onTypeChange}
          onApplianceChange={onApplianceChange}
          onWidthChange={onWidthChange}
          onQuantityChange={onQuantityChange}
          onRemoveUnit={onRemoveUnit}
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

      <CabinetSection
        title="Island"
        units={islandUnits}
        typeOptions={ISLAND_TYPES}
        addLabel="Add island"
        emptyLabel="No island. Add one to include it in the estimate."
        declaredAppliances={declaredAppliances}
        placedAppliances={placedAppliances}
        onTypeChange={onIslandTypeChange}
        onApplianceChange={onIslandApplianceChange}
        onWidthChange={onIslandWidthChange}
        onQuantityChange={onIslandQuantityChange}
        onRemove={onIslandRemove}
        onAdd={onIslandAdd}
        onReorder={onIslandReorder}
      />

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
