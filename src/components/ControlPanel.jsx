import { useState } from 'react';
import { Eye, Zap } from 'lucide-react';

const TABS = ['Display', 'Overlays', 'Modes'];
const OVERLAYS = ['None', 'Yellow', 'Blue', 'Rose'];

const OVERLAY_STYLE = {
  None:   'bg-card border-border text-foreground',
  Yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  Blue:   'bg-blue-100 border-blue-300 text-blue-900',
  Rose:   'bg-rose-100 border-rose-300 text-rose-900',
};

function Slider({ label, value, min, max, step, unit = '', onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function ControlPanel({
  settings, onChange,
  focusMask, onToggleFocusMask,
  onToggleRhythmicMode,
  onOpenEyeTracking,
}) {
  const [tab, setTab] = useState('Display');

  function set(key, val) { onChange({ ...settings, [key]: val }); }

  return (
    <aside className="flex w-72 flex-col border-l border-border flex-shrink-0">

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 space-y-5">

        {tab === 'Display' && (
          <>
            <Slider label="Letter spacing" value={settings.letterSpacing} min={0} max={10} step={0.5} unit="px"
              onChange={(v) => set('letterSpacing', v)} />
            <Slider label="Word spacing" value={settings.wordSpacing} min={0} max={20} step={1} unit="px"
              onChange={(v) => set('wordSpacing', v)} />
            <Slider label="Line height" value={settings.lineHeight} min={1.2} max={3.0} step={0.1}
              onChange={(v) => set('lineHeight', v)} />
            <Slider label="Column width" value={settings.columnWidth} min={300} max={900} step={10} unit="px"
              onChange={(v) => set('columnWidth', v)} />
          </>
        )}

        {tab === 'Overlays' && (
          <>
            <div className="space-y-2">
              <span className="text-xs text-foreground">Color overlay</span>
              <div className="grid grid-cols-2 gap-2">
                {OVERLAYS.map((o) => (
                  <button
                    key={o}
                    onClick={() => set('overlay', o)}
                    className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${OVERLAY_STYLE[o]} ${
                      settings.overlay === o ? 'ring-2 ring-ring ring-offset-1' : ''
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-foreground">Focus mask</span>
              <button
                onClick={onToggleFocusMask}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  focusMask
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-foreground hover:bg-accent'
                }`}
              >
                {focusMask ? 'ON' : 'OFF'}
              </button>
            </div>
          </>
        )}

        {tab === 'Modes' && (
          <div className="space-y-3">
            <button
              onClick={onToggleRhythmicMode}
              className="w-full flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Zap className="h-4 w-4" />
              Rhythmic mode
            </button>
            <button
              onClick={onOpenEyeTracking}
              className="w-full flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Eye className="h-4 w-4" />
              Eye Tracking Mode
            </button>
          </div>
        )}

      </div>
    </aside>
  );
}
