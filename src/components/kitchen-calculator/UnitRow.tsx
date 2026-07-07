import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  /** Show the drag handle (false when the section has a single unit). */
  sortable?: boolean;
  onTypeChange: (id: string, type: UnitType) => void;
  onWidthChange: (id: string, width: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

/** One component-list row: drag handle + type swap + width + ×quantity + remove. */
export function UnitRow({
  unit,
  typeOptions,
  presentEssentials = [],
  sortable = false,
  onTypeChange,
  onWidthChange,
  onQuantityChange,
  onRemove,
}: UnitRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unit.id,
  });
  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };
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

  // Quantity: hidden at ×1 (just a "+ copies" affordance); a small number field
  // once there's more than one. Commit on blur/Enter, clamp to ≥ 1.
  const [qtyDraft, setQtyDraft] = useState(String(unit.quantity));
  const [editingQty, setEditingQty] = useState(false);
  useEffect(() => setQtyDraft(String(unit.quantity)), [unit.quantity]);
  const showQtyField = editingQty || unit.quantity > 1;
  const commitQty = () => {
    const value = Math.round(Number(qtyDraft));
    if (Number.isFinite(value) && value >= 1) {
      onQuantityChange(unit.id, value);
      if (value === 1) setEditingQty(false);
    } else {
      setQtyDraft(String(unit.quantity));
      setEditingQty(false);
    }
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
    <div ref={setNodeRef} style={rowStyle} className="flex items-center gap-2 bg-background py-2">
      {sortable ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${unit.name}`}
          className="shrink-0 cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
      <div className="flex flex-1 items-center gap-2">
        {/* The unit thumbnail is the way into per-unit configuration. */}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Configure ${unit.name}`}
              title="Configure unit"
              className="group/icon shrink-0 rounded-md p-0.5 text-muted-foreground transition hover:text-foreground hover:ring-1 focus-visible:outline-none focus-visible:ring-1"
              style={{ ["--tw-ring-color" as string]: "rgba(100,125,117,0.4)" }}
            >
              <UnitIcon unit={unit} size={40} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-medium">
                <UnitTypeIcon type={unit.type} size={24} className="text-muted-foreground" />
                {unit.name}
              </DialogTitle>
              <DialogDescription>
                Doors, drawers, shelves and internal fittings — set per unit.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
              <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Here you will configure this unit.</p>
              <span className="text-[11px] font-medium" style={{ color: "#ca8a04" }}>
                Coming soon
              </span>
            </div>
          </DialogContent>
        </Dialog>
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
          <SelectTrigger
            className="w-28"
            style={unit.isCustomWidth ? { color: "#ca8a04", borderColor: "#ca8a04" } : undefined}
            title={unit.isCustomWidth ? "Custom width" : undefined}
          >
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

      {/* Quantity — hidden at ×1; a compact field once a line stands for several. */}
      <div className="flex w-20 shrink-0 items-center justify-end gap-1">
        {showQtyField ? (
          <>
            <span className="text-sm text-muted-foreground">×</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              autoFocus={editingQty}
              value={qtyDraft}
              onChange={(e) => setQtyDraft(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={commitQty}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  setQtyDraft(String(unit.quantity));
                  setEditingQty(false);
                }
              }}
              className="h-9 w-14 text-center"
              aria-label={`${unit.name} quantity`}
            />
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setEditingQty(true)}
            aria-label={`Set quantity for ${unit.name}`}
            title="Set quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

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
