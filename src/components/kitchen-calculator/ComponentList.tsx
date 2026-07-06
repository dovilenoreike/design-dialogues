import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISLAND_TYPES, type CabinetUnit, type Run, type UnitType } from "@/lib/kitchen-calculator";
import { CabinetSection } from "./CabinetSection";
import { RunSection } from "./RunSection";

interface ComponentListProps {
  runs: Run[];
  islandUnits: CabinetUnit[];
  presentEssentials: UnitType[];
  // run-scoped unit handlers
  onRunLengthChange: (runId: string, mm: number) => void;
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
  onBacksplashChange: (runId: string, value: boolean) => void;
  onAddRun: () => void;
  // island handlers (island is not run-scoped)
  onIslandTypeChange: (unitId: string, type: UnitType) => void;
  onIslandWidthChange: (unitId: string, width: number) => void;
  onIslandQuantityChange: (unitId: string, quantity: number) => void;
  onIslandRemove: (unitId: string) => void;
  onIslandAdd: (type: UnitType) => void;
  onIslandReorder: (activeId: string, overId: string) => void;
}

/** All runs (each a RunSection), the island section, and an add-run control. */
export function ComponentList({
  runs,
  islandUnits,
  presentEssentials,
  onRunLengthChange,
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
  onBacksplashChange,
  onAddRun,
  onIslandTypeChange,
  onIslandWidthChange,
  onIslandQuantityChange,
  onIslandRemove,
  onIslandAdd,
  onIslandReorder,
}: ComponentListProps) {
  return (
    <div className="flex flex-col gap-4">
      {runs.map((run) => (
        <RunSection
          key={run.id}
          run={run}
          removable={runs.length > 1}
          presentEssentials={presentEssentials}
          onLengthChange={onRunLengthChange}
          onRemoveRun={onRemoveRun}
          onTypeChange={onTypeChange}
          onWidthChange={onWidthChange}
          onQuantityChange={onQuantityChange}
          onRemoveUnit={onRemoveUnit}
          onAddBase={onAddBase}
          onAddWall={onAddWall}
          onFillGap={onFillGap}
          onFillWall={onFillWall}
          onReorderBase={onReorderBase}
          onReorderWall={onReorderWall}
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
        onTypeChange={onIslandTypeChange}
        onWidthChange={onIslandWidthChange}
        onQuantityChange={onIslandQuantityChange}
        onRemove={onIslandRemove}
        onAdd={onIslandAdd}
        onReorder={onIslandReorder}
      />
    </div>
  );
}
