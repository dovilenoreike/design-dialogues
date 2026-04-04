# Material matching system — refactoring plan

## Context

This document captures the design decisions and migration plan for refactoring the material matching system from a collection-based model to a graph-based compatibility model.

---

## The problem with the current model

Collections in `collections-v2.ts` implicitly encode compatibility by grouping materials together. This assumes **full transitivity** — if A matches B and B matches C, then A matches C. In practice this breaks down:

- The same material pair can work in one combination but not another
- Archetype strings (`light-wood`, `soft-texture-dark`) conflate UI labelling with compatibility logic
- Adding new materials requires creating or modifying entire collections
- There is no way to validate whether a user-built combination is harmonious

---

## Core design decisions

### Pairwise compatibility is the ground truth

Every pair of materials that work together in real life gets a `pair_compatibility` row. **A row only exists if the pair has been physically tested and approved.** No row means not yet tested — not that it doesn't work. This keeps the table honest: every row is ground truth.

Pairwise approval is **necessary but not fully sufficient**. Two additional lightweight layers handle edge cases:

- **Layer 2 — set rules**: simple logical constraints on a full set (e.g. avoid two bold-pattern materials as fronts). Defined once, applied automatically.
- **Layer 3 — set exceptions**: a small curated table of specific material combinations that pass pairwise but fail in practice. Added reactively, not upfront.

### Material descriptor replaces archetype strings

Each material is described with four continuous fields:

| Field | Type | Purpose |
|---|---|---|
| `texture` | enum: `wood \| stone \| plain \| metal` | what the material is |
| `lightness` | 0–100 | perceptual brightness |
| `warmth` | −1 to +1 | cool grey → warm beige |
| `pattern` | 0–100 | subtle grain/vein → bold |

UI buckets like "light / medium / dark" are **display logic derived from `lightness`**, not stored data. This eliminates archetype boundary ambiguity entirely.

### Collections become a presentation layer only

Collections are curated presets for exploration — they point at specific materials and carry display metadata (name, designer, vibe). They have no compatibility logic of their own. A collection's validity is **validated by the graph**, not defined by it.

### ✨ swap logic

The "suggest better alternative" feature searches:
- same `texture`
- `lightness` within ± N (tunable)
- `pattern` within ± N (tunable)

Then ranks candidates by their compatibility score against the rest of the current set.

---

## Data model

### `materials`
```sql
id              uuid PK
technical_code  string        -- supplier product id, e.g. "solido-bolsena"
name            jsonb         -- { en: string, lt: string }
role            text[]        -- e.g. ['floor'], ['front'], ['floor', 'worktop']
texture         enum: wood | stone | plain | metal
lightness       integer       -- 0–100
warmth          float         -- -1 to +1
pattern         integer       -- 0–100
texture_prompt  string        -- prompt fragment for AI image generation
image_url       string
created_at      timestamp
```

### `pair_compatibility`
```sql
id            uuid PK
material_a_id uuid FK → materials
material_b_id uuid FK → materials
approved_by   string
notes         string
created_at    timestamp
```

> Symmetric — no role_context needed. Role is already known from the materials themselves.
> Every row in this table is a physically verified approval. Absence of a row means the pair has not been tested yet.

### `set_rules`
```sql
id              uuid PK
description     string
applies_to_role enum: front | floor | worktop | any
condition       jsonb
severity        enum: warn | block
example         string
```

Example condition (no two bold-pattern fronts):
```json
{ "role": "front", "field": "pattern", "op": "max_same_above", "threshold": 70 }
```

### `set_exceptions`
```sql
id               uuid PK
material_ids     uuid[]
reason           string
severity         enum: warn | block
discovered_date  date
```

### `collections`
```sql
id          string PK
name        jsonb         -- { en: string, lt: string }
designer    string
vibe        enum
floor_id    uuid FK → materials
worktop_id  uuid FK → materials
front_ids   uuid[]        -- FK → materials
```

### `user_sets`
```sql
id              uuid PK
floor_id        uuid FK → materials
worktop_id      uuid FK → materials
front_ids       uuid[]
validity_score  float         -- min pair compatibility score across the set
rule_warnings   uuid[]        -- set_rule ids triggered
seeded_from     string        -- collection id if started from a preset
created_at      timestamp
```

---

## Refactoring plan

### Phase 1 — migrate materials (current system unaffected)

**1.1 Create Supabase tables**

Write a single migration file creating all tables above. Run in Supabase SQL editor.

**1.2 Create a material record for every existing product**

For each product id in `collections-v2.ts`, create a `materials` row. Fill `technical_code` from the product id, `name` from the collection name context, and `texture_prompt` from the existing `promptBase` where applicable. Derive starting `lightness` and `pattern` values from archetype strings:

| Old archetype | texture | lightness | pattern |
|---|---|---|---|
| `light-wood` | wood | 75 | 25 |
| `medium-wood` | wood | 50 | 30 |
| `dark-wood` | wood | 20 | 35 |
| `soft-texture-light` | stone | 75 | 20 |
| `bold-texture-light` | stone | 75 | 80 |
| `soft-texture-dark` | stone | 25 | 20 |
| `white` | plain | 95 | 5 |
| `neutral` | plain | 65 | 5 |
| `black` | plain | 5 | 5 |
| `concrete` | stone | 55 | 15 |

> These are starting estimates only. Each material should be reviewed and adjusted against its actual image.

**1.3 Migrate Collection records**

Replace `pool` and `products` maps with direct `floor_id`, `worktop_id`, `front_ids[]` pointing to the new material UUIDs. Validate every FK exists in `materials`.

---

### Phase 2 — build the compatibility graph (most manual work)

**2.1 Use existing collections as a testing checklist**

The collections in `collections-v2.ts` imply which pairs are likely to work — every pair of materials that co-appears in a collection is a candidate to test. Extract this list and use it as a prioritised testing queue. Do not insert rows yet.

**2.2 Physical approval pass**

Work through the testing queue in real life. For each pair that passes:
- Insert a `pair_compatibility` row
- Set `approved_by` and add `notes` where useful

Pairs that don't pass are simply not inserted — no record needed. The graph only ever contains confirmed approvals.

**2.3 Define initial SetRules**

Start with 2–3 rules derived from what you already know:
- No two fronts with `pattern > 60` and the same `texture`
- At least one material in the set must have `lightness > 65`
- Front-to-front: if both are wood, `lightness` difference must be > 20

---

### Phase 3 — retire old collection logic (graph becomes source of truth)

**3.1 Switch material picker to use graph**

Replace collection `pool` lookup with a Supabase query:

```sql
-- Given already-selected material ids, find compatible next options
SELECT m.*
FROM materials m
JOIN pair_compatibility pc
  ON (pc.material_a_id = m.id OR pc.material_b_id = m.id)
WHERE
  (pc.material_a_id = ANY(:selected_ids) OR pc.material_b_id = ANY(:selected_ids))
  AND m.id != ALL(:selected_ids)
  AND m.role @> ARRAY[:target_role]  -- supports multi-role materials
GROUP BY m.id
HAVING COUNT(*) = :selected_count  -- compatible with ALL selected materials
```

**3.2 Delete `pool` and `products` from collections**

Once the picker is running from the graph and collections are validated, remove the old fields from `collections-v2.ts` and the `CollectionV2` type definition.

---

## What stays in files vs database

| Entity | Location | Reason |
|---|---|---|
| `materials` | Supabase | needs querying, grows over time |
| `pair_compatibility` | Supabase | grows with every approval session |
| `collections` | Supabase | references material UUIDs |
| `user_sets` | Supabase | per-session or per-user state |
| `set_rules` | files (initially) | small, rarely changes |
| `set_exceptions` | files (initially) | very small, added reactively |

---

## Open questions

- [x] What is the approval UI for `pair_compatibility`? → Supabase dashboard for now
- [ ] What ± delta for `lightness` and `pattern` in the ✨ swap logic?
- [ ] Should `user_sets` be persisted per user (requires auth) or session-only?
- [x] Can materials serve multiple roles? → Yes, `role` is an array. Compatibility is role-agnostic — two materials either work together or they do not.
