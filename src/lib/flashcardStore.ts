import { create } from "zustand";

export interface Flashcard {
  front: string;
  back: string;
  explanation: string;
  memoryTip: string;
  difficulty: "easy" | "medium" | "hard";
  userConfidence?: "easy" | "medium" | "hard";
}

export interface FlashcardStoreState {
  apiKey: string;
  topic: string;
  mode: "beginner" | "intermediate" | "interview" | "revision";
  cardCount: 5 | 10 | 20;
  isGenerating: boolean;
  loadingStep: number;
  error: string | null;
  cards: Flashcard[];
  currentCardIndex: number;
  phase: "config" | "viewing" | "results";
  
  // Gamification & Progress
  studyStreak: number;
  xpEarned: number;
  level: number;
  
  // Spaced Repetition / Memory Mode
  memoryPackIndices: number[]; // Indices of cards marked 'hard' in current round
  isMemoryModeActive: boolean;

  // Actions
  setApiKey: (key: string) => void;
  setTopic: (topic: string) => void;
  setMode: (mode: "beginner" | "intermediate" | "interview" | "revision") => void;
  setCardCount: (count: 5 | 10 | 20) => void;
  setGenerating: (val: boolean) => void;
  setLoadingStep: (step: number) => void;
  setError: (err: string | null) => void;
  setPhase: (phase: "config" | "viewing" | "results") => void;
  setCurrentCardIndex: (index: number) => void;
  rateCardConfidence: (cardIndex: number, confidence: "easy" | "medium" | "hard") => void;
  startMemoryMode: () => void;
  resetFlashcards: () => void;
}

const initialStoreState = {
  topic: "",
  mode: "intermediate" as const,
  cardCount: 5 as const,
  isGenerating: false,
  loadingStep: 0,
  error: null,
  cards: [],
  currentCardIndex: 0,
  phase: "config" as const,
  xpEarned: 0,
  memoryPackIndices: [],
  isMemoryModeActive: false,
};

export const useFlashcardStore = create<FlashcardStoreState>((set, get) => ({
  apiKey: typeof window !== "undefined" ? localStorage.getItem("ai-learning-openai-key") || "" : "",
  ...initialStoreState,
  studyStreak: typeof window !== "undefined" ? Number(localStorage.getItem("flashcard-study-streak") || "3") : 3,
  level: typeof window !== "undefined" ? Number(localStorage.getItem("flashcard-learning-level") || "4") : 4,

  setApiKey: (key) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-learning-openai-key", key);
    }
    set({ apiKey: key });
  },
  setTopic: (topic) => set({ topic }),
  setMode: (mode) => set({ mode }),
  setCardCount: (cardCount) => set({ cardCount }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setLoadingStep: (loadingStep) => set({ loadingStep }),
  setError: (error) => set({ error }),
  setPhase: (phase) => set({ phase }),
  setCurrentCardIndex: (currentCardIndex) => set({ currentCardIndex }),
  
  rateCardConfidence: (cardIndex, confidence) => {
    const { cards, memoryPackIndices, xpEarned } = get();
    
    // Create new cards array with updated rating
    const updatedCards = [...cards];
    if (updatedCards[cardIndex]) {
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        userConfidence: confidence,
      };
    }

    // Spaced repetition logic: Add or remove from hard list
    let updatedMemoryPack = [...memoryPackIndices];
    if (confidence === "hard") {
      if (!updatedMemoryPack.includes(cardIndex)) {
        updatedMemoryPack.push(cardIndex);
      }
    } else {
      updatedMemoryPack = updatedMemoryPack.filter((idx) => idx !== cardIndex);
    }

    // Gamification XP rewards: +15 XP for rating a card
    const addedXp = cards[cardIndex]?.userConfidence ? 0 : 15; // Only add XP if it's the first time rating this card
    const newXpEarned = xpEarned + addedXp;

    set({
      cards: updatedCards,
      memoryPackIndices: updatedMemoryPack,
      xpEarned: newXpEarned,
    });
  },

  startMemoryMode: () => {
    const { cards, memoryPackIndices } = get();
    if (memoryPackIndices.length === 0) return;

    // Filter cards to only include the ones in memoryPackIndices
    const memoryCards = cards
      .filter((_, idx) => memoryPackIndices.includes(idx))
      .map(c => ({
        ...c,
        userConfidence: undefined, // Reset confidence for the review round
      }));

    set({
      cards: memoryCards,
      currentCardIndex: 0,
      phase: "viewing",
      isMemoryModeActive: true,
      memoryPackIndices: [], // Clear for the review session so they can be re-added if still hard
    });
  },

  resetFlashcards: () => {
    set((state) => ({
      ...initialStoreState,
      topic: state.topic, // Keep previous topic for user convenience
      mode: state.mode,
      cardCount: state.cardCount,
      apiKey: state.apiKey,
    }));
  },
}));
