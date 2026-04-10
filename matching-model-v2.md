# Material matching model — v2 decisions

## Context

This document captures decisions made after the initial migration to Supabase was completed. The following are already in place:

- `materials` table with `texture`, `lightness`, `warmth`, `chroma`, `pattern` fields
- `pair_compatibility` table containing only physically verified approvals
- Archetypes exist as UI display logic derived from descriptors
- `collections-v2.ts` has been retired — collections are now thin presentation presets in Supabase

This document focuses on: scoring clarification, the two-tier matching model, and picker behaviour.

---

## Pattern field — clarification and retagging guidance

### What `pattern` should measure

`pattern` measures the **colour contrast between the lightest and darkest areas within the material's surface design**. It does not measure grain visibility, texture depth, or surface relief.

```
low pattern  (0–25)   →  near-uniform surface, minimal colour variation
                          e.g. plain stone, subtle beige-on-beige veining
mid pattern  (26–60)  →  visible but quiet surface variation
                          e.g. soft marble, gentle wood colour variation
high pattern (61–100) →  dramatic colour contrast within the surface
                          e.g. Patagonia stone, strongly contrasting veining,
                               bold two-tone wood grain
```

### Why this matters

Product photography varies significantly between suppliers. Some capture grain in fine detail, others shoot flat. Scoring `pattern` from photos as grain intensity produces inconsistent values — two identical materials from different suppliers can score 20 apart based purely on photography style.

Scoring colour contrast is more photo-stable. Even in a flat, overexposed product photo, the relative lightness difference between the vein colour and the base colour is still readable.

### Retagging guidance

When reviewing or adding a material, ask: **if I desaturated this material to greyscale, how much contrast would I see between its lightest and darkest areas?**

- Almost no contrast → pattern 0–20
- Subtle variation → pattern 20–40
- Clear but calm variation → pattern 40–60
- Strong contrast, dramatic → pattern 60–80
- Very bold, almost graphic → pattern 80–100

This question is answerable from any photo quality and from physical inspection.

---

## Two-tier matching model

### The system's job

The system solves a **harmony problem**. The user creates the design — the system ensures the foundation is harmonious. This distinction is important: the system does not decide what looks good, it prevents combinations that clash.

### Tier 1 — approved

- A `pair_compatibility` row exists
- Physically tested in real life
- Shown with a strong "goes together" badge
- Ground truth — every row is a verified approval

### Tier 2 — suggested

- No `pair_compatibility` row exists
- Compatibility computed from descriptor fields
- Shown with a lighter "likely works" badge
- Fallback when no approved options exist for a slot

The user understands intuitively that approved means someone stood in a showroom with these materials, suggested means mathematically similar. Both are honest and useful.

### When each tier applies — rollout approach

The suggested tier is introduced gradually as descriptor scoring proves reliable. Trust is fragile — one bad suggestion makes users doubt the good ones too.

**Current state — approved pairs, sorted by weighted score**

The user-facing picker shows only Tier 1 approved pairs, ranked by `SUM(pc.weight)`. Weight is stored on `pair_compatibility` and auto-set by trigger based on texture combination — wood and stone pairings rank above plain and metal pairings, correctly reflecting their role as harmony anchors.

Descriptor scores run in the background (shadow mode) but are not shown to users. They are available in the maintainer view only — used to find testing candidates, spot tagging inconsistencies, and calibrate scoring before it goes public.

**Phase 2 — suggested tier for plain and metal**

Once descriptor scores demonstrably correlate with approved pairs (see calibration check below), introduce Tier 2 suggestions for plain and metal surfaces only. These are the lowest-risk candidates:
- Harmony is largely predictable from `lightness`, `warmth`, and `chroma`
- Plain surfaces are forgiving — a badly scored plain pair is unlikely to look dramatically wrong
- Photography inconsistency has less impact on flat surfaces than on wood/stone grain

**Phase 3 — suggested tier for wood and stone**

Only after Phase 2 proves reliable and tagging is well calibrated. Wood and stone suggestions remain maintainer-only until then — photography inconsistency between suppliers makes these scores too unreliable to show users without strong evidence they work.

### Calibration check

Before promoting scores from shadow mode to user-facing, run this check in the maintainer view:

```
for each approved pair:
  compute descriptor_score
  check: do high-scoring approved pairs cluster above score 70?
  check: do the pairs you know work best score highest?
  check: are there approved pairs scoring below 40?
         (these indicate tagging problems to fix first)
```

A score distribution where approved pairs cluster high and known-good pairs rank first is the green light for Phase 2.

---

## Computed suggestion scoring

Scoring is **role-agnostic** — two materials receive the same harmony score regardless of which role they occupy. Wood + wood scores the same whether it's two fronts, a front and a floor, or any other combination. Role-based cautions (e.g. "two wood fronts — use with care") live in `set_rules`, not in the scoring model.

### Texture pair weights

The weight of a pair is determined by the texture family of the two materials involved. This is stable and grows slowly — new surface categories (e.g. textile in future) add one row to this matrix without touching the rest of the model.

```
texture_pair_weight = MAX(texture_weight_a, texture_weight_b)

  wood  ↔ wood    →  3.0  (strongest harmony anchor)
  wood  ↔ stone   →  3.0  (most common cross-texture pairing)
  stone ↔ stone   →  3.0  (equally critical — veining and colour temp interact strongly)
  wood  ↔ plain   →  2.0
  stone ↔ plain   →  2.0
  plain ↔ plain   →  1.0  (most forgiving, computed from descriptors)
  metal ↔ any     →  1.0  (accent material, rarely the harmony anchor)
```

### Descriptor-based score for plain and metal surfaces

For plain and metal pairs, compatibility score between materials A and B:

```
score = 100
      − w_lightness × |lightness_a − lightness_b|
      − w_warmth    × |warmth_a − warmth_b| × 50
      − w_chroma    × |chroma_a − chroma_b|
```

Suggested starting weights (tunable based on real-world feedback):

| w_lightness | w_warmth | w_chroma |
|---|---|---|
| 0.5 | 1.2 | 0.5 |

**Warmth carries the highest weight** because undertone clashes are the most common source of disharmony in plain surface combinations — a cool grey front against a warm beige floor reads as wrong even when their lightness values are well matched.

### Note on single-colour textile-pattern fronts

Fronts with a textile-like surface (linen effect, fabric weave emboss) but a single flat colour are tagged as `texture: plain`. They behave identically to other plain surfaces in scoring. A separate textile texture category will be introduced only when true multi-colour or patterned textile surfaces enter the catalogue.

---

## Pair weighting in set scoring

### Weight lives in `pair_compatibility`

The weight of each approved pair is stored directly on the `pair_compatibility` table as a `weight` column. This keeps the picker query simple and the logic in the data, not scattered across queries.

```sql
-- picker ranking stays dead simple
ORDER BY SUM(pc.weight) DESC
```

### Default weight by texture combination

When a pair is inserted, a Postgres trigger automatically sets the weight based on the texture combination of the two materials. No manual input needed.

```
wood  ↔ wood    →  3.0
wood  ↔ stone   →  3.0
stone ↔ stone   →  3.0
wood  ↔ plain   →  2.0
stone ↔ plain   →  2.0
plain ↔ plain   →  1.0
metal ↔ any     →  1.0
```

The trigger logic:

```sql
CREATE OR REPLACE FUNCTION set_pair_weight()
RETURNS TRIGGER AS $$
DECLARE
  texture_a text;
  texture_b text;
BEGIN
  SELECT texture INTO texture_a FROM materials WHERE id = NEW.material_a_id;
  SELECT texture INTO texture_b FROM materials WHERE id = NEW.material_b_id;

  IF (texture_a IN ('wood','stone') AND texture_b IN ('wood','stone')) THEN
    NEW.weight := 3.0;
  ELSIF (texture_a IN ('wood','stone') AND texture_b = 'plain')
     OR (texture_b IN ('wood','stone') AND texture_a = 'plain') THEN
    NEW.weight := 2.0;
  ELSE
    NEW.weight := 1.0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pair_weight_trigger
BEFORE INSERT ON pair_compatibility
FOR EACH ROW EXECUTE FUNCTION set_pair_weight();
```

### Manual override

The weight can be overridden at any time by updating the value directly:

```sql
UPDATE pair_compatibility SET weight = 4.0 WHERE id = :pair_id;
```

Useful for specific pairs that should rank higher or lower than their texture combination suggests. Not needed yet — built in for future flexibility.

### Why this approach

- Query stays simple as the catalogue grows
- New texture types automatically get weight 1.0 until explicitly handled
- Business logic lives in the database, not in application code
- Override is always possible without touching queries

### Example

Set: light wood front + dark wood front + 2 stone worktops. Scoring candidate floors:

```
dark floor ↔ stone worktop A   →  1.0 × 2.0 = 2.0
dark floor ↔ stone worktop B   →  1.0 × 2.0 = 2.0
dark floor ↔ dark wood front   →  3.0 × 3.0 = 9.0
dark floor total               →  13.0

light floor ↔ light wood front →  3.0 × 3.0 = 9.0
light floor total              →  9.0
```

In this example dark floor still scores higher due to volume of pairings. This is handled by a **mandatory pairing rule**: if the set contains a wood front, the candidate floor must have an approved or suggested pairing with that front. This eliminates candidates that have no relationship with the dominant material in the set regardless of their total score.

---

## Picker query structure

The picker returns two tiers ordered by confidence then score:

```sql
-- Tier 1: approved pairs — weight already stored on pair_compatibility
SELECT m.*, 'approved' as match_tier,
  SUM(pc.weight) as compatibility_score
FROM materials m
JOIN pair_compatibility pc
  ON (pc.material_a_id = m.id OR pc.material_b_id = m.id)
JOIN materials other
  ON (other.id = pc.material_a_id OR other.id = pc.material_b_id)
  AND other.id != m.id
  AND other.id = ANY(:selected_ids)
WHERE
  m.id != ALL(:selected_ids)
  AND m.role @> ARRAY[:target_role]
GROUP BY m.id

UNION ALL

-- Tier 2: suggested — plain/metal only, no approved pair exists
SELECT m.*, 'suggested' as match_tier,
  100
  - 0.6 * AVG(ABS(m.lightness - other.lightness))
  - 1.2 * AVG(ABS(m.warmth - other.warmth) * 50)
  - 0.5 * AVG(ABS(m.chroma - other.chroma)) as compatibility_score
FROM materials m
CROSS JOIN materials other
WHERE
  other.id = ANY(:selected_ids)
  AND m.id != ALL(:selected_ids)
  AND m.role @> ARRAY[:target_role]
  AND m.texture IN ('plain', 'metal')
  AND NOT EXISTS (
    SELECT 1 FROM pair_compatibility pc
    WHERE (pc.material_a_id = m.id AND pc.material_b_id = other.id)
       OR (pc.material_b_id = m.id AND pc.material_a_id = other.id)
  )
GROUP BY m.id

ORDER BY match_tier ASC, compatibility_score DESC
```

---

## UI fallback behaviour

When a user selects a material with no approved pairs for a given role slot:

1. Show Tier 2 suggested matches with the lighter badge
2. Include a brief explanation — "no tested matches yet, showing close alternatives"
3. Do not block the user — let them proceed with suggestions
4. If no suggestions meet a minimum score threshold (e.g. score < 50), show all options unranked with a neutral indicator

The UI should never leave the user stuck. Confidence level is communicated through badges, not by hiding options.

---

## Feedback loop

Suggested pairs that users consistently select and keep are candidates for prioritising in the next physical approval session — they are likely to pass.

Suggested pairs that users consistently swap out may indicate descriptor values need adjustment rather than that the pair is actually incompatible.

Over time, as approved pairs accumulate, the suggested tier shrinks naturally for wood and stone materials. Plain and metal will always rely more on suggestions due to the volume of combinations.

---

## Graph completeness and publishing

### Why completeness matters

The compatibility graph must be connected for the UI to function. If a user starts from a wood floor and there are no approved wood-front pairings in the graph, the picker has nothing to show — not a poor recommendation, but no recommendation at all. This is a data quality constraint, not a set rule.

### `is_published` flag

Add `is_published boolean default false` to the `materials` table. A material is only shown in the picker once it meets minimum pairing coverage. This ensures the system never serves a dead end.

Minimum coverage requirements before publishing:

```
wood floor    →  ≥ 1 approved pairing with a wood front
wood front    →  ≥ 1 approved pairing with a wood floor
               + ≥ 1 approved pairing with a stone or plain worktop
stone worktop →  ≥ 1 approved pairing with a wood front
plain front   →  can publish immediately (computed suggestions cover it)
plain floor   →  can publish immediately
metal front   →  can publish immediately
```

### Coverage query

Run in Supabase SQL editor before approval sessions or when adding new materials. Shows which materials are unpublished and the specific missing link blocking them:

```sql
SELECT
  m.id,
  m.name,
  m.texture,
  m.role,
  m.is_published,
  COUNT(pc.id) as approved_pairs,
  CASE
    WHEN 'floor' = ANY(m.role) AND m.texture = 'wood'
     AND NOT EXISTS (
       SELECT 1 FROM pair_compatibility pc2
       JOIN materials m2
         ON (m2.id = pc2.material_a_id OR m2.id = pc2.material_b_id)
       WHERE (pc2.material_a_id = m.id OR pc2.material_b_id = m.id)
         AND m2.id != m.id
         AND m2.texture = 'wood'
         AND 'front' = ANY(m2.role)
     ) THEN 'missing: wood front pairing'

    WHEN 'front' = ANY(m.role) AND m.texture = 'wood'
     AND NOT EXISTS (
       SELECT 1 FROM pair_compatibility pc2
       JOIN materials m2
         ON (m2.id = pc2.material_a_id OR m2.id = pc2.material_b_id)
       WHERE (pc2.material_a_id = m.id OR pc2.material_b_id = m.id)
         AND m2.id != m.id
         AND m2.texture = 'wood'
         AND 'floor' = ANY(m2.role)
     ) THEN 'missing: wood floor pairing'

    WHEN 'front' = ANY(m.role) AND m.texture = 'wood'
     AND NOT EXISTS (
       SELECT 1 FROM pair_compatibility pc2
       JOIN materials m2
         ON (m2.id = pc2.material_a_id OR m2.id = pc2.material_b_id)
       WHERE (pc2.material_a_id = m.id OR pc2.material_b_id = m.id)
         AND m2.id != m.id
         AND m2.texture IN ('stone', 'plain')
         AND 'worktop' = ANY(m2.role)
     ) THEN 'missing: stone or plain worktop pairing'

    WHEN 'worktop' = ANY(m.role) AND m.texture = 'stone'
     AND NOT EXISTS (
       SELECT 1 FROM pair_compatibility pc2
       JOIN materials m2
         ON (m2.id = pc2.material_a_id OR m2.id = pc2.material_b_id)
       WHERE (pc2.material_a_id = m.id OR pc2.material_b_id = m.id)
         AND m2.id != m.id
         AND m2.texture = 'wood'
         AND 'front' = ANY(m2.role)
     ) THEN 'missing: wood front pairing'

    ELSE 'ready to publish'
  END as readiness_status

FROM materials m
LEFT JOIN pair_compatibility pc
  ON (pc.material_a_id = m.id OR pc.material_b_id = m.id)
GROUP BY m.id, m.name, m.texture, m.role, m.is_published
ORDER BY
  CASE readiness_status WHEN 'ready to publish' THEN 1 ELSE 0 END,
  m.texture,
  approved_pairs ASC
```

This query also surfaces published materials with very few approved pairs — useful for spotting fragile nodes in the graph where a user could quickly run out of options.

---

## Maintainer matching view

### Purpose

The two-tier model shows users only approved pairs for wood and stone — computed suggestions are intentionally withheld because image inconsistency makes them unreliable as user-facing recommendations. However, those same computed scores are valuable to you as a maintainer: they surface potential matches worth testing, prioritise your approval sessions, and prevent good combinations from being missed as the catalogue grows.

### How it differs from the user picker

```
User picker       →  Tier 1 (approved) for all textures
                     Tier 2 (suggested) for plain and metal only

Maintainer view   →  Tier 1 (approved) for all textures
                     Tier 2 (suggested) for ALL textures including wood and stone
                     shown side by side so gaps are visible
```

The computed score for wood and stone pairs in the maintainer view is a **testing hint** — "these two are worth putting on the table together" — not a recommendation to show users.

### Maintainer query

Run in Supabase SQL editor to find potential matches for a given material that haven't been tested yet. Replace `:material_id` with the UUID of the material you're reviewing:

```sql
-- All materials that could potentially match a given material
-- showing approved pairs and computed suggestions side by side
SELECT
  m.id,
  m.name,
  m.texture,
  m.role,
  m.lightness,
  m.warmth,
  m.chroma,
  m.pattern,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pair_compatibility pc
      WHERE (pc.material_a_id = :material_id AND pc.material_b_id = m.id)
         OR (pc.material_b_id = :material_id AND pc.material_a_id = m.id)
    ) THEN 'approved'
    ELSE 'not tested'
  END as pair_status,
  -- computed descriptor score (useful for all textures in maintainer view)
  ROUND(
    100
    - 0.5  * ABS(m.lightness - ref.lightness)
    - 1.2  * ABS(m.warmth    - ref.warmth) * 50
    - 0.5  * ABS(m.chroma    - ref.chroma)
    - 0.3  * ABS(m.pattern   - ref.pattern)
  ) as descriptor_score
FROM materials m
CROSS JOIN materials ref
WHERE
  ref.id = :material_id
  AND m.id != :material_id
  AND m.is_published = true
ORDER BY
  pair_status DESC,       -- approved first
  descriptor_score DESC   -- then by computed similarity
```

### Reading the output

- **approved + high score** → confirmed match, descriptor values are well aligned. Good calibration signal — if scores are low here, descriptor tagging may need review.
- **not tested + high score** → strong candidate for your next approval session. Prioritise these.
- **not tested + medium score** → worth testing eventually, lower priority.
- **not tested + low score** → unlikely to work, probably safe to skip unless you have a specific reason to test.
- **approved + low score** → passed physical testing despite descriptor mismatch. Either the descriptor values need retagging, or this is a case where the real-life result surprised you — worth adding a note in `pair_compatibility.notes`.

### Finding the most under-tested materials

Run this periodically to see which published materials have the most untested high-score candidates — these are the biggest gaps in your graph:

```sql
SELECT
  ref.id,
  ref.name,
  ref.texture,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM pair_compatibility pc
      WHERE (pc.material_a_id = ref.id AND pc.material_b_id = m.id)
         OR (pc.material_b_id = ref.id AND pc.material_a_id = m.id)
    )
    AND ROUND(
      100
      - 0.5 * ABS(m.lightness - ref.lightness)
      - 1.2 * ABS(m.warmth - ref.warmth) * 50
      - 0.5 * ABS(m.chroma - ref.chroma)
      - 0.3 * ABS(m.pattern - ref.pattern)
    ) > 60
  ) as high_score_untested
FROM materials ref
CROSS JOIN materials m
WHERE ref.id != m.id AND m.is_published = true AND ref.is_published = true
GROUP BY ref.id, ref.name, ref.texture
ORDER BY high_score_untested DESC
LIMIT 20
```

This surfaces the materials with the most potential connections still waiting to be tested — a useful starting point when planning an approval session.

---

## Open questions

- [ ] What ± delta for `lightness`, `chroma`, and `pattern` in the ✨ swap logic?
- [ ] Should `user_sets` be persisted per user (requires auth) or session-only?
- [ ] Minimum score threshold for Tier 2 suggestions before showing unranked fallback? (relevant for Phase 2)
- [ ] Should the mandatory wood-front-floor pairing rule live in `set_rules` or be hardcoded in the picker query?
- [ ] What score threshold and sample size constitutes a green light for Phase 2 rollout?
