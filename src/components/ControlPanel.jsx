const OVERLAYS = ['None', 'Yellow', 'Blue', 'Rose'];

export default function ControlPanel({
  settings,
  onChange,
  focusMask,
  onToggleFocusMask,
  rhythmicMode,
  onToggleRhythmicMode,
  onBack,
}) {
  function set(key, value) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="control-panel">
      <div className="panel-header">
        <span className="panel-title">Display Settings</span>
        <button className="btn-back" onClick={onBack} title="Load new text">↩ New text</button>
      </div>

      <label className="ctrl-label">
        Letter spacing <span className="ctrl-value">{settings.letterSpacing}px</span>
        <input type="range" min="0" max="10" step="0.5" value={settings.letterSpacing}
          onChange={(e) => set('letterSpacing', Number(e.target.value))} />
      </label>

      <label className="ctrl-label">
        Word spacing <span className="ctrl-value">{settings.wordSpacing}px</span>
        <input type="range" min="0" max="20" step="1" value={settings.wordSpacing}
          onChange={(e) => set('wordSpacing', Number(e.target.value))} />
      </label>

      <label className="ctrl-label">
        Line height <span className="ctrl-value">{settings.lineHeight}</span>
        <input type="range" min="1.2" max="3.0" step="0.1" value={settings.lineHeight}
          onChange={(e) => set('lineHeight', Number(e.target.value))} />
      </label>

      <label className="ctrl-label">
        Column width <span className="ctrl-value">{settings.columnWidth}px</span>
        <input type="range" min="300" max="900" step="10" value={settings.columnWidth}
          onChange={(e) => set('columnWidth', Number(e.target.value))} />
      </label>

      <div className="ctrl-group">
        <span className="ctrl-group-label">Color overlay</span>
        <div className="overlay-btns">
          {OVERLAYS.map((o) => (
            <button
              key={o}
              className={`btn-overlay btn-overlay--${o.toLowerCase()} ${settings.overlay === o ? 'active' : ''}`}
              onClick={() => set('overlay', o)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl-toggle-row">
        <span>Focus mask</span>
        <button
          className={`toggle ${focusMask ? 'on' : 'off'}`}
          onClick={onToggleFocusMask}
        >
          {focusMask ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="ctrl-toggle-row">
        <span>Rhythmic mode (RSVP)</span>
        <button
          className={`toggle ${rhythmicMode ? 'on' : 'off'}`}
          onClick={onToggleRhythmicMode}
        >
          {rhythmicMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="panel-footer">
        <span className="eyetrack-badge">👁 Eye tracking — coming soon</span>
      </div>
    </div>
  );
}
