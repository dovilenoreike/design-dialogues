# Automated Wood-to-Neutral Generative Model

This framework automatically generates the exact target vector for a Harmonious Neutral Material $(L_c, C_c, W_c, H_c)$ using the attributes of a given Wood Anchor Material $(L_a, C_a, W_a, H_a)$.

---

## 1. Core Global Parameters

These static tuning constants govern the boundary sensitivity of the engine:
* $\lambda_{light} = 0.65$ (Lightness expansion factor for light neutrals)
* $\lambda_{med} = 0.50$ (Lightness convergence factor for mid-tone neutrals)
* $\lambda_{dark} = 0.60$ (Lightness compression factor for dark neutrals)
* $\mu_{base} = 0.35$ (Maximum allowable chroma threshold for dark neutrals)
* $k = 1.5$ (Perceptual exponent tracking lightness-chroma decay)

---

## 2. Step 1: Target Lightness Functions ($L_c$)

Depending on the chosen tier (Light, Medium, or Dark), calculate the master driver $L_c$ based on a scale bounded between `0` (Black) and `100` (White):

### A. Light Neutral
$$L_c = L_a + \lambda_{light} \cdot (100 - L_a)$$

### B. Medium Neutral
$$L_c = L_a + \lambda_{med} \cdot (50 - L_a)$$

### C. Dark Neutral
$$L_c = L_a \cdot (1 - \lambda_{dark})$$

---

## 3. Step 2: Dependent Attribute Matrix

Once $L_c$ is established by one of the formulas above, thread it sequentially through the dependent attribute equations to solve for Chroma, Warmth, and Hue:

### A. Dynamic Chroma Suppression ($C_c$)
$$C_c = C_a \cdot \mu_{base} \cdot \left( 1 - \frac{L_c}{100} \right)^k$$

### B. Proportional Warmth Scaling ($W_c$)
$$W_c = W_a \cdot \left( \frac{C_c}{C_a} \right)$$

### C. Monochromatic Hue Locking ($H_c$)
$$H_c = H_a$$

---

## 4. Alternate Strategy: Complementary Contrast

If your system toggles to a **Complementary Contrast** setting (e.g., matching a warm wood with a crisp, balancing cool gray) instead of a monochromatic blend, substitute Step 2-B and Step 2-C with the following inversions:

### Alternate Warmth (Cool Shift)
$$W_c = W_{max} - \left[ W_a \cdot \left( \frac{C_c}{C_a} \right) \right]$$

### Alternate Hue ($180^\circ$ Phase Inversion)
$$H_c = (H_a + 180^\circ) \pmod{360^\circ}$$