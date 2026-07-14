/** A top-view island glyph (a free-standing block), to sit alongside the
 *  LayoutLegGlyph in the setup tiles and the island block header. */
export function IslandGlyph({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <rect x="4" y="8.5" width="16" height="7" rx="1.5" />
      <line x1="9.5" y1="8.5" x2="9.5" y2="15.5" />
      <line x1="14.5" y1="8.5" x2="14.5" y2="15.5" />
    </svg>
  );
}
