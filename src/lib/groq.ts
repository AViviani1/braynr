const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface OpenQuestion {
  question: string;
}

export interface EvaluationResult {
  correct: boolean;
  feedback: string;
  correctAnswer: string; // brief correct answer used by QuizMemeHelper
}

export interface MemeResult {
  template: string;
  top: string;
  bottom: string;
  reason: string;
}

async function groqJson<T>(
  messages: { role: string; content: string }[],
  maxTokens = 300,
): Promise<T> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as T;
}

export async function generateOpenQuestion(paragraph: string): Promise<OpenQuestion> {
  const result = await groqJson<{ question: string }>(
    [
      {
        role: "system",
        content:
          'You are a comprehension tutor. Given a paragraph, write one short and simple open-ended question (max 12 words) that tests basic understanding of its content. Use the same language as the paragraph. Return ONLY a JSON object: {"question": "..."}',
      },
      {
        role: "user",
        content: `Write an open-ended comprehension question for this paragraph:\n\n${paragraph}`,
      },
    ],
    150,
  );

  if (typeof result.question !== "string") throw new Error("Unexpected response format");
  return { question: result.question };
}

export async function generateFinalQuiz(text: string): Promise<{ questions: string[] }> {
  const truncated = text.slice(0, 4000);
  const result = await groqJson<{ questions: string[] }>(
    [
      {
        role: "system",
        content:
          'You are a comprehension tutor. Given a text, generate exactly 3 short, simple open-ended questions (max 12 words each) that test understanding of the main ideas. Use the same language as the text. Return ONLY a JSON object: {"questions": ["...", "...", "..."]}',
      },
      {
        role: "user",
        content: `Generate 3 comprehension questions for this text:\n\n${truncated}`,
      },
    ],
    300,
  );

  if (!Array.isArray(result.questions) || result.questions.length !== 3) {
    throw new Error("Unexpected response format");
  }
  return { questions: result.questions };
}

export async function evaluateAnswer(
  paragraph: string,
  question: string,
  userAnswer: string,
): Promise<EvaluationResult> {
  const result = await groqJson<{ correct: boolean; feedback: string; correctAnswer: string }>(
    [
      {
        role: "system",
        content:
          'You are an encouraging comprehension tutor. Evaluate whether the student\'s spoken answer correctly addresses the question based on the paragraph. Accept answers in any language — evaluate the meaning, not the language. Return ONLY a JSON object: {"correct": true or false, "feedback": "1-2 sentence explanation", "correctAnswer": "brief correct answer in max 8 words"}.',
      },
      {
        role: "user",
        content: `Paragraph:\n${paragraph}\n\nQuestion:\n${question}\n\nStudent answer:\n${userAnswer}`,
      },
    ],
    300,
  );

  if (
    typeof result.correct !== "boolean" ||
    typeof result.feedback !== "string" ||
    typeof result.correctAnswer !== "string"
  ) {
    throw new Error("Unexpected evaluation format");
  }
  return result;
}

// Curated subset of templates confirmed to exist on memegen.link
const PREFERRED_TEMPLATES = [
  "drake",        // Drakeposting — disapprove/approve (2 panel)
  "doge",         // Doge — classic single image
  "fry",          // Futurama Fry — not sure if (1 panel)
  "fine",         // This is Fine — 1 panel
  "blb",          // Bad Luck Brian — 1 panel
  "buzz",         // X Everywhere — 2 panel
  "picard",       // Picard Facepalm — 1 panel
  "facepalm",     // Facepalm — 1 panel
  "wonka",        // Condescending Wonka — 1 panel
  "yoda",         // Yoda — 1 panel
  "aag",          // Ancient Aliens Guy — 1 panel
  "success",      // Success Kid — 1 panel
  "mordor",       // One Does Not Simply — 1 panel
  "morpheus",     // Matrix Morpheus — 1 panel
  "rollsafe",     // Roll Safe — 1 panel
  "woman-cat",    // Woman Yelling at a Cat — 2 panel
  "harold",       // Hide the Pain Harold — 1 panel
  "pooh",         // Tuxedo Winnie the Pooh — 2 panel
  "philosoraptor",// Philosoraptor — 1 panel
  "spongebob",    // Mocking Spongebob — 1 panel
];

async function fetchValidTemplates(): Promise<string[]> {
  try {
    const res = await fetch("https://api.memegen.link/templates");
    const data = (await res.json()) as Array<{ id: string }>;
    const available = new Set(data.map((t) => t.id));
    const valid = PREFERRED_TEMPLATES.filter((id) => available.has(id));
    return valid.length > 0 ? valid : PREFERRED_TEMPLATES;
  } catch {
    return PREFERRED_TEMPLATES;
  }
}

export async function generateMeme(
  paragraph: string,
  correctAnswer: string,
): Promise<MemeResult> {
  const templates = await fetchValidTemplates();

  const result = await groqJson<MemeResult>(
    [
      {
        role: "system",
        content: `You are a meme generator for education. A student got a quiz wrong. Pick the funniest and most fitting template from this exact list: ${templates.join(", ")}. Write short, punchy top/bottom text (max 6 words each) that references the correct answer to help the student remember it. Be funny and encouraging. Return ONLY JSON: {"template": "...", "top": "...", "bottom": "...", "reason": "..."}`,
      },
      {
        role: "user",
        content: `Study paragraph: ${paragraph.slice(0, 400)}\n\nCorrect answer: ${correctAnswer}`,
      },
    ],
    200,
  );

  if (!result.template || !result.top || !result.bottom) {
    throw new Error("Invalid meme response from model");
  }
  if (!templates.includes(result.template)) result.template = "drake";
  return result;
}
