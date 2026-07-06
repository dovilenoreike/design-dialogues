import { useState } from "react";
import { Check, X } from "lucide-react";
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
import {
  ESSENTIAL_TYPES,
  UNIT_LABELS,
  type CabinetUnit,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { UnitIcon, UnitTypeIcon } from "./UnitIcon";

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

  // Surface the singleton essentials (sink/hob/fridge) in their own group so the
  // must-have units stand out, and flag ones already placed elsewhere.
  const essentialOpts = ESSENTIAL_TYPES.filter((t) => typeOptions.includes(t));
  const otherOpts = typeOptions.filter((t) => !ESSENTIAL_TYPES.includes(t));

  const renderOption = (t: UnitType) => {
    const alreadyPlaced = presentEssentials.includes(t) && t !== unit.type;
    return (
      <SelectItem key={t} value={t}>
        <span className="flex items-center gap-2">
          <UnitTypeIcon type={t} size={22} className="shrink-0 text-muted-foreground" />
          <span>{UNIT_LABELS[t]}</span>
          {alreadyPlaced && (
            <span
              className="ml-1 flex items-center gap-0.5 text-[10px] font-medium"
              style={{ color: "#647d75" }}
            >
              <Check className="h-3 w-3" /> in project
            </span>
          )}
        </span>
      </SelectItem>
    );
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex flex-1 items-center gap-2">
        <UnitIcon unit={unit} size={40} className="shrink-0 text-muted-foreground" />
        <Select value={unit.type} onValueChange={(v) => onTypeChange(unit.id, v as UnitType)}>
          <SelectTrigger className="w-52">
            <SelectValue>{UNIT_LABELS[unit.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {essentialOpts.length > 0 ? (
              <>
                <SelectGroup>
                  <SelectLabel>Main appliances</SelectLabel>
                  {essentialOpts.map(renderOption)}
                </SelectGroup>
                {otherOpts.length > 0 && (
                  <SelectGroup>
                    <SelectSeparator />
                    <SelectLabel>Cabinets</SelectLabel>
                    {otherOpts.map(renderOption)}
                  </SelectGroup>
                )}
              </>
            ) : (
              typeOptions.map(renderOption)
            )}
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
