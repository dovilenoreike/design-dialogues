import { AlertTriangle, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OCHRE = "#ca8a04";

export interface MissingItem {
  /** Stable key (appliance id or unit type). */
  key: string;
  /** Display name, e.g. "Dishwasher". */
  label: string;
  /** Add the item's housing to the given run. */
  onAdd: (runId: string) => void;
  /** Drop the requirement (deselect the appliance / mark the fixture not needed). */
  onDismiss: () => void;
  /** Ghost-button copy for the dismiss action. */
  dismissLabel: string;
}

interface MissingUnitsAlertProps {
  items: MissingItem[];
  /** Runs the item can be added to. One run → single button; many → a run picker. */
  runs: { id: string; label: string }[];
}

/**
 * Prominent, action-oriented notice for things the project declares but the
 * kitchen doesn't have yet — a missing appliance is a serious gap, so this is a
 * full card (not a thin line) with a primary "Add …" call to action per item.
 * Structured as a generic action list so future fixes (e.g. overfill) can join.
 * Returns null when there's nothing to act on.
 */
export function MissingUnitsAlert({ items, runs }: MissingUnitsAlertProps) {
  if (items.length === 0) return null;

  const singleRun = runs.length <= 1;
  const targetRunId = runs[0]?.id;

  return (
    <div
      className="rounded-lg border-2 px-5 py-4"
      style={{ borderColor: OCHRE, backgroundColor: "rgba(202,138,4,0.07)" }}
      role="alert"
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: OCHRE }} />
        <h3 className="font-serif text-base font-medium" style={{ color: OCHRE }}>
          {items.length === 1 ? "An appliance is missing" : "Appliances are missing"}
        </h3>
      </div>
      <p className="mt-1 pl-7 text-sm" style={{ color: OCHRE }}>
        These are in the project but not yet placed in the kitchen. Add each one, or drop it from the
        project.
      </p>

      <div className="mt-3 flex flex-col gap-2 pl-7">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2"
          >
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            {singleRun ? (
              <Button
                size="sm"
                onClick={() => targetRunId && item.onAdd(targetRunId)}
                disabled={!targetRunId}
                className="shrink-0 gap-1.5 text-white"
                style={{ backgroundColor: OCHRE }}
              >
                <Plus className="h-4 w-4" />
                Add {item.label.toLowerCase()}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5 text-white"
                    style={{ backgroundColor: OCHRE }}
                  >
                    <Plus className="h-4 w-4" />
                    Add {item.label.toLowerCase()}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {runs.map((r) => (
                    <DropdownMenuItem key={r.id} onSelect={() => item.onAdd(r.id)}>
                      Add to {r.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onDismiss}
              className="shrink-0 text-muted-foreground"
            >
              {item.dismissLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
