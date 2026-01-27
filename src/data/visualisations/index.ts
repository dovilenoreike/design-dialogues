/**
 * Visualization URL utilities
 *
 * Images are stored in public/visualisations/{palette}/{style}/{room}.png
 * and served directly as static assets (no bundler processing needed).
 */

// Default values
export const DEFAULT_PALETTE = "fog-in-the-forest";
export const DEFAULT_STYLE = "japandi";
export const DEFAULT_ROOM = "kitchen";

/**
 * Convert room display name to room ID
 */
function roomNameToId(roomName: string): string {
  const mapping: Record<string, string> = {
    Kitchen: "kitchen",
    "Living Room": "living-room",
    Bathroom: "bathroom",
    Bedroom: "bedroom",
  };
  return mapping[roomName] || DEFAULT_ROOM;
}

/**
 * Get visualization image URL based on palette, room, and style selection
 *
 * @param paletteId - The palette ID (e.g., "fog-in-the-forest")
 * @param roomName - The room display name (e.g., "Kitchen", "Living Room")
 * @param styleId - The style ID (e.g., "japandi", "quiet-luxury")
 * @returns The visualization image URL
 */
export function getVisualization(
  paletteId: string | null,
  roomName: string | null,
  styleId: string | null
): string {
  const palette = paletteId || DEFAULT_PALETTE;
  const room = roomName ? roomNameToId(roomName) : DEFAULT_ROOM;
  const style = styleId || DEFAULT_STYLE;

  return `/visualisations/${palette}/${style}/${room}.png`;
}
