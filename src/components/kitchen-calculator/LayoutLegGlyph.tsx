import type { KitchenLayout } from "@/lib/kitchen-calculator";

/**
 * A tiny plan of the kitchen layout with one leg (run) drawn heavy. Reused
 * wherever a run needs a face — the layout picker, the "which wall?" appliance
 * assignment, and the run section headers — so the abstract "Run A / B / C"
 * becomes learnable by sight rather than explanation.
 */
interface LayoutLegGlyphProps {
  layout: KitchenLayout;
  /** Which leg to highlight (0-based). */
  leg: number;
  size?: number;
  className?: string;
}

// Each leg is one line segment [x1, y1, x2, y2] in a 24×24 box. Order matches
// the run order the generator uses (run 0 first).
const LEGS: Record<KitchenLayout, [number, number, number, number][]> = {
  line: [[12, 4, 12, 20]],
  l: [
    [6, 18, 19, 18], // A — bottom
    [6, 18, 6, 5], // B — upright
  ],
  u: [
    [6, 5, 6, 18], // A — left
    [6, 18, 18, 18], // B — bottom
    [18, 18, 18, 5], // C — right
  ],
  galley: [
    [5, 8, 19, 8], // A — top
    [5, 16, 19, 16], // B — bottom
  ],
};

export function LayoutLegGlyph({ layout, leg, size = 20, className }: LayoutLegGlyphProps) {
  const legs = LEGS[layout] ?? LEGS.line;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-hidden
    >
      {legs.map((c, i) => {
        const active = i === leg;
        return (
          <line
            key={i}
            x1={c[0]}
            y1={c[1]}
            x2={c[2]}
            y2={c[3]}
            stroke={active ? "#647d75" : "currentColor"}
            strokeWidth={active ? 2.6 : 1.5}
            strokeOpacity={active ? 1 : 0.3}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
