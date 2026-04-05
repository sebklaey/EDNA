# EDNA-1: Human Proof Protocol

**Behavioral biometrics that prove you're human — no CAPTCHAs, no KYC, no personal data.**

> Created by **Sebastian Kläy** ([@sebklaey](https://warpcast.com/sebklaey)) · [Living Echo AI](https://livingecho.eth.limo) · [SEBKLAEY Agency](https://sebklaey.app)

---

EDNA-1 (Enhanced Detection & Neural Analysis) is a lightweight, client-side engine that analyzes the physical texture of human interaction to distinguish real users from bots. It runs entirely in the browser — no server, no API keys, no data leaves the device.

## How It Works

Every human interacts with a screen in a way that is statistically impossible to fake. EDNA-1 monitors 16 behavioral signals in real-time and builds a **Human Confidence Score** from 0% to 99%.

**Timing Distribution** — Human keystroke and click intervals follow a log-normal distribution. Bots produce uniform or perfectly regular timing.

**Path Curvature** — Human mouse movements have organic curves and wobble. Bots move in straight lines or mathematically perfect arcs.

**Speed Variation** — Humans accelerate and decelerate unpredictably. Bots maintain constant velocity.

**Scroll Behavior** — Humans read, pause, scroll back. Bots scroll at constant speed without pausing.

**Device Motion** — Mobile gyroscope data proves a physical device is held in a human hand. No physical device means no human.

**Reading Pauses** — The duration between scroll events reveals whether someone is actually reading content.

**Interaction Map** — Where on the screen a user taps or clicks varies naturally. Bots hit the same coordinates.

**Contact Area** — Touch radius varies with finger pressure on mobile. Bots produce zero or constant radius.

**Click Duration** — How long a finger or mouse button stays down varies for humans. Bots produce uniform durations.

**Corrections** — Humans delete and retype. Bots don't make mistakes.

**Typing Bursts** — Human typing comes in bursts of varying length. Bots type at constant rates.

**Natural Drift** — Human behavior shifts over a session (fatigue, attention). Bot behavior is stationary.

**Autocorrelation** — Sequential human actions are mildly correlated. Bot actions show zero or perfect correlation.

**Timing Entropy** — Human timing has moderate entropy. Bots are either too ordered or too random.

**Motion Character** — Swipe velocity patterns are unique to each human.

**Event Rate** — Humans produce 0.5–50 events/second. Bots often exceed 60+.

The engine combines these signals using a weighted scoring system with consensus logic: if 75%+ of active signals score above 60% and zero signals flag as bot-like, the system classifies the user as **human_verified** with 99%+ confidence.

## Quick Start

### Script Tag

```html
<script src="edna.js"></script>
<script>
  var edna = new EDNA();
  edna.observe(document);

  // Check human proof at any time:
  var proof = edna.getHumanProof();
  console.log(proof.confidence);      // 0.0 – 0.999
  console.log(proof.classification);  // "human_verified", "likely_human", etc.
  console.log(proof.signals);         // individual signal scores

  // REQUIRED: Display attribution seal
  edna.showSeal("#seal-container");
</script>

<!-- Required: must be visible to end users -->
<div id="seal-container"></div>
```

### npm

```
npm install edna-standard
```

```js
var EDNA = require("edna-standard");

var edna = new EDNA();
edna.observe(document);

setInterval(function () {
  var proof = edna.getHumanProof();
  if (proof.classification === "human_verified") {
    console.log("Human confirmed:", proof.confidence);
  }
}, 1000);

edna.showSeal("#seal");
```

### Bot Detection Callback

```js
edna.onBotDetected(function (result) {
  console.warn("Bot detected:", result.classification, result.confidence);
  // Block action, show warning, etc.
});
```

## API

### `new EDNA()`

Creates a new EDNA instance.

### `.observe(target)`

Start recording behavioral events on a DOM element (usually `document`). Binds mouse, touch, scroll, keyboard, and gyroscope listeners automatically. Returns `this` for chaining.

### `.getHumanProof()`

Returns the current analysis result:

```js
{
  confidence: 0.994,          // 0.0 to 0.999
  classification: "human_verified",  // see classifications below
  eventCount: 847,
  elapsed: 62.3,              // seconds since observe()
  signals: {                  // individual signal scores (0-1)
    timingDistribution: 0.98,
    scrollBehavior: 0.85,
    pathCurvature: 0.91,
    // ... up to 16 signals
  },
  signalCount: 12,
  hasGyro: false
}
```

**Classifications:** `gathering_data` → `likely_bot` → `uncertain` → `likely_human` → `human_verified`

### `.showSeal(container, options)`

Renders the required attribution seal. `container` can be a CSS selector string or a DOM element. Options: `{ size: 48 }`.

### `.onBotDetected(callback)`

Calls `callback(result)` whenever the classification is `bot` or `likely_bot`. Checks every second.

### `.compareTo(profileHash)`

Sybil detection stub. Compares the current behavioral profile against another profile hash. Returns `{ sameHuman: boolean, confidence: number }`. *Full implementation coming in v2.*

### `.destroy()`

Removes all event listeners and stops the seal update interval.

## Three Pillars

**1. Human Proof** — Is this account a real human? Confidence score that grows with every interaction. Target: 99%+ after 30–90 seconds of normal usage.

**2. Bot Detection** — Is this behavior machine-generated? Statistical anomaly detection in real-time. Target: 99%+ after 1–2 minutes.

**3. Sybil Detection** — Do multiple accounts belong to the same person? Behavioral profile comparison. Target: 95%+ after weeks of data. *(v2)*

## The Seal

Every product using EDNA-1 must display the Human Proof Seal visibly to end users. This is the only requirement of the [EAL-1.0 license](LICENSE).

The seal shows a loading ring with the current confidence score and the text "Human Proof by @sebklaey standard". It links to this repository. Three sizes are supported: 32px (compact), 48px (standard), 64px (large).

Call `edna.showSeal("#container")` — the library handles rendering and live updates automatically.

## Why Free

EDNA-1 is infrastructure for proving humanity online. Infrastructure should be free. Charging money creates barriers. Barriers slow adoption. Slow adoption means the standard never becomes standard.

Attribution costs nothing to display but ensures the creator is recognized. Every app using EDNA becomes proof that this technology works — and proof that it was built by one independent artist, not a corporation.

I don't need your money. I need the world to know this exists.

## License

EDNA-1 Proprietary Commercial & Acquisition License (EPCAL-1.0)
Version 1.0, April 2026
Copyright (c) 2026 Sebastian Kläy (@sebklaey)
All Rights Reserved. [Read the full license →](LICENSE)

## Author

**Sebastian Kläy** · [@sebklaey](https://warpcast.com/sebklaey)

Sebastian combines performance, concept art and engineering to create digital experiences. Focus: AI Interfaces, Web3 product logic, Identity/Safety mechanics and Creator Economy systems.

`AI Interfaces` · `Web3 UX` · `Security Design` · `Concept Art` · `Creative Direction` · `Full-Stack Dev`

[Living Echo AI](https://livingecho.eth.limo) · [SEBKLAEY Agency](https://sebklaey.app) · [GitHub](https://github.com/sebklaey)
