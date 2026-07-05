"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Layers,
  ArrowLeft,
  ArrowRight,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sliders,
  Settings,
  Brain,
  Terminal
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { CardStack } from "@/features/flashcards/components/CardStack";
import { useFlashcardStore } from "@/stores/flashcard-store";
import { cn } from "@/utils/cn";

function getTopicInsights(topicName: string) {
  const normalized = topicName.toLowerCase().trim();
  
  let strengths = [
    "Recalled definitions and primary building blocks correctly.",
    "Strong memory link with generated analogies.",
    "Demonstrated familiarity with foundational terminology."
  ];
  let focusAreas = [
    "Edge cases and practical use case constraints.",
    "Cards flagged as Hard require repetition intervals."
  ];
  let nextAction = "Spaced recall of flagged concepts in 12 hours.";

  if (normalized.includes("python")) {
    strengths = [
      "Good comprehension of Python syntax paradigms and dynamic core structures.",
      "Clear identification of mutable vs immutable types under code execution.",
      "Successfully recognized object-oriented properties in standard snippets."
    ];
    focusAreas = [
      "Memory allocation strategies, garbage collection thresholds, and the GIL.",
      "Advanced decorators, scopes, and context manager pipelines."
    ];
    nextAction = "Build a local Python script exercising custom generators to trace activation flows.";
  } else if (normalized.includes("sql join") || normalized.includes("sql")) {
    strengths = [
      "Mastered difference between INNER, LEFT, RIGHT, and FULL OUTER joins.",
      "Identified correct filtering behaviors when using ON vs WHERE clauses.",
      "Understands performance impacts of cross joins vs hash matching join algorithms."
    ];
    focusAreas = [
      "Complex subqueries vs CTE join optimizations.",
      "Indexed join queries and understanding nested loop performance characteristics."
    ];
    nextAction = "Construct a sample database schema and execute optimization checks on multi-table queries.";
  } else if (normalized.includes("neural network") || normalized.includes("deep learning")) {
    strengths = [
      "Solid grasp of neural layering structure, weights, and bias parameters.",
      "Recognized activation functions (ReLU, Sigmoid, Softmax) and their scopes.",
      "Understands backpropagation flow and chain rule gradients."
    ];
    focusAreas = [
      "Exploding and vanishing gradient solutions (e.g., residual connections, batch normalization).",
      "Regularization trade-offs (Dropout, L1/L2 weight decay) to prevent overfitting."
    ];
    nextAction = "Implement a simple 2-layer perceptron from scratch in numpy to trace derivative flows.";
  } else if (normalized.includes("gradient descent")) {
    strengths = [
      "Clear visualization of cost functions, valleys, and local minima navigation.",
      "Strong understanding of learning rates and step tuning impacts.",
      "Differentiated between Batch, Stochastic (SGD), and Mini-batch variants."
    ];
    focusAreas = [
      "Advanced momentum optimizers (Adam, RMSprop, AdaGrad) weight modifications.",
      "Handling saddle points and plateaus where gradients approach zero."
    ];
    nextAction = "Simulate cost function trajectory plots comparing Standard SGD vs Adam Optimizer.";
  } else if (normalized.includes("binary search")) {
    strengths = [
      "Excellent grasp of log(n) divide-and-conquer search boundaries.",
      "Clear pointer tracking (left, right, mid calculations to prevent overflow).",
      "Understands conditions for array sorting preconditions."
    ];
    focusAreas = [
      "Lower and upper boundary checks for arrays with duplicates.",
      "Solving binary search search-space application problems (e.g., search in rotated sorted arrays)."
    ];
    nextAction = "Practice 3 classic binary search variations on coding platforms under time constraints.";
  } else {
    strengths = [
      `Grasped core definitions and foundational elements of "${topicName}".`,
      "Identified basic structural properties and conceptual relationships.",
      "Mapped general analogies successfully to build mental models."
    ];
    focusAreas = [
      `Advanced applications and execution trade-offs of "${topicName}".`,
      "Synthesizing edge cases and fixing recurring memory recall challenges."
    ];
    nextAction = `Create a real-world project or code simulation applying "${topicName}" principles.`;
  }

  return { strengths, focusAreas, nextAction };
}

export default function FlashcardsPage() {
  const {
    apiKey,
    topic,
    mode,
    cardCount,
    isGenerating,
    loadingStep,
    error,
    cards,
    currentCardIndex,
    phase,
    studyStreak,
    xpEarned,
    level,
    memoryPackIndices,
    isMemoryModeActive,
    setApiKey,
    setTopic,
    setMode,
    setCardCount,
    setGenerating,
    setLoadingStep,
    setError,
    setPhase,
    setCurrentCardIndex,
    rateCardConfidence,
    startMemoryMode,
    resetFlashcards,
  } = useFlashcardStore();

  const [inputTopic, setInputTopic] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();

  const { strengths, focusAreas, nextAction } = getTopicInsights(topic);

  const handleTestKnowledge = () => {
    router.push(`/quiz?topic=${encodeURIComponent(topic)}&mode=${encodeURIComponent(mode)}&autostart=true`);
  };

  // Suggested preset topics
  const presets = ["SQL Joins", "Gradient Descent", "Neural Networks", "Binary Search"];

  // Loading steps animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingStep(1);
      interval = setInterval(() => {
        const currentStep = useFlashcardStore.getState().loadingStep;
        setLoadingStep(currentStep < 5 ? currentStep + 1 : 5);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, setLoadingStep]);

  // Trigger confetti when hitting the results page
  useEffect(() => {
    if (phase === "results") {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ["#8b5cf6", "#6366f1", "#10b981"],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ["#8b5cf6", "#6366f1", "#10b981"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [phase]);

  // Handle generation action
  const handleGenerate = async () => {
    if (!inputTopic.trim()) {
      setError("Please provide a learning topic.");
      return;
    }

    setTopic(inputTopic.trim());
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: inputTopic.trim(),
          mode,
          cardCount,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards.");
      }

      if (data.data?.cards) {
        useFlashcardStore.setState({ cards: data.data.cards, phase: "viewing" });
      } else {
        throw new Error("No flashcard data returned from AI.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  // Navigations
  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Completed last card
      setPhase("results");
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  // Calculate results statistics
  const totalCardsCount = cards.length;
  const easyCount = cards.filter((c) => c.userConfidence === "easy").length;
  const mediumCount = cards.filter((c) => c.userConfidence === "medium").length;
  const hardCount = cards.filter((c) => c.userConfidence === "hard").length;

  const averageConfidence =
    totalCardsCount > 0
      ? Math.round(
          ((easyCount * 100 + (totalCardsCount - easyCount - hardCount) * 70 + hardCount * 30) /
            totalCardsCount)
        )
      : 0;

  // Retention formula: confidence based scale
  const estimatedRetention = Math.round(averageConfidence * 0.95);

  const getRetentionLevel = (ret: number) => {
    if (ret >= 85) return { text: "Strong Recall", color: "text-emerald-400" };
    if (ret >= 60) return { text: "Moderate retention", color: "text-indigo-400" };
    return { text: "Needs spaced review", color: "text-rose-400" };
  };

  // Loading Steps texts
  const loadSteps = [
    "Analyzing topic keywords...",
    "Synthesizing pedagogical structure...",
    "Generating card front questions...",
    "Formulating definitions and answers...",
    "Injecting memory tips and mnemonics...",
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeItem="flashcards" />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between max-h-screen overflow-y-auto">
        
        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers className="text-violet-500" />
              <span>AI Flashcards</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              Spaced repetition accelerated by AI.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Gamified Level & XP */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg text-xs font-bold text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <Flame size={13} className="text-orange-400 animate-pulse" />
                <span>{studyStreak} Day Streak</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-300">
                <Award size={13} className="text-yellow-400" />
                <span>Level {level}</span>
              </div>
            </div>
            
            {/* API Key Toggle Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg border border-white/5 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* SETTINGS OVERLAY PANEL */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel border-white/10 rounded-xl p-4 mb-6 bg-zinc-950/90 shadow-2xl relative z-40 max-w-md ml-auto"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Terminal size={14} className="text-violet-400" />
                API Configuration
              </h3>
              <p className="text-zinc-400 text-xs mb-3 leading-relaxed">
                Provide your custom API key (Gemini, Groq, OpenRouter). If left blank, server fallback keys from environment variables will be used automatically.
              </p>
              <input
                type="password"
                placeholder="Enter API Key (AQ...sk-or-)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 focus:border-violet-500/40 rounded-lg p-2 text-xs text-white placeholder-zinc-500"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-md cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONFIGURATION PHASE (SETUP FORM) */}
        {phase === "config" && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col items-center justify-center py-6 sm:py-12"
          >
            <div className="w-full max-w-xl space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 items-center justify-center text-white shadow-[0_0_25px_rgba(139,92,246,0.3)] mb-2">
                  <Brain size={24} className="animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Flashcard Generator
                </h2>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                  Provide any study topic to receive tailored flashcards using Spaced Repetition algorithms.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 text-xs flex gap-2 items-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* TOPIC INPUT */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider font-extrabold text-zinc-400">
                  Topic of Study
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter topic (e.g., Gradient Descent, SQL Joins...)"
                    value={inputTopic}
                    onChange={(e) => setInputTopic(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500/50 hover:border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 shadow-inner"
                  />
                </div>
                
                {/* Presets */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setInputTopic(preset)}
                      className="px-3 py-1.5 rounded-lg border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTIONS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* MODE SELECTION */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-1.5">
                    <Sliders size={13} className="text-violet-400" />
                    Learning Mode
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "beginner", label: "Beginner", desc: "Basics & Examples" },
                      { id: "intermediate", label: "Intermediate", desc: "Core Details" },
                      { id: "interview", label: "Interview", desc: "Trick Questions" },
                      { id: "revision", label: "Revision", desc: "Facts & Formula" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1 group",
                          mode === m.id
                            ? "bg-violet-500/10 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] text-white"
                            : "bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/15"
                        )}
                      >
                        <span className={cn("text-xs font-bold transition-colors", mode === m.id ? "text-violet-400" : "group-hover:text-zinc-200")}>
                          {m.label}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium">
                          {m.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARD COUNT SELECTOR */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-violet-400" />
                    Flashcard Count
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 20].map((count) => (
                      <button
                        key={count}
                        onClick={() => setCardCount(count as any)}
                        className={cn(
                          "p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1",
                          cardCount === count
                            ? "bg-violet-500/10 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] text-white"
                            : "bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/15"
                        )}
                      >
                        <span className={cn("text-sm font-extrabold", cardCount === count ? "text-violet-400" : "text-zinc-300")}>
                          {count}
                        </span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Cards</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GENERATE SUBMIT */}
              <div className="pt-4">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full text-sm font-bold shadow-lg"
                  rightIcon={<Play size={14} fill="currentColor" />}
                  onClick={handleGenerate}
                >
                  Generate Flashcards
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* LOADING GENERATING STATE */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto"
          >
            <div className="relative">
              {/* Spinner background halo */}
              <div className="absolute inset-0 bg-violet-600/10 rounded-full blur-2xl animate-pulse" />
              <div className="h-16 w-16 rounded-full border-4 border-violet-500/10 border-t-violet-500 animate-spin relative z-10" />
            </div>

            <div className="text-center space-y-2 relative z-10">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Crafting Personalized Deck
              </h3>
              <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
                Our AI model is synthesising questions, definitions, and analogies for <span className="text-violet-400 font-semibold">&ldquo;{inputTopic || topic}&rdquo;</span>.
              </p>
            </div>

            {/* Stepped Process List */}
            <div className="w-full glass-panel border border-white/5 rounded-xl p-4 bg-zinc-950/40 space-y-2.5">
              {loadSteps.map((stepText, idx) => {
                const stepNum = idx + 1;
                const isDone = loadingStep > stepNum;
                const isCurrent = loadingStep === stepNum;
                
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border transition-all duration-300",
                      isDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                      isCurrent ? "bg-violet-500/10 border-violet-500/30 text-violet-400 animate-pulse" :
                      "bg-zinc-900 border-white/5 text-zinc-500"
                    )}>
                      {isDone ? "✓" : stepNum}
                    </div>
                    <span className={cn(
                      "transition-colors",
                      isDone ? "text-zinc-400 line-through decoration-zinc-800" :
                      isCurrent ? "text-white font-bold" :
                      "text-zinc-500"
                    )}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ACTIVE FLASHCARD VIEWING PHASE */}
        {phase === "viewing" && cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-between items-center max-w-2xl mx-auto w-full py-4 sm:py-6"
          >
            {/* Context Topic Label */}
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-widest bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded">
                Topic: {topic} {isMemoryModeActive && "(Review Pack)"}
              </span>
              <h3 className="text-sm font-semibold text-zinc-400">
                Level {level} Study Session • XP: {xpEarned}
              </h3>
            </div>

            {/* CARD STACK AREA */}
            <div className="w-full my-6 flex justify-center">
              <CardStack
                cards={cards}
                currentIndex={currentCardIndex}
                onRate={rateCardConfidence}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            </div>

            {/* INTERACTIVE PROGRESS STATS */}
            <div className="w-full max-w-[420px] space-y-4">
              {/* Progress bar info */}
              <div className="flex justify-between items-end text-xs">
                <span className="text-zinc-400 font-medium">
                  Card {currentCardIndex + 1} of {cards.length}
                </span>
                <span className="text-white font-bold">
                  {Math.round(((currentCardIndex + 1) / cards.length) * 100)}% Complete
                </span>
              </div>
              
              <div className="h-1.5 w-full bg-zinc-900 rounded-full border border-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                />
              </div>

              {/* ACTION BUTTON CONTROLS (DESKTOP) */}
              <div className="flex justify-between items-center gap-3 pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentCardIndex === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-white/5 bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Prev
                </button>
                
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-violet-500/20 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCw size={13} />
                  Flip Card
                </button>

                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Next
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* CONFIDENCE RATING BAR */}
              <div className="glass-panel border-white/5 bg-zinc-950/40 p-3 rounded-2xl space-y-2.5">
                <div className="text-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  How well did you recall this?
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      rateCardConfidence(currentCardIndex, "easy");
                      handleNext();
                    }}
                    className="py-1.5 px-2 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5"
                  >
                    <span>Easy</span>
                    <span className="text-[8px] text-emerald-500 font-semibold">100% Recall</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      rateCardConfidence(currentCardIndex, "medium");
                      handleNext();
                    }}
                    className="py-1.5 px-2 bg-violet-500/10 border border-violet-500/25 hover:bg-violet-500/20 text-violet-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5"
                  >
                    <span>Medium</span>
                    <span className="text-[8px] text-violet-500 font-semibold">70% Recall</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      rateCardConfidence(currentCardIndex, "hard");
                      handleNext();
                    }}
                    className="py-1.5 px-2 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5"
                  >
                    <span>Hard</span>
                    <span className="text-[8px] text-rose-500 font-semibold">Flag for Review</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS / COMPLETION SCREEN */}
        {phase === "results" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full py-4 space-y-8"
          >
            {/* Header badges */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center text-emerald-400 mb-2">
                <CheckCircle2 size={24} className="animate-bounce" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Session Completed!
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm">
                Amazing work! You parsed the flashcard deck on <span className="text-white font-semibold">&ldquo;{topic}&rdquo;</span>.
              </p>
            </div>

            {/* KEY METRICS ROWS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              
              {/* Circular retention progress card */}
              <div className="glass-panel border-white/5 rounded-2xl p-5 bg-zinc-950/40 flex flex-col items-center justify-between text-center relative overflow-hidden h-[180px]">
                <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Retention</span>
                
                {/* Circular ring path */}
                <div className="relative h-20 w-20 flex items-center justify-center mt-2">
                  <svg className="h-full w-full transform -rotate-95" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-900"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      className="text-emerald-500"
                      strokeWidth="2.5"
                      strokeDasharray={`${estimatedRetention}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${estimatedRetention}, 100` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <span className="absolute text-base font-extrabold text-white">{estimatedRetention}%</span>
                </div>
                
                <span className={cn("text-[11px] font-bold mt-2", getRetentionLevel(estimatedRetention).color)}>
                  {getRetentionLevel(estimatedRetention).text}
                </span>
              </div>

              {/* Confidence scores distribution */}
              <div className="glass-panel border-white/5 rounded-2xl p-5 bg-zinc-950/40 flex flex-col justify-between h-[180px]">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-center block mb-2">Confidence Score</span>
                
                <div className="space-y-2">
                  {/* Easy Row */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-emerald-400">Easy ({easyCount})</span>
                      <span className="text-zinc-400">{Math.round((easyCount / totalCardsCount) * 100) || 0}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(easyCount / totalCardsCount) * 100}%` }} />
                    </div>
                  </div>

                  {/* Medium Row */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-violet-400">Medium ({mediumCount})</span>
                      <span className="text-zinc-400">{Math.round((mediumCount / totalCardsCount) * 100) || 0}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(mediumCount / totalCardsCount) * 100}%` }} />
                    </div>
                  </div>

                  {/* Hard Row */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-rose-400">Hard ({hardCount})</span>
                      <span className="text-zinc-400">{Math.round((hardCount / totalCardsCount) * 100) || 0}%</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(hardCount / totalCardsCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* XP, levels & streaks */}
              <div className="glass-panel border-white/5 rounded-2xl p-5 bg-zinc-950/40 flex flex-col justify-between text-center relative overflow-hidden h-[180px]">
                <div className="absolute top-0 right-0 h-20 w-20 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Gamification Summary</span>
                
                <div className="my-auto space-y-1">
                  <h4 className="text-3xl font-black text-violet-400">+{xpEarned} XP</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Accumulated reward</p>
                </div>
                
                <div className="flex justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] px-2 py-0.5 rounded font-bold">
                    Streak Saved!
                  </span>
                  <span className="inline-flex items-center gap-1 bg-zinc-900 border border-white/5 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-bold">
                    Lv. {level}
                  </span>
                </div>
              </div>
            </div>

            {/* AI COGNITIVE INSIGHTS */}
            <div className="w-full glass-panel border border-white/5 rounded-2xl p-6 bg-zinc-950/20 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Brain className="text-violet-400" size={18} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Cognitive Analysis & Insights
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Strengths</span>
                  <ul className="list-disc pl-4 text-zinc-300 space-y-1">
                    {strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">Focus Areas</span>
                  <ul className="list-disc pl-4 text-zinc-300 space-y-1">
                    {focusAreas.map((focus, idx) => (
                      <li key={idx}>{focus}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                <span className="text-zinc-500 font-medium">
                  Suggested Next Action: {nextAction}
                </span>
              </div>
            </div>

            {/* ACTION TRIGGERS BAR */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-lg">
              
              <Button
                variant="gradient"
                size="md"
                className="flex-1 text-xs font-bold shadow-lg"
                leftIcon={<Brain size={14} />}
                onClick={handleTestKnowledge}
              >
                Test My Knowledge
              </Button>

              {/* Spaced repetition memory mode button */}
              {memoryPackIndices.length > 0 ? (
                <Button
                  variant="emerald"
                  size="md"
                  className="flex-1 text-xs font-bold border border-emerald-500/20 shadow-md"
                  leftIcon={<RotateCw size={13} />} // Wait, let's use RotateCw for memory mode to avoid duplicate brain icons
                  onClick={startMemoryMode}
                >
                  Review Pack ({memoryPackIndices.length})
                </Button>
              ) : null}

              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs font-bold border border-zinc-800"
                leftIcon={<RotateCw size={13} />}
                onClick={resetFlashcards}
              >
                New Topic
              </Button>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}
