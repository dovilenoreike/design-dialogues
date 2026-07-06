import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CabinetUnit, UnitType } from "@/lib/kitchen-calculator";
import { UnitRow } from "./UnitRow";

interface CabinetSectionProps {
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

/** A titled card of cabinet rows with an add button — used for base, wall and island lists. */
export function CabinetSection({
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="gap-1.5"
            style={{ color: "#647d75" }}
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
          {footerExtra}
        </div>
      </CardContent>
    </Card>
  );
}
