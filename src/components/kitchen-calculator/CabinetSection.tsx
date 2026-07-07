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
import type { CabinetUnit, UnitType } from "@/lib/kitchen-calculator";
import { AddUnitMenu } from "./AddUnitMenu";
import { UnitRow } from "./UnitRow";

interface CabinetSectionProps {
  title: string;
  units: CabinetUnit[];
  typeOptions: UnitType[];
  addLabel: string;
  emptyLabel?: string;
  indicator?: ReactNode;
  footerExtra?: ReactNode;
  presentEssentials?: UnitType[];
  onTypeChange: (id: string, type: UnitType) => void;
  onApplianceChange: (id: string, appliance: string) => void;
  onWidthChange: (id: string, width: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onAdd: (type: UnitType) => void;
  onReorder?: (activeId: string, overId: string) => void;
}

/** A titled card of cabinet rows with an add button — used for base, wall and island lists. */
export function CabinetSection({
  title,
  units,
  typeOptions,
  addLabel,
  emptyLabel,
  indicator,
  footerExtra,
  presentEssentials,
  onTypeChange,
  onApplianceChange,
  onWidthChange,
  onQuantityChange,
  onRemove,
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
                  typeOptions={typeOptions}
                  presentEssentials={presentEssentials}
                  sortable={sortable}
                  onTypeChange={onTypeChange}
                  onApplianceChange={onApplianceChange}
                  onWidthChange={onWidthChange}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemove}
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
        </div>
      </CardContent>
    </Card>
  );
}
