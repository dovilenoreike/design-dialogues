# Kitchen Calculator — Icon Renderer Addendum

This section is an addition to the main Kitchen Furniture Price Calculator spec.
It defines a programmatic SVG icon renderer for cabinet units.

---

## Overview

Each cabinet unit in the component list displays a small SVG icon representing
its type and zone configuration. Icons are generated programmatically from the
unit's data — they are never static image files. When a user changes a unit's
configuration (e.g. switches a door zone to a drawer zone), the icon updates
automatically.

---

## Visual Style

Line-drawing style. Refer to the attached reference image for tone.

- **Stroke only** — no fills except white (used to mask lines behind foreground elements)
- **Uniform stroke weight** — 1.5px for all structural lines
- **Rounded corners** — border-radius ~3px on the outer shell and zone panels
- **No shadows, no gradients**
- **Colour** — single stroke colour, inherits from UI theme (e.g. `currentColor`)
- **Viewbox** — all icons use a fixed square viewbox (e.g. 80×80) regardless of
  real cabinet proportions. Aspect ratio is not represented — the icon represents
  type and configuration, not scale.

---

## Layout Rules (applied to every icon)

These rules define how the SVG space is divided, top to bottom:

```
┌─────────────────┐  ← worktop bar (fixed height: ~8% of viewbox)
│                 │
│   zone area     │  ← remaining height minus worktop and plinth
│                 │     divided equally between zones
└─────────────────┘  ← plinth bar (fixed height: ~6% of viewbox)
  │             │     ← two legs (width ~8% each, at corners)
```

1. **Worktop** — thin filled rectangle across the full top
2. **Shell** — outer rectangle below worktop, above plinth
3. **Zones** — shell interior divided into equal horizontal bands, one per zone
4. **Handles** — one handle per zone, centred horizontally within the zone
5. **Plinth** — thin rectangle across the full bottom
6. **Legs** — two small rectangles at bottom-left and bottom-right corners,
   below the plinth

---

## Handle Shapes by Zone Type

| Zone type     | Handle shape                                                  |
|---------------|---------------------------------------------------------------|
| Drawer        | Full-width horizontal bar, centred vertically in zone, ~60% of zone width |
| Door (single) | Short horizontal bar, centred in zone, ~30% of zone width    |
| Door (pair)   | Vertical divider line down the centre + one short bar per panel |
| Open / shelf  | No handle — horizontal shelf line at mid-zone height         |

---

## Unit-Specific Additions

Some unit types add elements on top of the base layout rules:

| Unit type         | Additional SVG elements                                         |
|-------------------|-----------------------------------------------------------------|
| Sink cabinet      | Oval cutout shape in the worktop area + simple tap/faucet line above it |
| Hob/Oven cabinet  | Hob: 2×2 circle grid on worktop area representing burners      |
| Corner unit       | Angled line across top-right corner of the shell indicating the return |
| Fridge housing    | No zones — interior is empty (single open rectangle)           |
| Oven housing      | Oven zone: rounded rectangle inset (representing oven door)    |
| Wall cabinet      | No worktop bar, no legs — shell only with zones                |
| Open shelf        | No doors — horizontal shelf lines only                         |
| Island unit       | Same as base unit but with side panel lines on both left and right edges |

---

## Renderer Input

The renderer is a single function that accepts a unit descriptor and returns an
SVG string (or React SVG element).

```ts
interface UnitIconDescriptor {
  type:    "sink" | "hob_oven" | "storage" | "corner_base" |
           "fridge" | "oven_housing" | "larder" |
           "wall_standard" | "corner_wall" |
           "island"
  zones:   Zone[]           // ordered top-to-bottom
  size?:   number           // viewbox size in px, default 80
}

interface Zone {
  kind:    "drawer" | "door_single" | "door_pair" | "open"
  height?: number           // relative weight, default 1 (equal division)
}
```

Example inputs:

```ts
// 2-drawer cabinet
{ type: "storage", zones: [{ kind: "drawer" }, { kind: "drawer" }] }

// Door below, 2 drawers above
{ type: "storage", zones: [{ kind: "drawer" }, { kind: "drawer" }, { kind: "door_pair" }] }

// Sink cabinet
{ type: "sink", zones: [{ kind: "door_pair" }] }

// Standard wall cabinet
{ type: "wall_standard", zones: [{ kind: "door_pair" }] }
```

---

## Renderer Output

A self-contained SVG element, no external dependencies. Suitable for rendering
inline in React or as an `<img src="data:image/svg+xml,...">`.

---

## Usage in the Component List

Each cabinet row in the component list renders its icon at ~48×48px display size.
The icon updates reactively whenever the unit's zone configuration changes —
no separate fetch or asset load required.

Icons are also used in the "Add unit" picker to help users identify unit types
at a glance before adding them.

---

## What is Out of Scope for the Icon Renderer

- Accurate aspect ratio / scale representation
- Colour coding by material or finish
- 3D or isometric perspective
- Animation
- Export or print quality rendering (icons are UI elements only)
