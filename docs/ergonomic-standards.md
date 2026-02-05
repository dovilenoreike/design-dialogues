# Ergonomic Standards Reference

> **This document serves as a reference for space planning formulas.**
> It is NOT directly imported by code — it provides context for feature development.
>
> Last updated: 2026-02-04

---

## How to Use This Document

- Reference when building audit questions, calculators, or AI prompts
- Formulas may be implemented in code with adjustments
- Update this document as standards evolve
- Code does NOT need to change when this document changes

---

## 4-Tier Evaluation System

Each dimension is evaluated on a 4-tier scale:

| Tier | Description | Visual Indicator |
|------|-------------|------------------|
| **Underbuilt** | Below minimum functional threshold | Red / Warning |
| **Minimal Acceptable** | Functional but tight, may feel cramped | Amber / Caution |
| **Optimal** | Recommended comfortable range | Green / Good |
| **Overbuilt** | Excessive, potentially wasted space/cost | Neutral / Info |

---

## Formulas by Category

### 1. Kitchen Linear Length (base cabinets + tall units combined)

| Component | Value |
|-----------|-------|
| **Base** | 3.0 m |
| **Per extra adult** | +0.6 m |
| **Per extra child** | +0.4 m |

**Formula:** 3.0m + adults × 0.6m + children × 0.4m

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < formula − 1.5 m | or less than 2.4
| Minimal Acceptable | formula − 1.5 m to formula − 0.6 m | and not less than 2.4
| Optimal | formula − 0.6 m to formula + 0.6 m |
| Overbuilt | > formula + 1.5 m |

**Rationale:** LT cooking culture requires more counter space for meal prep, larger fridges, and bulk shopping habits.

---

### 2. Tall Kitchen Storage Units (pantry, fridge towers)

| Component | Value |
|-----------|-------|
| **Formula** | 1 tall unit per 2 people (rounded up) |

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < required − 1 |
| Minimal Acceptable | required − 1 |
| Optimal | required to required + 1 |
| Overbuilt | > required + 2 |

---

### 3. Number of Bathrooms (incl. WC)

| People | Bathrooms |
|--------|-----------|
| Up to 3 | 1 bathroom |
| 4–5 | 2 bathrooms |
| 6+ | 3 bathrooms |

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | Two levels below recommended |
| Minimal Acceptable | One level below recommended |
| Optimal | Recommended |
| Overbuilt | +1 or more above recommended |

**Note:** Extra WC becomes an upgrade, not a base rule.

---

### 4. Laundry Setup Type

| People | Setup |
|--------|-------|
| 1–3 | Bathroom-integrated |
| 4–5 | Dedicated laundry niche |
| 6+ | Separate laundry room |

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | Two levels below recommended |
| Minimal Acceptable | One level below recommended |
| Optimal | Recommended |
| Overbuilt | One level above recommended |

---

### 5. Entrance Wardrobe / Hanging Length

| Component | Value |
|-----------|-------|
| **Per adult** | 0.6 m |
| **Per child** | 0.4 m |
| **Seasonal buffer** | +0.6 m (coats, guests) |

**Formula:** adults × 0.6m + children × 0.4m + 0.6m

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < formula − 0.8 m |
| Minimal Acceptable | formula − 0.8 m to formula − 0.3 m |
| Optimal | formula − 0.3 m to formula + 0.4 m |
| Overbuilt | > formula + 0.8 m |

**Rationale:** LT reality includes winter coats, boots, and frequent guests.

---

### 6. Main Bedroom Wardrobe Length

| Occupants | Optimal Length |
|-----------|----------------|
| 1 adult | 1.8 m |
| 2 adults | 2.4–2.8 m |

**Tiers (for couple):**
| Tier | Range |
|------|-------|
| Underbuilt | < 1.8 m |
| Minimal Acceptable | 1.8 m to 2.3 m |
| Optimal | 2.4 m to 3.0 m |
| Overbuilt | > 3.2 m |

---

### 7. Kids Wardrobe Length (total, combined)

| Component | Value |
|-----------|-------|
| **Per child** | 0.8 m |
| **Shared buffer** | +0.4 m (sports, seasonal) |

**Formula:** children × 0.8m + 0.4m

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < formula − 0.5 m |
| Minimal Acceptable | formula − 0.5 m to formula − 0.2 m |
| Optimal | formula − 0.2 m to formula + 0.4 m |
| Overbuilt | > formula + 0.8 m |

---

### 8. General Storage / Utility Wardrobe

| Component | Value |
|-----------|-------|
| **Base** | 1.0 m |
| **Per person** | +0.4 m |

**Formula:** 1.0m + people × 0.4m

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < formula − 0.6 m |
| Minimal Acceptable | formula − 0.6 m to formula − 0.2 m |
| Optimal | formula − 0.2 m to formula + 0.5 m |
| Overbuilt | > formula + 1.0 m |

---

### 9. Cleaning Storage (vacuum, mop, tools)

| Component | Value |
|-----------|-------|
| **Minimum** | 0.6 m |
| **Per additional 2 people** | +0.2 m |

**Tiers:**
| Tier | Description |
|------|-------------|
| Underbuilt | No dedicated space |
| Minimal Acceptable | Shared corner or under-stair nook |
| Optimal | Dedicated 60×60cm closet |
| Overbuilt | Full utility room |

---

### 10. Dining Table Seating

| Component | Value |
|-----------|-------|
| **Base** | Adults + children |
| **Guest buffer** | +2 seats |

**Formula:** people + 2

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < people |
| Minimal Acceptable | people to people + 1 |
| Optimal | people + 2 to people + 3 |
| Overbuilt | > people + 4 |

---

### 11. Living Room Seating Capacity

| Component | Value |
|-----------|-------|
| **Base** | People count |
| **Lounging buffer** | +1 seat |

**Formula:** people + 1

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < people |
| Minimal Acceptable | people |
| Optimal | people + 1 to people + 2 |
| Overbuilt | > people + 3 |

---

### 12. Total Storage Length (Combined)

Combines: Entrance + Master Bedroom + Kids (if any) + General Storage

**Formula:** See individual formulas above, summed

**Tiers:**
| Tier | Range |
|------|-------|
| Underbuilt | < formula × 0.75 |
| Minimal Acceptable | formula × 0.75 to formula × 0.90 |
| Optimal | formula × 0.90 to formula × 1.15 |
| Overbuilt | > formula × 1.35 |

---

## Summary Table

| # | Area | Formula | Underbuilt | Minimal | Optimal | Overbuilt |
|---|------|---------|------------|---------|---------|-----------|
| 1 | Kitchen linear | 3.0m + 0.6m/extra adult + 0.4m/child | < f−1.5m | f−1.5m to f−0.6m | f±0.6m | > f+1.2m |
| 2 | Tall units | 1 per 2 people | < req−1 | req−1 | req to req+1 | > req+2 |
| 3 | Bathrooms | 1→3ppl, 2→4-5ppl, 3→6+ppl | −2 levels | −1 level | recommended | +1 above |
| 4 | Laundry | integrated→niche→room | −2 levels | −1 level | recommended | +1 above |
| 5 | Entrance wardrobe | 0.6m/adult + 0.4m/child + 0.6m | < f−0.8m | f−0.8m to f−0.3m | f−0.3m to f+0.4m | > f+0.8m |
| 6 | Bedroom wardrobe | 1.8m (1) / 2.4m (2) | < 1.8m | 1.8–2.3m | 2.4–3.0m | > 3.2m |
| 7 | Kids wardrobe | 0.8m/child + 0.4m | < f−0.5m | f−0.5m to f−0.2m | f−0.2m to f+0.4m | > f+0.8m |
| 8 | General storage | 1.0m + 0.4m/person | < f−0.6m | f−0.6m to f−0.2m | f−0.2m to f+0.5m | > f+1.0m |
| 9 | Cleaning storage | 0.6m min | None | Corner/nook | 60×60 closet | Full room |
| 10 | Dining seats | people + 2 | < people | people to p+1 | p+2 to p+3 | > p+4 |
| 11 | Living seats | people + 1 | < people | people | p+1 to p+2 | > p+3 |
| 12 | Total storage | sum of 5,6,7,8 | < f×0.75 | f×0.75–0.90 | f×0.90–1.15 | > f×1.35 |

---

## Changelog

- **2026-02-04:** Updated to 4-tier system (Underbuilt / Minimal Acceptable / Optimal / Overbuilt)
- **2026-02-04:** Added Total Storage Length as combined formula (#12)
- **2026-02-03:** Kitchen linear formula updated - 3.0m is now base for 2 people
- **2026-02-03:** Initial version with 11 formulas
