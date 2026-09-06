/**
 * FocusFlow Deterministic Virtual Clock
 * Hijacks Date.now, performance.now, requestAnimationFrame and cancelAnimationFrame
 * Allows deterministic step-by-step frame rendering without timing jitter
 */

(function () {
  let virtualTimeMs = 0;
  let nextRafId = 1;
  const rafCallbacks = new Map();

  // Override Date.now
  const originalDateNow = Date.now;
  Date.now = function () {
    return virtualTimeMs;
  };

  // Override performance.now
  if (typeof performance !== 'undefined') {
    performance.now = function () {
      return virtualTimeMs;
    };
  }

  // Override requestAnimationFrame
  window.requestAnimationFrame = function (callback) {
    const id = nextRafId++;
    rafCallbacks.set(id, callback);
    return id;
  };

  // Override cancelAnimationFrame
  window.cancelAnimationFrame = function (id) {
    rafCallbacks.delete(id);
  };

  // Step virtual time by deltaMs and trigger pending callbacks
  window.__stepVirtualTime = function (deltaMs) {
    virtualTimeMs += deltaMs;

    // Snapshot callbacks scheduled for this step
    const currentCallbacks = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();

    for (const [_, cb] of currentCallbacks) {
      try {
        cb(virtualTimeMs);
      } catch (err) {
        console.error('[VirtualClock] Error executing rAF callback:', err);
      }
    }

    return virtualTimeMs;
  };

  window.__getVirtualTime = function () {
    return virtualTimeMs;
  };

  window.__isVirtualClockActive = true;
})();
