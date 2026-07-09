import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, ChevronDown, Copy, GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  APPLIANCE_ITEMS,
  type CabinetUnit,
  type ProjectAppliance,
  type UnitFinish,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { UnitConfig, defaultUnitConfig, type UnitConfigState } from "./UnitConfig";
import { UnitIcon } from "./UnitIcon";
import {
  addableAppliances,
  categoriesOf,
  currentKindOptionId,
  kindGroupsForCategories,
  kindOptionById,
  typeForKind,
  unitKind,
  type KindOption,
} from "./unitKind";

const APPLIANCE_LABEL: Record<string, string> = Object.fromEntries(
  APPLIANCE_ITEMS.map((a) => [a.id, a.label]),
);

const WIDTH_OPTIONS = [300, 400, 500, 600, 800, 1000];

interface UnitRowProps {
  unit: CabinetUnit;
  typeOptions: UnitType[];
  /** Essential types already placed somewhere in the kitchen (sink/hob/fridge). */
  presentEssentials?: UnitType[];
  /** Appliances the project declares — the master set. A unit holding an
   *  appliance outside this set is flagged as a mistake on its badge. */
  declaredAppliances?: Set<ProjectAppliance>;
  /** Appliances already placed anywhere — the config offers only what's free. */
  placedAppliances?: Set<ProjectAppliance>;
  /** Show the drag handle (false when the section has a single unit). */
  sortable?: boolean;
  onTypeChange: (id: string, type: UnitType) => void;
  onApplianceChange: (id: string, appliances: ProjectAppliance[]) => void;
  onConfigChange: (id: string, config: UnitFinish) => void;
  onWidthChange: (id: string, width: number) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

/** One component-list row: drag handle + type swap + width + ×quantity + remove. */
export function UnitRow({
  unit,
  typeOptions,
  declaredAppliances,
  placedAppliances,
  sortable = false,
  onTypeChange,
  onApplianceChange,
  onConfigChange,
  onWidthChange,
  onQuantityChange,
  onRemove,
  onDuplicate,
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
  // Width is typed directly in millimetres — bespoke sizes are the norm, so
  // free entry is the primary path and the standard sizes are one tap away in
  // the adjacent menu. Draft mirrors the unit but never snaps back mid-edit.
  const [widthDraft, setWidthDraft] = useState(String(unit.width));
  const widthFocused = useRef(false);
  useEffect(() => {
    if (!widthFocused.current) setWidthDraft(String(unit.width));
  }, [unit.width]);
  const commitWidth = (raw: string) => {
    const value = Math.round(Number(raw));
    if (Number.isFinite(value) && value > 0) onWidthChange(unit.id, value);
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

  const [configOpen, setConfigOpen] = useState(false);
  // The appliance whose glyph was tapped — drives the drop/edit modal.
  const [editAppliance, setEditAppliance] = useState<ProjectAppliance | null>(null);

  // The interior config lives on the unit now (so it survives duplication and
  // reordering); fall back to the type defaults for any field left unset.
  const configDefaults = defaultUnitConfig(unit);
  const configValue: UnitConfigState = {
    appliances: unit.appliances,
    front: unit.front ?? configDefaults.front,
    shelves: unit.shelves ?? configDefaults.shelves,
    accessories: unit.accessories ?? configDefaults.accessories,
  };
  const handleConfigChange = (next: UnitConfigState) => {
    // Appliances drive the carcass type (retyped — and the interior re-defaulted
    // — in the store); front/shelves/accessories persist verbatim. An appliance
    // toggle takes the appliance path; the new type re-defaults the rest.
    const appliancesChanged =
      next.appliances.length !== unit.appliances.length ||
      next.appliances.some((a) => !unit.appliances.includes(a));
    if (appliancesChanged) {
      onApplianceChange(unit.id, next.appliances);
    } else {
      onConfigChange(unit.id, {
        front: next.front,
        shelves: next.shelves,
        accessories: next.accessories,
      });
    }
  };

  // The picker offers just the coarse carcass kinds (Sink / Storage / Appliance
  // housing / Corner), grouped low/tall. The appliance itself is chosen in the
  // config — so this list stays tiny and stable.
  const groups = kindGroupsForCategories(categoriesOf(typeOptions));
  const currentKindId = currentKindOptionId(unit);
  const currentLabel = kindOptionById(currentKindId)?.label ?? "Storage";

  const selectKind = (id: string) => {
    const opt = kindOptionById(id);
    if (!opt) return;
    onTypeChange(unit.id, typeForKind(opt.kind, opt.category));
    // Picking "Appliance housing" opens the config so you can assign the appliance.
    if (opt.kind === "housing") setConfigOpen(true);
  };

  // A unit holding an appliance the project doesn't declare is a mistake (red).
  const undeclared = (a: ProjectAppliance) => !!declaredAppliances && !declaredAppliances.has(a);
  const isEmptyHousing = unitKind(unit) === "housing" && unit.appliances.length === 0;

  // Inline "+" affordance. Only housings and islands hold appliances; the menu
  // offers what's still assignable (declared, not placed elsewhere) that forms a
  // valid state — the first appliance when empty, or the free pairing partner.
  const canHoldAppliance = unitKind(unit) === "housing" || unit.category === "island";
  const assignableIds = APPLIANCE_ITEMS.map((a) => a.id).filter(
    (id) =>
      (declaredAppliances?.has(id) ?? true) &&
      (!(placedAppliances?.has(id) ?? false) || unit.appliances.includes(id)),
  );
  const addable = canHoldAppliance ? addableAppliances(unit.appliances, assignableIds) : [];

  const renderOption = (opt: KindOption) => (
    <SelectItem key={opt.id} value={opt.id}>
      {opt.label}
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
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
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
                <UnitIcon unit={unit} size={24} className="text-muted-foreground" />
                {currentLabel}
                <span className="text-sm font-normal text-muted-foreground">· {unit.width}mm</span>
              </DialogTitle>
              <DialogDescription>Set the appliances, front layout and fittings.</DialogDescription>
            </DialogHeader>
            <UnitConfig unit={unit} value={configValue} onChange={handleConfigChange} />
          </DialogContent>
        </Dialog>
        {/* Atomic appliance glyphs — sit next to the cabinet icon so the box +
            what's inside it read as one picture. Fixed-width slot so the kind
            dropdowns still line up down the column. Sage when declared, red when
            the appliance isn't in the project settings. */}
        <div className="flex w-20 shrink-0 items-center gap-1">
          {unit.appliances.map((a) => {
            const bad = undeclared(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => setEditAppliance(a)}
                aria-label={`Edit ${APPLIANCE_LABEL[a] ?? a}`}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-1 transition hover:ring-1 focus-visible:outline-none focus-visible:ring-1"
                style={{
                  ...(bad
                    ? { backgroundColor: "rgba(154,52,18,0.12)", color: "#9a3412" }
                    : { backgroundColor: "rgba(100,125,117,0.12)", color: "#647d75" }),
                  ["--tw-ring-color" as string]: bad
                    ? "rgba(154,52,18,0.4)"
                    : "rgba(100,125,117,0.4)",
                }}
                title={
                  bad
                    ? `${APPLIANCE_LABEL[a] ?? a} — not in the project settings; tap to remove it here`
                    : `${APPLIANCE_LABEL[a] ?? a} — tap to remove`
                }
              >
                {bad && <AlertTriangle className="h-3 w-3" />}
                <ApplianceGlyph id={a} size={15} />
              </button>
            );
          })}
          {addable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={isEmptyHousing ? "Add appliance" : "Add paired appliance"}
                  title={isEmptyHousing ? "Add appliance" : "Add paired appliance"}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed transition hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-1"
                  style={{
                    // Ochre while an empty housing still needs its appliance;
                    // sage for the optional pairing add on an already-filled unit.
                    color: isEmptyHousing ? "#ca8a04" : "#647d75",
                    borderColor: isEmptyHousing
                      ? "rgba(202,138,4,0.5)"
                      : "rgba(100,125,117,0.5)",
                    ["--tw-ring-color" as string]: "rgba(100,125,117,0.4)",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {addable.map((a) => (
                  <DropdownMenuItem
                    key={a}
                    className="gap-2"
                    onSelect={() => onApplianceChange(unit.id, [...unit.appliances, a])}
                  >
                    <ApplianceGlyph id={a} size={15} />
                    {APPLIANCE_LABEL[a] ?? a}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isEmptyHousing && addable.length === 0 && (
            <span
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: "rgba(202,138,4,0.12)", color: "#ca8a04" }}
              title="Empty housing — all declared appliances are placed elsewhere; add more in the project settings"
            >
              <AlertTriangle className="h-3 w-3" />
              Empty
            </span>
          )}
        </div>

        {/* Tapping an appliance glyph opens this modal. For now it only offers to
            drop the appliance; a later step will let you swap it for another. */}
        <Dialog
          open={editAppliance !== null}
          onOpenChange={(open) => !open && setEditAppliance(null)}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-medium">
                {editAppliance && (
                  <ApplianceGlyph id={editAppliance} size={20} className="text-muted-foreground" />
                )}
                {editAppliance ? APPLIANCE_LABEL[editAppliance] ?? editAppliance : ""}
              </DialogTitle>
              <DialogDescription>
                Remove this appliance from the unit? It stays available to place elsewhere.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditAppliance(null)}>
                Cancel
              </Button>
              <Button
                className="text-white"
                style={{ backgroundColor: "#9a3412" }}
                onClick={() => {
                  if (editAppliance)
                    onApplianceChange(
                      unit.id,
                      unit.appliances.filter((x) => x !== editAppliance),
                    );
                  setEditAppliance(null);
                }}
              >
                Remove
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Select value={currentKindId} onValueChange={selectKind}>
          <SelectTrigger className="w-52 [&>span]:truncate [&>span]:text-left">
            <SelectValue>{currentLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {groups.map((g, gi) => (
              <SelectGroup key={g.label ?? `g${gi}`}>
                {gi > 0 && <SelectSeparator />}
                {g.label && <SelectLabel>{g.label}</SelectLabel>}
                {g.items.map(renderOption)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-32 shrink-0 items-center gap-1">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={10}
          value={widthDraft}
          onFocus={(e) => {
            widthFocused.current = true;
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setWidthDraft(e.target.value);
            commitWidth(e.target.value);
          }}
          onBlur={(e) => {
            widthFocused.current = false;
            const value = Math.round(Number(e.target.value));
            if (!Number.isFinite(value) || value <= 0) setWidthDraft(String(unit.width));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-9 w-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label={`${unit.name} width in millimetres`}
        />
        <span className="text-xs text-muted-foreground">mm</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Standard widths"
              title="Standard widths"
              className="flex h-9 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-1"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {WIDTH_OPTIONS.map((w) => (
              <DropdownMenuItem key={w} onSelect={() => onWidthChange(unit.id, w)}>
                {w} mm
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
        onClick={() => onDuplicate(unit.id)}
        aria-label={`Duplicate ${unit.name}`}
        title="Duplicate unit"
        className="text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-4 w-4" />
      </Button>

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
