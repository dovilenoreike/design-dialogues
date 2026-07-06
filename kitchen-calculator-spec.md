# Kitchen Furniture Price Calculator — Build Spec

## Overview

A web-based interactive price estimation tool for kitchen furniture builds. The user enters a single kitchen length; the system auto-fills a standard component list snapped exactly to that length using standard cabinet widths. Users configure components and see a live estimated total.

Material prices are resolved externally and injected as a config object. The calculator does not handle material selection.

---

## Guiding Principles

- **Simple to the user, robust underneath.** The UI exposes only what users need to change. Complexity lives in the pricing model.
- **Bill of materials (BOM) architecture.** Every cabinet decomposes into typed primitive parts. Any dimension change or configuration swap triggers a full BOM recalculation — no hardcoded unit prices anywhere, including corner units.
- **Total price first.** The user sees one number. Per-component breakdown is reserved for a future partner view.
- **Nothing is fixed.** Even structurally complex units (corners, islands) are priced from material consumption formulas, not flat rates.

---

## Material Config (externally injected)

The calculator consumes a single config object. Prices come from the existing material matching system and are never selected in this UI.

### Surface categories (existing system)

These identify the visual front materials per cabinet category. They are used for door fronts and drawer fronts only — not for carcass panels.

```
surfaces {
  bottom_cabinets:   price per m²   // door/drawer fronts for base units
  top_cabinets:      price per m²   // door/drawer fronts for wall units
  tall_cabinets:     price per m²   // door/drawer fronts for tall units
  worktop:           price per m²   // worktop slab
  backsplash:        price per m²   // out of scope for v1 calculator
}
```

### Structural materials (system-level, user never sees these)

```
structural {
  carcass_board:   price per m²   // all structural carcass panels: sides, top,
                                  // bottom — same material for all cabinet types
  back_panel:      price per m²   // back panels — different (typically thinner)
                                  // material, priced separately, not estimated
  edge_banding:    price per lm   // all exposed edges across every part
}
```

All three are real costs in every BOM. None are shown to the user. `back_panel` is a distinct material entry — no rate factor approximations are used.

### Hardware config

Hardware is a product database, not a surface. See Hardware section below.

---

## Global Settings (user-configurable)

Accessible via a collapsible "Kitchen settings" panel — not shown prominently on first load.

| Setting            | Default  | Applies to               |
|--------------------|----------|--------------------------|
| Base unit height   | 720 mm   | All base cabinets        |
| Wall unit height   | 720 mm   | All wall cabinets        |
| Tall unit height   | 2100 mm  | All tall cabinets        |
| Base unit depth    | 560 mm   | All base + tall cabinets |
| Wall unit depth    | 300 mm   | All wall cabinets        |
| Island unit depth  | 900 mm   | Island cabinets          |

These are category-level — one value per type, shared across all units of that type.

---

## Hardware

### Architecture

Hardware is driven by a **product database**, not multipliers. Every hardware item type (runner, hinge, handle, etc.) has one recommended product assigned per grade tier. The grade selector (Basic / Mid / Premium) is a UX shortcut that auto-selects the recommended product for each item type at that tier. The price is always the real product price from the database.

```
HardwareProduct {
  id
  name
  type:        runner | hinge | handle | bin | pull_out | shelf_pin | fixings | other
  grade:       basic | mid | premium
  unit_price:  €
  unit:        per_pair | per_unit | per_set
}
```

Each hardware item type has exactly one recommended product per grade. When the user selects a grade, all hardware items across all cabinets switch to their recommended product at that grade. Soft-close functionality is included in the hinge product price at the appropriate grade — it is not a separate line item.

### Grade selector

Shown prominently above the component list. Changing grade reprices all hardware instantly.

```
○ Basic   ● Mid   ○ Premium
```

### Hardware items consumed by part type

| Part type      | Hardware consumed                         |
|----------------|-------------------------------------------|
| Cabinet shell  | Fixings set (cam locks + dowels) per shell |
| Door front     | 1× hinge pair, 1× handle                 |
| Drawer box     | 1× runner pair                            |
| Drawer front   | 1× handle                                 |
| Shelf          | 4× shelf pins                             |
| Pull-out / bin | 1× product unit (sourced from DB)         |

The specific products and their default selections per grade are defined entirely in the hardware database — the calculator does not hardcode which product maps to which behaviour.

---

## Primitive Parts — BOM Architecture

Every cabinet is an assembly of typed primitive parts. Each part type defines material area, edge banding length, and hardware items as functions of its dimensions. Changing any dimension or swapping a part type reprices automatically.

**Carcass board** (`structural.carcass_board`) is the same material for all cabinet types — base, wall, and tall.

**Back panel** (`structural.back_panel`) is a separate material used only for back panels.

**Door/drawer fronts** use the surface category rate matching the cabinet type (`surfaces.bottom_cabinets`, `surfaces.top_cabinets`, or `surfaces.tall_cabinets`).

---

### Part 1 — Cabinet Shell

The structural carcass. One per cabinet.

**Inputs:** W (width), H (height), D (depth) — from cabinet config or global settings

**Material consumption:**

| Panel       | Area formula | Material              |
|-------------|--------------|------------------------|
| Left side   | H × D        | carcass_board          |
| Right side  | H × D        | carcass_board          |
| Top         | W × D        | carcass_board          |
| Bottom      | W × D        | carcass_board          |
| Back panel  | W × H        | back_panel             |

**Edge banding (front-facing exposed edges only):**
- Side front edges: 2 × H
- Top front edge: W
- Bottom front edge: W

**Hardware:**
- 1× fixings set per shell (sourced from hardware DB at selected grade)

---

### Part 2 — Shelf

**Inputs:** W and D inherit from parent shell

**Material:**
- Shelf panel: W × D — carcass_board

**Edge banding:**
- Front edge only: W

**Hardware:**
- 4× shelf pins (sourced from hardware DB at selected grade)

---

### Part 3 — Drawer Box

Structural drawer body — not the front face.

**Inputs:** W and D inherit from shell; H_drawer default 180mm, configurable

**Material:**

| Panel        | Area formula       | Material      |
|--------------|--------------------|----------------|
| Front        | W × H_drawer       | carcass_board  |
| Back         | W × H_drawer       | carcass_board  |
| Left side    | D × H_drawer       | carcass_board  |
| Right side   | D × H_drawer       | carcass_board  |
| Base         | W × D              | back_panel     |

**Edge banding:**
- Top edges of front, back, and both sides: 2W + 2D

**Hardware:**
- 1× runner pair (sourced from hardware DB at selected grade)

---

### Part 4 — Door / Drawer Front

The visible face panel. Uses the surface category rate for the parent cabinet type.

**Inputs:** W_front, H_front — derived from cabinet zone layout

**Material:**
- Face panel: W_front × H_front — surface category rate (bottom / top / tall)

**Edge banding (all 4 edges):**
- 2 × W_front + 2 × H_front

**Hardware:**
- Door front: 1× hinge pair + 1× handle (sourced from hardware DB at selected grade)
- Drawer front: 1× handle (sourced from hardware DB at selected grade)

---

### Part 5 — Pull-out / Internal Fitting

Internal fittings sourced as hardware products. Not decomposed into panels.

| Fitting           | Hardware type | Notes                        |
|-------------------|---------------|------------------------------|
| Single bin        | bin           | Default in sink cabinet      |
| Double bin        | bin           |                              |
| Pull-out shelf    | pull_out      |                              |
| Magic corner      | pull_out      | Default in corner base unit  |
| Lazy susan        | pull_out      | Alternative for corner unit  |
| Cutlery insert    | other         |                              |
| Drawer dividers   | other         |                              |

Each sourced as a product from the hardware database at the selected grade.

---

### Corner Shell (variant of Cabinet Shell)

Corner units are not fixed-price. They use the same shell formula with a geometric approximation for the non-rectangular footprint.

A corner unit has two run widths: W₁ (primary run) and W₂ (return run). The interior is the L-shape minus the corner overlap square.

**Material consumption:**

| Panel       | Area formula                        | Material    |
|-------------|--------------------------------------|-------------|
| Side 1      | H × D                                | carcass_board |
| Side 2      | H × D                                | carcass_board |
| Top         | (W₁ × D) + (W₂ × D) − (D × D)       | carcass_board |
| Bottom      | (W₁ × D) + (W₂ × D) − (D × D)       | carcass_board |
| Back 1      | W₁ × H                               | back_panel  |
| Back 2      | W₂ × H                               | back_panel  |

This approximation is within ~5% of exact for typical corner sizes — acceptable for estimation.

**Edge banding:** front-facing return edges of both sides: 2 × H

**Internal fitting:** magic corner or lazy susan (hardware product, grade-matched)

---

## Standard Cabinet Units

Each unit type is a named default assembly. These are starting configurations — users reconfigure from here.

---

### BASE UNITS *(use base H + D from global settings)*

#### Sink Cabinet
Default width: 600mm

Assembly:
- 1× shell
- 2× door fronts (each W/2 wide, full shell height)
- 1× mid-height shelf (space above reserved for plumbing)
- 1× single bin pull-out

Worktop: adds sink cutout cost (sourced from hardware DB)

Configurable: width, bin type, shelf

---

#### Hob / Oven Cabinet *(default combined unit)*
Default width: 600mm

Assembly:
- 1× shell
- 1× drawer box + drawer front (below hob)
- 1× door front (oven access, below drawer)
- Hob cutout added to worktop cost (sourced from hardware DB)
- Oven recess occupies the door zone (no shelf — oven sits in the opening)

Configuration option: **split into separate units** — adds a Tall Oven Housing to the tall units list at the end of the run, and replaces this unit with a standard base hob cabinet (shell + drawer + hob cutout only). New units are appended to the end of their respective lists; reordering is out of scope for v1.

Configurable: width, drawer height, split into separate units

---

#### Storage Cabinet
Default width: 600mm

The general-purpose base unit. Internal configuration is the key variable.

Default assembly:
- 1× shell
- 2× door fronts (full height)
- 1× shelf

The interior is divided into **zones**. Each zone is one of: door section, drawer section, or open. Door and drawer fronts are generated automatically to match the zone layout and fill the shell height.

Example zone configurations:
- 2 doors (default)
- 3 drawers
- 1 door below + 2 drawers above
- 2 doors with pull-out shelf inside

Configurable: width, zone layout, internal fittings per zone

---

#### Corner Base Unit
Default: W₁ = 1000mm, W₂ = 1000mm

Assembly:
- 1× corner shell
- 1× door front (on the accessible face)
- 1× magic corner fitting (default)

Configurable: W₁ and W₂ widths, internal fitting type (magic corner / lazy susan / open shelves)

---

### TALL UNITS *(use tall H + base D from global settings)*

#### Fridge Housing
Default width: 600mm

Assembly:
- 1× shell
- 2× door fronts (upper door above fridge, lower door below — split height configurable)

Configurable: width, upper/lower door height split

---

#### Oven Housing *(added when hob/oven cabinet is split)*
Default width: 600mm

Assembly:
- 1× shell
- 2× door fronts (one above oven recess, one below)
- 1× shelf (below oven)

Configurable: width, oven recess height (default 595mm)

---

#### Larder / Storage Tall
Default width: 500mm

Assembly:
- 1× shell
- 2× door fronts (full height)
- 4× shelves (default)

Configurable: width, shelf count, swap shelves for drawers, add pull-outs

---

### WALL UNITS *(use wall H + wall D from global settings)*

#### Standard Wall Cabinet
Default width: 600mm

Assembly:
- 1× shell
- 2× door fronts
- 1× shelf

Configurable: width, shelf count, convert to open shelf (removes door fronts)

---

#### Corner Wall Unit

Assembly:
- 1× corner shell (wall depth variant)
- 1× door front

Configurable: W₁ and W₂ widths, internal fitting

---

### ISLAND UNITS

An island is a distinct cabinet category. Shares base cabinet construction logic but differs in:

- **Depth:** 900mm default (from global settings)
- **Panel ends:** default 3 sides exposed (front + both ends). Panel ends use `surfaces.bottom_cabinets` rate (front material, not carcass), same as base unit fronts.
- **Worktop:** island width × island depth, with edge banding on 3 exposed sides by default
- **Worktop material:** inherits the same worktop material as the main run
- No wall units above

Each island unit is configured identically to base units (storage cabinet, drawer configuration, etc.). Island units are added as a separate section in the component list.

The island worktop is calculated separately from the main run worktop.

---

## Extras

Below the component list. All defaulted on; user can toggle or adjust quantity.

| Extra                  | Default qty              | Pricing basis                                        |
|------------------------|--------------------------|------------------------------------------------------|
| Plinth                 | = base run lm            | per lm, from hardware DB                            |
| Cornice / pelmet       | = wall run lm            | per lm, from hardware DB                            |
| Panel ends             | 2 (main run), 3 (island) | surface rate (bottom_cabinets) × area + edge banding |
| Under-cabinet lighting | = wall run lm            | per lm, from hardware DB                            |

Panel ends use `surfaces.bottom_cabinets` — they are visible faces matching the front finish, not carcass material.

---

## Auto-Fill Algorithm

**Input:** kitchen length in mm

**Step 1 — Place default requirement units:**
1. Sink cabinet — 600mm (base)
2. Hob/Oven cabinet (combined) — 600mm (base)
3. Fridge housing — 600mm (tall; occupies floor footprint but not base run worktop)

**Step 2 — Calculate remaining base run length:**
```
remaining = total_length − sink_width − hob_oven_width − fridge_width
```

**Step 3 — Fill remainder with Storage Cabinets:**

Greedy descending fit using standard widths: `[1000, 800, 600, 500, 400, 300]` mm

- Place the largest width that fits the remaining length, repeat until remaining = 0
- If exact fit is not achievable with standard widths, adjust the last placed unit to a custom width and flag it visually: *"custom width: 550mm"*

**Step 4 — Auto-generate wall units:**

Mirror the base run length with 600mm wall cabinets by default, skipping the floor footprint span of tall units (fridge housing, oven housing if split). User adjusts freely.

---

## Pricing Formulas

### Per-part

```
shell_price =
    (side₁_area + side₂_area + top_area + bottom_area) × carcass_board_rate
  + back_area × back_panel_rate
  + edge_banding_lm × edge_banding_rate
  + fixings_product_price

shelf_price =
    (W × D) × carcass_board_rate
  + W × edge_banding_rate
  + 4 × shelf_pin_product_price

drawer_box_price =
    (front_area + back_area + side₁_area + side₂_area) × carcass_board_rate
  + base_area × back_panel_rate
  + top_edge_lm × edge_banding_rate
  + runner_pair_product_price

door_front_price =
    (W_front × H_front) × surface_category_rate
  + (2 × W_front + 2 × H_front) × edge_banding_rate
  + hinge_pair_product_price          ← doors only
  + handle_product_price

drawer_front_price =
    (W_front × H_front) × surface_category_rate
  + (2 × W_front + 2 × H_front) × edge_banding_rate
  + handle_product_price

pull_out_price = hardware_product_price
```

All hardware product prices are sourced from the hardware DB at the selected grade.

### Per-unit

```
unit_price = sum(price of all parts in the unit BOM)
```

No unit has a hardcoded price. Corner units use the corner shell formula.

### Worktop (main run)

```
worktop_price =
    (total_base_run_lm × worktop_depth_m) × worktop_rate
  + total_base_run_lm × edge_banding_rate
  + sink_cutout_product_price     (if sink cabinet present)
  + hob_cutout_product_price      (if hob cabinet present)
```

`worktop_depth_m` defaults to 0.6m (600mm), not configurable in v1.

### Worktop (island)

```
island_worktop_price =
    (island_total_width_lm × island_depth_m) × worktop_rate
  + exposed_edge_lm × edge_banding_rate      ← 3 sides by default
```

### Extras

```
panel_end_price =
    (panel_H × panel_D) × bottom_cabinets_rate
  + (2 × panel_H + 2 × panel_D) × edge_banding_rate

extras_price =
    (plinth_on   ? base_run_lm  × plinth_product_price_per_lm  : 0)
  + (cornice_on  ? wall_run_lm  × cornice_product_price_per_lm : 0)
  + panel_ends_count × panel_end_price
  + (lighting_on ? wall_run_lm  × lighting_product_price_per_lm : 0)
```

### Total

```
total =
    sum(all unit prices)
  + worktop_price
  + island_worktop_price  (if island present)
  + extras_price
```

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Kitchen length: [ 3.6 ] m                      [Generate]   │
│  ▾ Kitchen settings  (heights, depths — collapsed by default) │
├──────────────────────────────────────────────────────────────┤
│  Hardware:  ○ Basic   ● Mid   ○ Premium                      │
├──────────────────────────────────────────────────────────────┤
│  BASE & TALL UNITS                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Sink cabinet       [600mm ▾]   [configure ▾]      [×]  │  │
│  │ Hob/Oven cabinet   [600mm ▾]   [configure ▾]      [×]  │  │
│  │ Storage cabinet    [600mm ▾]   [configure ▾]      [×]  │  │
│  │ Fridge housing     [600mm ▾]   [configure ▾]      [×]  │  │
│  │ + Add unit                                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  WALL UNITS                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Wall cabinet       [600mm ▾]   [configure ▾]      [×]  │  │
│  │ + Add wall unit                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ISLAND  [+ Add island]                                       │
│                                                               │
│  ▾ Extras                                                     │
│  [✓] Plinth  [✓] Cornice  Panel ends [2]  [✓] Lighting       │
│                                                               │
│  ══════════════════════════════════════════════════════════   │
│                            Estimated total      € 4,820       │
└──────────────────────────────────────────────────────────────┘
```

**Configure panel (expands inline per unit):**
```
  ▾ Storage cabinet — 600mm
    Type:  [Storage cabinet ▾]        ← swap unit type

    Interior zones:
    ┌─────────────────────────────────────────┐
    │  Zone 1: [2 doors ▾]  [1 shelf ▾]      │
    │  + Add zone                              │
    └─────────────────────────────────────────┘

    Additional fittings:
    [ ] Pull-out shelf    [ ] Bin    [ ] Cutlery insert
```

**Mobile:** total collapses to a sticky bottom bar; tapping expands full summary.

---

## Summary Display

**V1:** total only.
```
Estimated total   € 4,820
```

**Future partner view (out of scope for v1):** price shown per component row + full line-item breakdown.

---

## V1 Scope

**In scope:**
- Single length input → auto-fill → component list
- BOM-based pricing for all unit types including corners and islands
- Per-unit configuration: type swap, width, zone layout, internal fittings
- Global hardware grade (product-database-driven)
- Global height/depth settings per category
- Island as a separate section with its own worktop calculation
- Extras section
- Total price display only

**Out of scope for v1:**
- Material selection (prices injected externally)
- Per-component price display (partner view)
- L-shape / U-shape run layout
- Backsplash pricing
- Unit reordering (new units append to end of their list)
- Save, export, PDF quote
- User accounts
- Real hardware product database (mocked for v1)
- Real structural material rates (mocked for v1)

