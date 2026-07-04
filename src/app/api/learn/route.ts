import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSystemPrompt(level: string, topic: string, duration: string): string {
  interface ComboDetails {
    goal: string;
    cognitiveLoad: string;
    structure: string[];
    structureDescription: string;
    conceptsRules: string;
    examplesRules: string;
    practiceRules: string;
    quizRules: string;
    summaryRules: string;
  }

  const matrix: Record<string, Record<string, ComboDetails>> = {
    beginner: {
      "5m": {
        goal: `Gain a basic awareness and high-level intuitive mental model of what ${topic} is.`,
        cognitiveLoad: "Very Low",
        structure: ["What is it?", "Why it matters", "Simple Analogy", "One Visual Explanation", "Three Key Takeaways", "One Quiz Question"],
        structureDescription: "Keep it extremely simple. Explain what it is and why it matters in middle school terms. Focus on an intuitive analogy and a visual mental model.",
        conceptsRules: "Generate exactly 2 key concepts. Content should be ultra-short (1-2 sentences maximum per concept). Keep it entirely non-technical.",
        examplesRules: "Generate exactly 1 simple example. Use a vivid real-life analogy.",
        practiceRules: "Generate an empty array []. Beginners in a 5-minute session do not have cognitive room for exercises.",
        quizRules: "Generate exactly 1 very simple multiple-choice question testing the core intuition.",
        summaryRules: "Provide a quick 1-sentence wrap-up."
      },
      "10m": {
        goal: `Develop a structured conceptual understanding of how ${topic} works from first principles.`,
        cognitiveLoad: "Medium",
        structure: ["Overview", "Why it Matters", "Visual Analogy", "Step-by-Step Walkthrough", "Common Beginner Mistakes", "Comprehension Checkpoint"],
        structureDescription: "Build solid comprehension. Provide clear conceptual overviews, a step-by-step example showing the mechanics, and highlight beginner pitfalls.",
        conceptsRules: "Generate exactly 3 key concepts. Content should be brief and clear (2-3 sentences per concept).",
        examplesRules: "Generate exactly 1 step-by-step example explaining the workflow in plain English.",
        practiceRules: "Generate exactly 1 practice question with gentle guidance to check their mental model.",
        quizRules: "Generate exactly 2 multiple-choice questions testing core concepts.",
        summaryRules: "Provide a friendly 2-sentence key summary."
      },
      "20m": {
        goal: `Understand the basics of ${topic} and solve simple introductory problems.`,
        cognitiveLoad: "Moderate to High",
        structure: ["Foundational Concept", "Analogy Breakdowns", "Worked Examples", "Guided Practice Scenarios", "Knowledge Checkpoints", "Recap Summary"],
        structureDescription: "Provide deep visual explanations, multiple simple worked examples, and actionable practice items to check their knowledge.",
        conceptsRules: "Generate exactly 4 key concepts. Content should be detailed (4-5 sentences per concept) with step-by-step logic.",
        examplesRules: "Generate exactly 2 examples showing the topic in different basic scenarios.",
        practiceRules: "Generate exactly 2 practice questions with expected answers to allow hands-on checking.",
        quizRules: "Generate exactly 3 multiple-choice questions testing concepts and examples.",
        summaryRules: "Provide a comprehensive beginner summary."
      },
      "30m": {
        goal: `Build a strong, first-principles foundation in ${topic} to explain and apply it confidently.`,
        cognitiveLoad: "High",
        structure: ["Comprehensive Big Picture", "Multi-Analogy Mechanics", "Granular Concept Sheets", "Hands-on Practice Exercises", "Student Misconceptions", "Mastery Assessment"],
        structureDescription: "An exhaustive foundation starting from zero. Walk through multiple analogies, detailed sub-concepts, step-by-step practice exercises, and an assessment.",
        conceptsRules: "Generate exactly 5 detailed concepts. Each concept must contain sub_concepts (2-3 points) outlining sub-steps.",
        examplesRules: "Generate exactly 3 detailed examples, illustrating different facets of the topic.",
        practiceRules: "Generate exactly 3 practice questions with detailed guidance and expected answers.",
        quizRules: "Generate exactly 4 multiple-choice questions testing both theory and application.",
        summaryRules: "Provide a complete beginner revision package with memory tips."
      }
    },
    intermediate: {
      "5m": {
        goal: `Understand the practical essence, mechanics, and core purpose of ${topic}.`,
        cognitiveLoad: "Low",
        structure: ["Concept Overview", "Core Mechanics", "Practical Use Case", "Key Concepts Recap", "Challenge Question"],
        structureDescription: "Skip introductory fluff. Provide a direct professional overview, under-the-hood mechanics, and a quick practical scenario.",
        conceptsRules: "Generate exactly 2 concepts. Content should be brief, technical, and direct (1-2 sentences).",
        examplesRules: "Generate exactly 1 practical example showing real use case scenarios. (Provide code snippet or query if relevant).",
        practiceRules: "Generate exactly 1 short practice scenario testing decision making.",
        quizRules: "Generate exactly 1 challenge multiple-choice question testing technical understanding.",
        summaryRules: "Provide a 1-sentence mechanical takeaway."
      },
      "10m": {
        goal: `Acquire a solid operational understanding of ${topic}'s workflow and trade-offs.`,
        cognitiveLoad: "Medium",
        structure: ["Architectural Overview", "Core Mechanics", "Workflow & Dataflow", "Practical Use Cases", "Technical Trade-offs", "Quick Exercise"],
        structureDescription: "Provide operational details, step-by-step workflow of the algorithm/process, code example, and core trade-offs.",
        conceptsRules: "Generate exactly 3 core concepts. Content should be clear and operational (2-3 sentences).",
        examplesRules: "Generate exactly 2 practical examples showing code or system integration.",
        practiceRules: "Generate exactly 1 practice scenario with expected answers focusing on developer choices.",
        quizRules: "Generate exactly 2 quiz questions testing workflow and trade-offs.",
        summaryRules: "Provide a 2-sentence developer cheat summary."
      },
      "20m": {
        goal: `Implement, configure, and use ${topic} in modern software/data systems.`,
        cognitiveLoad: "Moderate to High",
        structure: ["Theoretical Mechanics", "Reference Implementation Code", "Edge Cases & Configuration", "Production Use Cases", "Common Developer Pitfalls", "Assessment Problem"],
        structureDescription: "Provide solid theory, functional code examples, config setups, edge cases, developer mistakes, and interactive exercises.",
        conceptsRules: "Generate exactly 4 concepts. Content must be detailed (4-5 sentences) and outline concrete system parameters or edge conditions.",
        examplesRules: "Generate exactly 2 examples, including complete executable code blocks or script simulations.",
        practiceRules: "Generate exactly 2 practice exercises with coding guides or database schemas.",
        quizRules: "Generate exactly 3 quiz questions testing configurations and debugging.",
        summaryRules: "Provide a comprehensive intermediate engineering summary."
      },
      "30m": {
        goal: `Master the implementation, trade-offs, optimization, and system design patterns for ${topic}.`,
        cognitiveLoad: "High",
        structure: ["Detailed Architecture", "Production Reference Code", "System-Scale Trade-offs", "Real-World Case Studies", "Interactive Debugging Scenarios", "Final Competency Assessment"],
        structureDescription: "An exhaustive engineering deep-dive. Covers advanced architecture, system scalability, case studies, debugging, and comprehensive assessment.",
        conceptsRules: "Generate exactly 5 detailed concepts. Include sub_concepts for system components and tips for performance optimization.",
        examplesRules: "Generate exactly 3 detailed examples, including performance benchmarks and clean code blocks.",
        practiceRules: "Generate exactly 3 practice problems focusing on design and refactoring.",
        quizRules: "Generate exactly 4 quiz questions testing advanced edge cases and architecture.",
        summaryRules: "Provide a complete reference cheat sheet with optimization notes."
      }
    },
    interview: {
      "5m": {
        goal: `Quickly grasp the official industry definition and model interview pitch for ${topic}.`,
        cognitiveLoad: "Low",
        structure: ["Formal Definition", "Target Interview Pitch", "Evaluation Signal Tips", "Top Interview Question", "Trap Alert"],
        structureDescription: "Focus on passing the initial phone screen. Deliver a highly polished definition, pitch, and red flag warnings.",
        conceptsRules: "Generate exactly 2 concepts. Content should be highly direct (1-2 sentences) and designed to be recited.",
        examplesRules: "Generate exactly 1 example showing how to state this concept under interview constraints.",
        practiceRules: "Generate exactly 1 mock follow-up question.",
        quizRules: "Generate exactly 1 multiple-choice question testing their awareness of red flags.",
        summaryRules: "Provide 2 quick high-scoring tips."
      },
      "10m": {
        goal: `Formulate rigorous, high-signal explanations and pass core technical loops on ${topic}.`,
        cognitiveLoad: "Medium",
        structure: ["Precise Definition", "Deep Technical Explanation", "Top Questions & Model Answers", "Interviewer Evaluation Rubric", "Industry Scaling Cases"],
        structureDescription: "Prepare for core technical interviews. Outline expectations, common questions, model answers, traps, and real company use cases.",
        conceptsRules: "Generate exactly 3 concepts. Content should cover core terminology (2-3 sentences).",
        examplesRules: "Generate exactly 2 examples showing model communication style during mock questions.",
        practiceRules: "Generate exactly 1 practice question with a common trap explanation.",
        quizRules: "Generate exactly 2 quiz questions testing model vs trap answers.",
        summaryRules: "Provide a summary of core interviewer signals."
      },
      "20m": {
        goal: `Deconstruct complex interview patterns, trade-offs, and follow-ups on ${topic}.`,
        cognitiveLoad: "Moderate to High",
        structure: ["Deep Fundamentals", "Advanced Interview Questions", "Performance & Scaling Limits", "Interviewer Follow-ups", "Mock Interview Assessment", "Revision Sheet"],
        structureDescription: "Focus on detailed mock interviews. Prepare for advanced coding/system design questions, scale limits, and follow-up prompts.",
        conceptsRules: "Generate exactly 4 concepts. Content must be detailed (4-5 sentences) and focus on space/time complexity or trade-offs.",
        examplesRules: "Generate exactly 2 advanced examples with full solution strategies.",
        practiceRules: "Generate exactly 2 mock round scenarios with expected answers and evaluator guidance.",
        quizRules: "Generate exactly 3 quiz questions testing system limitations.",
        summaryRules: "Provide an interview-focused cheat sheet."
      },
      "30m": {
        goal: `Master ${topic} from both technical execution and high-level system architecture perspectives under mock evaluation.`,
        cognitiveLoad: "High",
        structure: ["System Design Architecture", "Company Scale Scenarios", "Multi-Level Mock Interview", "Interviewer Evaluation Matrix", "High-Scoring Key Cheat Sheet", "Diagnostic Assessment"],
        structureDescription: "An exhaustive preparation matrix. Covers L6+ level system design, architectural trade-offs at top tech companies, mock loops, evaluation grids, and assessments.",
        conceptsRules: "Generate exactly 5 concepts. Detail candidate levels (L4 vs L6 answer tips) and specific evaluation criteria in tips.",
        examplesRules: "Generate exactly 3 detailed mock scenario walkthroughs with dialogue.",
        practiceRules: "Generate exactly 3 practice questions detailing follow-up steps and evaluator rubrics.",
        quizRules: "Generate exactly 4 quiz questions testing architectural failure modes.",
        summaryRules: "Provide a comprehensive high-scoring sheet with architectural templates."
      }
    },
    revision: {
      "5m": {
        goal: `Rapidly refresh the absolute core facts, formulas, and memory anchors for ${topic}.`,
        cognitiveLoad: "Low",
        structure: ["One Page Cheat Sheet", "High-Frequency Facts", "Prime Exam Question", "Memory Tricks & Mnemonics"],
        structureDescription: "Ultra-fast recall. Focus on raw facts, formulas, and fast exam questions. Avoid long explanations.",
        conceptsRules: "Generate exactly 2 concepts. Keep explanations under 1 sentence (highly compressed).",
        examplesRules: "Generate exactly 1 quick visual example or analogy cheat.",
        practiceRules: "Generate exactly 1 quick recall practice question.",
        quizRules: "Generate exactly 1 quick-fire quiz question.",
        summaryRules: "Provide 1 fast mnemonic trick."
      },
      "10m": {
        goal: `Review core formulas, invariants, and high-frequency examination questions for ${topic}.`,
        cognitiveLoad: "Medium",
        structure: ["Key Review Overview", "Essential Formula Sheet", "Top Revision Concepts", "Hot Exam Questions", "MCQ Diagnostics"],
        structureDescription: "Provide high-energy review sheets. Focus on equations, definitions, quick-fire questions, and common examiner traps.",
        conceptsRules: "Generate exactly 3 revision concepts. Content should be highly condensed (1-2 sentences).",
        examplesRules: "Generate exactly 2 quick examples highlighting formula operations.",
        practiceRules: "Generate exactly 1 practice question testing quick execution.",
        quizRules: "Generate exactly 2 quiz questions mapping to common exam styles.",
        summaryRules: "Provide 2 quick revision tips."
      },
      "20m": {
        goal: `Audit exam readiness, cover major examiner traps, and solve diagnostic tests for ${topic}.`,
        cognitiveLoad: "Moderate to High",
        structure: ["Full Topic Revision Package", "Mathematical & Structural Invariants", "High-Frequency Exam Concepts", "Examiner Trap Alerts", "Diagnostic Self-Assessment Quiz"],
        structureDescription: "Provide a comprehensive revision guide. Focus on math, logic models, exam strategy, mistakes, and practice tests.",
        conceptsRules: "Generate exactly 4 concepts. Detail mathematical or architectural equations and how to read them.",
        examplesRules: "Generate exactly 3 short walkthrough cases of standard exam problems.",
        practiceRules: "Generate exactly 2 practice questions with expected answers and strategy notes.",
        quizRules: "Generate exactly 3 quiz questions testing edge-case formulas.",
        summaryRules: "Provide a full formula cheat summary."
      },
      "30m": {
        goal: `Complete revision boot camp with intensive question banks, formula boards, and mock exam grids for ${topic}.`,
        cognitiveLoad: "High",
        structure: ["Complete Review Package", "Mathematical/Logical Formulations", "Exhaustive Concept Sheets", "Memory Tricks", "Practice Exam Question Grid", "Final Mock Exam Test"],
        structureDescription: "An intensive exam prep boot camp. Covers complete concept hierarchies, exhaustive formula tables, revision grids, and practice tests.",
        conceptsRules: "Generate exactly 5 revision concepts. Explain terms, variables, parameters, and boundary conditions in detail.",
        examplesRules: "Generate exactly 4 examples representing the most common exam questions.",
        practiceRules: "Generate exactly 3 practice questions with structured guidance and examiner rubrics.",
        quizRules: "Generate exactly 4 quiz questions testing advanced rules and exceptions.",
        summaryRules: "Provide an exhaustive study summary cheat sheet."
      }
    }
  };

  const config = matrix[level]?.[duration] || matrix["intermediate"]["10m"];

  if (level === "beginner") {
    return `You are a Senior Learning Scientist, Educational Psychologist, Prompt Engineer, and AI Product Designer.
Your task is to teach the topic: "${topic}" using a combination of the selected Learning Mode: "beginner" and Available Duration: "${duration}".

Pedagogical Matrix Objective:
- Duration: ${duration} (Learning Objective: ${config.goal})
- Target Cognitive Load: ${config.cognitiveLoad}
- Mode: beginner
- Teaching Strategy & Structure: ${config.structureDescription}

You must respond with a JSON object matching this structure EXACTLY. Do not add comments or extra properties:
{
  "learning_goal": "${config.goal}",
  "estimated_completion_time": "${duration}",
  "lesson_structure": ${JSON.stringify(config.structure)},
  "overview": "A clear, beautifully written introductory module text tailored to beginner level. Length: ${duration === "5m" ? "1-2 sentences" : duration === "10m" ? "2-3 sentences" : "4-5 sentences"}.",
  "why_matters": "A compelling explanation of why understanding this topic matters in everyday life.",
  "simple_explanation": "An extremely clear, plain-English explanation of the topic, breaking down any jargon.",
  "real_life_analogy": "A rich, vivid real-world analogy to help the student build an intuitive mental model.",
  "example": "A concrete, simple walkthrough example of how the topic applies in real life.",
  "key_takeaways": [
    "A concise, memorable takeaway rule, fact, or principle.",
    "Another key takeaway.",
    "A third key takeaway."
  ],
  "mini_quiz": [
    {
      "question": "A multiple-choice question testing the core intuition.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The EXACT string match of the correct option from the options array.",
      "explanation": "A clear explanation of why this option is correct."
    }
  ],
  "key_concepts": [
    {
      "title": "Concept Title",
      "content": "A short, beginner-friendly conceptual explanation."
    }
  ]
}

Rules for this specific combination:
- lesson_structure MUST match the array: ${JSON.stringify(config.structure)}
- key_takeaways array: must contain exactly 3 clear takeaway statements.
- mini_quiz array: ${config.quizRules}
- key_concepts array: must contain brief concept summaries matching the takeaways to populate the student notes companion.
- Ensure that the details and depth of explanations strictly match the duration:
  - 5m: Ultra-short, high-level, awareness-only.
  - 10m: Solid conceptual explanations.
  - 20m: High detail with code setups and exercises.
  - 30m: Rigorous, exhaustive, case-study scale.
- The output must be raw JSON conforming to this schema. Do not wrap in markdown code blocks.`;
  }

  return `You are a Senior Learning Scientist, Educational Psychologist, Prompt Engineer, and AI Product Designer.
Your task is to teach the topic: "${topic}" using a combination of the selected Learning Mode: "${level}" and Available Duration: "${duration}".

Pedagogical Matrix Objective:
- Duration: ${duration} (Learning Objective: ${config.goal})
- Target Cognitive Load: ${config.cognitiveLoad}
- Mode: ${level}
- Teaching Strategy & Structure: ${config.structureDescription}

You must respond with a JSON object matching this structure EXACTLY. Do not add comments or extra properties:
{
  "learning_goal": "${config.goal}",
  "estimated_completion_time": "${duration}",
  "lesson_structure": ${JSON.stringify(config.structure)},
  "overview": "A clear, beautifully written introductory module text tailored to the mode (level: ${level}, objective: ${config.goal}). Length: ${duration === "5m" ? "1-2 sentences" : duration === "10m" ? "2-3 sentences" : "4-5 sentences"}.",
  "key_concepts": [
    {
      "title": "Concept Title",
      "content": "Explanation text tailored to the requested detail level. Format with clear Markdown lists if appropriate.",
      "sub_concepts": ["Optional sub-step or sub-point 1", "Optional sub-step or sub-point 2"],
      "tips": ["Optional practical tip, trap warning, or exam trick."]
    }
  ],
  "examples": [
    {
      "title": "Example Title",
      "scenario": "A descriptive scenario, walkthrough, or analogy illustrating the concept.",
      "code_or_data": "Optional code block, query, math derivation, or simulator script.",
      "explanation": "Optional explanation of the example mechanics."
    }
  ],
  "practice_questions": [
    {
      "question": "A practice question, exercise, system design challenge, or mock question.",
      "guidance": "Optional hints or steps to help the user solve it.",
      "expected_answer": "Optional ideal solution or expected answer.",
      "red_flag": "Optional common mistake, red flag, or trap to avoid."
    }
  ],
  "quiz": [
    {
      "question": "A multiple-choice question testing the lesson content.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The EXACT string match of the correct option from the options array.",
      "explanation": "A clear, helpful explanation of why this option is correct."
    }
  ],
  "summary": "A wrapping summary module. Detail level: ${duration === "5m" ? "1-2 sentences" : "3-4 sentences"}. Use bullet points or mnemonics where appropriate."
}

Rules for this specific combination:
- lesson_structure MUST match the array: ${JSON.stringify(config.structure)}
- key_concepts array: ${config.conceptsRules}
- examples array: ${config.examplesRules}
- practice_questions array: ${config.practiceRules}
- quiz array: ${config.quizRules}
- summary: ${config.summaryRules}
- Ensure that the details and depth of explanations strictly match the duration:
  - 5m: Ultra-short, high-level, awareness-only.
  - 10m: Solid conceptual explanations.
  - 20m: High detail with code setups and exercises.
  - 30m: Rigorous, exhaustive, case-study scale.
- The output must be raw JSON conforming to this schema. Do not wrap in markdown code blocks.`;
}

function validateResponse(data: any, level: string) {
  if (!data || typeof data !== "object") {
    throw new Error("Response is not a valid JSON object");
  }

  if (level === "beginner") {
    const requiredKeys = [
      "learning_goal",
      "estimated_completion_time",
      "lesson_structure",
      "overview",
      "why_matters",
      "simple_explanation",
      "real_life_analogy",
      "example",
      "key_takeaways",
      "mini_quiz",
      "key_concepts"
    ];

    for (const key of requiredKeys) {
      if (data[key] === undefined) {
        throw new Error(`Missing required key for beginner: ${key}`);
      }
    }

    if (!Array.isArray(data.lesson_structure) || data.lesson_structure.length === 0) {
      throw new Error("lesson_structure must be a non-empty array of strings");
    }

    if (!Array.isArray(data.key_takeaways) || data.key_takeaways.length === 0) {
      throw new Error("key_takeaways must be a non-empty array");
    }

    if (!Array.isArray(data.mini_quiz) || data.mini_quiz.length === 0) {
      throw new Error("mini_quiz must be a non-empty array");
    }
    for (const q of data.mini_quiz) {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || !q.answer || !q.explanation) {
        throw new Error("Invalid question in mini_quiz. Must have 'question', non-empty 'options', 'answer', and 'explanation'");
      }
    }

    if (!Array.isArray(data.key_concepts)) {
      throw new Error("key_concepts must be an array");
    }
  } else {
    const requiredKeys = [
      "learning_goal",
      "estimated_completion_time",
      "lesson_structure",
      "overview",
      "key_concepts",
      "examples",
      "practice_questions",
      "quiz",
      "summary"
    ];

    for (const key of requiredKeys) {
      if (data[key] === undefined) {
        throw new Error(`Missing required key: ${key}`);
      }
    }

    if (!Array.isArray(data.lesson_structure) || data.lesson_structure.length === 0) {
      throw new Error("lesson_structure must be a non-empty array of strings");
    }

    if (!Array.isArray(data.key_concepts) || data.key_concepts.length === 0) {
      throw new Error("key_concepts must be a non-empty array");
    }
    for (const concept of data.key_concepts) {
      if (!concept.title || !concept.content) {
        throw new Error("Invalid concept in key_concepts. Each concept must have 'title' and 'content'");
      }
    }

    if (!Array.isArray(data.examples)) {
      throw new Error("examples must be an array");
    }
    for (const ex of data.examples) {
      if (!ex.title || !ex.scenario) {
        throw new Error("Invalid example in examples. Each example must have 'title' and 'scenario'");
      }
    }

    if (!Array.isArray(data.practice_questions)) {
      throw new Error("practice_questions must be an array");
    }

    if (!Array.isArray(data.quiz)) {
      throw new Error("quiz must be an array");
    }
    for (const q of data.quiz) {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || !q.answer || !q.explanation) {
        throw new Error("Invalid question in quiz. Must have 'question', non-empty 'options', 'answer', and 'explanation'");
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, duration, level } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!["beginner", "intermediate", "interview", "revision"].includes(level)) {
      return NextResponse.json({ error: "Invalid learning level/mode" }, { status: 400 });
    }

    // Get API Key from header or fallback to environment variables
    const authHeader = req.headers.get("Authorization");
    let apiKey = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    }

    let provider: "gemini" | "groq" | "openrouter" = "gemini";

    // Detect provider based on key format
    if (apiKey) {
      if (apiKey.startsWith("gsk_")) {
        provider = "groq";
      } else if (apiKey.startsWith("sk-or-")) {
        provider = "openrouter";
      } else if (apiKey.startsWith("AQ.") || apiKey.length === 39) {
        provider = "gemini";
      }
    } else {
      // Fallback in order of preferences: Groq -> Gemini -> OpenRouter
      if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith("sk-")) {
        apiKey = process.env.GROQ_API_KEY;
        provider = "groq";
      } else if (process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
        provider = "gemini";
      } else if (process.env.OPENROUTER_API_KEY) {
        apiKey = process.env.OPENROUTER_API_KEY;
        provider = "openrouter";
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API Key configured. Please configure a Groq, Gemini, or OpenRouter API key in your settings or env." },
        { status: 400 }
      );
    }

    const systemPrompt = getSystemPrompt(level, topic, duration);

    let apiUrl = "";
    let apiModel = "";

    if (provider === "groq") {
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      apiModel = "llama-3.3-70b-versatile";
    } else if (provider === "gemini") {
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      apiModel = "gemini-2.5-flash";
    } else if (provider === "openrouter") {
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      apiModel = "google/gemini-2.5-pro";
    }

    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (provider === "openrouter") {
      fetchHeaders["HTTP-Referer"] = "http://localhost:3000";
      fetchHeaders["X-Title"] = "AI Learning Accelerator";
    }

    const openAiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Explain "${topic}" in detail as requested by the parameters.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Ignore parsing error
      }
      
      const message = errorJson?.error?.message || errorJson?.error || `API returned status ${openAiResponse.status}`;
      return NextResponse.json({ error: `${provider.toUpperCase()} API Error: ${message}` }, { status: openAiResponse.status });
    }

    const data = await openAiResponse.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      return NextResponse.json({ error: "Empty response from AI service" }, { status: 500 });
    }

    let cleanedText = generatedText.trim();
    
    // Strip markdown code fences if present
    if (cleanedText.startsWith("```")) {
      const match = cleanedText.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
      if (match) {
        cleanedText = match[1].trim();
      }
    }

    try {
      const parsedData = JSON.parse(cleanedText);
      
      // Perform strict output validation
      validateResponse(parsedData, level);

      return NextResponse.json(parsedData);
    } catch (parseError: any) {
      console.error("Validation or JSON parsing failed:", cleanedText, parseError);
      return NextResponse.json(
        { error: `Validation error: ${parseError.message || "Failed to parse API response as JSON"}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

