import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BASE_TALL_TYPES,
  ISLAND_TYPES,
  WALL_TYPES,
  type CabinetUnit,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { UnitRow } from "./UnitRow";

type SectionKind = "base" | "wall" | "island";

interface SectionProps {
  title: string;
  units: CabinetUnit[];
  typeOptions: UnitType[];
  addLabel: string;
  emptyLabel?: string;
  indicator?: ReactNode;
  footerExtra?: ReactNode;
  onTypeChange: (id: string, type: UnitType) => void;
  onWidthChange: (id: string, width: number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

function Section({
  title,
  units,
  typeOptions,
  addLabel,
  emptyLabel,
  indicator,
  footerExtra,
  onTypeChange,
  onWidthChange,
  onRemove,
  onAdd,
}: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          {indicator}
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {units.map((u) => (
            <UnitRow
              key={u.id}
              unit={u}
              typeOptions={typeOptions}
              onTypeChange={onTypeChange}
              onWidthChange={onWidthChange}
              onRemove={onRemove}
            />
          ))}
        </div>
        {units.length === 0 && emptyLabel && (
          <p className="py-2 text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1.5" style={{ color: "#647d75" }}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
          {footerExtra}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComponentListProps {
  baseUnits: CabinetUnit[];
  wallUnits: CabinetUnit[];
  islandUnits: CabinetUnit[];
  kitchenLengthMm: number;
  onTypeChange: (id: string, type: UnitType) => void;
  onWidthChange: (id: string, width: number) => void;
  onRemove: (id: string) => void;
  onAdd: (section: SectionKind) => void;
  /** Append wall units to fill the given free span above the base cabinets. */
  onFillWall: (spanMm: number) => void;
}

const m = (mm: number): string => (mm / 1000).toFixed(2);

/** Base & Tall, Wall, and Island sections (spec §UI Layout). */
export function ComponentList({
  baseUnits,
  wallUnits,
  islandUnits,
  kitchenLengthMm,
  onTypeChange,
  onWidthChange,
  onRemove,
  onAdd,
  onFillWall,
}: ComponentListProps) {
  const baseRunMm = baseUnits.reduce((sum, u) => sum + u.width, 0);
  const runMatches = baseRunMm === kitchenLengthMm;
  const runIndicator = (
    <span
      className={`text-xs font-medium tabular-nums ${runMatches ? "text-muted-foreground" : ""}`}
      style={runMatches ? undefined : { color: "#ca8a04" }}
    >
      {m(baseRunMm)} m / {m(kitchenLengthMm)} m
    </span>
  );

  // Wall units hang above base cabinets only — not over tall units (fridge,
  // larder). That base-cabinet span is the reference; walls may fall short or
  // overrun it, so this is an informational meter, not a hard constraint.
  const wallSpanMm = baseUnits
    .filter((u) => u.category === "base")
    .reduce((sum, u) => sum + u.width, 0);
  const wallTotalMm = wallUnits.reduce((sum, u) => sum + u.width, 0);
  const wallFreeMm = wallSpanMm - wallTotalMm;
  const wallIndicator = (
    <span className="text-xs font-medium tabular-nums text-muted-foreground">
      {m(wallTotalMm)} m / {m(wallSpanMm)} m
      {wallFreeMm > 0 && <span> · {m(wallFreeMm)} m free</span>}
      {wallFreeMm < 0 && (
        <span style={{ color: "#ca8a04" }}> · {m(-wallFreeMm)} m over</span>
      )}
    </span>
  );
  const wallFillButton = wallFreeMm >= 100 && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onFillWall(wallFreeMm)}
      className="gap-1.5"
      style={{ color: "#647d75" }}
    >
      <Plus className="h-4 w-4" />
      Fill remaining ({m(wallFreeMm)} m)
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Base & tall units"
        units={baseUnits}
        typeOptions={BASE_TALL_TYPES}
        addLabel="Add unit"
        indicator={runIndicator}
        onTypeChange={onTypeChange}
        onWidthChange={onWidthChange}
        onRemove={onRemove}
        onAdd={() => onAdd("base")}
      />
      <Section
        title="Wall units"
        units={wallUnits}
        typeOptions={WALL_TYPES}
        addLabel="Add wall unit"
        indicator={wallIndicator}
        footerExtra={wallFillButton}
        onTypeChange={onTypeChange}
        onWidthChange={onWidthChange}
        onRemove={onRemove}
        onAdd={() => onAdd("wall")}
      />
      <Section
        title="Island"
        units={islandUnits}
        typeOptions={ISLAND_TYPES}
        addLabel="Add island"
        emptyLabel="No island. Add one to include it in the estimate."
        onTypeChange={onTypeChange}
        onWidthChange={onWidthChange}
        onRemove={onRemove}
        onAdd={() => onAdd("island")}
      />
    </div>
  );
}

export type { SectionKind };
