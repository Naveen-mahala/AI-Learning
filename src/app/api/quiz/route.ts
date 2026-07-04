import { NextRequest, NextResponse } from "next/server";
import { buildQuizSystemPrompt, getQuizConfig } from "@/lib/quizPrompts";
import type { QuizMode, QuizDuration, SmartQuizData } from "@/lib/store";

export const dynamic = "force-dynamic";

// ─── Validation ───────────────────────────────────────────────────────────────

function validateQuizResponse(data: unknown, mode: QuizMode, duration: QuizDuration): SmartQuizData {
  if (!data || typeof data !== "object") throw new Error("Response is not a valid JSON object");

  const d = data as Record<string, unknown>;
  const required = ["quiz_title", "topic", "difficulty", "estimated_time", "mode", "questions", "performance_insights_template"];
  for (const key of required) {
    if (d[key] === undefined || d[key] === null) throw new Error(`Missing required field: ${key}`);
  }

  if (!Array.isArray(d.questions) || d.questions.length === 0) throw new Error("questions must be a non-empty array");

  const config = getQuizConfig(mode, duration);
  const delta = Math.abs((d.questions as unknown[]).length - config.questionCount);
  if (delta > 1) throw new Error(`Expected ${config.questionCount} questions, got ${(d.questions as unknown[]).length}`);

  const validTypes = ["mcq", "true_false", "scenario", "interview", "revision"];
  for (let i = 0; i < (d.questions as unknown[]).length; i++) {
    const q = (d.questions as Record<string, unknown>[])[i];
    if (!q.question || typeof q.question !== "string") throw new Error(`Question ${i + 1}: missing 'question'`);
    if (!q.type || !validTypes.includes(q.type as string)) q.type = "mcq";
    if (!Array.isArray(q.options) || (q.options as unknown[]).length < 2) throw new Error(`Question ${i + 1}: 'options' must have at least 2 entries`);
    if (!q.correct_answer || typeof q.correct_answer !== "string") throw new Error(`Question ${i + 1}: missing 'correct_answer'`);
    if (!(q.options as string[]).includes(q.correct_answer as string)) {
      const match = (q.options as string[]).find((o) => o.toLowerCase().trim() === (q.correct_answer as string).toLowerCase().trim());
      if (match) { q.correct_answer = match; } else throw new Error(`Question ${i + 1}: correct_answer not found in options`);
    }
    if (!q.explanation || typeof q.explanation !== "string") throw new Error(`Question ${i + 1}: missing 'explanation'`);
  }

  const insights = d.performance_insights_template as Record<string, unknown>;
  if (!Array.isArray(insights?.strengths) || !Array.isArray(insights?.weak_areas) || !insights?.recommended_next_step) {
    throw new Error("performance_insights_template is invalid or incomplete");
  }

  return d as unknown as SmartQuizData;
}

// ─── Provider resolution (mirrors learn/route.ts) ────────────────────────────

type Provider = "gemini" | "groq" | "openrouter";

function resolveProvider(userKey?: string): { apiKey: string; provider: Provider } | null {
  // 1. User-supplied key via request body
  if (userKey && userKey.length > 10) {
    if (userKey.startsWith("gsk_")) return { apiKey: userKey, provider: "groq" };
    if (userKey.startsWith("sk-or-")) return { apiKey: userKey, provider: "openrouter" };
    if (userKey.startsWith("AQ.") || (!userKey.startsWith("sk-") && userKey.length > 20)) return { apiKey: userKey, provider: "gemini" };
    // sk- prefix → try openrouter with it (user has openai key, route through openrouter)
  }

  // 2. Fallback to .env.local — same priority as learn route: Groq → Gemini → OpenRouter
  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;
  const openrouter = process.env.OPENROUTER_API_KEY;

  if (groq && groq.startsWith("gsk_")) return { apiKey: groq, provider: "groq" };
  if (gemini) return { apiKey: gemini, provider: "gemini" };
  if (openrouter) return { apiKey: openrouter, provider: "openrouter" };

  return null;
}

function buildProviderRequest(provider: Provider, apiKey: string, systemPrompt: string, topic: string, mode: string, duration: string) {
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
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a personalized ${mode} quiz on "${topic}" for a ${duration} session. Return only the JSON object.` },
      ],
    }),
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, mode, duration, apiKey: userKey } = body as {
      topic: string;
      mode: QuizMode;
      duration: QuizDuration;
      apiKey?: string;
    };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (!mode || !["beginner", "intermediate", "interview", "revision"].includes(mode)) {
      return NextResponse.json({ error: "Invalid learning mode" }, { status: 400 });
    }
    if (!duration || !["5m", "10m", "20m", "30m"].includes(duration)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const resolved = resolveProvider(userKey);
    if (!resolved) {
      return NextResponse.json({ error: "No API key configured. Add a key in the quiz settings or set one in .env.local." }, { status: 401 });
    }

    const { apiKey, provider } = resolved;
    const systemPrompt = buildQuizSystemPrompt(topic.trim(), mode, duration);
    const { url, headers, body: reqBody } = buildProviderRequest(provider, apiKey, systemPrompt, topic.trim(), mode, duration);

    const response = await fetch(url, { method: "POST", headers, body: reqBody });

    if (!response.ok) {
      const errText = await response.text();
      let errJson: Record<string, unknown> = {};
      try { errJson = JSON.parse(errText); } catch { /* ignore */ }
      const msg = (errJson?.error as Record<string, unknown>)?.message as string || errJson?.error as string || `${provider.toUpperCase()} API error ${response.status}`;
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const completion = await response.json();
    const rawContent = completion?.choices?.[0]?.message?.content as string | undefined;

    if (!rawContent) {
      return NextResponse.json({ error: "Empty response from AI. Please try again." }, { status: 500 });
    }

    let parsed: unknown;
    try {
      const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned an invalid format. Please try again." }, { status: 500 });
    }

    let validated: SmartQuizData;
    try {
      validated = validateQuizResponse(parsed, mode, duration);
    } catch (err: unknown) {
      return NextResponse.json({ error: `Quiz validation failed: ${err instanceof Error ? err.message : "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({ quiz: validated });
  } catch (err: unknown) {
    console.error("[Quiz API] Unexpected error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unexpected server error." }, { status: 500 });
  }
}
