/**
 * EDNA-1: Enhanced Detection & Neural Analysis
 * Human Proof Protocol — Behavioral Biometrics Engine
 *
 * Copyright (c) 2026 Sebastian Kläy (@sebklaey)
 * Licensed under EAL-1.0 (EDNA Attribution License)
 * https://github.com/sebklaey/EDNA
 *
 * IMPORTANT: Any product using this library must display the
 * Human Proof Seal visibly to end users. See LICENSE for details.
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EDNA = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ═══════════════════════════════════════════
  // CORE ENGINE
  // ═══════════════════════════════════════════

  function EDNAEngine() {
    this.intervals = [];
    this.scrollIntervals = [];
    this.moveAngles = [];
    this.moveSpeeds = [];
    this.touchAreas = [];
    this.gyroMagnitudes = [];
    this.scrollVelocities = [];
    this.scrollDirectionChanges = 0;
    this.lastScrollDir = null;
    this.deletionCount = 0;
    this.totalKeyCount = 0;
    this.burstLengths = [];
    this.currentBurst = 0;
    this.burstTimeout = null;
    this.lastEventTime = null;
    this.lastScrollTime = null;
    this.lastMoveTime = null;
    this.lastMoveX = null;
    this.lastMoveY = null;
    this.sessionStart = Date.now();
    this.hasGyro = false;
    this.moveCount = 0;
    this.scrollCount = 0;
    this.smoothedConfidence = 0;
    this.touchDurations = [];
    this.touchStartTime = null;
    this.swipeVelocities = [];
    this.tapPositionsX = [];
    this.tapPositionsY = [];
    this.lastTapTime = 0;
    this.scrollPauses = [];
    this.lastScrollEnd = null;
    this.scrollActive = false;
    this.scrollTimeout = null;
    this._handlers = {};
    this._observed = false;
  }

  // ── Event Recorders ──

  EDNAEngine.prototype.recordTouchStart = function (e) {
    var now = Date.now();
    var t = (e.touches && e.touches[0]) || e;
    this.touchStartTime = now;
    if (this.lastEventTime) this.intervals.push(now - this.lastEventTime);
    this.lastEventTime = now;
    if (t.radiusX)
      this.touchAreas.push(t.radiusX * (t.radiusY || t.radiusX));
    if (t.clientX != null) {
      this.tapPositionsX.push(t.clientX / window.innerWidth);
      this.tapPositionsY.push(t.clientY / window.innerHeight);
    }
    this.lastTapTime = now;
  };

  EDNAEngine.prototype.recordTouchEnd = function () {
    if (this.touchStartTime) {
      this.touchDurations.push(Date.now() - this.touchStartTime);
      this.touchStartTime = null;
    }
  };

  EDNAEngine.prototype.recordScroll = function (e) {
    var now = Date.now();
    var dir = e.deltaY > 0 ? 1 : -1;
    if (this.lastScrollDir !== null && dir !== this.lastScrollDir)
      this.scrollDirectionChanges++;
    this.lastScrollDir = dir;
    this.scrollVelocities.push(Math.abs(e.deltaY));
    if (this.lastScrollTime)
      this.scrollIntervals.push(now - this.lastScrollTime);
    this.lastScrollTime = now;
    this.scrollCount++;
    if (this.lastEventTime) this.intervals.push(now - this.lastEventTime);
    this.lastEventTime = now;
    if (!this.scrollActive && this.lastScrollEnd)
      this.scrollPauses.push(now - this.lastScrollEnd);
    this.scrollActive = true;
    var self = this;
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(function () {
      self.scrollActive = false;
      self.lastScrollEnd = Date.now();
    }, 150);
  };

  EDNAEngine.prototype.recordMove = function (e) {
    var now = Date.now();
    var x =
      e.clientX != null
        ? e.clientX
        : e.touches && e.touches[0]
        ? e.touches[0].clientX
        : 0;
    var y =
      e.clientY != null
        ? e.clientY
        : e.touches && e.touches[0]
        ? e.touches[0].clientY
        : 0;
    if (this.lastMoveX !== null && this.lastMoveTime !== null) {
      var dx = x - this.lastMoveX;
      var dy = y - this.lastMoveY;
      var dt = now - this.lastMoveTime;
      if (dt > 0 && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        var speed = Math.sqrt(dx * dx + dy * dy) / dt;
        this.moveSpeeds.push(speed);
        this.moveAngles.push(Math.atan2(dy, dx));
        this.moveCount++;
        if (speed > 0.5) this.swipeVelocities.push(speed);
      }
    }
    this.lastMoveX = x;
    this.lastMoveY = y;
    this.lastMoveTime = now;
  };

  EDNAEngine.prototype.recordKey = function (e) {
    var now = Date.now();
    if (this.lastEventTime) this.intervals.push(now - this.lastEventTime);
    this.lastEventTime = now;
    this.totalKeyCount++;
    if (e.key === "Backspace" || e.key === "Delete") this.deletionCount++;
    this.currentBurst++;
    var self = this;
    clearTimeout(this.burstTimeout);
    this.burstTimeout = setTimeout(function () {
      if (self.currentBurst > 0) {
        self.burstLengths.push(self.currentBurst);
        self.currentBurst = 0;
      }
    }, 500);
  };

  EDNAEngine.prototype.recordGyro = function (e) {
    var a = e.accelerationIncludingGravity;
    if (a && a.x != null && a.y != null && a.z != null) {
      this.hasGyro = true;
      this.gyroMagnitudes.push(Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z));
    }
  };

  // ── Statistics ──

  EDNAEngine.prototype._mean = function (a) {
    if (!a.length) return 0;
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  };

  EDNAEngine.prototype._std = function (a) {
    if (a.length < 2) return 0;
    var m = this._mean(a);
    var s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / (a.length - 1));
  };

  EDNAEngine.prototype._cv = function (a) {
    var m = this._mean(a);
    return m ? this._std(a) / m : 0;
  };

  EDNAEngine.prototype._entropy = function (arr, bins) {
    bins = bins || 10;
    if (arr.length < 8) return 0.5;
    var sorted = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > 0) sorted.push(arr[i]);
    }
    sorted.sort(function (a, b) {
      return a - b;
    });
    if (sorted.length < 8) return 0.5;
    var boundaries = [];
    for (var i = 1; i < bins; i++) {
      boundaries.push(sorted[Math.floor((i * sorted.length) / bins)]);
    }
    var counts = [];
    for (var i = 0; i < bins; i++) counts.push(0);
    for (var i = 0; i < sorted.length; i++) {
      var b = 0;
      for (var j = 0; j < boundaries.length; j++) {
        if (sorted[i] > boundaries[j]) b = j + 1;
      }
      counts[Math.min(b, bins - 1)]++;
    }
    var H = 0;
    for (var i = 0; i < counts.length; i++) {
      if (counts[i] > 0) {
        var p = counts[i] / sorted.length;
        H -= p * Math.log(p) / Math.LN2;
      }
    }
    return H / (Math.log(bins) / Math.LN2);
  };

  EDNAEngine.prototype._autocorrelation = function (arr) {
    if (arr.length < 8) return 0;
    var m = this._mean(arr);
    var num = 0,
      den = 0;
    for (var i = 0; i < arr.length - 1; i++) {
      num += (arr[i] - m) * (arr[i + 1] - m);
      den += (arr[i] - m) * (arr[i] - m);
    }
    den +=
      (arr[arr.length - 1] - m) * (arr[arr.length - 1] - m);
    return den === 0 ? 0 : num / den;
  };

  // ── Signal Scorers (0-1, higher = more human) ──

  EDNAEngine.prototype._scoreTimingDistribution = function () {
    if (this.intervals.length < 12) return null;
    var p = [];
    for (var i = 0; i < this.intervals.length; i++) {
      if (this.intervals[i] > 0) p.push(this.intervals[i]);
    }
    if (p.length < 8) return null;
    var rawCv = this._cv(p);
    var logP = [];
    for (var i = 0; i < p.length; i++) logP.push(Math.log(p[i]));
    var logCv = this._cv(logP);
    if (rawCv > 0.25 && logCv < rawCv * 0.9)
      return Math.min(1, 0.65 + rawCv * 0.35);
    if (rawCv < 0.06) return 0.1;
    return Math.min(1, 0.45 + rawCv * 0.3);
  };

  EDNAEngine.prototype._scoreEntropy = function () {
    if (this.intervals.length < 12) return null;
    var e = this._entropy(this.intervals);
    if (e >= 0.6) return Math.min(1, 0.6 + e * 0.4);
    if (e >= 0.4) return 0.5 + (e - 0.4) * 1.5;
    if (e < 0.3) return 0.15;
    return 0.4;
  };

  EDNAEngine.prototype._scoreAutocorrelation = function () {
    if (this.intervals.length < 12) return null;
    var ac = this._autocorrelation(this.intervals);
    if (ac > 0.02 && ac < 0.7) return 0.6 + ac * 0.55;
    if (Math.abs(ac) < 0.01) return 0.35;
    return 0.4;
  };

  EDNAEngine.prototype._scoreDrift = function () {
    if (this.intervals.length < 20) return null;
    var recent = this.intervals.slice(-200);
    var t = Math.floor(recent.length / 3);
    var m1 = this._mean(recent.slice(0, t));
    var m2 = this._mean(recent.slice(-t));
    var o = this._mean(recent);
    if (!o) return 0.5;
    var d = Math.abs(m2 - m1) / o;
    if (d > 0.015 && d < 0.7) return Math.min(1, 0.6 + d * 0.7);
    return 0.35;
  };

  EDNAEngine.prototype._scorePathCurvature = function () {
    if (this.moveAngles.length < 12) return null;
    var diffs = [];
    for (var i = 1; i < this.moveAngles.length; i++) {
      diffs.push(Math.abs(this.moveAngles[i] - this.moveAngles[i - 1]));
    }
    var c = this._cv(diffs);
    if (c > 0.2 && c < 3.5) return Math.min(1, 0.55 + c * 0.22);
    if (c < 0.06) return 0.1;
    return 0.3;
  };

  EDNAEngine.prototype._scoreSpeedVariation = function () {
    if (this.moveSpeeds.length < 12) return null;
    var c = this._cv(this.moveSpeeds);
    var s = 0.5;
    if (c > 0.35) s += 0.3;
    if (c > 0.7) s += 0.15;
    if (c < 0.1) s -= 0.35;
    return Math.max(0.05, Math.min(1, s));
  };

  EDNAEngine.prototype._scoreScroll = function () {
    if (this.scrollIntervals.length < 5) return null;
    var c = this._cv(this.scrollIntervals);
    var vc = this._cv(this.scrollVelocities);
    var s = 0.5;
    if (c > 0.2) s += 0.2;
    if (vc > 0.2) s += 0.2;
    if (this.scrollDirectionChanges > 0) s += 0.1;
    if (c < 0.06) s -= 0.35;
    return Math.max(0.05, Math.min(1, s));
  };

  EDNAEngine.prototype._scoreGyro = function () {
    if (!this.hasGyro || this.gyroMagnitudes.length < 10) return null;
    var c = this._cv(this.gyroMagnitudes);
    if (c > 0.004 && c < 3) return 0.95;
    if (c <= 0.004) return 0.08;
    return 0.4;
  };

  EDNAEngine.prototype._scoreTouchArea = function () {
    if (this.touchAreas.length < 6) return null;
    var c = this._cv(this.touchAreas);
    return c > 0.06 ? Math.min(1, 0.6 + c * 0.8) : 0.15;
  };

  EDNAEngine.prototype._scoreCorrections = function () {
    if (this.totalKeyCount < 25) return null;
    var r = this.deletionCount / this.totalKeyCount;
    if (r > 0.01 && r < 0.5) return Math.min(1, 0.7 + r * 0.6);
    return 0.4;
  };

  EDNAEngine.prototype._scoreBursts = function () {
    if (this.burstLengths.length < 3) return null;
    var c = this._cv(this.burstLengths);
    return c > 0.12 ? Math.min(1, 0.55 + c * 0.5) : 0.35;
  };

  EDNAEngine.prototype._scoreEventRate = function () {
    var elapsed = (Date.now() - this.sessionStart) / 1000;
    var total =
      this.intervals.length + this.scrollCount + this.moveCount;
    if (elapsed < 2 || total < 15) return null;
    var r = total / elapsed;
    if (r > 0.2 && r < 60) return 0.8;
    if (r >= 60) return 0.08;
    return 0.4;
  };

  EDNAEngine.prototype._scoreTouchDuration = function () {
    if (this.touchDurations.length < 6) return null;
    var c = this._cv(this.touchDurations);
    if (c > 0.3) return Math.min(1, 0.6 + c * 0.3);
    if (c < 0.08) return 0.15;
    return 0.45;
  };

  EDNAEngine.prototype._scoreScrollPauses = function () {
    if (this.scrollPauses.length < 4) return null;
    var c = this._cv(this.scrollPauses);
    if (c > 0.25) return Math.min(1, 0.6 + c * 0.35);
    if (c < 0.08) return 0.15;
    return 0.45;
  };

  EDNAEngine.prototype._scoreTouchZones = function () {
    if (this.tapPositionsX.length < 8) return null;
    var xCv = this._cv(this.tapPositionsX);
    var yCv = this._cv(this.tapPositionsY);
    var spread = (xCv + yCv) / 2;
    if (spread > 0.15) return Math.min(1, 0.55 + spread * 0.8);
    if (spread < 0.05) return 0.15;
    return 0.4;
  };

  EDNAEngine.prototype._scoreSwipeCharacter = function () {
    if (this.swipeVelocities.length < 8) return null;
    var c = this._cv(this.swipeVelocities);
    var s = 0.5;
    if (c > 0.3) s += 0.25;
    if (c < 0.1) s -= 0.3;
    return Math.max(0.05, Math.min(1, s));
  };

  // ── Main Analysis ──

  EDNAEngine.prototype.analyze = function () {
    var total =
      this.intervals.length + this.scrollCount + this.moveCount;
    var elapsed = (Date.now() - this.sessionStart) / 1000;

    if (total < 8) {
      return {
        confidence: 0,
        classification: "gathering_data",
        eventCount: total,
        elapsed: elapsed,
        signals: {},
        hasGyro: this.hasGyro,
      };
    }

    var scorers = [
      ["timingDistribution", this._scoreTimingDistribution()],
      ["timingEntropy", this._scoreEntropy()],
      ["autocorrelation", this._scoreAutocorrelation()],
      ["naturalDrift", this._scoreDrift()],
      ["pathCurvature", this._scorePathCurvature()],
      ["speedVariation", this._scoreSpeedVariation()],
      ["scrollBehavior", this._scoreScroll()],
      ["deviceMotion", this._scoreGyro()],
      ["contactArea", this._scoreTouchArea()],
      ["clickDuration", this._scoreTouchDuration()],
      ["readingPauses", this._scoreScrollPauses()],
      ["interactionMap", this._scoreTouchZones()],
      ["motionCharacter", this._scoreSwipeCharacter()],
      ["corrections", this._scoreCorrections()],
      ["typingBursts", this._scoreBursts()],
      ["eventRate", this._scoreEventRate()],
    ];

    var weights = {
      timingDistribution: 2.5,
      timingEntropy: 1.5,
      autocorrelation: 2,
      naturalDrift: 1.5,
      pathCurvature: 2,
      speedVariation: 2,
      scrollBehavior: 2.5,
      deviceMotion: 3,
      contactArea: 2,
      clickDuration: 2,
      readingPauses: 2.5,
      interactionMap: 2,
      motionCharacter: 2,
      corrections: 1.5,
      typingBursts: 1,
      eventRate: 1.5,
    };

    var signals = {};
    var wSum = 0,
      wTotal = 0;

    for (var i = 0; i < scorers.length; i++) {
      var key = scorers[i][0];
      var val = scorers[i][1];
      if (val === null) continue;
      signals[key] = val;
      var w = weights[key] || 1;
      wSum += Math.max(0.3, val) * w;
      wTotal += w;
    }

    var signalKeys = Object.keys(signals);
    var sigCount = signalKeys.length;

    if (sigCount === 0) {
      return {
        confidence: 0,
        classification: "gathering_data",
        eventCount: total,
        elapsed: elapsed,
        signals: signals,
        hasGyro: this.hasGyro,
      };
    }

    var raw = wSum / wTotal;

    // Bot penalty
    var botCount = 0;
    var strongCount = 0;
    for (var i = 0; i < signalKeys.length; i++) {
      if (signals[signalKeys[i]] < 0.15) botCount++;
      if (signals[signalKeys[i]] > 0.6) strongCount++;
    }
    if (botCount >= 3) raw *= 0.4;
    else if (botCount >= 2) raw *= 0.6;

    // Human consensus
    var strongRatio = strongCount / sigCount;
    if (botCount === 0 && sigCount >= 6) {
      if (strongRatio >= 0.75) raw = 0.999;
      else if (strongRatio >= 0.5) raw = raw * 0.3 + 0.999 * 0.7;
    }

    // Signal & time & volume scaling
    var sigBoost = Math.min(1, (sigCount - 0.5) / 5);
    raw *= sigBoost;
    var tf = Math.min(1, elapsed / 40);
    raw = raw * 0.55 + raw * tf * 0.45;
    var vb = Math.min(1, total / 100);
    raw = raw * 0.75 + raw * vb * 0.25;

    raw = Math.max(0, Math.min(0.999, raw));
    var smoothRate = raw > 0.95 ? 0.18 : 0.12;
    this.smoothedConfidence +=
      (raw - this.smoothedConfidence) * smoothRate;
    var confidence = Math.max(
      0,
      Math.min(0.999, this.smoothedConfidence)
    );

    var classification = "bot";
    if (confidence >= 0.99) classification = "human_verified";
    else if (confidence >= 0.8) classification = "likely_human";
    else if (confidence >= 0.5) classification = "uncertain";
    else if (confidence >= 0.3) classification = "likely_bot";

    return {
      confidence: confidence,
      classification: classification,
      eventCount: total,
      elapsed: elapsed,
      signals: signals,
      signalCount: sigCount,
      hasGyro: this.hasGyro,
    };
  };

  // ── Public API ──

  /**
   * Observe a DOM element (usually `document`) for all interaction events.
   * Automatically binds touch, mouse, scroll, key, and gyroscope listeners.
   */
  EDNAEngine.prototype.observe = function (target) {
    if (this._observed) return;
    this._observed = true;
    var self = this;

    this._handlers = {
      mousedown: function (e) { self.recordTouchStart(e); },
      touchstart: function (e) { self.recordTouchStart(e); },
      mouseup: function (e) { self.recordTouchEnd(e); },
      touchend: function (e) { self.recordTouchEnd(e); },
      mousemove: function (e) { self.recordMove(e); },
      touchmove: function (e) { self.recordMove(e); },
      wheel: function (e) { self.recordScroll(e); },
      keydown: function (e) { self.recordKey(e); },
    };

    var passiveEvents = ["touchstart", "touchmove", "wheel"];
    var keys = Object.keys(this._handlers);
    for (var i = 0; i < keys.length; i++) {
      var evt = keys[i];
      var opts = passiveEvents.indexOf(evt) >= 0 ? { passive: true } : undefined;
      target.addEventListener(evt, this._handlers[evt], opts);
    }

    // Gyroscope
    this._handlers._gyro = function (e) { self.recordGyro(e); };
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      var requestGyro = function () {
        DeviceMotionEvent.requestPermission()
          .then(function (state) {
            if (state === "granted") {
              window.addEventListener("devicemotion", self._handlers._gyro);
            }
          })
          .catch(function () {});
        target.removeEventListener("click", requestGyro);
      };
      target.addEventListener("click", requestGyro);
    } else {
      window.addEventListener("devicemotion", this._handlers._gyro);
    }

    this._target = target;
  };

  /**
   * Stop observing. Removes all event listeners.
   */
  EDNAEngine.prototype.destroy = function () {
    if (!this._observed) return;
    var keys = Object.keys(this._handlers);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === "_gyro") {
        window.removeEventListener("devicemotion", this._handlers._gyro);
      } else {
        this._target.removeEventListener(keys[i], this._handlers[keys[i]]);
      }
    }
    this._observed = false;
  };

  /**
   * Get the current human proof result.
   * @returns {{ confidence: number, classification: string, signals: object, ... }}
   */
  EDNAEngine.prototype.getHumanProof = function () {
    return this.analyze();
  };

  /**
   * Compare this session's profile to another profile hash (stub for future implementation).
   * @param {string} otherProfileHash
   * @returns {{ sameHuman: boolean, confidence: number }}
   */
  EDNAEngine.prototype.compareTo = function (otherProfileHash) {
    // Future: implement semantic profile comparison
    return { sameHuman: false, confidence: 0, note: "Not yet implemented" };
  };

  /**
   * Render the required attribution seal into a container element.
   * @param {string|HTMLElement} container - CSS selector or DOM element
   * @param {object} [opts] - Options: { size: 48, score: null (auto) }
   */
  EDNAEngine.prototype.showSeal = function (container, opts) {
    opts = opts || {};
    var size = opts.size || 48;
    var el =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!el) return;

    var self = this;

    function render() {
      var result = self.analyze();
      var score = Math.round(result.confidence * 100);
      var r = size * 0.38;
      var c = 2 * Math.PI * r;
      var off = c * (1 - score / 100);
      var color = score >= 99 ? "#4ADE80" : "#D4A843";

      el.innerHTML =
        '<a href="https://github.com/sebklaey/EDNA" target="_blank" rel="noopener" ' +
        'style="display:inline-flex;align-items:center;gap:' +
        size * 0.2 +
        "px;background:rgba(10,10,15,0.8);border:1px solid rgba(212,168,67,0.15);" +
        "border-radius:" +
        (size / 2 + 20) +
        "px;padding:" +
        size * 0.12 +
        "px " +
        size * 0.3 +
        "px " +
        size * 0.12 +
        "px " +
        size * 0.15 +
        'px;text-decoration:none;font-family:-apple-system,sans-serif">' +
        '<svg viewBox="0 0 ' +
        size +
        " " +
        size +
        '" width="' +
        size +
        '" height="' +
        size +
        '">' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r +
        '" fill="none" stroke="rgba(212,168,67,0.1)" stroke-width="2"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r +
        '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"' +
        ' stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"' +
        ' transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/>' +
        '<text x="' + size / 2 + '" y="' + (size / 2 + 1) +
        '" text-anchor="middle" dominant-baseline="middle"' +
        ' style="font-size:' + size * 0.28 + "px;fill:" + color +
        ';font-weight:700">' + score + "</text>" +
        "</svg>" +
        "<div>" +
        '<div style="font-size:' + size * 0.2 +
        'px;font-weight:600;color:#ccc;letter-spacing:0.5px">Human Proof</div>' +
        '<div style="font-size:' + size * 0.16 +
        'px;color:#666">by <span style="color:#D4A843;font-weight:600">@sebklaey</span> standard</div>' +
        "</div></a>";
    }

    render();
    this._sealInterval = setInterval(render, 1000);
  };

  // ═══════════════════════════════════════════
  // PUBLIC CONSTRUCTOR
  // ═══════════════════════════════════════════

  function EDNA() {
    this._engine = new EDNAEngine();
  }

  EDNA.prototype.observe = function (target) {
    this._engine.observe(target);
    return this;
  };

  EDNA.prototype.destroy = function () {
    this._engine.destroy();
    if (this._engine._sealInterval) clearInterval(this._engine._sealInterval);
  };

  EDNA.prototype.getHumanProof = function () {
    return this._engine.getHumanProof();
  };

  EDNA.prototype.compareTo = function (hash) {
    return this._engine.compareTo(hash);
  };

  EDNA.prototype.showSeal = function (container, opts) {
    this._engine.showSeal(container, opts);
    return this;
  };

  EDNA.prototype.onBotDetected = function (callback) {
    var self = this;
    this._botCheckInterval = setInterval(function () {
      var result = self._engine.analyze();
      if (result.classification === "bot" || result.classification === "likely_bot") {
        callback(result);
      }
    }, 1000);
  };

  EDNA.VERSION = "1.0.0";

  return EDNA;
});
