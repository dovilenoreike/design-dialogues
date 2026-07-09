import type { ProjectAppliance } from "@/lib/kitchen-calculator";

/**
 * Small technical-drawing glyph for a project appliance, in the manner of a
 * kitchen plan symbol. Monochrome line art (currentColor), 16×16 viewbox — pair
 * with a tooltip/label since not every symbol is self-evident.
 */
interface ApplianceGlyphProps {
  id: ProjectAppliance;
  size?: number;
  className?: string;
}

const SW = 1.3;

function shapes(id: ProjectAppliance): JSX.Element {
  switch (id) {
    case "hob":
      // Square with a 2×2 burner grid.
      return (
        <>
          <rect x={2} y={2} width={12} height={12} rx={1.5} />
          {[5.5, 10.5].map((cx) =>
            [5.5, 10.5].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.5} />),
          )}
        </>
      );
    case "oven":
      // Square with a control strip up top and a door handle.
      return (
        <>
          <rect x={2} y={2} width={12} height={12} rx={1.5} />
          <line x1={3} y1={5.5} x2={13} y2={5.5} />
          <line x1={5} y1={9.5} x2={11} y2={9.5} />
        </>
      );
    case "fridge":
      // Box with a snowflake (freezer) star.
      return (
        <>
          <rect x={3} y={2} width={10} height={12} rx={1.5} />
          <line x1={8} y1={5} x2={8} y2={11} />
          <line x1={5.4} y1={6.5} x2={10.6} y2={9.5} />
          <line x1={10.6} y1={6.5} x2={5.4} y2={9.5} />
        </>
      );
    case "hood":
      // Extractor canopy (trapezoid) with a duct.
      return (
        <>
          <path d="M2.5 12 L5.5 6.5 L10.5 6.5 L13.5 12 Z" strokeLinejoin="round" />
          <rect x={7} y={2.5} width={2} height={4} rx={0.5} />
        </>
      );
    case "dishwasher":
      // Cabinet with a control strip and loaded dishes — two overlapping plates
      // with crossed cutlery behind (the standard dishwasher plan symbol).
      return (
        <>
          <rect x={2} y={2} width={12} height={12} rx={1.5} />
          <line x1={3} y1={5} x2={13} y2={5} />
          <line x1={4.6} y1={6.4} x2={10} y2={11.4} />
          <line x1={11.4} y1={6.4} x2={6} y2={11.4} />
          <circle cx={6.6} cy={10} r={2.6} />
          <circle cx={9.7} cy={10.2} r={2.1} />
        </>
      );
    case "microwave":
      // Square with a door window and a control strip on the right.
      return (
        <>
          <rect x={2} y={3} width={12} height={10} rx={1.5} />
          <rect x={3.5} y={5} width={6} height={6} rx={0.5} />
          <line x1={11.5} y1={5} x2={11.5} y2={11} />
        </>
      );
  }
}

export function ApplianceGlyph({ id, size = 16, className }: ApplianceGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={SW}
      strokeLinecap="round"
      className={className}
      role="img"
      aria-label={id}
    >
      {shapes(id)}
    </svg>
  );
}
