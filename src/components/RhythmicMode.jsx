import { useState, useEffect, useRef, useCallback } from 'react';

function buildChunks(text, chunkSize = 2) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

export default function RhythmicMode({ text, onExit }) {
  const chunks = useRef(buildChunks(text));
  const [index, setIndex] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => {
        if (i >= chunks.current.length - 1) {
          setPaused(true);
          return i;
        }
        return i + 1;
      });
      setVisible(true);
    }, 150);
  }, []);

  useEffect(() => {
    if (paused) {
      clearInterval(timerRef.current);
      return;
    }
    const ms = Math.round(60000 / bpm);
    timerRef.current = setInterval(advance, ms);
    return () => clearInterval(timerRef.current);
  }, [bpm, paused, advance]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'ArrowLeft') setBpm((b) => Math.max(20, b - 5));
      if (e.key === 'ArrowRight') setBpm((b) => Math.min(120, b + 5));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pct = chunks.current.length > 1
    ? Math.round((index / (chunks.current.length - 1)) * 100)
    : 100;

  return (
    <div className="rsvp-overlay">
      <div className="rsvp-header">
        <button className="btn-exit-rsvp" onClick={onExit}>✕ Exit rhythmic mode</button>
        <span className="rsvp-progress">{pct}%</span>
      </div>

      <div className="rsvp-stage">
        <div className={`rsvp-word ${visible ? 'fade-in' : 'fade-out'}`}>
          {chunks.current[index]}
        </div>
      </div>

      <div className="rsvp-controls">
        <button className="btn-rsvp-speed" onClick={() => setBpm((b) => Math.max(20, b - 5))}>
          ◀ Slower
        </button>

        <button className="btn-rsvp-play" onClick={() => setPaused((p) => !p)}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button className="btn-rsvp-speed" onClick={() => setBpm((b) => Math.min(120, b + 5))}>
          Faster ▶
        </button>
      </div>

      <div className="rsvp-bpm-row">
        <label className="ctrl-label rsvp-bpm-label">
          Speed: <strong>{bpm} BPM</strong>
          <input
            type="range" min="20" max="120" step="5" value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </label>
        <p className="rsvp-keys-hint">← → adjust speed &nbsp;|&nbsp; Space pause/resume</p>
      </div>
    </div>
  );
}
