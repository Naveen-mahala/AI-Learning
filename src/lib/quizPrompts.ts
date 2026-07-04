import type { QuizMode, QuizDuration, QuizDifficulty, QuizType } from "./store";

// ─── Quiz generation configuration matrix ────────────────────────────────────

interface QuizConfig {
  questionCount: number;
  difficulty: QuizDifficulty;
  goal: string;
  questionTypes: QuizType[];
  typeInstructions: string;
  depthInstructions: string;
  avoidInstructions: string;
}

export function getQuizConfig(mode: QuizMode, duration: QuizDuration): QuizConfig {
  const matrix: Record<QuizMode, Record<QuizDuration, QuizConfig>> = {
    beginner: {
      "5m": {
        questionCount: 3,
        difficulty: "easy",
        goal: "Verify basic awareness and check the student's core intuition.",
        questionTypes: ["mcq", "true_false"],
        typeInstructions:
          "Use simple MCQs and True/False questions only. Test whether the student understands what the topic is, not how it works internally.",
        depthInstructions:
          "Questions must be definition-level. Test recognition, not recall. Use plain English with zero jargon. Each question should be answerable by someone who read a 2-sentence description.",
        avoidInstructions:
          "Avoid any scenario-based, mathematical, code-based, or multi-step reasoning questions. Do not test edge cases or nuance.",
      },
      "10m": {
        questionCount: 5,
        difficulty: "easy",
        goal: "Check conceptual understanding of how the topic works from first principles.",
        questionTypes: ["mcq", "true_false"],
        typeInstructions:
          "Use MCQs (4 options) and True/False. Focus on concept identification, simple cause-and-effect, and analogy matching.",
        depthInstructions:
          "Questions should test whether the student can explain the 'what' and 'why' of the topic. Include 1-2 questions about common beginner misconceptions. All questions must have clear, unambiguous correct answers.",
        avoidInstructions:
          "Avoid code snippets, algorithm steps, implementation details, and anything requiring prior background knowledge beyond the topic itself.",
      },
      "20m": {
        questionCount: 8,
        difficulty: "easy_to_medium",
        goal: "Test foundational understanding and ability to recognize applications.",
        questionTypes: ["mcq", "true_false", "scenario"],
        typeInstructions:
          "Use 5 MCQs, 2 True/False, and 1 simple real-world scenario question. The scenario should present a relatable everyday situation where the concept applies.",
        depthInstructions:
          "Go beyond definitions — test comprehension. Ask about relationships between concepts, identify the correct use case, and distinguish correct from common misconceptions. Scenarios must use non-technical language.",
        avoidInstructions:
          "Avoid technical implementation, code, complex math, or questions requiring multi-step deduction.",
      },
      "30m": {
        questionCount: 10,
        difficulty: "easy_to_medium",
        goal: "Evaluate strong foundational mastery — the student should be able to explain and apply the topic in simple terms.",
        questionTypes: ["mcq", "true_false", "scenario"],
        typeInstructions:
          "Use 6 MCQs, 2 True/False, and 2 simple scenario questions. Scenarios should test decision-making: 'Which approach fits this situation?'",
        depthInstructions:
          "Test conceptual depth, understanding of trade-offs, and ability to apply the topic to a new simple context. Include questions that require comparing two ideas or choosing the correct analogy.",
        avoidInstructions:
          "Avoid deep technical implementations, performance benchmarks, and advanced edge cases.",
      },
    },

    intermediate: {
      "5m": {
        questionCount: 3,
        difficulty: "easy_to_medium",
        goal: "Confirm the student understands the core mechanics and practical use of the topic.",
        questionTypes: ["mcq", "scenario"],
        typeInstructions:
          "Use 2 MCQs and 1 scenario question. The scenario must involve a realistic professional decision where the correct use of the topic matters.",
        depthInstructions:
          "Go below the surface. Test understanding of how and why the mechanism works, not just what it is. Include questions about configuration choices or trade-offs.",
        avoidInstructions: "Avoid pure memorization questions. Every question must require reasoning.",
      },
      "10m": {
        questionCount: 5,
        difficulty: "easy_to_medium",
        goal: "Check practical operational understanding of the topic's workflow and trade-offs.",
        questionTypes: ["mcq", "scenario"],
        typeInstructions:
          "Use 3 MCQs and 2 scenario-based questions. Scenarios should involve developer decision points: choosing between options, debugging a behavior, or explaining output.",
        depthInstructions:
          "Test workflow understanding, key configuration parameters, and practical consequences of decisions. Ask 'what would happen if...' style questions to test mental models.",
        avoidInstructions:
          "Avoid trivial 'what does X stand for' questions. Avoid questions with debatable answers.",
      },
      "20m": {
        questionCount: 8,
        difficulty: "medium",
        goal: "Verify ability to implement, configure, and reason about the topic in a system context.",
        questionTypes: ["mcq", "scenario", "true_false"],
        typeInstructions:
          "Use 4 MCQs, 3 scenario questions, and 1 True/False on a common misconception. Scenarios may reference short code snippets or system descriptions.",
        depthInstructions:
          "Test implementation knowledge, error identification, edge case handling, and the ability to reason about system behavior. Scenarios should reflect real-world engineering situations.",
        avoidInstructions:
          "Avoid questions with multiple correct answers unless clearly structured as 'select the BEST option'. Avoid abstract theory-only questions.",
      },
      "30m": {
        questionCount: 10,
        difficulty: "medium",
        goal: "Evaluate implementation mastery, trade-off analysis, and system design application of the topic.",
        questionTypes: ["mcq", "scenario", "true_false"],
        typeInstructions:
          "Use 5 MCQs, 4 scenario questions, and 1 True/False. At least 2 scenarios should involve debugging or identifying the root cause of a described system failure.",
        depthInstructions:
          "Test deep understanding of performance trade-offs, edge cases, configuration decisions under constraints, and the ability to select the right approach for a given system requirement.",
        avoidInstructions: "Avoid overly academic or textbook-style questions that don't reflect engineering practice.",
      },
    },

    interview: {
      "5m": {
        questionCount: 3,
        difficulty: "medium",
        goal: "Warm up for interview-style questions on the topic.",
        questionTypes: ["interview"],
        typeInstructions:
          "Generate 3 classic first-round interview questions about this topic. Each must be a multiple-choice version of a commonly asked verbal interview question, with one clearly best answer and 3 plausible distractors.",
        depthInstructions:
          "Questions should match what a junior-to-mid level interviewer would ask in the first 10 minutes. Focus on 'how does X work', 'what is the difference between X and Y', and 'when would you use X'.",
        avoidInstructions: "Avoid trick questions or highly specialized niche questions for a 5-minute warm-up.",
      },
      "10m": {
        questionCount: 5,
        difficulty: "medium",
        goal: "Prepare for a standard technical interview covering core concepts and practical scenarios.",
        questionTypes: ["interview", "scenario"],
        typeInstructions:
          "Use 3 classic interview MCQs and 2 scenario-based interview questions. Scenarios must describe a real-world situation where the interviewer is probing the candidate's reasoning and decision-making.",
        depthInstructions:
          "Include at least 1 trick question that tests a common misconception or a subtle technical nuance. Each question's explanation should include what a strong interview answer looks like.",
        avoidInstructions: "Avoid overly simple definitional questions that wouldn't appear in a real tech interview.",
      },
      "20m": {
        questionCount: 8,
        difficulty: "medium_to_hard",
        goal: "Simulate a full technical interview covering concepts, scenarios, and follow-up depth questions.",
        questionTypes: ["interview", "scenario"],
        typeInstructions:
          "Use 4 interview MCQs, 3 scenario questions, and 1 follow-up question (a question that builds on a previous answer). For the follow-up, reference the previous question in the question text.",
        depthInstructions:
          "Go deep. Test the ability to articulate trade-offs, explain internals, handle edge cases, and defend design decisions. Each scenario should have a non-obvious correct answer that requires nuanced reasoning.",
        avoidInstructions: "Avoid surface-level definitional questions entirely. Every question must require synthesis.",
      },
      "30m": {
        questionCount: 10,
        difficulty: "medium_to_hard",
        goal: "Full interview simulation — covers everything from basics through senior-level system design reasoning.",
        questionTypes: ["interview", "scenario"],
        typeInstructions:
          "Use 4 interview MCQs, 4 scenario questions, 1 trick question, and 1 follow-up deep-dive question. The trick question should test a common wrong mental model. The deep-dive should test architectural reasoning.",
        depthInstructions:
          "Cover the full interview spectrum: conceptual clarity, practical application, debugging scenarios, trade-off articulation, and system-scale thinking. Explanations should be detailed enough to serve as study notes.",
        avoidInstructions:
          "Do not include questions whose correct answer depends on a specific programming language unless the topic itself is language-specific.",
      },
    },

    revision: {
      "5m": {
        questionCount: 3,
        difficulty: "easy",
        goal: "Fast recall of the highest-yield facts — the 3 things you must know cold.",
        questionTypes: ["revision", "true_false"],
        typeInstructions:
          "Use 2 rapid-fire MCQs and 1 True/False. Every question must test a fact that appears on 90%+ of exams or interviews covering this topic.",
        depthInstructions:
          "Prioritize recall speed over depth. Questions should be answerable in under 15 seconds by someone who knows the topic. Focus on definitions, key numbers, names, and core rules.",
        avoidInstructions: "Avoid any question that requires multi-step reasoning or extended thought.",
      },
      "10m": {
        questionCount: 5,
        difficulty: "easy",
        goal: "Rapid consolidation of the most important concepts before an exam or interview.",
        questionTypes: ["revision", "true_false", "mcq"],
        typeInstructions:
          "Use 3 high-yield MCQs, 1 True/False on a classic myth or misconception, and 1 'complete the rule' style question where the answer completes a key principle.",
        depthInstructions:
          "Select only the questions that appear in every study guide for this topic. Focus on exam-day essentials: key formulas, landmark results, core definitions, and critical distinctions.",
        avoidInstructions: "Avoid anything that would be considered an advanced or niche sub-topic.",
      },
      "20m": {
        questionCount: 8,
        difficulty: "easy_to_medium",
        goal: "Comprehensive pre-exam revision — hits every high-yield subtopic.",
        questionTypes: ["revision", "mcq", "true_false"],
        typeInstructions:
          "Use 5 high-yield MCQs, 2 True/False on common misconceptions, and 1 scenario where the student must apply a core rule to a new situation.",
        depthInstructions:
          "Cover all the major subtopics in a structured way: one question per key concept. Include questions that contrast similar concepts (e.g., 'which of the following is NOT...') to test precision of understanding.",
        avoidInstructions: "Avoid long question stems. Keep questions crisp and targeted.",
      },
      "30m": {
        questionCount: 10,
        difficulty: "medium",
        goal: "Complete mastery review — designed to catch any remaining knowledge gaps before exam or interview.",
        questionTypes: ["revision", "mcq", "true_false", "scenario"],
        typeInstructions:
          "Use 5 high-yield MCQs, 2 True/False, 2 application scenarios, and 1 'which is the exception' or 'which does NOT apply' question to test precision.",
        depthInstructions:
          "This should feel like a real practice exam. Cover breadth and depth. Test mastery of both foundational facts and the ability to apply them under new conditions. Include at least 2 questions that expose common exam traps.",
        avoidInstructions: "Avoid redundancy. Each question must cover a distinct concept or subtopic.",
      },
    },
  };

  return matrix[mode][duration];
}

// ─── Difficulty display labels ────────────────────────────────────────────────

export const difficultyLabels: Record<QuizDifficulty, string> = {
  easy: "Easy",
  easy_to_medium: "Easy – Medium",
  medium: "Medium",
  medium_to_hard: "Medium – Hard",
};

// ─── Mode display metadata ────────────────────────────────────────────────────

export const modeConfig = {
  beginner: {
    label: "Beginner",
    color: "emerald",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
    bgClass: "bg-emerald-500/10",
    glowClass: "from-emerald-500/15 to-teal-500/15",
    badgeBg: "bg-emerald-500/15",
    description: "Concept checks, definitions, and basic examples",
  },
  intermediate: {
    label: "Intermediate",
    color: "violet",
    textClass: "text-violet-400",
    borderClass: "border-violet-500/20",
    bgClass: "bg-violet-500/10",
    glowClass: "from-violet-500/15 to-indigo-500/15",
    badgeBg: "bg-violet-500/15",
    description: "Application questions, real-world scenarios, trade-offs",
  },
  interview: {
    label: "Interview Prep",
    color: "amber",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/20",
    bgClass: "bg-amber-500/10",
    glowClass: "from-amber-500/15 to-orange-500/15",
    badgeBg: "bg-amber-500/15",
    description: "Frequently asked interview questions, trick questions, scenarios",
  },
  revision: {
    label: "Quick Revision",
    color: "rose",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/20",
    bgClass: "bg-rose-500/10",
    glowClass: "from-rose-500/15 to-pink-500/15",
    badgeBg: "bg-rose-500/15",
    description: "High-yield facts, exam-style, rapid-fire recall",
  },
} as const;

export const durationConfig: Record<string, { label: string; questionHint: string }> = {
  "5m": { label: "5 min", questionHint: "3 questions" },
  "10m": { label: "10 min", questionHint: "5 questions" },
  "20m": { label: "20 min", questionHint: "8 questions" },
  "30m": { label: "30 min", questionHint: "10 questions" },
};

// ─── XP and badge calculator ──────────────────────────────────────────────────

export function calculateXP(score: number, mode: QuizMode, duration: QuizDuration): number {
  const base: Record<QuizDuration, number> = { "5m": 30, "10m": 50, "20m": 80, "30m": 120 };
  const modeMultiplier: Record<QuizMode, number> = {
    beginner: 1.0,
    intermediate: 1.3,
    interview: 1.6,
    revision: 1.2,
  };
  const accuracyBonus = score >= 90 ? 1.5 : score >= 70 ? 1.2 : score >= 50 ? 1.0 : 0.7;
  return Math.round(base[duration] * modeMultiplier[mode] * accuracyBonus);
}

export function getBadge(score: number, mode: QuizMode): string {
  if (score === 100) return "🏆 Perfect Score";
  if (score >= 90) return "⭐ Expert";
  if (score >= 75) return "🔥 Strong";
  if (score >= 60) return "📈 Progressing";
  if (score >= 40) return "📚 Keep Studying";
  return "💪 Try Again";
}

// ─── System prompt builder ────────────────────────────────────────────────────

export function buildQuizSystemPrompt(
  topic: string,
  mode: QuizMode,
  duration: QuizDuration
): string {
  const config = getQuizConfig(mode, duration);

  return `You are an expert educator, assessment designer, and AI quiz engine.

Your task is to generate a personalized quiz on the topic: "${topic}".

Quiz Parameters:
- Learning Mode: ${mode}
- Duration: ${duration}
- Question Count: ${config.questionCount}
- Difficulty: ${config.difficulty}
- Goal: ${config.goal}

Question Type Instructions:
${config.typeInstructions}

Depth & Content Instructions:
${config.depthInstructions}

Avoid:
${config.avoidInstructions}

General Rules:
1. Every question must test UNDERSTANDING or REASONING — not rote memorization alone.
2. ALL questions — regardless of type (mcq, interview, scenario, revision, true_false) — MUST have an "options" array with EXACTLY 4 entries. No exceptions. Even "interview" type questions must be formatted as multiple-choice with 4 options and one correct answer.
3. All options must be plausible. Distractors should reflect common misconceptions or related-but-wrong ideas, not obviously wrong filler.
4. The correct_answer field must be the EXACT string match of one entry in the options array.
5. Explanations must be educational — tell the student WHY the answer is correct and what the common mistake is.
6. For "true_false" type ONLY, options must be exactly ["True", "False"] (2 entries, not 4).
7. For "interview" type, format as MCQ with 4 options. The explanation should include what a strong interview answer looks like.
8. For "scenario" type, the question must describe a concrete situation before asking the question.
9. Questions must be unique from each other — no two questions should test the same concept.

Performance Insights Instructions:
Based on the quiz content you are generating, also fill in the performance_insights_template:
- strengths: 2 specific things a student who answers well likely understands
- weak_areas: 2 specific things a student who struggles likely needs to review
- recommended_next_step: 1 specific, actionable recommendation for what to study next after this quiz

Respond with a single raw JSON object. Do not wrap in markdown. Do not add comments. Use this exact schema:

{
  "quiz_title": "A descriptive title for this quiz (e.g. 'Gradient Descent — Beginner Checkpoint')",
  "topic": "${topic}",
  "difficulty": "${config.difficulty}",
  "estimated_time": "${duration}",
  "mode": "${mode}",
  "questions": [
    {
      "question": "The full question text",
      "type": "mcq | true_false | scenario | interview | revision",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "The EXACT string from options that is correct",
      "explanation": "Why this is correct and what the common mistake is",
      "follow_up": "Optional: only for interview type — what a great follow-up answer looks like"
    }
  ],
  "performance_insights_template": {
    "strengths": [
      "Specific strength 1 based on quiz content",
      "Specific strength 2 based on quiz content"
    ],
    "weak_areas": [
      "Specific weak area 1 to review",
      "Specific weak area 2 to review"
    ],
    "recommended_next_step": "One specific actionable next step"
  }
}

Generate exactly ${config.questionCount} questions. No more, no less.`;
}
