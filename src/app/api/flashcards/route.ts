import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Provider = "gemini" | "groq" | "openrouter";

// ─── Validation ───────────────────────────────────────────────────────────────
interface ValidFlashcard {
  front: string;
  back: string;
  explanation: string;
  memoryTip: string;
  difficulty: "easy" | "medium" | "hard";
}

interface ValidFlashcardResponse {
  topic: string;
  cards: ValidFlashcard[];
}

function validateFlashcardResponse(data: unknown, expectedCount: number): ValidFlashcardResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Response is not a valid JSON object");
  }

  const d = data as Record<string, unknown>;
  if (!d.topic || typeof d.topic !== "string") {
    d.topic = "Unknown Topic";
  }

  if (!Array.isArray(d.cards) || d.cards.length === 0) {
    throw new Error("cards must be a non-empty array");
  }

  const validatedCards: ValidFlashcard[] = [];
  const validDifficulties = ["easy", "medium", "hard"];

  for (let i = 0; i < d.cards.length; i++) {
    const card = d.cards[i];
    if (!card || typeof card !== "object") {
      throw new Error(`Card ${i + 1} is not a valid object`);
    }

    const c = card as Record<string, unknown>;
    
    // Fallback values if fields are missing or malformed to avoid crashing the user experience
    const front = typeof c.front === "string" ? c.front.trim() : `Concept ${i + 1}`;
    const back = typeof c.back === "string" ? c.back.trim() : "Definition / Answer not provided by AI.";
    const explanation = typeof c.explanation === "string" ? c.explanation.trim() : "No detailed explanation was provided for this card.";
    const memoryTip = typeof c.memoryTip === "string" 
      ? c.memoryTip.trim() 
      : typeof c.memory_tip === "string" 
        ? c.memory_tip.trim() 
        : "Visualize the core concept and connect it to a real-world application.";
    
    let difficulty: "easy" | "medium" | "hard" = "medium";
    if (typeof c.difficulty === "string" && validDifficulties.includes(c.difficulty.toLowerCase())) {
      difficulty = c.difficulty.toLowerCase() as "easy" | "medium" | "hard";
    }

    validatedCards.push({
      front,
      back,
      explanation,
      memoryTip,
      difficulty,
    });
  }

  // Cap cards to expected count (or allow small variance)
  return {
    topic: d.topic as string,
    cards: validatedCards.slice(0, expectedCount + 2), // Keep close to expected
  };
}

// ─── Provider Resolution ───────────────────────────────────────────────────────
function resolveProvider(userKey?: string): { apiKey: string; provider: Provider } | null {
  if (userKey && userKey.length > 10) {
    if (userKey.startsWith("gsk_")) return { apiKey: userKey, provider: "groq" };
    if (userKey.startsWith("sk-or-")) return { apiKey: userKey, provider: "openrouter" };
    if (userKey.startsWith("AQ.") || (!userKey.startsWith("sk-") && userKey.length > 20)) return { apiKey: userKey, provider: "gemini" };
  }

  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;
  const openrouter = process.env.OPENROUTER_API_KEY;

  if (groq && groq.startsWith("gsk_")) return { apiKey: groq, provider: "groq" };
  if (gemini) return { apiKey: gemini, provider: "gemini" };
  if (openrouter) return { apiKey: openrouter, provider: "openrouter" };

  return null;
}

function buildProviderRequest(
  provider: Provider,
  apiKey: string,
  systemPrompt: string,
  topic: string,
  mode: string,
  count: number
) {
  let apiUrl = "";
  let model = "";
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };

  if (provider === "groq") {
    apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    model = "llama-3.3-70b-versatile";
  } else if (provider === "gemini") {
    apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    model = "gemini-2.5-flash";
  } else {
    apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    model = "google/gemini-2.5-pro";
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "AI Learning Accelerator";
  }

  return {
    url: apiUrl,
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate exactly ${count} interactive flashcards on the topic "${topic}" in ${mode} mode. Return ONLY the JSON object conforming to the schema.`,
        },
      ],
    }),
  };
}

// ─── System Prompt Builder ─────────────────────────────────────────────────────
function buildFlashcardSystemPrompt(topic: string, mode: string, count: number): string {
  let modeInstructions = "";

  switch (mode) {
    case "beginner":
      modeInstructions = `
- Cover foundational definitions, fundamental concepts, and primary building blocks.
- Provide simple real-world examples.
- Include intuitive analogies that compare complex technical items to everyday objects or situations (e.g., comparing a database index to a book's table of contents).
- Maintain an encouraging, easy-to-understand tone.
`;
      break;
    case "intermediate":
      modeInstructions = `
- Cover core concepts, common applications, and practical implementation patterns.
- Focus on practical use cases, trade-offs, and "how it works under the hood".
- Include code snippets or mock data schemas if relevant to help understand practical applications.
`;
      break;
    case "interview":
      modeInstructions = `
- Cover typical technical interview questions, common trick questions, and edge cases.
- Emphasize common developer mistakes, pitfalls, and anti-patterns.
- Provide clear, articulate industry standard answers, highlighting best practices and vocabulary that impress recruiters.
`;
      break;
    case "revision":
      modeInstructions = `
- Focus on high-yield, must-remember facts, formulas, short definitions, and critical metrics.
- Keep descriptions extremely concise and punchy for fast mental recall.
- Memory tips should focus on mnemonics or fast associations to lock in details under exam pressure.
`;
      break;
    default:
      modeInstructions = "Cover core conceptual definitions, use cases, and tips.";
  }

  return `You are a Senior Product Designer, Learning Experience Designer, and Subject Matter Expert.
Your task is to generate a JSON bundle of exactly ${count} educational flashcards on the topic: "${topic}".

Generate cards specifically tailored for a level/mode of: "${mode.toUpperCase()}".

Guidelines for generating content:
${modeInstructions}

For each card, generate:
1. "front": The question, term, or concept to remember (e.g., "What is a SQL Outer Join?").
2. "back": The concise core answer or definition.
3. "explanation": A detailed explanation of why the answer is correct or how the concept works. 2-4 sentences.
4. "memoryTip": A mnemonic device, short analogy, memory tip, or visualization cue to help students remember this.
5. "difficulty": Estimated card difficulty ("easy", "medium", "hard").

IMPORTANT: You MUST return a valid JSON object matching the schema below. Do not output any conversational wrapper text.

JSON Schema:
{
  "topic": "${topic}",
  "cards": [
    {
      "front": "Question, concept, or term to define",
      "back": "Concise answer or definition",
      "explanation": "Detailed explanation of the concept",
      "memoryTip": "Analogy, mnemonic, or tip to aid memory recall",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;
}

// ─── POST Route Handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, mode, cardCount, apiKey: userKey } = body as {
      topic: string;
      mode: "beginner" | "intermediate" | "interview" | "revision";
      cardCount: 5 | 10 | 20;
      apiKey?: string;
    };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (!mode || !["beginner", "intermediate", "interview", "revision"].includes(mode)) {
      return NextResponse.json({ error: "Invalid learning mode" }, { status: 400 });
    }
    if (!cardCount || ![5, 10, 20].includes(cardCount)) {
      return NextResponse.json({ error: "Invalid card count" }, { status: 400 });
    }

    const resolved = resolveProvider(userKey);
    if (!resolved) {
      return NextResponse.json(
        { error: "No API key configured. Enter an API key in Settings or set one in .env.local." },
        { status: 401 }
      );
    }

    const { apiKey, provider } = resolved;
    const systemPrompt = buildFlashcardSystemPrompt(topic.trim(), mode, cardCount);
    const { url, headers, body: reqBody } = buildProviderRequest(
      provider,
      apiKey,
      systemPrompt,
      topic.trim(),
      mode,
      cardCount
    );

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: reqBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errJson: Record<string, unknown> = {};
      try {
        errJson = JSON.parse(errText);
      } catch {
        /* ignore */
      }
      const msg =
        ((errJson?.error as Record<string, unknown>)?.message as string) ||
        (errJson?.error as string) ||
        `${provider.toUpperCase()} API error ${response.status}`;
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const completion = await response.json();
    const rawContent = completion?.choices?.[0]?.message?.content as string | undefined;

    if (!rawContent) {
      return NextResponse.json({ error: "Empty response from AI. Please try again." }, { status: 500 });
    }

    let parsed: unknown;
    try {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned an invalid format. Please try again." }, { status: 500 });
    }

    let validated: ValidFlashcardResponse;
    try {
      validated = validateFlashcardResponse(parsed, cardCount);
    } catch (err: unknown) {
      return NextResponse.json(
        { error: `Flashcard validation failed: ${err instanceof Error ? err.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: validated });
  } catch (err: unknown) {
    console.error("[Flashcard API] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
