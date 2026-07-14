import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CabinetUnit,
  GlobalSettings,
  ProjectAppliance,
  UnitFinish,
  UnitType,
} from "@/lib/kitchen-calculator";
import { AddUnitMenu } from "./AddUnitMenu";
import { formatEur } from "./currency";
import { UnitRow } from "./UnitRow";

interface CabinetSectionProps {
  title: string;
  units: CabinetUnit[];
  /** Global heights/depths — a row's config modal shows the unit's full W × D × H. */
  settings: GlobalSettings;
  typeOptions: UnitType[];
  addLabel: string;
  emptyLabel?: string;
  indicator?: ReactNode;
  footerExtra?: ReactNode;
  /** Per-unit line subtotals keyed by unit id — sums to the section price. */
  unitPrices?: Map<string, number>;
  presentEssentials?: UnitType[];
  declaredAppliances?: Set<ProjectAppliance>;
  placedAppliances?: Set<ProjectAppliance>;
  onTypeChange: (id: string, type: UnitType) => void;
  onApplianceChange: (id: string, appliances: ProjectAppliance[]) => void;
  onConfigChange: (id: string, config: UnitFinish) => void;
  onWidthChange: (id: string, width: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAdd: (type: UnitType) => void;
  onReorder?: (activeId: string, overId: string) => void;
}

/** A titled card of cabinet rows with an add button — used for base, wall and island lists. */
export function CabinetSection({
  title,
  units,
  settings,
  typeOptions,
  addLabel,
  emptyLabel,
  indicator,
  footerExtra,
  unitPrices,
  presentEssentials,
  declaredAppliances,
  placedAppliances,
  onTypeChange,
  onApplianceChange,
  onConfigChange,
  onWidthChange,
  onQuantityChange,
  onRemove,
  onDuplicate,
  onAdd,
  onReorder,
}: CabinetSectionProps) {
  const sensors = useSensors(
    // A small drag threshold so a click on the row's controls isn't a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) onReorder?.(String(active.id), String(over.id));
  };

  const sortable = onReorder && units.length > 1;

  // Section subtotal — the sum of this section's unit line prices. Only shown
  // once there are units and prices to sum (empty island → no price).
  const sectionSubtotal =
    unitPrices && units.length > 0
      ? units.reduce((sum, u) => sum + (unitPrices.get(u.id) ?? 0), 0)
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base font-medium text-foreground">{title}</CardTitle>
          {indicator}
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={units.map((u) => u.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y">
              {units.map((u) => (
                <UnitRow
                  key={u.id}
                  unit={u}
                  price={unitPrices?.get(u.id)}
                  settings={settings}
                  typeOptions={typeOptions}
                  presentEssentials={presentEssentials}
                  declaredAppliances={declaredAppliances}
                  placedAppliances={placedAppliances}
                  sortable={sortable}
                  onTypeChange={onTypeChange}
                  onApplianceChange={onApplianceChange}
                  onConfigChange={onConfigChange}
                  onWidthChange={onWidthChange}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemove}
                  onDuplicate={onDuplicate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {units.length === 0 && emptyLabel && (
          <p className="py-2 text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AddUnitMenu
            label={addLabel}
            typeOptions={typeOptions}
            presentEssentials={presentEssentials}
            onAdd={onAdd}
          />
          {footerExtra}
          {sectionSubtotal !== null && (
            <span
              className="ml-auto text-sm font-medium tabular-nums"
              style={{ color: "#647d75" }}
            >
              {formatEur(sectionSubtotal)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
