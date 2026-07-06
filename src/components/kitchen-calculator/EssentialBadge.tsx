import { ESSENTIAL_TYPES, type UnitType } from "@/lib/kitchen-calculator";

interface EssentialBadgeProps {
  type: UnitType;
  /** True when this appliance is present somewhere in the kitchen. */
  present?: boolean;
}

/**
 * Status bubble shown on the singleton essentials (sink/hob/fridge) in the
 * pickers: sage when the appliance is in the project, ochre when it's still
 * missing. Orthogonal to the Base/Tall grouping, so the fridge can be a tall
 * unit *and* carry this badge.
 */
export function EssentialBadge({ type, present = false }: EssentialBadgeProps) {
  if (!ESSENTIAL_TYPES.includes(type)) return null;
  const color = present ? "#647d75" : "#ca8a04";
  return (
    <span className="ml-1 flex items-center gap-1 text-[10px] font-medium" style={{ color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      appliance
    </span>
  );
}
