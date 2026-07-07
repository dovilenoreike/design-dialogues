import { AlertTriangle, Check } from "lucide-react";

/**
 * Project-level appliance checklist — declares which appliances the kitchen
 * includes. Sits beside the hardware grade at the top of the estimate. The set
 * is the intent the calculator can later help fulfil (every marked appliance
 * should end up housed in a unit). Standard appliances are on by default;
 * microwave is optional.
 */

export type ProjectAppliance = "fridge" | "oven" | "hob" | "hood" | "dishwasher" | "microwave";

export const APPLIANCE_ITEMS: { id: ProjectAppliance; label: string; default: boolean }[] = [
  { id: "fridge", label: "Fridge", default: true },
  { id: "oven", label: "Oven", default: true },
  { id: "hob", label: "Hob", default: true },
  { id: "hood", label: "Hood", default: true },
  { id: "dishwasher", label: "Dishwasher", default: true },
  { id: "microwave", label: "Microwave", default: false },
];

export const defaultAppliances = (): Set<ProjectAppliance> =>
  new Set(APPLIANCE_ITEMS.filter((a) => a.default).map((a) => a.id));

// Maps a unit's integrated-appliance id (UnitConfig) to the project appliances it
// fulfils. "Hob + oven" satisfies both hob and oven; sink/none satisfy nothing here.
const UNIT_APPLIANCE_TO_PROJECT: Record<string, ProjectAppliance[]> = {
  fridge: ["fridge"],
  oven: ["oven"],
  hob: ["hob"],
  hobOven: ["hob", "oven"],
  dishwasher: ["dishwasher"],
  microwave: ["microwave"],
  extractor: ["hood"],
  sink: [],
  none: [],
};

export const projectAppliancesFor = (unitApplianceId: string): ProjectAppliance[] =>
  UNIT_APPLIANCE_TO_PROJECT[unitApplianceId] ?? [];

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

  const missing = APPLIANCE_ITEMS.filter((a) => selected.has(a.id) && !placed?.has(a.id));

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
      {missing.length > 0 && (
        <p className="text-[11px]" style={{ color: OCHRE }}>
          Not placed yet: {missing.map((a) => a.label).join(", ")}
        </p>
      )}
    </div>
  );
}
