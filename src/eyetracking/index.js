/**
 * Eye Tracking Module — implemented with WebGazer.js v2.1.0
 *
 * WebGazer uses the webcam + TensorFlow.js face-mesh to predict
 * gaze coordinates. It learns from click events automatically:
 * every time the user clicks on screen while WebGazer is running,
 * that position is recorded as a calibration sample.
 *
 * CDN: https://unpkg.com/webgazer@2.1.0/webgazer.js
 * Docs: https://webgazer.cs.brown.edu/
 */

const CDN_URL = 'https://unpkg.com/webgazer@2.1.0/webgazer.js';

export const EyeTracker = {
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  load() {
    if (window.webgazer) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = CDN_URL;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load WebGazer from CDN'));
      document.head.appendChild(s);
    });
  },

  async start(onGaze) {
    await window.webgazer
      .setRegression('ridge')
      .setGazeListener((data) => {
        if (data) onGaze({ x: data.x, y: data.y });
      })
      .begin();
    window.webgazer.showVideoPreview(true);
    window.webgazer.showFaceOverlay(false);
    window.webgazer.showPredictionPoints(false);
  },

  showPreview(visible) {
    window.webgazer?.showVideoPreview(visible);
  },

  clearData() {
    window.webgazer?.clearData();
  },

  stop() {
    try { window.webgazer?.end(); } catch (_) {}
  },
};
