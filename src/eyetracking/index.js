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
    await wg().begin();
    wg().setGazeListener((data) => {
      if (data) onGaze({ x: data.x, y: data.y });
    });
    wg().showVideoPreview(true);
    wg().showFaceOverlay(false);
    wg().showPredictionPoints(true);
    wg().applyKalmanFilter(true);
  },

  showPreview(visible) {
    wg()?.showVideoPreview(visible);
  },

  showGazeDot(visible) {
    wg()?.showPredictionPoints(visible);
  },

  // Explicitly record a calibration sample at (x, y) screen pixels.
  // Called on every calibration dot click so WebGazer's regression model
  // knows exactly where the user was looking.
  recordPoint(x, y) {
    wg()?.recordScreenPosition(x, y);
  },

  async clearData() {
    await wg()?.clearData();
  },

  stop() {
    try { wg()?.end(); } catch (_) {}
  },
};
