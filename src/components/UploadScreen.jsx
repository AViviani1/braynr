import { useRef } from 'react';
import { SAMPLE_TEXT } from '../sampleText';

export default function UploadScreen({ onTextReady }) {
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onTextReady(ev.target.result, file.name);
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.txt')) return;
    const reader = new FileReader();
    reader.onload = (ev) => onTextReady(ev.target.result, file.name);
    reader.readAsText(file);
  }

  return (
    <div className="upload-screen">
      <div className="upload-hero">
        <h1 className="brand">Braynr</h1>
        <p className="tagline">A reading tool designed for dyslexic readers</p>
      </div>

      <div
        className="drop-zone"
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.currentTarget.classList.add('drag-over')}
        onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
      >
        <span className="drop-icon">📄</span>
        <p>Drop a <strong>.txt</strong> file here, or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>

      <div className="upload-divider">
        <span>or</span>
      </div>

      <button
        className="btn-sample"
        onClick={() => onTextReady(SAMPLE_TEXT, 'Ancient Rome (sample)')}
      >
        Load sample text — History of Ancient Rome
      </button>
    </div>
  );
}
