import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type UnitType } from "@/lib/kitchen-calculator";
import { UnitTypeIcon } from "./UnitIcon";
import { categoriesOf, typeForKind } from "./unitKind";

interface AddUnitMenuProps {
  label: string;
  typeOptions: UnitType[];
  presentEssentials?: UnitType[];
  onAdd: (type: UnitType) => void;
}

/**
 * "Add unit" control. The only choice at creation time is the carcass *shape*
 * (Low / Tall / Corner) — a plain box. What it becomes (a housing, a sink) then
 * follows from what you add to it via the row's "+" menu. A single-option
 * section (island) renders a plain button.
 */
export function AddUnitMenu({ label, typeOptions, onAdd }: AddUnitMenuProps) {
  const cats = categoriesOf(typeOptions);
  const shapes: { id: string; label: string; type: UnitType }[] = [];
  if (cats.has("base")) shapes.push({ id: "low", label: "Low unit", type: typeForKind("storage", "base") });
  if (cats.has("tall")) shapes.push({ id: "tall", label: "Tall unit", type: typeForKind("storage", "tall") });
  if (cats.has("base")) shapes.push({ id: "cornerBase", label: "Corner", type: typeForKind("corner", "base") });
  if (cats.has("wall")) {
    shapes.push({ id: "wall", label: "Wall cabinet", type: typeForKind("storage", "wall") });
    shapes.push({ id: "cornerWall", label: "Corner", type: typeForKind("corner", "wall") });
  }
  if (cats.has("island")) shapes.push({ id: "island", label: "Island", type: typeForKind("storage", "island") });

  // One choice (island) — no point showing a menu.
  if (shapes.length <= 1) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        style={{ color: "#647d75" }}
        onClick={() => shapes[0] && onAdd(shapes[0].type)}
      >
        <Plus className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" style={{ color: "#647d75" }}>
          <Plus className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {shapes.map((s) => (
          <DropdownMenuItem key={s.id} className="gap-2" onSelect={() => onAdd(s.type)}>
            <UnitTypeIcon type={s.type} size={22} className="shrink-0 text-muted-foreground" />
            <span className="flex-1">{s.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
