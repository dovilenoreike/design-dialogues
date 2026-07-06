import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LAYOUT_RUN_COUNT, type KitchenLayout } from "@/lib/kitchen-calculator";

const LAYOUTS: { value: KitchenLayout; label: string; hint: string }[] = [
  { value: "line", label: "Line", hint: "no corner" },
  { value: "l", label: "L-shape", hint: "1 corner" },
  { value: "u", label: "U-shape", hint: "2 corners" },
  { value: "galley", label: "Galley", hint: "2 parallel runs" },
];

const RUN_LABELS = ["Run A", "Run B", "Run C", "Run D"];

interface KitchenSetupProps {
  layout: KitchenLayout;
  legLengths: string[]; // metres, one per run
  /** Once generated, leg lengths are edited per-run; the seed inputs are hidden. */
  generated: boolean;
  onLayoutChange: (layout: KitchenLayout) => void;
  onLegLengthChange: (index: number, value: string) => void;
  onGenerate: () => void;
  onStartFresh: () => void;
}

/** First action: pick a layout and enter a wall length per leg, then Generate. */
export function KitchenSetup({
  layout,
  legLengths,
  generated,
  onLayoutChange,
  onLegLengthChange,
  onGenerate,
  onStartFresh,
}: KitchenSetupProps) {
  const runCount = LAYOUT_RUN_COUNT[layout];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Kitchen layout</Label>
          {generated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartFresh}
              className="text-muted-foreground"
            >
              Start fresh
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {LAYOUTS.map((l) => {
            const active = l.value === layout;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => onLayoutChange(l.value)}
                className="flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors"
                style={
                  active
                    ? { borderColor: "#647d75", backgroundColor: "rgba(100,125,117,0.08)" }
                    : undefined
                }
              >
                <span
                  className="text-sm font-medium"
                  style={active ? { color: "#647d75" } : undefined}
                >
                  {l.label}
                </span>
                <span className="text-xs text-muted-foreground">{l.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {generated ? (
        <p className="text-xs text-muted-foreground">
          Adjust each run&apos;s length in its section below. Switching layout regenerates the kitchen.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          {Array.from({ length: runCount }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Label htmlFor={`leg-${i}`}>{RUN_LABELS[i] ?? `Run ${i + 1}`} length (m)</Label>
              <Input
                id={`leg-${i}`}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={legLengths[i] ?? ""}
                onChange={(e) => onLegLengthChange(i, e.target.value)}
                className="w-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onGenerate();
                }}
              />
            </div>
          ))}
          <Button onClick={onGenerate} style={{ backgroundColor: "#647d75" }} className="text-white">
            Generate
          </Button>
        </div>
      )}
    </div>
  );
}
