import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ESSENTIAL_TYPES, UNIT_LABELS, type UnitType } from "@/lib/kitchen-calculator";
import { UnitTypeIcon } from "./UnitIcon";

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

  const essentialOpts = ESSENTIAL_TYPES.filter((t) => typeOptions.includes(t));
  const otherOpts = typeOptions.filter((t) => !ESSENTIAL_TYPES.includes(t));

  const renderItem = (t: UnitType) => (
    <DropdownMenuItem key={t} className="gap-2" onSelect={() => onAdd(t)}>
      <UnitTypeIcon type={t} size={22} className="shrink-0 text-muted-foreground" />
      <span className="flex-1">{UNIT_LABELS[t]}</span>
      {presentEssentials.includes(t) && (
        <span
          className="flex items-center gap-0.5 text-[10px] font-medium"
          style={{ color: "#647d75" }}
        >
          <Check className="h-3 w-3" /> in project
        </span>
      )}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {essentialOpts.length > 0 ? (
          <>
            <DropdownMenuLabel>Main appliances</DropdownMenuLabel>
            {essentialOpts.map(renderItem)}
            {otherOpts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Cabinets</DropdownMenuLabel>
                {otherOpts.map(renderItem)}
              </>
            )}
          </>
        ) : (
          typeOptions.map(renderItem)
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
