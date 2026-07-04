import { create } from "zustand";

// ─── Quiz Engine Types ────────────────────────────────────────────────────────

export type QuizType = "mcq" | "true_false" | "scenario" | "interview" | "revision";
export type QuizDifficulty = "easy" | "easy_to_medium" | "medium" | "medium_to_hard";
export type QuizMode = "beginner" | "intermediate" | "interview" | "revision";
export type QuizDuration = "5m" | "10m" | "20m" | "30m";

export interface SmartQuizQuestion {
  question: string;
  type: QuizType;
  options: string[];         // for true_false this is ["True", "False"]
  correct_answer: string;    // exact string match from options
  explanation: string;
  follow_up?: string;        // for interview questions
}

export interface PerformanceInsights {
  strengths: string[];
  weak_areas: string[];
  recommended_next_step: string;
}

export interface SmartQuizData {
  quiz_title: string;
  topic: string;
  difficulty: QuizDifficulty;
  estimated_time: string;
  mode: QuizMode;
  questions: SmartQuizQuestion[];
  performance_insights_template: PerformanceInsights; // AI-generated template, personalized at result time
}

export interface QuizAnswer {
  questionIndex: number;
  selectedOption: string;
  isCorrect: boolean;
  timeSpent?: number; // ms
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;         // percentage 0–100
  accuracy: string;      // "80%"
  answers: QuizAnswer[];
  xpEarned: number;
  badge: string;
  completedAt: string;
}

// Quiz engine Zustand slice
export interface QuizState {
  quizApiKey: string;
  quizTopic: string;
  quizMode: QuizMode;
  quizDuration: QuizDuration;
  isGeneratingQuiz: boolean;
  quizLoadingStep: number;
  quizData: SmartQuizData | null;
  quizError: string | null;
  quizResult: QuizResult | null;
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  submittedQuestions: Record<number, boolean>;
  quizPhase: "config" | "active" | "results";

  setQuizApiKey: (key: string) => void;
  setQuizTopic: (topic: string) => void;
  setQuizMode: (mode: QuizMode) => void;
  setQuizDuration: (duration: QuizDuration) => void;
  setGeneratingQuiz: (val: boolean) => void;
  setQuizLoadingStep: (step: number) => void;
  setQuizData: (data: SmartQuizData | null) => void;
  setQuizError: (error: string | null) => void;
  setQuizResult: (result: QuizResult | null) => void;
  setCurrentQuestion: (index: number) => void;
  selectQuizAnswer: (questionIndex: number, option: string) => void;
  submitQuizAnswer: (questionIndex: number, correctAnswer: string) => void;
  setQuizPhase: (phase: "config" | "active" | "results") => void;
  resetQuiz: () => void;
}

// ─── Lesson Types ─────────────────────────────────────────────────────────────

export interface UnifiedConcept {
  title: string;
  content: string;
  sub_concepts?: string[];
  tips?: string[];
}

export interface UnifiedExample {
  title: string;
  scenario: string;
  code_or_data?: string;
  explanation?: string;
}

export interface UnifiedPractice {
  question: string;
  guidance?: string;
  expected_answer?: string;
  red_flag?: string;
}

export interface UnifiedQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface UnifiedLesson {
  learning_goal: string;
  estimated_completion_time: string;
  lesson_structure: string[];
  overview: string;
  key_concepts: UnifiedConcept[];
  examples: UnifiedExample[];
  practice_questions: UnifiedPractice[];
  quiz: UnifiedQuizQuestion[];
  summary: string;
}

export type LessonData = UnifiedLesson;

interface LearningState {
  apiKey: string;
  topic: string;
  duration: "5m" | "10m" | "20m" | "30m";
  level: "beginner" | "intermediate" | "interview" | "revision";
  isGenerating: boolean;
  loadingStep: number;
  lessonData: LessonData | null;
  error: string | null;
  
  setApiKey: (key: string) => void;
  setTopic: (topic: string) => void;
  setDuration: (duration: "5m" | "10m" | "20m" | "30m") => void;
  setLevel: (level: "beginner" | "intermediate" | "interview" | "revision") => void;
  setGenerating: (val: boolean) => void;
  setLoadingStep: (step: number) => void;
  setLessonData: (data: LessonData | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  apiKey: typeof window !== "undefined" ? localStorage.getItem("ai-learning-openai-key") || "" : "",
  topic: "",
  duration: "10m",
  level: "intermediate",
  isGenerating: false,
  loadingStep: 0,
  lessonData: null,
  error: null,

  setApiKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-learning-openai-key", key);
    }
    set({ apiKey: key });
  },
  setTopic: (topic) => set({ topic }),
  setDuration: (duration) => set({ duration }),
  setLevel: (level) => set({ level }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setLoadingStep: (loadingStep) => set({ loadingStep }),
  setLessonData: (lessonData) => set({ lessonData }),
  setError: (error) => set({ error }),
  reset: () => set({ lessonData: null, error: null, loadingStep: 0, isGenerating: false })
}));

// ─── Quiz Engine Store ────────────────────────────────────────────────────────

const quizInitialState = {
  quizTopic: "",
  quizMode: "intermediate" as QuizMode,
  quizDuration: "10m" as QuizDuration,
  isGeneratingQuiz: false,
  quizLoadingStep: 0,
  quizData: null,
  quizError: null,
  quizResult: null,
  currentQuestionIndex: 0,
  userAnswers: {},
  submittedQuestions: {},
  quizPhase: "config" as const,
};

export const useQuizStore = create<QuizState>((set, get) => ({
  quizApiKey: typeof window !== "undefined" ? localStorage.getItem("ai-learning-openai-key") || "" : "",
  ...quizInitialState,

  setQuizApiKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-learning-openai-key", key);
    }
    set({ quizApiKey: key });
  },
  setQuizTopic: (quizTopic) => set({ quizTopic }),
  setQuizMode: (quizMode) => set({ quizMode }),
  setQuizDuration: (quizDuration) => set({ quizDuration }),
  setGeneratingQuiz: (isGeneratingQuiz) => set({ isGeneratingQuiz }),
  setQuizLoadingStep: (quizLoadingStep) => set({ quizLoadingStep }),
  setQuizData: (quizData) => set({ quizData }),
  setQuizError: (quizError) => set({ quizError }),
  setQuizResult: (quizResult) => set({ quizResult }),
  setCurrentQuestion: (currentQuestionIndex) => set({ currentQuestionIndex }),
  selectQuizAnswer: (questionIndex, option) =>
    set((state) => ({
      userAnswers: { ...state.userAnswers, [questionIndex]: option },
    })),
  submitQuizAnswer: (questionIndex, correctAnswer) => {
    const { userAnswers } = get();
    const selected = userAnswers[questionIndex];
    if (!selected) return;
    set((state) => ({
      submittedQuestions: { ...state.submittedQuestions, [questionIndex]: true },
    }));
  },
  setQuizPhase: (quizPhase) => set({ quizPhase }),
  resetQuiz: () =>
    set({
      ...quizInitialState,
      // preserve the api key and topic/mode from last session for convenience
      quizTopic: get().quizTopic,
      quizMode: get().quizMode,
      quizDuration: get().quizDuration,
      quizApiKey: get().quizApiKey,
    }),
}));
