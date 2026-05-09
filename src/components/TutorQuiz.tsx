import { useState, useRef } from "react";
import { Brain, Mic, Square, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateOpenQuestion, evaluateAnswer, EvaluationResult } from "@/lib/groq";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; question: string }
  | { status: "listening"; question: string; transcript: string }
  | { status: "evaluating"; question: string; answer: string }
  | { status: "result"; question: string; answer: string; evaluation: EvaluationResult }
  | { status: "error"; message: string };

export function TutorQuiz({ paragraph }: { paragraph: string }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef("");

  async function handleGenerate() {
    setState({ status: "loading" });
    try {
      const { question } = await generateOpenQuestion(paragraph);
      setState({ status: "ready", question });
    } catch (e: unknown) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Failed to generate question" });
    }
  }

  function startListening(question: string) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setState({ status: "error", message: "Speech recognition not supported — use Chrome or Edge." });
      return;
    }

    finalRef.current = "";
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalRef.current += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setState({ status: "listening", question, transcript: (finalRef.current + interim).trim() });
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      setState({ status: "error", message: `Microphone error: ${event.error}` });
    };

    setState({ status: "listening", question, transcript: "" });
    recognition.start();
  }

  async function handleDone() {
    if (state.status !== "listening") return;
    const { question } = state;

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const answer = finalRef.current.trim();
    if (!answer) {
      setState({ status: "ready", question });
      return;
    }

    setState({ status: "evaluating", question, answer });
    try {
      const evaluation = await evaluateAnswer(paragraph, question, answer);
      setState({ status: "result", question, answer, evaluation });
    } catch (e: unknown) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Evaluation failed" });
    }
  }

  function reset() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState({ status: "idle" });
  }

  /* ── idle ── */
  if (state.status === "idle") {
    return (
      <div className="my-2 flex justify-start">
        <button
          onClick={handleGenerate}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Brain className="h-3.5 w-3.5" />
          Quiz this paragraph
        </button>
      </div>
    );
  }

  /* ── loading ── */
  if (state.status === "loading") {
    return (
      <div className="my-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Generating question…
      </div>
    );
  }

  /* ── error ── */
  if (state.status === "error") {
    return (
      <div className="my-2 flex items-center gap-2 text-xs text-red-500">
        <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{state.message}</span>
        <button onClick={reset} className="ml-1 underline text-muted-foreground hover:text-foreground">
          Reset
        </button>
      </div>
    );
  }

  /* ── ready: show question + mic button ── */
  if (state.status === "ready") {
    return (
      <div className="my-3 rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-2">
          <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground leading-snug">{state.question}</p>
        </div>
        <div className="flex items-center gap-3 pl-6">
          <button
            onClick={() => startListening(state.question)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Mic className="h-3.5 w-3.5" />
            Rispondi a voce
          </button>
          <span className="text-xs text-muted-foreground">Clicca e parla</span>
        </div>
      </div>
    );
  }

  /* ── listening: mic active, live transcript ── */
  if (state.status === "listening") {
    const hasText = state.transcript.length > 0;
    return (
      <div className="my-3 rounded-lg border border-primary bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-2">
          <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground leading-snug">{state.question}</p>
        </div>

        {/* live transcript */}
        <div className="pl-6 min-h-[3rem] rounded-md border border-border bg-muted/40 px-3 py-2">
          {hasText ? (
            <p className="text-sm text-foreground">{state.transcript}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic animate-pulse">In ascolto…</p>
          )}
        </div>

        <div className="flex items-center gap-3 pl-6">
          {/* pulsing mic indicator */}
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs text-muted-foreground">Sto ascoltando…</span>

          <button
            onClick={handleDone}
            className={cn(
              "ml-auto flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors",
              hasText
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            disabled={!hasText}
          >
            <Square className="h-3 w-3" />
            Fine — valuta
          </button>
        </div>
      </div>
    );
  }

  /* ── evaluating ── */
  if (state.status === "evaluating") {
    return (
      <div className="my-3 rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-start gap-2">
          <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground leading-snug">{state.question}</p>
        </div>
        <div className="pl-6 rounded-md border border-border bg-muted/40 px-3 py-2">
          <p className="text-sm text-muted-foreground">{state.answer}</p>
        </div>
        <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Valutazione in corso…
        </div>
      </div>
    );
  }

  /* ── result ── */
  const { question, answer, evaluation } = state;
  return (
    <div className="my-3 rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-start gap-2">
        <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-foreground leading-snug">{question}</p>
      </div>

      {/* user's transcribed answer */}
      <div className="pl-6 rounded-md border border-border bg-muted/40 px-3 py-2">
        <p className="text-xs text-muted-foreground mb-0.5">La tua risposta</p>
        <p className="text-sm text-foreground">{answer}</p>
      </div>

      {/* verdict */}
      <div
        className={cn(
          "pl-6 flex items-start gap-2 rounded-md px-3 py-2",
          evaluation.correct ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900",
        )}
      >
        {evaluation.correct ? (
          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-xs font-semibold mb-0.5">
            {evaluation.correct ? "Corretto!" : "Non del tutto"}
          </p>
          <p className="text-xs leading-relaxed">{evaluation.feedback}</p>
        </div>
      </div>

      <div className="flex justify-end pl-6">
        <button
          onClick={reset}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );
}
