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

---

## The Five Scoring Axes

Each axis returns a value **0–1**. Axes are combined into a weighted sum. Weights vary by style mode.

---

### Axis 1 — Lightness

**What it measures:** Whether the candidate's lightness lands in a harmonious range relative to the anchor, given its role.

**Target delta ranges by role and style:**

| Candidate role | Quiet | Grounded | Intentional |
|---|---|---|---|
| Fronts vs floor | 5–20 | 15–35 | 30–55 |
| Worktop vs anchor | 0–20 | 10–30 | 20–45 |
| Backsplash vs anchor | 0–30 | 0–40 | 0–50 |

Backsplash is always more permissive — small surface, accent role.

**Scoring function:** Score 1.0 at the centre of the target range. Smooth decay to 0.0 at ±15 units outside the range edges. No hard cutoff.

**If no anchor is placed yet:** axis returns neutral 0.5 — no constraint.

---

### Axis 2 — Warmth

**What it measures:** Whether the candidate creates warmth duplication or useful contrast against the anchor.

**Rules by anchor warmth:**

| Anchor warmth | Candidate target zone | Penalty zone |
|---|---|---|
| Strong warm (> +0.4) | −0.2 to +0.3 | Above +0.4 |
| Strong cool (< −0.4) | −0.3 to +0.2 | Below −0.4 |
| Neutral (−0.2 to +0.2) | Full range | None |

The core rule: **no two dominant elements should share the same warmth extreme.** One warm, one not — or both genuinely neutral.

**Style modulation:**
- **Quiet:** Tighten penalty threshold — flag duplication above +0.3 if anchor is already warm. Warmth direction must stay consistent throughout the palette.
- **Grounded:** Standard rules. One warmth contrast allowed.
- **Intentional:** Relax slightly — a second warm element is permitted in the accent role (backsplash).

**Scoring function:** Score 1.0 within target zone. Decay to 0.0 at the penalty boundary.

---

### Axis 3 — Hue Undertone

**What it measures:** Angular distance between the candidate's `hue_angle` and the anchor's `hue_angle`.

**Only active when both values are populated.** If either is NULL, axis returns neutral 0.5 — no reward, no penalty. NULL signals undertone-agnostic and is compatible with anything.

**Harmony zones:**

| Angular distance | Relationship | Score |
|---|---|---|
| 0–40° | Tight family match | 1.0 |
| 40–60° | Ambiguous | 0.5 |
| 60–120° | Undertone clash | 0.1 |
| 120–150° | Transition zone | 0.5 |
| 150–210° | Complementary | 0.9 |

The problematic zone is 60–120° — close enough to feel accidental, far enough to clash.

**Style modulation:**
- **Quiet:** Weights family match (0–40°) highest.
- **Intentional:** Gives near-equal weight to complementary (150–210°).
- **Grounded:** Sits between.

**Undertone reference bands:**

| Undertone family | Hue angle | Examples |
|---|---|---|
| Pink-red | 340–20° | Warm plaster, blush stone, terracotta |
| Orange-amber | 20–50° | Oak, honey, amber marble |
| Yellow-ochre | 50–80° | Limewash, sandstone, warm white |
| Yellow-green | 80–120° | Sage, cement with green cast |
| Cool grey-green | 120–180° | Slate, cool linen, blue-green stone |
| Cool blue | 180–240° | Cool whites, grey-blue stone |
| Lavender-mauve | 240–300° | Warm grey, taupe with purple cast |

---

### Axis 4 — Texture

**What it measures:** Whether the candidate introduces useful texture variety or duplicates what is already present.

**Texture families:** wood, stone, plain, metal, ceramic, fabric/woven.

**Scoring logic:**

| Candidate texture status | Score |
|---|---|
| Not yet present in palette | 1.0 (up to style limit) |
| Already present once | 0.5 |
| Already the dominant texture | 0.1 |

**Style family limits:**

| Style | Max families | Third family score | Notes |
|---|---|---|---|
| Quiet | 1–2 | 0.1 | Refinement within family matters — fine grain preferred |
| Grounded | 2–3 | 0.6 | |
| Intentional | 2–3 | 0.8 in accent role | One statement texture allowed |

---

### Axis 5 — Pattern

**What it measures:** Whether the candidate's pattern level is appropriate given accumulated pattern in the palette.

Compute **palette pattern sum** — sum of `pattern` scores of all placed elements.

**Target for candidate by palette pattern sum:**

| Palette pattern sum | Candidate target | Notes |
|---|---|---|
| 0–20 | Any | No constraint |
| 20–50 | 0–30 | Decay above 40 |
| 50+ | 0–15 | Strong penalty for adding more |

**Exception:** Backsplash role always allows one patterned element regardless of palette sum.

**Style pattern budgets:**

| Style | Palette pattern sum target | High-pattern allowance |
|---|---|---|
| Quiet | Below 30 total | None |
| Grounded | Up to 60 | One surface, low-mid pattern |
| Intentional | One element up to 80 | Allowed if all others are low |

---

## Combining the Axes

### Formula

```
score = w1·lightness + w2·warmth + w3·undertone + w4·texture + w5·pattern
```

### Weights by Style

| Axis | Quiet | Grounded | Intentional |
|---|---|---|---|
| Lightness | 0.25 | 0.25 | 0.30 |
| Warmth | 0.30 | 0.25 | 0.20 |
| Undertone | 0.20 | 0.20 | 0.20 |
| Texture | 0.15 | 0.20 | 0.20 |
| Pattern | 0.10 | 0.10 | 0.10 |

Warmth is weighted highest in Quiet — tonal coherence is the main discipline. Lightness gets a slight boost in Intentional — contrast placement is the main discipline. Undertone stays constant across all modes.

---

## Recommendation Logic

Given the current palette state, for each candidate material:

1. Identify the **anchor** — heaviest placed element by visual weight
2. Identify **what is unresolved** — which axis has the most open space or the highest risk given current selections
3. Compute the five axis scores against current state
4. Rank candidates by weighted sum for the declared style
5. Surface top candidates with a **one-line reason** driven by the highest-contributing axis

The reason line makes the recommendation legible to the user and provides a natural foundation for palette audit when that is later introduced.

---

## What "A Good Next Material" Looks Like

| Axis | Signal that something good is needed | What to look for |
|---|---|---|
| Lightness | All placed elements are mid-toned | A candidate that moves toward the light or dark end of the style's target range |
| Warmth | Anchor is strongly warm or cool, no contrast placed yet | A candidate in the neutral-to-opposite zone |
| Undertone | Anchor has a populated hue_angle, no other element has responded to it | A candidate in the same family (Quiet) or complementary zone (Intentional) |
| Texture | All placed elements share one texture family | A candidate from a different family within the style's limit |
| Pattern | Palette pattern sum is climbing | A plain or very low-pattern candidate |
