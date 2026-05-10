import { useState } from "react";
import { Laugh, Loader2, RefreshCw, XCircle } from "lucide-react";
import { generateMeme, MemeResult } from "@/lib/groq";

/* ── memegen.link URL encoding ──────────────────────────────────────── */
function sanitize(text: string): string {
  if (!text.trim()) return "_";
  return text
    .replace(/-/g, "--")       // literal dash must be doubled
    .replace(/\s+/g, "_")      // spaces → underscores
    .replace(/\?/g, "~q")
    .replace(/!/g, "~e")
    .replace(/&/g, "~a")
    .replace(/%/g, "~p")
    .replace(/#/g, "~h")
    .replace(/\//g, "~s")
    .replace(/"/g, "''");
}

function buildMemeUrl(template: string, top: string, bottom: string): string {
  return `https://api.memegen.link/images/${template}/${sanitize(top)}/${sanitize(bottom)}.jpg`;
}

/* ── component ──────────────────────────────────────────────────────── */
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string; meme: MemeResult }
  | { status: "error"; message: string };

interface Props {
  paragraph: string;
  correctAnswer: string;
}

export function QuizMemeHelper({ paragraph, correctAnswer }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function generate() {
    setState({ status: "loading" });
    try {
      const meme = await generateMeme(paragraph, correctAnswer);
      const url = buildMemeUrl(meme.template, meme.top, meme.bottom);
      setState({ status: "ready", url, meme });
    } catch (e: unknown) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Failed to generate meme",
      });
    }
  }

  /* idle */
  if (state.status === "idle") {
    return (
      <button
        onClick={generate}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
      >
        <Laugh className="h-3.5 w-3.5" />
        Generate a meme to remember this
      </button>
    );
  }

  /* loading */
  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Generating meme…
      </div>
    );
  }

  /* error */
  if (state.status === "error") {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 mt-1">
        <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{state.message}</span>
        <button
          onClick={() => setState({ status: "idle" })}
          className="underline text-muted-foreground hover:text-foreground ml-1"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ready */
  return (
    <div className="mt-2 space-y-2">
      <img
        src={state.url}
        alt={`${state.meme.template} meme`}
        className="w-full max-w-xs rounded-lg border border-border shadow-sm"
        onError={() =>
          setState({ status: "error", message: "Image failed to load — try again" })
        }
      />
      <button
        onClick={generate}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Another meme
      </button>
    </div>
  );
}
