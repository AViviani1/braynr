/**
 * Eye Tracking Module — WebGazer.js v2.1.0
 *
 * WebGazer is loaded as a standalone UMD script (/public/webgazer.js)
 * and sets window.webgazer. Serving it locally avoids bundler issues
 * with @mediapipe/face_mesh and CDN availability problems.
 *
 * WebGazer trains automatically from click events: every click while
 * active is recorded as a calibration sample.
 *
 * Docs: https://webgazer.cs.brown.edu/
 */

function wg() {
  return window.webgazer;
}

export const EyeTracker = {
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  // WebGazer is already injected via <script> in index.html — just wait for it.
  load() {
    return new Promise((resolve, reject) => {
      if (wg()) { resolve(); return; }
      const start = Date.now();
      const poll = setInterval(() => {
        if (wg()) { clearInterval(poll); resolve(); return; }
        if (Date.now() - start > 10000) {
          clearInterval(poll);
          reject(new Error('WebGazer did not initialise within 10 s'));
        }
      }, 100);
    });
  },

  async start(onGaze) {
    wg().setGazeListener((data) => {
      if (data) onGaze({ x: data.x, y: data.y });
    });
    await wg().begin();
    wg().showVideoPreview(true);
    wg().showFaceOverlay(false);
    wg().showPredictionPoints(false);
  },

  showPreview(visible) {
    wg()?.showVideoPreview(visible);
  },

  clearData() {
    wg()?.clearData();
  },

  stop() {
    try { wg()?.end(); } catch (_) {}
  },
};
