# Interior Material Palette Scoring — Design Specification

## Overview

This document defines what a harmonious material palette is, expressed in terms of scoreable parameters, specific enough to translate into a ranking formula.

The system recommends materials one surface at a time. Given what is already selected, each candidate material is scored on five axes and ranked. Style mode shifts the scoring weights and target zones — it does not hard-exclude candidates.

---

## Style Modes

Users declare one of three styles at the start. Style acts as a ranking lens, not a gate.

| Mode | Character | Lightness | Texture | Contrast |
|---|---|---|---|---|
| **Quiet** | Palette almost disappears. Coherence through restraint. | Tonal, low delta | 1–2 fine families | Avoided |
| **Grounded** | A real palette — elements are distinct but related. | Moderate delta | 2–3 families | One contrast pair |
| **Intentional** | Explicit hierarchy: anchor, support, accent. Every contrast earns its place. | Higher delta, placed deliberately | 2–3, one may be statement | Welcomed, not scattered |

---

## Role Hierarchy

Surfaces are weighted by visual dominance for scoring purposes. The heaviest placed element becomes the **palette anchor** — the reference point all subsequent recommendations respond to.

| Surface | Visual weight |
|---|---|
| Floor | Highest |
| Cabinet fronts | High |
| Worktop | Medium |
| Backsplash | Low — accent role, most permissive |

If the user starts from a surface other than the floor, the anchor is dynamically assigned to whichever element is placed first, then recalculated as elements are added based on the weight table above.

piece of discussion summary of how to define best candidate:

EXAMPLE OF one-to-one matching
FLOOR-> FRONTS
The target deltas should react to:
* source lightness
* source activity
* source warmth
* source chroma
* texture type
Especially:
* activity
* lightness
Those are the dominant compositional drivers.

STEP 1 — DERIVE VISUAL ACTIVITY
You need one synthetic metric.

activity =
(pattern * 0.55)
+
(chroma * 0.30)
+
(texture_complexity * 15)

Texture complexity example:

plain  = 0
stone  = 0.35
wood   = 0.65
metal  = 0.15

Normalize to:

0–100

This becomes the MAIN driver.

MINIMAL
Rule
The more active the source:
* the calmer
* lighter
* flatter the target should become.

Formula
Pattern delta

Δpattern =
-(activity * 0.75)


Chroma delta

Δchroma =
-(activity * 0.55)


Lightness delta

if lightness < 45:
    Δlightness = +32

elif lightness < 70:
    Δlightness = +18

else:
    Δlightness = -12

Minimal wants separation.

Warmth delta

Δwarmth =
-(warmth * 0.35)

Slight neutralization.

Hue delta

if warmth > 0:
    Δhue = +4°

else:
    Δhue = -4°

Tiny undertone drift only.

BALANCED
Rule
Preserve identity. Reduce excess.

Formula
Pattern delta

Δpattern =
-(activity * 0.45)


Chroma delta

Δchroma =
-(activity * 0.30)


Lightness delta

if lightness < 40:
    Δlightness = +22

elif lightness < 70:
    Δlightness = +10

else:
    Δlightness = -8


Warmth delta

Δwarmth =
-(warmth * 0.10)

Mostly preserved.

Hue delta

Δhue = 0° to 3°

Almost aligned.

CHARACTER
Rule
Create controlled tension.
Not chaos. Not maximal contrast.

Formula
Pattern delta

Δpattern =
-(activity * 0.70)

Character still wants quieter fronts.

Chroma delta

Δchroma =
-(activity * 0.50)

Premium character is usually muted.

Lightness delta

if lightness < 40:
    Δlightness = -18

elif lightness < 70:
    Δlightness = -10

else:
    Δlightness = +14

Character often inverts hierarchy.

Warmth delta

Δwarmth =
-(warmth * 0.50)

Introduce tension.

Hue delta

if warmth > 0:
    Δhue = -8° to -15°

else:
    Δhue = +8° to +15°

Controlled undertone contrast.

COMPOSITION -> NEXT MATERIAL 
THE CORE MODEL
You should stop thinking:

floor → fronts
fronts → countertop

Instead think:
CURRENT COMPOSITION VECTOR
At any step you already have:

selected_materials = [m1, m2, ...]

You derive:

composition_state

Then generate:

ideal_next_material


STEP 1 — DERIVED COMPOSITION METRICS
For all selected materials calculate:

A. Dominant Warmth
Not average.
Weighted by visual mass.
Example weights:
Element	Weight
floor	0.35
main fronts	0.35
secondary fronts	0.15
countertop	0.10
backsplash	0.05
Formula

dominant_warmth =
Σ(material_warmth * weight)


B. Composition Activity
Very important.
Per material

activity =
(pattern * 0.55)
+
(chroma * 0.30)
+
(texture_complexity * 15)


Total composition activity

composition_activity =
weighted_average(activity)


C. Hierarchy Pressure
This is critical.
You need to know whether composition already feels:
* calm
* balanced
* overloaded

Formula

hierarchy_pressure =
Σ(active_materials_over_threshold)

Example:

if activity > 55:
    contributes strongly

Too many expressive surfaces = visual stress.

D. Warmth Bias

warmth_bias =
warm / cool dominance

This determines whether next element should:
* reinforce warmth OR
* neutralize it.

THE ACTUAL DESIGN RULES

1. FLOOR
Psychological Role

base warmth
grounding
continuous field

Usually:
* allowed to carry warmth
* allowed texture richness

2. CABINET FRONTS
Psychological Role

hierarchy stabilizer
architectural plane

Usually should:
* reduce activity
* calm composition
* slightly neutralize warmth
unless floor is extremely cold/light.

3. COUNTERTOP
Psychological Role

luxury focal surface

This is important: countertops are often where:
* richness
* drama
* material identity returns.
So unlike fronts: they are ALLOWED to:
* increase pattern
* increase contrast
* introduce stone texture
* sharpen composition

COUNTERTOP FORMULA
The logic changes completely.

If current composition is CALM
Example:
* flat fronts
* low pattern
* medium warmth
Then countertop may become expressive.

Formula
Pattern

Δpattern =
+(30 - composition_activity) * 0.8

Low-activity kitchen wants countertop richness.

Chroma

Δchroma =
-(dominant_chroma * 0.25)

Keep premium restraint.

Lightness

if fronts are dark:
    countertop lighter

if fronts are light:
    countertop medium or darker

Because countertop creates:
* middle bridge
* visual anchoring

Warmth
Countertop usually:
* follows composition warmth OR
* slightly cools it
Rarely warmer than all surrounding materials.

Countertop Texture Logic

if fronts are plain:
    stone texture gains score

if fronts already textured:
    calm countertop gains score

This is huge.
Countertop often compensates for missing richness.

4. BACKSPLASH
Backsplash is NOT independent.
This is critical.
It should usually behave as either:
A. Countertop extension
OR
B. Quiet mediator
NOT another competing material.

BACKSPLASH FORMULA
If countertop is expressive
Then backsplash should:

pattern ↓↓↓
chroma ↓
texture flatten

Often nearly invisible.

If countertop is calm
Backsplash may introduce:
* texture
* vertical detail
* reflectivity
* rhythm

THE MOST IMPORTANT UNIVERSAL RULE
At every step:
NEXT MATERIAL SHOULD COMPENSATE CURRENT IMBALANCE
NOT maximize similarity.

Example
Current selection:
* warm busy wood floor
* calm warm fronts
Composition currently lacks:
* focal richness
* material sharpness
Therefore countertop formula naturally outputs:

stone
more pattern
slightly cooler
controlled contrast

Exactly what designers often do.

The Actual System You Are Building
You are not building:

pair matching

You are building:
dynamic composition balancing
That is the correct mental model.

The Deepest Rule In Your Whole System
Probably this:
every next material should either:

1. calm
2. balance
3. enrich

But NEVER:

compete

