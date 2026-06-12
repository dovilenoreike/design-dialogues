# Three-Material Harmony Evaluation Model (Triad Evaluator)

This model transitions the material matching system from a *generative* state to an *evaluative* state. Given three distinct user-selected material vectors—**Floor ($F$)**, **Cabinet Fronts ($K$)**, and **Worktops ($W$)**—this algorithm calculates a unified **Grand Harmony Score ($GHS$)** based on interior design principles of visual hierarchy, contrast topology, and undertone alignment.

---

## 1. The Global Material Vector Setup

The three inputs are tracked as four-dimensional coordinates ($L, C, W, H$):
* **Floor ($F$):** $(L_f, C_f, W_f, H_f)$ — Typically the dominant surface (~60% visual mass)
* **Fronts ($K$):** $(L_k, C_k, W_k, H_k)$ — Secondary large surface (~30% visual mass)
* **Worktops ($W$):** $(L_w, C_w, W_w, H_w)$ — The accent/anchor surface (~10% visual mass)

---

## 2. Evaluation Step 1: Lightness Contrast Topology

A successful triad requires an intentional structure of light and dark surfaces (e.g., a "sandwich" or a continuous "gradient"). If surfaces are too close in value without matching identically, they create a muddy visual blur (the "Dead Zone").

First, calculate the three absolute lightness deltas:
$$\Delta L_{fk} = |L_f - L_k|$$
$$\Delta L_{kw} = |L_k - L_w|$$
$$\Delta L_{fw} = |L_f - L_w|$$

### Lightness Penalty ($P_L$)
The system penalizes any delta that falls into the clashing "Dead Zone" (between 2% and 12% difference) using a localized Gaussian distribution:

$$P_L = \sum_{ij \in \{fk, kw, fw\}} \exp\left( -\frac{(\Delta L_{ij} - 20)^2}{2(5)^2} \right)$$

---

## 3. Evaluation Step 2: Undertone Clash Index

While lightness requires contrast, underlying Hue ($H$) and Warmth ($W$) must remain unified across all natural/wood surfaces to prevent a chaotic environment.

### A. Total Hue Variance ($V_H$)
Calculates the standard deviation of the Hue angles across the triad. *(Note: For true $360^\circ$ spaces, utilize the circular mean $\bar{H}$ to handle wrapping).*

$$V_H = \sqrt{\frac{(H_f - \bar{H})^2 + (H_k - \bar{H})^2 + (H_w - \bar{H})^2}{3}}$$

### B. Total Warmth Variance ($V_W$)
Calculates the standard deviation of the Warmth values across the triad:

$$V_W = \sigma(W_f, W_k, W_w) = \sqrt{\frac{(W_f - \bar{W})^2 + (W_k - \bar{W})^2 + (W_w - \bar{W})^2}{3}}$$

### The Total Undertone Penalty ($P_U$)
Applies systemic weights to the variances ($w_h = 1.5, w_w = 1.0$):
$$P_U = w_h \cdot V_H + w_w \cdot V_W$$

*(Rule: If a material is verified as a pure neutral via the dynamic chroma model, its hue variance contribution can be bypassed by the evaluator).*

---

## 4. Evaluation Step 3: Chroma Crowding Factor

A balanced space needs a clear visual "hero." If multiple materials carry high saturation ($C > 25$), they fight for dominance. 

Let the mean Chroma be $\bar{C} = \frac{C_f + C_k + C_w}{3}$, and the peak Chroma be $C_{max} = \max(C_f, C_k, C_w)$.

### The Chroma Penalty ($P_C$)
$$P_C = \begin{cases} 
      10 \cdot (C_{max} - \bar{C}) & \text{if } \text{count}(C_i > 25) \ge 2 \\
      0 & \text{otherwise}
   \end{cases}$$

---

## 5. Summary Step: Grand Harmony Score ($GHS$)

The individual penalties are weighted and subtracted from a perfect baseline score of `100`.

$$GHS = 100 - (W_{P_L} \cdot P_L + W_{P_U} \cdot P_U + W_{P_C} \cdot P_C)$$

### System Weights Configuration
* $W_{P_L} = 0.45$ (Lightness structure dictates macro-harmony)
* $W_{P_U} = 0.40$ (Undertone tracking prevents micro-clashing)
* $W_{P_C} = 0.15$ (Chroma grouping ensures proper accent balance)

### System Classification Matrix
Your user interface can interpret the calculated $GHS$ integer using these three tier thresholds:

| Score Range | Classification | UI Behavior / Recommendation |
| :--- | :--- | :--- |
| **$85 \le GHS \le 100$** | **Excellent Triad** | Green light. Intentional contrast and flawless undertone cohesion. |
| **$60 \le GHS < 85$** | **Passable / Safe** | Yellow light. Clean, though potentially a bit flat or monochromatic. |
| **$GHS < 60$** | **Visual Clash** | Red light. Flagged for review due to muddy contrast or fighting undertones. |