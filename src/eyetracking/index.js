/**
 * Eye Tracking Placeholder Module
 *
 * Interface contract for future eye tracking integration.
 * Library TBD — candidates: WebGazer.js, GazeCloud API, Tobii Web SDK.
 *
 * When implemented, this module should:
 *   - calibrate() — run a calibration routine (returns Promise)
 *   - start(onGaze) — begin tracking; calls onGaze({ x, y }) on each sample
 *   - stop() — end tracking session
 *   - isSupported() — returns bool (webcam + browser support check)
 */

export const EyeTracker = {
  isSupported() {
    // TODO: check for webcam access + required browser APIs
    return false;
  },

  async calibrate() {
    // TODO: display calibration targets and collect gaze samples
    console.warn('[EyeTracker] calibrate() not yet implemented');
  },

  start(onGaze) {
    // TODO: start the tracking loop and invoke onGaze({ x, y }) per frame
    console.warn('[EyeTracker] start() not yet implemented');
  },

  stop() {
    // TODO: tear down tracking loop and release webcam
    console.warn('[EyeTracker] stop() not yet implemented');
  },
};
