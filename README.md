# EDNA-1: Advanced Behavioral Biometrics Engine

EDNA-1 (Enhanced Detection & Neural Analysis) is a lightweight, client-side "Human-Proof" verification engine. Instead of intrusive CAPTCHAs, EDNA-1 analyzes the **physical texture of human interaction** to distinguish between real users and automated bots.

🎮 Live Demo: Check it out here -> https://claude.ai/public/artifacts/74af0308-e2b3-4bd7-af54-3f5fb106c687

## 🚀 Key Features

EDNA-1 monitors over 15 unique behavioral signals in real-time:

*   **Timing Entropy:** Analyzes the natural micro-variances in keystrokes and clicks.
*   **Path Curvature:** Detects the organic "wobble" in human mouse movements vs. perfect bot vectors.
*   **Device Motion (Gyro):** Leverages mobile hardware sensors to verify physical presence.
*   **Scroll Behavior:** Differentiates between human reading patterns and programmatic scrolling.
*   **Interaction Mapping:** Validates touch targets and contact areas (TouchRadius).

## 🧠 How it Works

The engine uses statistical methods like **Coefficient of Variation (CV)** and **Autocorrelation** to build a "Human Confidence Score."

- **Bot Detection:** Automated scripts often have a CV near 0 (too perfect) or 1 (pure noise).
- **Human Validation:** EDNA-1 looks for the "Golden Ratio" of organic irregularity that characterizes human motor skills.

## 🛠️ Quick Start

Include the `EDNAEngine` class in your project and initialize it:

```javascript
const edna = new EDNAEngine();

// Start recording events
window.addEventListener('mousemove', (e) => edna.recordMove(e));
window.addEventListener('keydown', (e) => edna.recordKey(e));

// Analyze the user
const results = edna.analyze();
console.log(`Confidence: ${results.confidence * 100}%`);
console.log(`Classification: ${results.classification}`);
