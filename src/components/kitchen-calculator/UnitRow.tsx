import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, GripVertical, Plus, X } from "lucide-react";
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
import {
  projectAppliancesFor,
  UNIT_LABELS,
  type CabinetUnit,
  type ProjectAppliance,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { EssentialBadge } from "./EssentialBadge";
import { UnitConfig, applianceLabel, defaultUnitConfig, type UnitConfigState } from "./UnitConfig";
import { UnitIcon, UnitTypeIcon } from "./UnitIcon";
import { buildTypeGroups } from "./unitGroups";

const WIDTH_OPTIONS = [300, 400, 500, 600, 800, 1000];
const CUSTOM = "custom";

interface UnitRowProps {
  unit: CabinetUnit;
  typeOptions: UnitType[];
  /** Essential types already placed somewhere in the kitchen (sink/hob/fridge). */
  presentEssentials?: UnitType[];
  /** Appliances the project declares — the master set. A unit configured for an
   *  appliance outside this set is flagged as a mistake on its badge. */
  declaredAppliances?: Set<ProjectAppliance>;
  /** Show the drag handle (false when the section has a single unit). */
  sortable?: boolean;
  onTypeChange: (id: string, type: UnitType) => void;
  onApplianceChange: (id: string, appliance: string) => void;
  onWidthChange: (id: string, width: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

/** One component-list row: drag handle + type swap + width + ×quantity + remove. */
export function UnitRow({
  unit,
  typeOptions,
  presentEssentials = [],
  declaredAppliances,
  sortable = false,
  onTypeChange,
  onApplianceChange,
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

  // Per-unit configuration (visual mock) — reset to type defaults on a type swap.
  // Appliance is the exception: it lives on the unit (page-level, for the tracker),
  // so it's read from `unit.appliance` and changes route up via onApplianceChange.
  const [config, setConfig] = useState<UnitConfigState>(() => defaultUnitConfig(unit));
  useEffect(() => setConfig(defaultUnitConfig(unit)), [unit.type]); // eslint-disable-line react-hooks/exhaustive-deps
  const configValue: UnitConfigState = { ...config, appliance: unit.appliance };
  const handleConfigChange = (next: UnitConfigState) => {
    if (next.appliance !== unit.appliance) onApplianceChange(unit.id, next.appliance);
    setConfig(next);
  };

  // Grouped picker: main appliances, then base cabinets, then tall units.
  const groups = buildTypeGroups(typeOptions);

  // The project settings are the master list: a unit configured for an appliance
  // that isn't declared there is a mistake — its badge turns red.
  const applianceUndeclared =
    declaredAppliances !== undefined &&
    projectAppliancesFor(unit.appliance).some((p) => !declaredAppliances.has(p));

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
                <span className="text-sm font-normal text-muted-foreground">· {unit.width}mm</span>
              </DialogTitle>
              <DialogDescription>Set the appliance, front layout and fittings.</DialogDescription>
            </DialogHeader>
            <UnitConfig unit={unit} value={configValue} onChange={handleConfigChange} />
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
        {/* Read-only appliance badge — set together with the front in the config dialog.
            Red when the appliance isn't in the project settings (the master list). */}
        {unit.appliance !== "none" && (
          <span
            className="hidden items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-flex"
            style={
              applianceUndeclared
                ? { backgroundColor: "rgba(154,52,18,0.12)", color: "#9a3412" }
                : { backgroundColor: "rgba(100,125,117,0.12)", color: "#647d75" }
            }
            title={
              applianceUndeclared
                ? "Not in the project settings — add it there, or change this unit's appliance"
                : "Appliance — change it in the unit configuration"
            }
          >
            {applianceUndeclared && <AlertTriangle className="h-3 w-3" />}
            {applianceLabel(unit.appliance)}
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
