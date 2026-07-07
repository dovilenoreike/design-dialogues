import { AlertTriangle, Check } from "lucide-react";
import { APPLIANCE_ITEMS, type ProjectAppliance } from "@/lib/kitchen-calculator";

/**
 * Project-level appliance checklist — declares which appliances the kitchen
 * includes. Sits beside the hardware grade at the top of the estimate. The set
 * is the intent the generator fulfils (every marked appliance is placed in a
 * housing unit on Generate). The taxonomy itself lives in the engine
 * (`lib/kitchen-calculator/appliances.ts`); this is just its UI.
 */

const SAGE = "#647d75";
const OCHRE = "#ca8a04";

interface ApplianceSelectorProps {
  selected: Set<ProjectAppliance>;
  onChange: (next: Set<ProjectAppliance>) => void;
  /** Appliances actually placed in a unit — used to flag declared-but-missing. */
  placed?: Set<ProjectAppliance>;
}

export function ApplianceSelector({ selected, onChange, placed }: ApplianceSelectorProps) {
  const toggle = (id: ProjectAppliance) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Appliances</span>
        <div className="flex flex-wrap gap-1.5">
          {APPLIANCE_ITEMS.map((a) => {
            const active = selected.has(a.id);
            const isPlaced = placed?.has(a.id) ?? false;
            const isMissing = active && !isPlaced;
            const style = active
              ? isPlaced
                ? { backgroundColor: SAGE, borderColor: SAGE, color: "#fff" }
                : { borderColor: OCHRE, color: OCHRE }
              : undefined;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                aria-pressed={active}
                title={isMissing ? "Declared but not placed in any unit yet" : undefined}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition"
                style={style}
              >
                {active && isPlaced && <Check className="h-3 w-3" />}
                {isMissing && <AlertTriangle className="h-3 w-3" />}
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
