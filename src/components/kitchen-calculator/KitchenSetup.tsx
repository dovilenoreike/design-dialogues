import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LAYOUT_RUN_COUNT, type KitchenLayout } from "@/lib/kitchen-calculator";
import { IslandGlyph } from "./IslandGlyph";
import { LayoutLegGlyph } from "./LayoutLegGlyph";

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
  /** Whether the kitchen includes an island (coexists with any wall layout). */
  hasIsland: boolean;
  /** Island footprint length (metres) — seeds island cabinets on Generate. */
  islandLength: string;
  onLayoutChange: (layout: KitchenLayout) => void;
  onLegLengthChange: (index: number, value: string) => void;
  onIslandToggle: (value: boolean) => void;
  onIslandLengthChange: (value: string) => void;
  onGenerate: () => void;
  onStartFresh: () => void;
}

/** First action: pick a layout and enter a wall length per leg, then Generate.
 *  An island is an optional add-on that can accompany any layout. */
export function KitchenSetup({
  layout,
  legLengths,
  generated,
  hasIsland,
  islandLength,
  onLayoutChange,
  onLegLengthChange,
  onIslandToggle,
  onIslandLengthChange,
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
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors"
                style={
                  active
                    ? { borderColor: "#647d75", backgroundColor: "rgba(100,125,117,0.08)" }
                    : undefined
                }
              >
                <LayoutLegGlyph
                  layout={l.value}
                  leg={-1}
                  size={22}
                  className={active ? "text-[#647d75]" : "text-muted-foreground"}
                />
                <span className="flex flex-col">
                  <span
                    className="text-sm font-medium"
                    style={active ? { color: "#647d75" } : undefined}
                  >
                    {l.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{l.hint}</span>
                </span>
              </button>
            );
          })}

          {/* Island is additive, not a wall layout — a toggle tile set off by a
              divider so it reads as "and an island", alongside the chosen shape. */}
          <span className="mx-1 self-stretch border-l" aria-hidden />
          <button
            type="button"
            onClick={() => onIslandToggle(!hasIsland)}
            aria-pressed={hasIsland}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors"
            style={
              hasIsland
                ? { borderColor: "#647d75", backgroundColor: "rgba(100,125,117,0.08)" }
                : undefined
            }
          >
            <IslandGlyph size={22} className={hasIsland ? "text-[#647d75]" : "text-muted-foreground"} />
            <span className="flex flex-col">
              <span className="text-sm font-medium" style={hasIsland ? { color: "#647d75" } : undefined}>
                Island
              </span>
              <span className="text-xs text-muted-foreground">optional</span>
            </span>
          </button>
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
              <Label htmlFor={`leg-${i}`} className="flex items-center gap-1.5">
                {runCount > 1 && (
                  <LayoutLegGlyph layout={layout} leg={i} size={18} className="text-muted-foreground" />
                )}
                {RUN_LABELS[i] ?? `Run ${i + 1}`} length (m)
              </Label>
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
          {hasIsland && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="island-length" className="flex items-center gap-1.5">
                <IslandGlyph size={18} className="text-muted-foreground" />
                Island length (m)
              </Label>
              <Input
                id="island-length"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={islandLength}
                onChange={(e) => onIslandLengthChange(e.target.value)}
                className="w-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onGenerate();
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
