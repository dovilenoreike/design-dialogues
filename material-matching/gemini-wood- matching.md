# Generative Material Matching Model for Wood Harmony

This model defines a generative framework for an interior material matching system. Given an **Anchor Material** (e.g., a floor), the model mathematically computes the exact target coordinates for a **Candidate Material** (e.g., cabinets) based on a target relative Lightness shift ($\Delta L_{rel}$). 

By dynamically linking Chroma, Warmth, and Hue to changes in Lightness, the model replicates the non-linear physical and perceptual shifts found in natural wood elements.

---

## 1. Input Variables & Parameters

### Anchor Material Vector (Given)
* $L_a$ : Anchor Lightness
* $W_a$ : Anchor Warmth
* $H_a$ : Anchor Hue
* $C_a$ : Anchor Chroma

### System Drivers & Tuning Constants
* $\Delta L_{rel}$ : The target relative lightness reduction (expressed as a decimal, e.g., `0.15` for a 15% drop).
* $\alpha$ : **Chroma Scaling Coefficient** (Controls saturation rate as wood darkens; typically `0.8` to `1.2`).
* $\beta$ : **Chroma-Warmth Exponent** (Damps/amplifies Chroma's impact on perceived warmth; typically `0.5`).
* $\gamma$ : **Lightness-Warmth Exponent** (Damps/amplifies Lightness's inverse impact on warmth; typically `0.3`).
* $\theta$ : **Hue Shift Factor** (Controls the rate of migration toward red to prevent olive/greenish undertones. Scale-dependent; see Section 3).

---

## 2. The Dependent Generative Formulas

The Candidate Material vector $(L_c, W_c, H_c, C_c)$ is calculated sequentially using the following interdependent equations:

### Step 1: Target Lightness ($L_c$)
Establishes the primary contrast anchor.
$$L_c = L_a \cdot (1 - \Delta L_{rel})$$

### Step 2: Dependent Chroma ($C_c$)
Adjusts saturation so that the darker material maintains visual richness without turning muddy or gray.
$$C_c = C_a \cdot (1 + \alpha \cdot \Delta L_{rel})$$

### Step 3: Dependent Warmth ($W_c$)
Scales warmth non-linearly, tying it directly to the deeper luminance profile and increased chroma.
$$W_c = W_a \cdot \left( \frac{C_c}{C_a} \right)^\beta \cdot \left( \frac{1}{1 - \Delta L_{rel}} \right)^\gamma$$

### Step 4: Dependent Hue ($H_c$)
Shifts the hue angle slightly toward red to account for the Bezold-Brücke shift and natural wood optics.
$$H_c = H_a - \theta \cdot \Delta L_{rel}$$

---

## 3. Calibrating the Hue Shift Factor ($\theta$)

Because natural wood occupies a very narrow band of color space, $\theta$ must be calibrated tightly depending on your architecture's metric tracking system:

| Color Space Archetype | Recommended $\theta$ Range | Visual Behavior (at $\Delta L_{rel} = 0.15$) |
| :--- | :--- | :--- |
| **Global Standard**<br>(e.g., CIELAB $L^*C^*h^\circ$ where wheel is $0\text{--}360^\circ$) | `10` to `15` | Yields a subtle, realistic shift of roughly $1.5^\circ \text{--} 2.2^\circ$ toward red. |
| **Localized Wood Domain**<br>(e.g., A custom scale normalized strictly to $0\text{--}100$) | `30` to `45` | Yields a smooth, highly visible shift within your system's custom boundaries. |

---

## 4. Implementation Example (Pseudocode)

```python
def generate_harmonious_candidate(anchor, delta_l=0.15):
    # Setup configuration constants
    ALPHA = 1.0
    BETA  = 0.5
    GAMMA = 0.3
    THETA = 12.0 # Tuned for CIELAB degrees
    
    # Extract anchor values
    L_a, W_a, H_a, C_a = anchor['L'], anchor['W'], anchor['H'], anchor['C']
    
    # Run generative matrix
    L_c = L_a * (1.0 - delta_l)
    C_c = C_a * (1.0 + ALPHA * delta_l)
    W_c = W_a * ((C_c / C_a) ** BETA) * ((1.0 / (1.0 - delta_l)) ** GAMMA)
    H_c = H_a - (THETA * delta_l)
    
    return {
        'L': round(L_c, 2),
        'W': round(W_c, 2),
        'H': round(H_c, 2),
        'C': round(C_c, 2)
    }