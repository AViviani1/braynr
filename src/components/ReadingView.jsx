import { useRef, useState } from 'react';
import { ArrowLeft, Zap, Eye } from 'lucide-react';
import ControlPanel from './ControlPanel';
import FocusMask from './FocusMask';
import RhythmicMode from './RhythmicMode';

const DEFAULT_SETTINGS = {
  letterSpacing: 2,
  wordSpacing: 4,
  lineHeight: 1.8,
  columnWidth: 680,
  overlay: 'None',
};

const OVERLAY_COLORS = {
  None:   'transparent',
  Yellow: 'rgba(255,240,100,0.25)',
  Blue:   'rgba(100,180,255,0.20)',
  Rose:   'rgba(255,150,160,0.22)',
};

export default function ReadingView({ text, fileName, onBack, onOpenEyeTracking }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [focusMask, setFocusMask] = useState(false);
  const [rhythmicMode, setRhythmicMode] = useState(false);
  const containerRef = useRef(null);

  const readingStyle = {
    fontFamily: "'OpenDyslexic', system-ui, sans-serif",
    fontSize: '1.05rem',
    letterSpacing: `${settings.letterSpacing}px`,
    wordSpacing: `${settings.wordSpacing}px`,
    lineHeight: settings.lineHeight,
    maxWidth: `${settings.columnWidth}px`,
    margin: '0 auto',
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">

      {/* ── Top toolbar (mirrors StudyWorkspace) ── */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Home</span>
          </button>
          <div className="mx-2 h-6 w-px bg-border" />
          <span className="text-xs text-muted-foreground truncate max-w-48">{fileName}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setRhythmicMode(true)}
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <Zap className="h-5 w-5" />
            <span>Rhythmic Mode</span>
          </button>
          <button
            onClick={onOpenEyeTracking}
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            <Eye className="h-5 w-5" />
            <span>Eye Track</span>
          </button>
        </div>

        <div className="w-32" /> {/* spacer to balance left side */}
      </header>

      {/* ── Body ── */}
      {rhythmicMode ? (
        <RhythmicMode text={text} onExit={() => setRhythmicMode(false)} />
      ) : (
        <div className="flex flex-1 overflow-hidden">

          {/* Left: reading area */}
          <main className="relative flex flex-1 flex-col overflow-hidden border-r border-border">
            {/* Color overlay */}
            <div
              className="pointer-events-none fixed inset-0 z-10"
              style={{ background: OVERLAY_COLORS[settings.overlay] }}
            />
            {focusMask && <FocusMask containerRef={containerRef} />}

            <div className="flex-1 overflow-auto bg-muted/30 p-8" ref={containerRef}>
              <div style={readingStyle}>
                {text.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="mb-5 text-foreground">{para.trim()}</p>
                ))}
              </div>
            </div>
          </main>

          {/* Right: control panel */}
          <ControlPanel
            settings={settings}
            onChange={setSettings}
            focusMask={focusMask}
            onToggleFocusMask={() => setFocusMask((v) => !v)}
            onToggleRhythmicMode={() => setRhythmicMode(true)}
            onOpenEyeTracking={onOpenEyeTracking}
          />
        </div>
      )}
    </div>
  );
}
