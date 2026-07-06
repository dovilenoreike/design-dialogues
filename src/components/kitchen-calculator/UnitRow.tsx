import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_LABELS, type CabinetUnit, type UnitType } from "@/lib/kitchen-calculator";

const WIDTH_OPTIONS = [300, 400, 500, 600, 800, 1000];

interface UnitRowProps {
  unit: CabinetUnit;
  typeOptions: UnitType[];
  onTypeChange: (id: string, type: UnitType) => void;
  onWidthChange: (id: string, width: number) => void;
  onRemove: (id: string) => void;
}

/** One component-list row: type swap + width + remove. */
export function UnitRow({ unit, typeOptions, onTypeChange, onWidthChange, onRemove }: UnitRowProps) {
  // Include the unit's own width so a custom/non-standard size stays selectable.
  const widthOptions = WIDTH_OPTIONS.includes(unit.width)
    ? WIDTH_OPTIONS
    : [...WIDTH_OPTIONS, unit.width].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex flex-1 items-center gap-2">
        <Select value={unit.type} onValueChange={(v) => onTypeChange(unit.id, v as UnitType)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {UNIT_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {unit.isCustomWidth && (
          <span className="text-xs" style={{ color: "#ca8a04" }}>
            custom: {unit.width}mm
          </span>
        )}
      </div>

      <Select value={String(unit.width)} onValueChange={(v) => onWidthChange(unit.id, Number(v))}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {widthOptions.map((w) => (
            <SelectItem key={w} value={String(w)}>
              {w}mm
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(unit.id)}
        aria-label={`Remove ${unit.name}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
