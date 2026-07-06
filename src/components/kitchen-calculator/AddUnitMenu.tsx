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
import { UNIT_LABELS, type UnitType } from "@/lib/kitchen-calculator";
import { EssentialBadge } from "./EssentialBadge";
import { UnitTypeIcon } from "./UnitIcon";
import { buildTypeGroups } from "./unitGroups";

interface AddUnitMenuProps {
  label: string;
  typeOptions: UnitType[];
  presentEssentials?: UnitType[];
  onAdd: (type: UnitType) => void;
}

/**
 * "Add unit" control that lets the user pick which type to add. A single-option
 * section (e.g. island) renders a plain button; otherwise a grouped, icon'd menu.
 */
export function AddUnitMenu({ label, typeOptions, presentEssentials = [], onAdd }: AddUnitMenuProps) {
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

  const groups = buildTypeGroups(typeOptions);

  const renderItem = (t: UnitType) => (
    <DropdownMenuItem key={t} className="gap-2" onSelect={() => onAdd(t)}>
      <UnitTypeIcon type={t} size={22} className="shrink-0 text-muted-foreground" />
      <span className="flex-1">{UNIT_LABELS[t]}</span>
      <EssentialBadge type={t} present={presentEssentials.includes(t)} />
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {groups.map((g, gi) => (
          <div key={g.label ?? `g${gi}`}>
            {gi > 0 && <DropdownMenuSeparator />}
            {g.label && <DropdownMenuLabel>{g.label}</DropdownMenuLabel>}
            {g.types.map(renderItem)}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
