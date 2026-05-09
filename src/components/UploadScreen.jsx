import { useRef } from 'react';
import { Upload } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-5">

      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Braynr</h1>
        <p className="text-sm text-muted-foreground mt-1">A reading tool designed for dyslexic students</p>
      </div>

      <div
        className="w-full max-w-md flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-card p-12 text-center cursor-pointer hover:border-ring hover:bg-muted/30 transition-colors"
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Drop a <strong>.txt</strong> file here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        className="w-full max-w-md rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        onClick={() => onTextReady(SAMPLE_TEXT, 'Ancient Rome (sample)')}
      >
        Load sample — History of Ancient Rome
      </button>

    </div>
  );
}
