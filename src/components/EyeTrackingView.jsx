import { useState, useEffect, useRef, useCallback } from 'react';
import { EyeTracker } from '../eyetracking';

// 9-point calibration grid [x%, y%]
const DOTS = [
  [10, 10], [50, 10], [90, 10],
  [10, 50], [50, 50], [90, 50],
  [10, 90], [50, 90], [90, 90],
];
const CLICKS_PER_DOT = 5;

export default function EyeTrackingView({ text, fileName, onExit }) {
  const [phase, setPhase] = useState('loading'); // loading | intro | calibration | tracking | error
  const [error, setError] = useState('');
  const [dotClicks, setDotClicks] = useState(Array(9).fill(0));
  const [gazePos, setGazePos] = useState(null);
  const readingRef = useRef(null);

  const totalClicks = dotClicks.reduce((s, n) => s + n, 0);
  const totalNeeded = DOTS.length * CLICKS_PER_DOT;
  const calibrated = dotClicks.every((c) => c >= CLICKS_PER_DOT);

  // Load WebGazer from CDN on mount
  useEffect(() => {
    EyeTracker.load()
      .then(() => setPhase('intro'))
      .catch((e) => { setError(e.message); setPhase('error'); });
  }, []);

  // Stop tracking on unmount
  useEffect(() => () => EyeTracker.stop(), []);

  const handleStart = useCallback(async () => {
    setPhase('calibration');
    try {
      EyeTracker.clearData();
      await EyeTracker.start((pos) => setGazePos(pos));
    } catch (e) {
      setError(e.message || 'Camera access denied or unavailable.');
      setPhase('error');
    }
  }, []);

  const handleDotClick = useCallback((idx) => {
    setDotClicks((prev) => {
      if (prev[idx] >= CLICKS_PER_DOT) return prev;
      const next = [...prev];
      next[idx]++;
      return next;
    });
  }, []);

  const handleStartTracking = useCallback(() => {
    EyeTracker.showPreview(false);
    setPhase('tracking');
  }, []);

  // Auto-scroll reading area based on gaze position
  useEffect(() => {
    if (phase !== 'tracking' || !gazePos || !readingRef.current) return;
    const zone = window.innerHeight * 0.18;
    if (gazePos.y > window.innerHeight - zone) {
      readingRef.current.scrollBy(0, 5);
    } else if (gazePos.y < zone) {
      readingRef.current.scrollBy(0, -5);
    }
  }, [gazePos, phase]);

  /* ── Loading ── */
  if (phase === 'loading') return (
    <div className="et-screen et-centered">
      <div className="et-spinner" />
      <p>Loading eye tracking library…</p>
    </div>
  );

  /* ── Error ── */
  if (phase === 'error') return (
    <div className="et-screen et-centered">
      <p className="et-error">⚠ {error}</p>
      <button className="btn-sample" onClick={onExit}>Go back</button>
    </div>
  );

  /* ── Intro ── */
  if (phase === 'intro') return (
    <div className="et-screen et-centered">
      <h2 className="et-title">👁 Eye Tracking Mode</h2>
      <p className="et-subtitle">
        Your webcam tracks your gaze and auto-scrolls the text as you read — no mouse needed.
      </p>
      <ul className="et-intro-list">
        <li>Sit roughly 50 cm from your screen</li>
        <li>Make sure your face is well lit</li>
        <li>You will click 9 dots to calibrate (~30 seconds)</li>
        <li>A dot on screen shows where you are looking</li>
      </ul>
      <div className="et-intro-btns">
        <button className="btn-sample" onClick={handleStart}>
          Start calibration →
        </button>
        <button className="btn-back" onClick={onExit}>Cancel</button>
      </div>
    </div>
  );

  /* ── Calibration ── */
  if (phase === 'calibration') return (
    <div className="et-screen et-calibration">
      <div className="et-cal-header">
        <p>Look at each dot and click it <strong>{CLICKS_PER_DOT} times</strong></p>
        <div className="et-cal-bar-wrap">
          <div className="et-cal-bar" style={{ width: `${(totalClicks / totalNeeded) * 100}%` }} />
        </div>
        <span className="et-cal-count">{totalClicks} / {totalNeeded}</span>
      </div>

      {DOTS.map(([px, py], i) => (
        <button
          key={i}
          className={`et-dot ${dotClicks[i] >= CLICKS_PER_DOT ? 'done' : ''}`}
          style={{ left: `${px}%`, top: `${py}%` }}
          onClick={() => handleDotClick(i)}
          aria-label={`Calibration point ${i + 1}`}
        >
          <span
            className="et-dot-fill"
            style={{ transform: `scaleY(${dotClicks[i] / CLICKS_PER_DOT})` }}
          />
          <span className="et-dot-count">{dotClicks[i]}</span>
        </button>
      ))}

      {calibrated && (
        <div className="et-cal-ready">
          <button className="btn-sample" onClick={handleStartTracking}>
            ✓ Calibrated — Start reading
          </button>
        </div>
      )}
    </div>
  );

  /* ── Tracking ── */
  return (
    <div className="et-screen et-tracking" ref={readingRef}>
      <div className="et-track-bar">
        <span className="et-track-label">👁 Eye tracking active — auto-scroll on</span>
        <button className="btn-exit-rsvp" onClick={onExit}>✕ Exit</button>
      </div>

      <div className="reading-body et-reading-content">
        <p className="file-label">{fileName}</p>
        {text.split(/\n\n+/).map((para, i) => (
          <p key={i} className="reading-para">{para.trim()}</p>
        ))}
      </div>

      {gazePos && (
        <div
          className="et-gaze-dot"
          style={{ left: gazePos.x, top: gazePos.y }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
