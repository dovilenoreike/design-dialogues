# Ergonomic Standards Reference

> **This document serves as a reference for space planning formulas.**
> It is NOT directly imported by code — it provides context for feature development.
>
> Last updated: 2026-02-03

---

## How to Use This Document

- Reference when building audit questions, calculators, or AI prompts
- Formulas may be implemented in code with adjustments
- Update this document as standards evolve
- Code does NOT need to change when this document changes

---

## Formulas by Category

### 1. Kitchen Linear Length (base cabinets + tall units combined)

| Component | Value |
|-----------|-------|
| **Base (for 2 people)** | 3.0 m |
| **Per extra adult** | +0.6 m |
| **Per extra child** | +0.4 m |

**Formula:** 3.0m + max(0, adults − 2) × 0.6m + children × 0.4m

**Ranges:**
- **Underbuilt:** < formula − 0.6 m
- **Overbuilt:** > formula + 0.7 m

**Rationale:** LT cooking culture requires more counter space for meal prep, larger fridges, and bulk shopping habits.

---

### 2. Tall Kitchen Storage Units (pantry, fridge towers)

| Component | Value |
|-----------|-------|
| **Formula** | 1 tall unit per 2 people (rounded up) |

**Ranges:**
- **Underbuilt:** < required units
- **Overbuilt:** > required + 1 unit

---

### 3. Number of Bathrooms (incl. WC)

| People | Bathrooms |
|--------|-----------|
| Up to 3 | 1 bathroom |
| 4–5 | 2 bathrooms |
| 6+ | 3 bathrooms |

**Ranges:**
- **Underbuilt:** One level below recommended
- **Overbuilt:** +1 bathroom above recommended

**Note:** Extra WC becomes an upgrade, not a base rule.

---

### 4. Laundry Setup Type

| People | Setup |
|--------|-------|
| 1–3 | Bathroom-integrated |
| 4–5 | Dedicated laundry niche |
| 6+ | Separate laundry room |

**Ranges:**
- **Underbuilt:** One level below recommended
- **Overbuilt:** One level above recommended

---

### 5. Entrance Wardrobe / Hanging Length

| Component | Value |
|-----------|-------|
| **Per adult** | 0.6 m |
| **Per child** | 0.4 m |
| **Seasonal buffer** | +0.6 m (coats, guests) |

**Ranges:**
- **Underbuilt:** < formula − 0.4 m
- **Overbuilt:** > formula + 0.6 m

**Rationale:** LT reality includes winter coats, boots, and frequent guests.

---

### 6. Main Bedroom Wardrobe Length

| Occupants | Length |
|-----------|--------|
| 1 adult | 1.8 m |
| 2 adults | 2.4–2.8 m |

**Ranges:**
- **Underbuilt:** < 1.8 m (single) / < 2.4 m (couple)
- **Overbuilt:** > 3.2 m

---

### 7. Kids Wardrobe Length (total, combined)

| Component | Value |
|-----------|-------|
| **Per child** | 0.8 m |
| **Shared buffer** | +0.4 m (sports, seasonal) |

**Ranges:**
- **Underbuilt:** < formula − 0.3 m
- **Overbuilt:** > formula + 0.6 m

---

### 8. General Storage / Utility Wardrobe

| Component | Value |
|-----------|-------|
| **Base** | 1.0 m |
| **Per person** | +0.4 m |

**Ranges:**
- **Underbuilt:** < formula − 0.4 m
- **Overbuilt:** > formula + 0.8 m

---

### 9. Cleaning Storage (vacuum, mop, tools)

| Component | Value |
|-----------|-------|
| **Minimum** | 0.6 m |
| **Per additional 2 people** | +0.2 m |

**Ranges:**
- **Underbuilt:** No dedicated space
- **Overbuilt:** Full utility closet

---

### 10. Dining Table Seating

| Component | Value |
|-----------|-------|
| **Base** | Adults + children |
| **Guest buffer** | +2 seats |

**Ranges:**
- **Underbuilt:** No guest seats
- **Overbuilt:** +4 or more seats beyond household

---

### 11. Living Room Seating Capacity

| Component | Value |
|-----------|-------|
| **Base** | People count |
| **Lounging buffer** | +1 seat |

**Ranges:**
- **Underbuilt:** Seats < people count
- **Overbuilt:** People count + 3 or more

---

## Summary Table

| # | Area | Formula | Underbuilt | Overbuilt |
|---|------|---------|------------|-----------|
| 1 | Kitchen linear | 3.0m (base for 2) + 0.6m/extra adult + 0.4m/child | < formula − 0.6m | > formula + 0.7m |
| 2 | Tall kitchen units | 1 per 2 people (rounded up) | < required | > required + 1 |
| 3 | Bathrooms | 1→3ppl, 2→4-5ppl, 3→6+ppl | One level below | +1 above |
| 4 | Laundry | 1-3→integrated, 4-5→niche, 6+→room | One level below | One level above |
| 5 | Entrance wardrobe | 0.6m/adult + 0.4m/child + 0.6m | < formula − 0.4m | > formula + 0.6m |
| 6 | Main bedroom wardrobe | 1.8m (1) / 2.4-2.8m (2) | < 1.8m / < 2.4m | > 3.2m |
| 7 | Kids wardrobe | 0.8m/child + 0.4m buffer | < formula − 0.3m | > formula + 0.6m |
| 8 | General storage | 1.0m + 0.4m/person | < formula − 0.4m | > formula + 0.8m |
| 9 | Cleaning storage | 0.6m min + 0.2m per 2 extra ppl | No dedicated space | Full closet |
| 10 | Dining seating | People + 2 guests | No guest seats | +4 or more |
| 11 | Living seating | People + 1 | Seats < people | People + 3+ |

---

## Changelog

- **2026-02-03:** Kitchen linear formula updated - 3.0m is now base for 2 people, extras added beyond that
- **2026-02-03:** Initial version with 11 formulas
