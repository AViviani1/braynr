const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface OpenQuestion {
  question: string;
}

export interface EvaluationResult {
  correct: boolean;
  feedback: string;
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

export async function evaluateAnswer(
  paragraph: string,
  question: string,
  userAnswer: string,
): Promise<EvaluationResult> {
  const result = await groqJson<{ correct: boolean; feedback: string }>(
    [
      {
        role: "system",
        content:
          'You are an encouraging comprehension tutor. Evaluate whether the student\'s spoken answer correctly addresses the question based on the paragraph. Accept answers in any language — evaluate the meaning, not the language. Return ONLY a JSON object: {"correct": true or false, "feedback": "1-2 sentence explanation"}.',
      },
      {
        role: "user",
        content: `Paragraph:\n${paragraph}\n\nQuestion:\n${question}\n\nStudent answer:\n${userAnswer}`,
      },
    ],
    250,
  );

  if (typeof result.correct !== "boolean" || typeof result.feedback !== "string") {
    throw new Error("Unexpected evaluation format");
  }
  return result;
}
