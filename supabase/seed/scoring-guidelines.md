# Material Scoring Guidelines

Last updated: 2026-05-11

---

## texture
Category label for the surface type.

```
wood | stone | metal | plain | textile | concrete | ceramic
```

---

## lightness
Perceived luminosity. 0 = pure black, 100 = pure white.

Score what the surface reads as in the image — not the raw pixel brightness.
A dark-stained wood plank with gloss would still read dark.

---

## warmth
Warm/cool direction of the overall colour temperature.
Scale: −1 (cold blue-grey) → 0 (neutral) → +1 (deep amber-orange).

**Score assertively — don't cluster near zero. Use the full range.**

| Reference | warmth |
|---|---|
| Deep amber / honey oak / warm walnut | 0.40–0.45 |
| Light oak / natural oak | 0.20–0.30 |
| Warm white / off-white / cream | 0.15–0.25 |
| Warm beige / warm stone | 0.20–0.30 |
| Sandy greige (subtle warm) | 0.05–0.10 |
| Pure neutral white / true black / mid-grey | 0.00 |
| Grey-washed oak / greige (borderline) | −0.05 to 0.05 |
| Cool grey lacquer / cool stone | −0.10 to −0.15 |
| Blue-grey / slate / cool marble | −0.15 to −0.25 |
| Brushed steel / chrome | −0.05 to −0.10 |

---

## pattern
Visual complexity of the **surface texture itself** — grain intensity, tonal
variation, veining, knots, weave structure.

**Score from the material surface, not the installation layout.**
Chevron / herringbone is a layout pattern — it adds only a very subtle
contribution (≤ 5 points) on top of the wood grain score.

| Surface | pattern |
|---|---|
| Solid plain / lacquer / paint | 0–5 |
| Very subtle grain, washed or dark | 10–20 |
| Clear wood grain, moderate variation | 22–32 |
| Strong grain + knots / prominent plank variation | 33–42 |
| Marble with clear veining | 45–65 |
| Bold marble / dramatic veining | 65–85 |
| Heavily patterned textile / mosaic | 60–90 |

---

## chroma
Saturation of the actual colour in the image.
0 = fully achromatic (grey/white/black) → 100 = maximally vivid.

**Score each material individually from the image — do not use category
defaults as a cap.** A red stone scores as red (high chroma). A coloured
lacquer front scores its actual saturation.

Typical observed ranges (reference only, not limits):
| Material | typical chroma |
|---|---|
| Grey-washed / very dark wood | 3–7 |
| Natural light oak | 8–13 |
| Warm honey / walnut oak | 10–16 |
| Stone (most) | 3–10 |
| Stone (coloured — terracotta, green marble) | 15–40 |
| Plain fronts (white / grey) | 2–8 |
| Plain fronts (pastel / tinted) | 8–20 |
| Plain fronts (bold colour) | 25–60 |
| Metals | 2–8 |
| Textiles | 5–40 |

---

## hue_angle
Dominant colour direction (undertone), 0–360°.
Set to NULL only when chroma ≤ 5 (genuinely achromatic — no readable hue).

**Score the actual undertone visible in the image, not the "typical" range
for the category.**

```
0°   = red
15°  = red-orange
30°  = orange / warm brown
45°  = golden-yellow
60°  = yellow
90°  = yellow-green
120° = green
180° = cyan
210° = blue-green
240° = blue
270° = violet
300° = magenta / pink
```

| Reference | hue_angle |
|---|---|
| Warm brown / walnut | 25–32° |
| Orange-brown / amber oak | 30–38° |
| Golden / sandy-beige oak | 36–44° |
| Warm white / cream | 40–55° |
| Greige with warm undertone | 36–42° |
| Pink-undertone stone / plaster | 10–20° |
| Green-tinted stone | 100–130° |
| Blue-grey stone / cool slate | 210–240° |
| Terracotta | 15–25° |

---

## texture_prompt
Short label used as image identifier in AI generation prompts.

- **Non-plain textures**: just the texture name → `wood`, `stone`, `metal`,
  `textile`, `concrete`, `ceramic`
- **Exception** — if scale is distinctive, append it:
  `stone-large-format`, `textile-oversized`
- **Plain fronts and worktops**: derive from lightness + chroma:
  - chroma < 15: lightness ≥ 80 → `white` / lightness ≥ 45 → `neutral` / else → `dark`
  - chroma ≥ 15: lightness ≥ 55 → `pastel` / else → `bold`

---

## layout_pattern *(floors only)*
Physical installation layout of the planks/tiles. Separate from pattern score.

```
plank | chevron | herringbone | brick | grid | large-format
```

---

## Calibration anchors

When scoring a new material, compare against these confirmed reference points first.
Score relative to them rather than reasoning from scratch.

### Lightness
Scores track pixel luminance — do not inflate for warm tone.
Confirmed pixel anchors: bolsena=55 (54.8%), runa=51 (51.2%).

| Score | Reference material | Reads as |
|---|---|---|
| 13 | aspecta-burned | near-black, grain barely visible |
| 22 | aspecta-maggiore | very dark espresso |
| 33 | floorest-nora | dark greige-brown |
| 35 | aspecta-brienz / floorest-lira | medium-dark warm/cool brown |
| 42 | floorest-orien | medium greige |
| 43 | aspecta-pecan | medium warm brown |
| 46 | aspecta-constance / floorest-maren | medium cool-grey / medium honey |
| 47 | aspecta-macadamia | medium honey |
| 51 | floorest-runa | ★ pixel confirmed 51.2% |
| 53 | floorest-silva | medium golden-yellow |
| 55 | aspecta-bolsena | ★ pixel confirmed 54.8% |
| 62 | aspecta-baron | light natural oak |
| 64 | aspecta-almond / floorest-mira | light sandy-beige / light sandy-greige |
| 70 | aspecta-como | very light sandy-greige |

### Warmth
| Score | Reference material | Reads as |
|---|---|---|
| −0.08 | aspecta-constance | cool grey-washed oak |
| 0.05 | aspecta-bolsena | barely warm, greige |
| 0.08 | floorest-nora / floorest-orien | subtle greige warmth |
| 0.12 | floorest-mira | sandy warm, understated |
| 0.22 | floorest-runa | warm golden, lighter character |
| 0.25 | aspecta-almond | natural warm oak |
| 0.28 | floorest-maren / aspecta-baron | honey-brown / natural oak |
| 0.30 | aspecta-brienz | warm brown oak |
| 0.32 | floorest-silva / aspecta-macadamia | golden-yellow / rich honey |

### Pattern (wood grain intensity)
| Score | Reference material | Reads as |
|---|---|---|
| 15 | aspecta-burned | grain nearly invisible at this depth |
| 20 | floorest-lira / floorest-nora | washed grain, low contrast |
| 22 | aspecta-constance / aspecta-maggiore | grain visible but subdued |
| 23 | aspecta-bolsena / aspecta-como | subtle, low plank variation |
| 28 | aspecta-almond | clear grain, moderate variation |
| 30 | aspecta-pecan / floorest-silva | clear grain with visible plank variation |
| 32 | aspecta-brienz | strong grain, tonal variation |
| 35 | aspecta-baron / aspecta-macadamia | strong grain + prominent plank variation |

### Chroma
| Score | Reference material | Reads as |
|---|---|---|
| 4 | aspecta-burned | near-achromatic |
| 5 | aspecta-constance | barely any colour |
| 7 | aspecta-bolsena / floorest-lira | faint greige undertone |
| 8 | aspecta-almond / floorest-mira | mild warm colour |
| 10 | floorest-silva | moderate warm colour |
| 11 | aspecta-baron / aspecta-pecan | clear warm colour |
| 12 | aspecta-brienz / floorest-maren | rich warm colour |
| 13 | aspecta-macadamia | most saturated in wood floor collection |

### Hue angle
| Score | Reference material | Undertone direction |
|---|---|---|
| 28 | aspecta-maggiore | warm brown, red-orange edge |
| 30 | aspecta-brienz / floorest-maren | orange-brown / warm brown |
| 32 | aspecta-macadamia / aspecta-pecan | orange-brown / honey |
| 35 | aspecta-baron | amber-brown |
| 37 | floorest-runa | warm golden |
| 38 | aspecta-almond / floorest-lira | golden-sandy |
| 40 | aspecta-como / floorest-mira | sandy golden-yellow |
| 45 | floorest-silva | assertively golden-yellow |

---

## General principles

1. **Score what you see** — read the image directly, don't average toward
   category norms.
1a. **Lightness tracks pixel luminance, not warmth** — a warm golden oak and
    a cool greige at the same actual brightness score the same lightness.
    Warm tones feel lighter than they measure; resist inflating lightness for
    warm materials. Use the calibration anchors above as a reference.
2. **Use the full scale** — if it's dark, score it dark. If it's warm, score
   it warm. Clustering near safe middle values makes the data useless.
3. **Warmth and hue_angle are complementary** — warmth = overall temperature
   direction, hue_angle = the specific colour angle of the undertone. A pink-
   undertone oak and a golden oak can share the same warmth but differ in
   hue_angle.
4. **NULL for hue_angle only when truly achromatic** — if you can see any
   colour direction, score it. Grey-washed woods often have a warm beige or
   cool blue undertone that matters for pairing.
