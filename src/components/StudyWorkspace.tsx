import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Focus, FileText, Zap, Eye, Upload,
  ChevronLeft, ChevronRight, Play, Pause, X, MoreVertical, Brain, GraduationCap, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SAMPLE_TEXT } from "@/sampleText";
import { TutorQuiz } from "@/components/TutorQuiz";
import { TestQuiz } from "@/components/TestQuiz";
// @ts-ignore
import { EyeTracker } from "@/eyetracking";

/* ─── types ─────────────────────────────────────────────────────────── */
interface ReadingSettings {
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number;
  columnWidth: number;
}

type OverlayKey = "None" | "Yellow" | "Blue" | "Rose";

const OVERLAY_COLORS: Record<OverlayKey, string> = {
  None:   "transparent",
  Yellow: "rgba(255,240,100,0.25)",
  Blue:   "rgba(100,180,255,0.20)",
  Rose:   "rgba(255,150,160,0.22)",
};

const DEFAULT_SETTINGS: ReadingSettings = {
  letterSpacing: 2,
  wordSpacing:   4,
  lineHeight:    1.8,
  columnWidth:   680,
};

/* ─── keyword types ──────────────────────────────────────────────────── */
type KeywordColor = "Yellow" | "Blue" | "Rose" | "Green";

interface Keyword {
  id: string;
  text: string;
  color: KeywordColor;
}

const KEYWORD_COLORS: Record<KeywordColor, string> = {
  Yellow: "rgba(255,235,60,0.65)",
  Blue:   "rgba(80,170,255,0.50)",
  Rose:   "rgba(255,120,145,0.50)",
  Green:  "rgba(80,210,120,0.55)",
};

/* ─── RSVP ──────────────────────────────────────────────────────────── */
function buildChunks(text: string, size = 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.reduce<string[]>((acc, w, i) => {
    const idx = Math.floor(i / size);
    acc[idx] = acc[idx] ? acc[idx] + " " + w : w;
    return acc;
  }, []);
}

function RsvpOverlay({ text, onExit }: { text: string; onExit: () => void }) {
  const chunks = useRef(buildChunks(text));
  const [index, setIndex]     = useState(0);
  const [bpm, setBpm]         = useState(60);
  const [paused, setPaused]   = useState(false);
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIndex(i => {
        if (i >= chunks.current.length - 1) { setPaused(true); return i; }
        return i + 1;
      });
      setVisible(true);
    }, 150);
  }, []);

  useEffect(() => {
    if (paused) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(advance, Math.round(60000 / bpm));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, bpm, advance]);

  const updateBpm = (next: number) => {
    setBpm(next);
    if (timer.current) clearInterval(timer.current);
    if (!paused) timer.current = setInterval(advance, Math.round(60000 / next));
  };

  const togglePause = () => {
    if (!paused) {
      if (timer.current) clearInterval(timer.current);
    } else {
      timer.current = setInterval(advance, Math.round(60000 / bpm));
    }
    setPaused(p => !p);
  };

  const pct = chunks.current.length > 1
    ? Math.round((index / (chunks.current.length - 1)) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium">Rhythmic Mode (RSVP)</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{pct}%</span>
          <Button variant="ghost" size="icon" onClick={onExit}><X /></Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-8">
        <p
          className={cn("text-center font-bold text-foreground transition-opacity duration-150",
            visible ? "opacity-100" : "opacity-0")}
          style={{
            fontFamily: "'OpenDyslexic', system-ui, sans-serif",
            fontSize: "clamp(2rem,5vw,3.5rem)",
            letterSpacing: "2px",
            lineHeight: 1.3,
            maxWidth: 700,
          }}
        >
          {chunks.current[index]}
        </p>
      </div>

      <div className="border-t border-border px-4 py-4 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => updateBpm(Math.max(20, bpm - 5))}>
            <ChevronLeft /> Slower
          </Button>
          <Button onClick={togglePause}>
            {paused ? <><Play /> Resume</> : <><Pause /> Pause</>}
          </Button>
          <Button variant="outline" onClick={() => updateBpm(Math.min(120, bpm + 5))}>
            Faster <ChevronRight />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2 max-w-sm mx-auto w-full">
          <div className="flex justify-between w-full">
            <span className="text-xs text-muted-foreground">Speed</span>
            <span className="text-xs font-medium">{bpm} BPM</span>
          </div>
          <Slider min={20} max={120} step={5} value={[bpm]}
            onValueChange={([v]) => updateBpm(v)} className="w-full" />
          <p className="text-xs text-muted-foreground">← → adjust · Space pause/resume</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Eye Tracking Overlay ───────────────────────────────────────────── */
const ET_DOTS = [
  [10,10],[50,10],[90,10],
  [10,50],[50,50],[90,50],
  [10,90],[50,90],[90,90],
];
const CLICKS_PER_DOT = 1;

function EyeTrackingOverlay({ text, fileName, onExit }: { text: string; fileName: string; onExit: () => void }) {
  const [phase, setPhase]         = useState<"loading"|"intro"|"calibration"|"tracking"|"error">("loading");
  const [error, setError]         = useState("");
  const [dotClicks, setDotClicks] = useState(Array(9).fill(0));
  const readingRef = useRef<HTMLDivElement>(null);

  const total      = dotClicks.reduce((s: number, n: number) => s + n, 0);
  const needed     = ET_DOTS.length * CLICKS_PER_DOT;
  const calibrated = dotClicks.every((c: number) => c >= CLICKS_PER_DOT);

  useEffect(() => {
    EyeTracker.load()
      .then(() => setPhase("intro"))
      .catch((e: Error) => { setError(e.message); setPhase("error"); });
    return () => { EyeTracker.stop(); };
  }, []);

  const handleStart = async () => {
    setPhase("calibration");
    try {
      await EyeTracker.clearData();
      await EyeTracker.start(() => {});
    } catch (e: any) {
      setError(e.message || "Camera error"); setPhase("error");
    }
  };

  const handleDotClick = (idx: number) => {
    const [px, py] = ET_DOTS[idx];
    const screenX = (px / 100) * window.innerWidth;
    const screenY = (py / 100) * window.innerHeight;
    EyeTracker.recordPoint(screenX, screenY);
    setDotClicks((prev: number[]) => {
      if (prev[idx] >= CLICKS_PER_DOT) return prev;
      const next = [...prev]; next[idx]++; return next;
    });
  };

  if (phase === "loading") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-4 bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading eye tracking…</p>
    </div>
  );

  if (phase === "error") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-4 bg-background text-center p-6">
      <p className="text-sm text-destructive">⚠ {error}</p>
      <Button onClick={onExit}>Go back</Button>
    </div>
  );

  if (phase === "intro") return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium">Eye Tracking Mode</span>
        <Button variant="ghost" size="icon" onClick={onExit}><X /></Button>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-xl font-semibold">Eye Tracking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your webcam tracks your gaze and auto-scrolls the text as you read.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Sit roughly 50 cm from your screen</li>
            <li>Ensure your face is well lit</li>
            <li>Click 9 dots to calibrate (~30 s)</li>
          </ul>
          <div className="flex gap-3">
            <Button onClick={handleStart}>Start calibration</Button>
            <Button variant="outline" onClick={onExit}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (phase === "calibration") return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center gap-2 pt-6 z-10">
        <p className="text-sm text-slate-300">
          Look at each dot and click it <strong className="text-white">{CLICKS_PER_DOT}×</strong>
        </p>
        <div className="w-48 h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(total/needed)*100}%` }} />
        </div>
        <span className="text-xs text-slate-500">{total} / {needed}</span>
      </div>
      {ET_DOTS.map(([px, py], i) => {
        const done = dotClicks[i] >= CLICKS_PER_DOT;
        return (
          <button key={i} onClick={() => handleDotClick(i)}
            className={cn("absolute w-9 h-9 rounded-full border-2 overflow-hidden transition-colors",
              done ? "border-emerald-400 bg-emerald-900/20" : "border-primary bg-primary/10 hover:border-blue-300")}
            style={{ left:`${px}%`, top:`${py}%`, transform:"translate(-50%,-50%)" }}
          >
            <span className={cn("absolute inset-0 origin-bottom transition-transform duration-150",
              done ? "bg-emerald-500/50" : "bg-primary/50")}
              style={{ transform:`scaleY(${dotClicks[i]/CLICKS_PER_DOT})` }} />
            <span className="relative z-10 text-[10px] font-bold text-white">{dotClicks[i]}</span>
          </button>
        );
      })}
      {calibrated && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <Button onClick={() => { EyeTracker.showPreview(false); EyeTracker.showGazeDot(true); setPhase("tracking"); }}>
            Calibrated — Start reading
          </Button>
        </div>
      )}
    </div>
  );

  // tracking phase
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm text-muted-foreground">Eye tracking active — auto-scroll on</span>
        <Button variant="ghost" size="icon" onClick={onExit}><X /></Button>
      </div>
      <div className="flex-1 overflow-auto bg-muted/30 p-8" ref={readingRef}>
        <div style={{ fontFamily:"'OpenDyslexic',system-ui,sans-serif", fontSize:"1.05rem",
          lineHeight:1.8, maxWidth:680, margin:"0 auto" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">{fileName}</p>
          {text.split("\n").filter(p => p.trim()).map((p, i) => (
            <p key={i} className="mb-5 text-foreground">{p.trim()}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Toolbar button (exact insight-navigator style) ─────────────────── */
function ToolbarBtn({
  icon, label, onClick, active = false,
}: { icon: React.ReactNode; label?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
      )}>
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

/* ─── Highlighted paragraph ──────────────────────────────────────────── */
function HighlightedParagraph({ text, keywords }: { text: string; keywords: Keyword[] }) {
  if (!keywords.length) return <>{text}</>;
  const escaped = keywords.map(k => k.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const kw = keywords.find(k => k.text.toLowerCase() === part.toLowerCase());
        return kw
          ? <mark key={i} style={{ background: KEYWORD_COLORS[kw.color], borderRadius: 3, padding: "0 1px" }}>{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ─── Main workspace ─────────────────────────────────────────────────── */
export function StudyWorkspace() {
  const fileRef      = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [text, setText]               = useState<string | null>(null);
  const [fileName, setFileName]       = useState("");
  const [settings, setSettings]       = useState<ReadingSettings>(DEFAULT_SETTINGS);
  const [overlay, setOverlay]         = useState<OverlayKey>("None");
  const [focusMask, setFocusMask]     = useState(false);
  const [showRsvp, setShowRsvp]       = useState(false);
  const [showEyeTrack, setShowEyeTrack] = useState(false);
  const [tutorMode, setTutorMode]     = useState(false);
  const [showTest, setShowTest]       = useState(false);
  const [keywords, setKeywords]       = useState<Keyword[]>([]);
  const [selPopup, setSelPopup]       = useState<{ x: number; y: number; text: string } | null>(null);

  /* detect text selection inside the reading area */
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      const sel = window.getSelection();
      const selected = sel?.toString().trim();
      if (!selected || !containerRef.current?.contains(e.target as Node)) {
        setSelPopup(null);
        return;
      }
      const range = sel!.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      setSelPopup({ x: rect.left + rect.width / 2, y: rect.top, text: selected });
    }
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  function addKeyword(text: string) {
    if (!text) return;
    if (keywords.some(k => k.text.toLowerCase() === text.toLowerCase())) return;
    setKeywords(prev => [...prev, { id: crypto.randomUUID(), text, color: "Yellow" }]);
  }

  function removeKeyword(id: string) {
    setKeywords(prev => prev.filter(k => k.id !== id));
  }

  function updateKeywordColor(id: string, color: KeywordColor) {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, color } : k));
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setText(e.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }

  function loadSample() {
    setText(SAMPLE_TEXT);
    setFileName("Ancient Rome (sample)");
  }

  const set = (key: keyof ReadingSettings, val: number) =>
    setSettings(s => ({ ...s, [key]: val }));

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">

      {/* ── Top toolbar ── */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2 flex-shrink-0">
        {/* Left group */}
        <div className="flex items-center gap-1">
          <ToolbarBtn icon={<Home className="h-5 w-5" />} label="Home"
            onClick={() => { setText(null); setFileName(""); }} />
          <ToolbarBtn icon={<Focus className="h-5 w-5" />} label="Focus"
            onClick={() => setFocusMask(f => !f)} active={focusMask} />
          <div className="mx-2 h-6 w-px bg-border" />
          <ToolbarBtn icon={<MoreVertical className="h-5 w-5" />} />
          <ToolbarBtn icon={<FileText className="h-5 w-5" />} label="Testo" />
        </div>

        {/* Center group */}
        <div className="flex items-center gap-1">
          <ToolbarBtn icon={<Zap className="h-5 w-5" />} label="RSVP"
            onClick={() => text && setShowRsvp(true)} active={showRsvp} />
          <ToolbarBtn icon={<Eye className="h-5 w-5" />} label="Eye Track"
            onClick={() => text && setShowEyeTrack(true)} active={showEyeTrack} />
          <ToolbarBtn icon={<Brain className="h-5 w-5" />} label="Tutor"
            onClick={() => setTutorMode(t => !t)} active={tutorMode} />
          <ToolbarBtn icon={<GraduationCap className="h-5 w-5" />} label="Test"
            onClick={() => text && setShowTest(true)} active={showTest} />
          <ToolbarBtn icon={<Upload className="h-5 w-5" />} label="Carica"
            onClick={() => fileRef.current?.click()} />
        </div>

        {/* Right group */}
        <div className="flex items-center gap-2">
          {fileName && (
            <span className="text-xs text-muted-foreground truncate max-w-48">{fileName}</span>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: document area */}
        <main className="relative flex flex-1 flex-col overflow-hidden border-r border-border">

          {/* Color overlay */}
          <div className="pointer-events-none fixed inset-0 z-10"
            style={{ background: OVERLAY_COLORS[overlay] }} />

          {/* Focus mask */}
          {focusMask && text && (
            <FocusMaskLayer containerRef={containerRef} />
          )}

          {/* Sub-toolbar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 flex-shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {fileName || "No document loaded"}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-muted/30 p-6" ref={containerRef}>
            {text ? (
              <div style={{
                fontFamily: "'OpenDyslexic', system-ui, sans-serif",
                fontSize: "1.05rem",
                letterSpacing: `${settings.letterSpacing}px`,
                wordSpacing: `${settings.wordSpacing}px`,
                lineHeight: settings.lineHeight,
                maxWidth: settings.columnWidth,
                margin: "0 auto",
              }}>
                {text.split("\n").filter(p => p.trim()).map((para, i) => (
                  <div key={i}>
                    <p className="mb-2 text-foreground">
                      <HighlightedParagraph text={para.trim()} keywords={keywords} />
                    </p>
                    {tutorMode && i > 0 && <TutorQuiz paragraph={para.trim()} />}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-card p-12 text-center"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Load a document</h2>
                <p className="text-sm text-muted-foreground">
                  Drag a <strong>.txt</strong> file here, or click to browse.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => fileRef.current?.click()}>Select file</Button>
                  <Button variant="outline" onClick={loadSample}>Load sample text</Button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right: tabbed controls + keywords */}
        <aside className="flex w-72 flex-col flex-shrink-0 overflow-hidden">

          {/* 3-tab section — natural height */}
          <Tabs defaultValue="display">
            <div className="border-b border-border px-3 py-2">
              <TabsList className="w-full">
                <TabsTrigger value="display"  className="flex-1 text-xs">Display</TabsTrigger>
                <TabsTrigger value="overlays" className="flex-1 text-xs">Overlays</TabsTrigger>
                <TabsTrigger value="modes"    className="flex-1 text-xs">Modes</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="display" className="p-4 space-y-5 mt-0">
              <SliderRow label="Letter spacing" value={settings.letterSpacing} min={0} max={10} step={0.5} unit="px"
                onChange={v => set("letterSpacing", v)} />
              <SliderRow label="Word spacing" value={settings.wordSpacing} min={0} max={20} step={1} unit="px"
                onChange={v => set("wordSpacing", v)} />
              <SliderRow label="Line height" value={settings.lineHeight} min={1.2} max={3.0} step={0.1}
                onChange={v => set("lineHeight", v)} />
              <SliderRow label="Column width" value={settings.columnWidth} min={300} max={900} step={10} unit="px"
                onChange={v => set("columnWidth", v)} />
            </TabsContent>

            <TabsContent value="overlays" className="p-4 space-y-5 mt-0">
              <div className="space-y-2">
                <Label className="text-xs">Color overlay</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["None","Yellow","Blue","Rose"] as OverlayKey[]).map(o => (
                    <button key={o} onClick={() => setOverlay(o)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                        o === "Yellow" && "bg-yellow-100 border-yellow-300 text-yellow-900",
                        o === "Blue"   && "bg-blue-100 border-blue-300 text-blue-900",
                        o === "Rose"   && "bg-rose-100 border-rose-300 text-rose-900",
                        o === "None"   && "bg-card border-border text-foreground",
                        overlay === o  && "ring-2 ring-ring ring-offset-1",
                      )}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="focus-mask" className="text-xs cursor-pointer">Focus mask</Label>
                <Switch id="focus-mask" checked={focusMask} onCheckedChange={setFocusMask} />
              </div>
            </TabsContent>

            <TabsContent value="modes" className="p-4 space-y-3 mt-0">
              <Button className="w-full" onClick={() => text && setShowRsvp(true)}>
                <Zap /> Rhythmic mode (RSVP)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => text && setShowEyeTrack(true)}>
                <Eye /> Eye Tracking Mode
              </Button>
            </TabsContent>
          </Tabs>

          {/* Keywords — permanent section below the tabs */}
          <div className="flex flex-col flex-1 overflow-hidden border-t border-border">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keywords</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {keywords.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Seleziona una parola nel testo per aggiungerla come keyword.
                </p>
              ) : (
                <div className="space-y-3">
                  {keywords.map(kw => (
                    <div key={kw.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex-1 truncate text-sm font-medium rounded px-1"
                          style={{ background: KEYWORD_COLORS[kw.color] }}
                        >
                          {kw.text}
                        </span>
                        <button
                          onClick={() => removeKeyword(kw.id)}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Color knobs */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Colore</span>
                        <div className="flex gap-2">
                          {(["Yellow", "Blue", "Rose", "Green"] as KeywordColor[]).map(color => (
                            <button
                              key={color}
                              title={color}
                              onClick={() => updateKeywordColor(kw.id, color)}
                              className={cn(
                                "h-5 w-5 rounded-full border-2 transition-all",
                                kw.color === color
                                  ? "border-foreground scale-125"
                                  : "border-transparent hover:scale-110",
                              )}
                              style={{ background: KEYWORD_COLORS[color] }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </aside>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".txt" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />

      {/* Overlays */}
      {showRsvp && text && <RsvpOverlay text={text} onExit={() => setShowRsvp(false)} />}
      {showEyeTrack && text && (
        <EyeTrackingOverlay text={text} fileName={fileName} onExit={() => setShowEyeTrack(false)} />
      )}
      {showTest && text && <TestQuiz text={text} onExit={() => setShowTest(false)} />}

      {/* Selection popup */}
      {selPopup && (
        <button
          className="fixed z-40 flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
          style={{
            left: selPopup.x,
            top: selPopup.y - 10,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={e => {
            e.preventDefault();
            addKeyword(selPopup.text);
            setSelPopup(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Tag className="h-4 w-4" />
          Add keyword
        </button>
      )}
    </div>
  );
}

/* ─── Slider row helper ──────────────────────────────────────────────── */
function SliderRow({ label, value, min, max, step, unit = "", onChange }:
  { label:string; value:number; min:number; max:number; step:number; unit?:string; onChange:(v:number)=>void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]}
        onValueChange={([v]) => onChange(v)} className="w-full" />
    </div>
  );
}

/* ─── Focus mask ─────────────────────────────────────────────────────── */
function FocusMaskLayer({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const topRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const BAND   = 72;

  useEffect(() => {
    function update() {
      const el = containerRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const center = window.innerHeight / 2;
      if (topRef.current) topRef.current.style.height = `${Math.max(0, center - BAND/2 - rect.top + el.scrollTop)}px`;
      if (botRef.current)  botRef.current.style.top   = `${center + BAND/2 - rect.top + el.scrollTop}px`;
    }
    const el = containerRef.current;
    update();
    el?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => { el?.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [containerRef]);

  return (
    <>
      <div ref={topRef} className="focus-mask-top" />
      <div ref={botRef} className="focus-mask-bottom" />
    </>
  );
}
