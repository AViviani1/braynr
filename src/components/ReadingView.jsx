import { useRef, useState } from 'react';
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
  None: 'transparent',
  Yellow: 'rgba(255, 240, 100, 0.25)',
  Blue: 'rgba(100, 180, 255, 0.20)',
  Rose: 'rgba(255, 150, 160, 0.22)',
};

export default function ReadingView({ text, fileName, onBack }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [focusMask, setFocusMask] = useState(false);
  const [rhythmicMode, setRhythmicMode] = useState(false);
  const containerRef = useRef(null);

  const textStyle = {
    '--letter-spacing': `${settings.letterSpacing}px`,
    '--word-spacing': `${settings.wordSpacing}px`,
    '--line-height': settings.lineHeight,
    '--column-width': `${settings.columnWidth}px`,
  };

  return (
    <div className="reading-view" ref={containerRef}>
      {rhythmicMode ? (
        <RhythmicMode text={text} onExit={() => setRhythmicMode(false)} />
      ) : (
        <>
          <div
            className="color-overlay"
            style={{ background: OVERLAY_COLORS[settings.overlay] }}
          />

          {focusMask && <FocusMask containerRef={containerRef} />}

          <div className="reading-body" style={textStyle}>
            <p className="file-label">{fileName}</p>
            {text.split(/\n\n+/).map((para, i) => (
              <p key={i} className="reading-para">
                {para.trim()}
              </p>
            ))}
          </div>
        </>
      )}

      {!rhythmicMode && (
        <ControlPanel
          settings={settings}
          onChange={setSettings}
          focusMask={focusMask}
          onToggleFocusMask={() => setFocusMask((v) => !v)}
          rhythmicMode={rhythmicMode}
          onToggleRhythmicMode={() => setRhythmicMode(true)}
          onBack={onBack}
        />
      )}
    </div>
  );
}
