import { useState, useEffect, useRef } from "react";
import { X, Mic, Square, Loader2, CheckCircle, XCircle, GraduationCap, RefreshCw, Sparkles } from "lucide-react";
import { QuizMemeHelper } from "@/components/QuizMemeHelper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateFinalQuiz, evaluateAnswer, generateQuizFeedback, EvaluationResult } from "@/lib/groq";

interface QuestionResult {
  question: string;
  answer: string;
  evaluation: EvaluationResult;
}

export interface KeywordHint {
  text: string;
  color: string; // resolved CSS color string
}

type Phase = "ready" | "listening" | "evaluating";

/* ─── inline keyword highlighter ────────────────────────────────────── */
function HighlightedText({ text, keywords }: { text: string; keywords: KeywordHint[] }) {
  if (!keywords.length) return <>{text}</>;
  const escaped = keywords.map(k => k.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts   = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const kw = keywords.find(k => k.text.toLowerCase() === part.toLowerCase());
        return kw
          ? <mark key={i} style={{ background: kw.color, borderRadius: 3, padding: "0 1px" }}>{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ─── TestQuiz overlay ───────────────────────────────────────────────── */
export function TestQuiz({
  text,
  keywords = [],
  onExit,
}: {
  text: string;
  keywords?: KeywordHint[];
  onExit: () => void;
}) {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [questions, setQuestions]   = useState<string[]>([]);
  const [results, setResults]       = useState<QuestionResult[]>([]);
  const [idx, setIdx]               = useState(0);
  const [phase, setPhase]           = useState<Phase>("ready");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback]     = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalRef       = useRef("");

  const keywordTexts = keywords.map(k => k.text);

  useEffect(() => {
    generateFinalQuiz(text, keywordTexts)
      .then(({ questions: qs }) => { setQuestions(qs); setLoading(false); })
      .catch(e => { setError(e instanceof Error ? e.message : "Failed to generate test"); setLoading(false); });
  }, []);

  const isComplete = questions.length > 0 && results.length >= questions.length;

  /* generate encouraging feedback once quiz is done */
  useEffect(() => {
    if (!isComplete) return;
    setFeedbackLoading(true);
    generateQuizFeedback(
      results.map(r => ({ question: r.question, correct: r.evaluation.correct, feedback: r.evaluation.feedback })),
    )
      .then(text => { setFeedback(text); setFeedbackLoading(false); })
      .catch(() => { setFeedbackLoading(false); });
  }, [isComplete]);

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition not supported — use Chrome or Edge."); return; }

    finalRef.current = "";
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous    = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalRef.current += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      setTranscript((finalRef.current + interim).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      setError(`Microphone error: ${event.error}`);
    };

    setTranscript("");
    setPhase("listening");
    recognition.start();
  }

  async function stopAndEvaluate() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const answer = finalRef.current.trim();
    if (!answer) { setPhase("ready"); setTranscript(""); return; }

    setPhase("evaluating");
    try {
      const evaluation = await evaluateAnswer(text.slice(0, 4000), questions[idx], answer);
      setResults(prev => [...prev, { question: questions[idx], answer, evaluation }]);
      setIdx(i => i + 1);
      setPhase("ready");
      setTranscript("");
      finalRef.current = "";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    }
  }

  /* ── loading ── */
  if (loading) return (
    <Overlay onExit={onExit}>
      <div className="flex flex-1 items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Generating test questions…</p>
      </div>
    </Overlay>
  );

  /* ── error ── */
  if (error) return (
    <Overlay onExit={onExit}>
      <div className="flex flex-1 items-center justify-center flex-col gap-4">
        <XCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-500 text-center max-w-sm">{error}</p>
        <Button onClick={onExit}>Close</Button>
      </div>
    </Overlay>
  );

  /* ── complete ── */
  if (isComplete) {
    return (
      <Overlay onExit={onExit}>
        <div className="flex flex-1 flex-col items-center justify-center p-8 gap-6 max-w-xl mx-auto w-full overflow-auto">

          {/* Encouraging feedback */}
          <div className="w-full rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">Feedback</span>
            </div>
            {feedbackLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating feedback…
              </div>
            ) : feedback ? (
              <p className="text-sm text-foreground leading-relaxed">{feedback}</p>
            ) : null}
          </div>

          {/* Per-question summary */}
          <div className="w-full space-y-3">
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-start gap-2">
                  {r.evaluation.correct
                    ? <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    : <XCircle    className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                  <p className="text-sm font-medium text-foreground">
                    <HighlightedText text={r.question} keywords={keywords} />
                  </p>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Risposta: </span>{r.answer}
                  </p>
                  <p className={cn(
                    "text-xs",
                    r.evaluation.correct ? "text-emerald-700" : "text-red-600",
                  )}>
                    {r.evaluation.feedback}
                  </p>
                  {!r.evaluation.correct && (
                    <QuizMemeHelper
                      paragraph={text.slice(0, 800)}
                      correctAnswer={r.evaluation.correctAnswer}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={onExit} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Chiudi
          </Button>
        </div>
      </Overlay>
    );
  }

  /* ── active question ── */
  const currentQuestion = questions[idx];
  const hasText = transcript.length > 0;

  return (
    <Overlay onExit={onExit} progress={`${idx + 1} / ${questions.length}`}>
      <div className="flex flex-1 flex-col items-center justify-center p-8 gap-5 max-w-xl mx-auto w-full">

        {/* Question card */}
        <div className="w-full rounded-lg border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Domanda {idx + 1}
          </div>
          <p className="text-base font-medium text-foreground leading-snug">
            <HighlightedText text={currentQuestion} keywords={keywords} />
          </p>
        </div>

        {/* Live transcript box */}
        {phase !== "ready" && (
          <div className="w-full rounded-md border border-border bg-muted/40 min-h-[3.5rem] px-4 py-3">
            {hasText
              ? <p className="text-sm text-foreground">{transcript}</p>
              : <p className="text-sm text-muted-foreground italic animate-pulse">In ascolto…</p>}
          </div>
        )}

        {/* Controls */}
        {phase === "ready" && (
          <Button onClick={startListening} className="gap-2">
            <Mic className="h-4 w-4" />
            Rispondi a voce
          </Button>
        )}

        {phase === "listening" && (
          <div className="flex items-center gap-4">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-sm text-muted-foreground">Sto ascoltando…</span>
            <Button
              onClick={stopAndEvaluate}
              disabled={!hasText}
              className="gap-2 ml-4"
            >
              <Square className="h-3.5 w-3.5" />
              Fine
            </Button>
          </div>
        )}

        {phase === "evaluating" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Valutazione in corso…
          </div>
        )}

        {/* Previous results mini-strip */}
        {results.length > 0 && (
          <div className="flex gap-2 mt-2">
            {results.map((r, i) => (
              <span key={i} className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold",
                r.evaluation.correct ? "bg-emerald-500" : "bg-red-500",
              )}>
                {i + 1}
              </span>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  );
}

/* ─── Shared overlay shell ───────────────────────────────────────────── */
function Overlay({
  children, onExit, progress,
}: {
  children: React.ReactNode;
  onExit: () => void;
  progress?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Test finale</span>
        </div>
        {progress && (
          <span className="text-xs text-muted-foreground">{progress}</span>
        )}
        <Button variant="ghost" size="icon" onClick={onExit}><X /></Button>
      </div>
      {children}
    </div>
  );
}
