import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type UnitType } from "@/lib/kitchen-calculator";
import { UnitTypeIcon } from "./UnitIcon";
import {
  categoriesOf,
  kindGroupsForCategories,
  typeForKind,
  type KindOption,
} from "./unitKind";

interface AddUnitMenuProps {
  label: string;
  typeOptions: UnitType[];
  presentEssentials?: UnitType[];
  onAdd: (type: UnitType) => void;
}

/**
 * "Add unit" control that lets the user pick which carcass kind to add (Storage,
 * Sink, Appliance housing, Corner — the appliance itself is chosen afterwards in
 * the config). A single-option section (island) renders a plain button.
 */
export function AddUnitMenu({ label, typeOptions, onAdd }: AddUnitMenuProps) {
  const trigger = (
    <Button variant="ghost" size="sm" className="gap-1.5" style={{ color: "#647d75" }}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );

  // One choice — no point showing a menu.
  if (typeOptions.length <= 1) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        style={{ color: "#647d75" }}
        onClick={() => typeOptions[0] && onAdd(typeOptions[0])}
      >
        <Plus className="h-4 w-4" />
        {label}
      </Button>
    );
  }

  const groups = kindGroupsForCategories(categoriesOf(typeOptions));

  const renderItem = (opt: KindOption) => {
    const type = typeForKind(opt.kind, opt.category);
    return (
      <DropdownMenuItem key={opt.id} className="gap-2" onSelect={() => onAdd(type)}>
        <UnitTypeIcon type={type} size={22} className="shrink-0 text-muted-foreground" />
        <span className="flex-1">{opt.label}</span>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {groups.map((g, gi) => (
          <div key={g.label ?? `g${gi}`}>
            {gi > 0 && <DropdownMenuSeparator />}
            {g.label && <DropdownMenuLabel>{g.label}</DropdownMenuLabel>}
            {g.items.map(renderItem)}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
