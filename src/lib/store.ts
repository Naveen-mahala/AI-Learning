import { create } from "zustand";

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
