import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { EyeTracker } from '../eyetracking';

const DOTS = [
  [10,10],[50,10],[90,10],
  [10,50],[50,50],[90,50],
  [10,90],[50,90],[90,90],
];
const CLICKS_PER_DOT = 5;

export default function EyeTrackingView({ text, fileName, onExit }) {
  const [phase, setPhase]       = useState('loading');
  const [error, setError]       = useState('');
  const [dotClicks, setDotClicks] = useState(Array(9).fill(0));
  const [gazePos, setGazePos]   = useState(null);
  const readingRef = useRef(null);

  const total    = dotClicks.reduce((s, n) => s + n, 0);
  const needed   = DOTS.length * CLICKS_PER_DOT;
  const calibrated = dotClicks.every((c) => c >= CLICKS_PER_DOT);

  useEffect(() => {
    EyeTracker.load()
      .then(() => setPhase('intro'))
      .catch((e) => { setError(e.message); setPhase('error'); });
  }, []);

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
      const next = [...prev]; next[idx]++; return next;
    });
  }, []);

  const handleStartTracking = useCallback(() => {
    EyeTracker.showPreview(false);
    setPhase('tracking');
  }, []);

  // Auto-scroll based on gaze
  useEffect(() => {
    if (phase !== 'tracking' || !gazePos || !readingRef.current) return;
    const zone = window.innerHeight * 0.18;
    if (gazePos.y > window.innerHeight - zone) readingRef.current.scrollBy(0, 5);
    else if (gazePos.y < zone)                  readingRef.current.scrollBy(0, -5);
  }, [gazePos, phase]);

  /* ── Loading ── */
  if (phase === 'loading') return (
    <div className="flex h-screen items-center justify-center flex-col gap-4 bg-background text-foreground">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading eye tracking…</p>
    </div>
  );

  /* ── Error ── */
  if (phase === 'error') return (
    <div className="flex h-screen items-center justify-center flex-col gap-4 bg-background text-foreground p-6 text-center">
      <p className="text-sm text-red-600">⚠ {error}</p>
      <button onClick={onExit} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        Go back
      </button>
    </div>
  );

  /* ── Intro ── */
  if (phase === 'intro') return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium">Eye Tracking Mode</span>
        <button onClick={onExit} className="rounded-md p-1.5 hover:bg-accent transition-colors">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">👁 Eye Tracking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your webcam tracks your gaze and auto-scrolls the text as you read — no mouse needed.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Sit roughly 50 cm from your screen</li>
            <li>Make sure your face is well lit</li>
            <li>Click 9 dots to calibrate (~30 seconds)</li>
            <li>A red dot shows where you are looking</li>
          </ul>
          <div className="flex gap-3">
            <button onClick={handleStart}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Start calibration →
            </button>
            <button onClick={onExit}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Calibration ── */
  if (phase === 'calibration') return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center gap-2 pt-6 z-10">
        <p className="text-sm text-slate-300">
          Look at each dot and click it <strong className="text-white">{CLICKS_PER_DOT} times</strong>
        </p>
        <div className="w-48 h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(total / needed) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-500">{total} / {needed}</span>
      </div>

      {/* Dots */}
      {DOTS.map(([px, py], i) => {
        const done = dotClicks[i] >= CLICKS_PER_DOT;
        return (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            aria-label={`Calibration point ${i + 1}`}
            className={`absolute w-9 h-9 rounded-full border-2 overflow-hidden transition-colors ${
              done ? 'border-emerald-400 bg-emerald-900/20' : 'border-primary bg-primary/10 hover:border-blue-300'
            }`}
            style={{ left: `${px}%`, top: `${py}%`, transform: 'translate(-50%,-50%)' }}
          >
            <span
              className={`cal-dot-fill ${done ? 'bg-emerald-500/50' : 'bg-primary/50'}`}
              style={{ transform: `scaleY(${dotClicks[i] / CLICKS_PER_DOT})` }}
            />
            <span className="relative z-10 text-[10px] font-bold text-white">{dotClicks[i]}</span>
          </button>
        );
      })}

      {/* Done button */}
      {calibrated && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <button onClick={handleStartTracking}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            ✓ Calibrated — Start reading
          </button>
        </div>
      )}
    </div>
  );

  /* ── Tracking ── */
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-2 flex-shrink-0">
        <span className="text-sm text-muted-foreground">👁 Eye tracking active — auto-scroll on</span>
        <button onClick={onExit} className="rounded-md p-1.5 hover:bg-accent transition-colors">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-auto bg-muted/30 p-8" ref={readingRef}>
        <div style={{
          fontFamily: "'OpenDyslexic', system-ui, sans-serif",
          fontSize: '1.05rem',
          lineHeight: 1.8,
          maxWidth: '680px',
          margin: '0 auto',
        }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">{fileName}</p>
          {text.split(/\n\n+/).map((para, i) => (
            <p key={i} className="mb-5 text-foreground">{para.trim()}</p>
          ))}
        </div>
      </div>

      {gazePos && (
        <div
          className="pointer-events-none fixed z-50 w-5 h-5 rounded-full bg-red-500/60 border-2 border-red-500"
          style={{ left: gazePos.x, top: gazePos.y, transform: 'translate(-50%,-50%)', transition: 'left 0.06s, top 0.06s' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
