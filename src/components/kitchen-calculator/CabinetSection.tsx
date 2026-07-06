import type { ReactNode } from "react";
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
  onWidthChange: (id: string, width: number) => void;
  onRemove: (id: string) => void;
  onAdd: (type: UnitType) => void;
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
  onWidthChange,
  onRemove,
  onAdd,
}: CabinetSectionProps) {
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
              presentEssentials={presentEssentials}
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
