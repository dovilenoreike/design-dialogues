import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_LABELS, type CabinetUnit, type UnitType } from "@/lib/kitchen-calculator";
import { EssentialBadge } from "./EssentialBadge";
import { UnitIcon, UnitTypeIcon } from "./UnitIcon";
import { buildTypeGroups } from "./unitGroups";

const WIDTH_OPTIONS = [300, 400, 500, 600, 800, 1000];
const CUSTOM = "custom";

interface UnitRowProps {
  unit: CabinetUnit;
  typeOptions: UnitType[];
  /** Essential types already placed somewhere in the kitchen (sink/hob/fridge). */
  presentEssentials?: UnitType[];
  onTypeChange: (id: string, type: UnitType) => void;
  onWidthChange: (id: string, width: number) => void;
  onRemove: (id: string) => void;
}

/** One component-list row: type swap + width + remove. */
export function UnitRow({
  unit,
  typeOptions,
  presentEssentials = [],
  onTypeChange,
  onWidthChange,
  onRemove,
}: UnitRowProps) {
  // Include the unit's own width so a custom/non-standard size stays selectable.
  const widthOptions = WIDTH_OPTIONS.includes(unit.width)
    ? WIDTH_OPTIONS
    : [...WIDTH_OPTIONS, unit.width].sort((a, b) => a - b);

  // When "Custom…" is picked, the width control becomes a free-entry mm input.
  const [editingWidth, setEditingWidth] = useState(false);
  const [draftWidth, setDraftWidth] = useState("");

  const commitWidth = () => {
    const value = Math.round(Number(draftWidth));
    if (Number.isFinite(value) && value > 0) onWidthChange(unit.id, value);
    setEditingWidth(false);
  };

  // Grouped picker: main appliances, then base cabinets, then tall units.
  const groups = buildTypeGroups(typeOptions);

  const renderOption = (t: UnitType) => (
    <SelectItem key={t} value={t}>
      <span className="flex items-center gap-2">
        <UnitTypeIcon type={t} size={22} className="shrink-0 text-muted-foreground" />
        <span>{UNIT_LABELS[t]}</span>
        <EssentialBadge type={t} present={presentEssentials.includes(t)} />
      </span>
    </SelectItem>
  );

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex flex-1 items-center gap-2">
        <UnitIcon unit={unit} size={40} className="shrink-0 text-muted-foreground" />
        <Select value={unit.type} onValueChange={(v) => onTypeChange(unit.id, v as UnitType)}>
          <SelectTrigger className="w-52">
            <SelectValue>{UNIT_LABELS[unit.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {groups.map((g, gi) => (
              <SelectGroup key={g.label ?? `g${gi}`}>
                {gi > 0 && <SelectSeparator />}
                {g.label && <SelectLabel>{g.label}</SelectLabel>}
                {g.types.map(renderOption)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {unit.isCustomWidth && (
          <span className="text-xs" style={{ color: "#ca8a04" }}>
            custom: {unit.width}mm
          </span>
        )}
      </div>

      {editingWidth ? (
        <div className="flex w-28 items-center gap-1">
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            step="10"
            autoFocus
            value={draftWidth}
            onChange={(e) => setDraftWidth(e.target.value)}
            onBlur={commitWidth}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitWidth();
              } else if (e.key === "Escape") {
                setEditingWidth(false);
              }
            }}
            className="w-20"
            aria-label={`${unit.name} custom width in mm`}
          />
          <span className="text-xs text-muted-foreground">mm</span>
        </div>
      ) : (
        <Select
          value={String(unit.width)}
          onValueChange={(v) => {
            if (v === CUSTOM) {
              setDraftWidth(String(unit.width));
              setEditingWidth(true);
            } else {
              onWidthChange(unit.id, Number(v));
            }
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {widthOptions.map((w) => (
              <SelectItem key={w} value={String(w)}>
                {w}mm
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM}>Custom…</SelectItem>
          </SelectContent>
        </Select>
      )}

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
