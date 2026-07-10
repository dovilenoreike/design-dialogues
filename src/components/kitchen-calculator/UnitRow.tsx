import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  GripVertical,
  Plus,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  APPLIANCE_ITEMS,
  type CabinetUnit,
  type ProjectAppliance,
  type UnitFinish,
  type UnitType,
  unitHasSink,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { FrontIcon, UnitConfig, accessoriesFor, defaultUnitConfig, type UnitConfigState } from "./UnitConfig";
import { UnitIcon } from "./UnitIcon";
import {
  addableAppliances,
  currentKindOptionId,
  kindOptionById,
  typeForKind,
  unitKind,
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

/**
 * One component-list row. Kind is *derived from contents* — a plain box is
 * Storage; add an appliance and it becomes the matching housing; a sink makes it
 * a sink cabinet. Everything you can put in a unit (appliances, sink, fittings)
 * and the structural shape (corner / tall) live behind one "+" menu; the front
 * look lives behind the front icon.
 */
export function UnitRow({
  unit,
  typeOptions,
  presentEssentials,
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
  // The glyph that was tapped — drives the drop/edit modal. "sink" is a fixture
  // rather than a project appliance, but shares the same modal.
  const [editAppliance, setEditAppliance] = useState<ProjectAppliance | "sink" | null>(null);
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);

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

  const kind = unitKind(unit);
  const currentLabel = kindOptionById(currentKindOptionId(unit))?.label ?? "Storage";

  // A unit holding an appliance the project doesn't declare is a mistake (red).
  const undeclared = (a: ProjectAppliance) => !!declaredAppliances && !declaredAppliances.has(a);

  // ── What the "+" can add ────────────────────────────────────────────────
  // Kind is derived from contents, so appliances can be added to a plain storage
  // box too (it becomes a housing) — not only to an existing housing.
  const canHoldAppliance = kind === "storage" || kind === "housing" || unit.category === "island";
  const assignableIds = APPLIANCE_ITEMS.map((a) => a.id).filter(
    (id) =>
      (declaredAppliances?.has(id) ?? true) &&
      (!(placedAppliances?.has(id) ?? false) || unit.appliances.includes(id)),
  );
  const addable = canHoldAppliance ? addableAppliances(unit.appliances, assignableIds) : [];
  const isEmptyHousing = kind === "housing" && unit.appliances.length === 0;

  // Fittings apply where the interior is usable. A hob sits on the worktop, so
  // its cabinet keeps a full interior (cutlery insert, bin) — as do plain drawer
  // cabinets. An oven / fridge / dishwasher fills the box, so no fittings there.
  const interiorFilled = unit.appliances.some((a) => a !== "hob");
  const accessoryOptions = interiorFilled ? [] : accessoriesFor(unit);
  const currentAccessories = configValue.accessories;
  const activeAccessories = accessoryOptions.filter((o) => currentAccessories.includes(o.id));
  const toggleAccessory = (id: string) =>
    onConfigChange(unit.id, {
      accessories: currentAccessories.includes(id)
        ? currentAccessories.filter((x) => x !== id)
        : [...currentAccessories, id],
    });

  // A sink can sit on a plain low base box (its own dedicated carcass), or ride a
  // corner or island carcass as a fixture. It's offered only while the kitchen
  // has no sink yet (normally just one), and never on a unit that already has it.
  const hasSink = unitHasSink(unit);
  const sinkPlaced = !!presentEssentials?.includes("sink");
  const isLowBox = unit.category === "base" && kind === "storage" && unit.appliances.length === 0;
  const isCornerBase = kind === "corner" && unit.category === "base";
  const isIsland = unit.category === "island";
  const canAddSink = !hasSink && !sinkPlaced && (isLowBox || isCornerBase || isIsland);
  // A plain low box becomes the dedicated sink carcass; corner / island keep their
  // carcass and carry the sink as a fixture flag.
  const addSink = () =>
    isLowBox ? onTypeChange(unit.id, typeForKind("sink", "base")) : onConfigChange(unit.id, { sink: true });
  const removeSink = () =>
    unit.type === "sink"
      ? onTypeChange(unit.id, typeForKind("storage", unit.category))
      : onConfigChange(unit.id, { sink: false });

  // The "+" adds *contents* — appliances, sink, fittings. Each option drops as
  // it's added; when nothing can be added, the "+" disappears. Shape (low / tall
  // / corner) is chosen when the unit is created (in the Add-unit menu), not here.
  // Fittings only appear in the "+" to add the *first* one — once any fitting
  // exists, its 🔧 icon represents all of them (add more / remove happen there).
  const canAddFirstFitting = accessoryOptions.length > 0 && activeAccessories.length === 0;
  const hasAddOptions = addable.length > 0 || canAddSink || canAddFirstFitting;

  // Removing the last appliance leaves a plain box (Storage), not an empty
  // housing — kind follows contents.
  const removeAppliance = (a: ProjectAppliance) => {
    const next = unit.appliances.filter((x) => x !== a);
    if (next.length === 0) onTypeChange(unit.id, typeForKind("storage", unit.category));
    else onApplianceChange(unit.id, next);
  };

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
        {/* The front icon is the way into per-unit appearance (front / shelves). */}
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Configure ${unit.name}`}
              title="Configure front & shelves"
              className="group/icon flex shrink-0 flex-col items-center gap-0.5 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1"
              style={{ ["--tw-ring-color" as string]: "rgba(100,125,117,0.4)" }}
            >
              <FrontIcon front={configValue.front} className="h-9 w-[26px]" />
              <SlidersHorizontal className="h-2.5 w-2.5 opacity-50 transition group-hover/icon:opacity-100" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-medium">
                <UnitIcon unit={unit} size={24} className="text-muted-foreground" />
                {currentLabel}
                <span className="text-sm font-normal text-muted-foreground">· {unit.width}mm</span>
              </DialogTitle>
              <DialogDescription>Set the front layout and shelves.</DialogDescription>
            </DialogHeader>
            <UnitConfig unit={unit} value={configValue} onChange={handleConfigChange} />
          </DialogContent>
        </Dialog>

        {/* Contents — sink / appliance glyphs, a fittings count, and the "+".
            Kind is derived and read from the glyphs, so no text label. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {hasSink && (
            <button
              type="button"
              onClick={() => setEditAppliance("sink")}
              aria-label="Edit sink"
              title="Sink — tap to remove"
              className="inline-flex items-center rounded-full px-1.5 py-1 transition hover:ring-1 focus-visible:outline-none focus-visible:ring-1"
              style={{
                backgroundColor: "rgba(74,107,138,0.14)",
                color: "#4a6b8a",
                ["--tw-ring-color" as string]: "rgba(74,107,138,0.4)",
              }}
            >
              <ApplianceGlyph id="sink" size={15} />
            </button>
          )}
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
                  ["--tw-ring-color" as string]: bad ? "rgba(154,52,18,0.4)" : "rgba(100,125,117,0.4)",
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

          {/* Fittings collapse into one slate chip with a count; tap to edit or
              remove. Adding is done from the "+" (until all are used). */}
          {activeAccessories.length > 0 && (
            <button
              type="button"
              onClick={() => setAccessoriesOpen(true)}
              aria-label="Edit fittings"
              title={`Fittings: ${activeAccessories.map((a) => a.label).join(", ")} — tap to edit`}
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[11px] font-medium transition hover:ring-1 focus-visible:outline-none focus-visible:ring-1"
              style={{
                backgroundColor: "rgba(100,116,139,0.16)",
                color: "#475569",
                ["--tw-ring-color" as string]: "rgba(100,116,139,0.45)",
              }}
            >
              <Wrench className="h-3 w-3" />
              {activeAccessories.length}
            </button>
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

          {hasAddOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Add to unit"
                  title="Add appliance, sink, fitting or shape"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed transition hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-1"
                  style={{
                    color: isEmptyHousing ? "#ca8a04" : "#647d75",
                    borderColor: isEmptyHousing ? "rgba(202,138,4,0.5)" : "rgba(100,125,117,0.5)",
                    ["--tw-ring-color" as string]: "rgba(100,125,117,0.4)",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {addable.length > 0 && (
                  <>
                    <DropdownMenuLabel>{unit.appliances.length ? "Add appliance" : "Appliance"}</DropdownMenuLabel>
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
                  </>
                )}

                {canAddSink && (
                  <DropdownMenuItem className="gap-2" onSelect={addSink}>
                    <ApplianceGlyph id="sink" size={15} />
                    Sink
                  </DropdownMenuItem>
                )}

                {canAddFirstFitting && (
                  <>
                    {(addable.length > 0 || canAddSink) && <DropdownMenuSeparator />}
                    <DropdownMenuItem className="gap-2" onSelect={() => setAccessoriesOpen(true)}>
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      Fittings…
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tapping a sink / appliance glyph opens this modal to remove it. */}
        <Dialog open={editAppliance !== null} onOpenChange={(open) => !open && setEditAppliance(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-medium">
                {editAppliance && (
                  <ApplianceGlyph id={editAppliance} size={20} className="text-muted-foreground" />
                )}
                {editAppliance === "sink"
                  ? "Sink"
                  : editAppliance
                    ? APPLIANCE_LABEL[editAppliance] ?? editAppliance
                    : ""}
              </DialogTitle>
              <DialogDescription>
                {editAppliance === "sink"
                  ? unit.type === "sink"
                    ? "Remove the sink? This cabinet becomes plain storage."
                    : "Remove the sink from this cabinet? The carcass stays as it is."
                  : "Remove this appliance from the unit? It stays available to place elsewhere."}
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
                  if (editAppliance === "sink") {
                    removeSink();
                  } else if (editAppliance) {
                    removeAppliance(editAppliance);
                  }
                  setEditAppliance(null);
                }}
              >
                Remove
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fittings editor — add/remove internal accessories (the "🔧 N" icon and
            the "+" menu both open this). */}
        <Dialog open={accessoriesOpen} onOpenChange={setAccessoriesOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-lg font-medium">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Fittings
              </DialogTitle>
              <DialogDescription>Internal accessories for this cabinet.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5">
              {accessoryOptions.map((acc) => {
                const active = currentAccessories.includes(acc.id);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => toggleAccessory(acc.id)}
                    className="rounded-full border px-3 py-1.5 text-xs transition"
                    style={
                      active ? { backgroundColor: "#647d75", borderColor: "#647d75", color: "#fff" } : undefined
                    }
                  >
                    {acc.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setAccessoriesOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
