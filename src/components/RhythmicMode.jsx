import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

function buildChunks(text, size = 2) {
  return text.trim().split(/\s+/).filter(Boolean).reduce((acc, w, i) => {
    const idx = Math.floor(i / size);
    acc[idx] = acc[idx] ? acc[idx] + ' ' + w : w;
    return acc;
  }, []);
}

export default function RhythmicMode({ text, onExit }) {
  const chunks = useRef(buildChunks(text));
  const [index, setIndex]   = useState(0);
  const [bpm, setBpm]       = useState(60);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const timer = useRef(null);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => {
        if (i >= chunks.current.length - 1) { setPaused(true); return i; }
        return i + 1;
      });
      setVisible(true);
    }, 150);
  }, []);

  useEffect(() => {
    if (paused) { clearInterval(timer.current); return; }
    timer.current = setInterval(advance, Math.round(60000 / bpm));
    return () => clearInterval(timer.current);
  }, [bpm, paused, advance]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ')          { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowLeft')  setBpm((b) => Math.max(20, b - 5));
      if (e.key === 'ArrowRight') setBpm((b) => Math.min(120, b + 5));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pct = chunks.current.length > 1
    ? Math.round((index / (chunks.current.length - 1)) * 100) : 100;

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium text-foreground">Rhythmic Mode (RSVP)</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{pct}%</span>
          <button onClick={onExit} className="rounded-md p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Word stage */}
      <div className="flex flex-1 items-center justify-center px-8">
        <p
          className={`text-center font-bold text-foreground ${visible ? 'rsvp-fade-in' : 'rsvp-fade-out'}`}
          style={{
            fontFamily: "'OpenDyslexic', system-ui, sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            letterSpacing: '2px',
            lineHeight: 1.3,
            maxWidth: '700px',
          }}
        >
          {chunks.current[index]}
        </p>
      </div>

      {/* Controls */}
      <div className="border-t border-border px-4 py-4 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setBpm((b) => Math.max(20, b - 5))}
            className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Slower
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setBpm((b) => Math.min(120, b + 5))}
            className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Faster <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 max-w-sm mx-auto w-full">
          <div className="flex justify-between w-full">
            <span className="text-xs text-muted-foreground">Speed</span>
            <span className="text-xs font-medium text-foreground">{bpm} BPM</span>
          </div>
          <input type="range" min={20} max={120} step={5} value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">← → adjust · Space pause/resume</p>
        </div>
      </div>
    </div>
  );
}
