"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Clock, Key, AlertTriangle, RotateCcw, Search, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/Button";
import { GlowCard } from "@/components/Card";
import { QuizCard, QuizProgress } from "@/components/QuizCard";
import { QuizResult } from "@/components/QuizResult";
import { QuizSkeleton } from "@/components/QuizSkeleton";
import { useQuizStore } from "@/lib/store";
import { modeConfig, durationConfig, calculateXP, getBadge } from "@/lib/quizPrompts";
import { cn } from "@/lib/utils";
import type { QuizMode, QuizDuration, QuizAnswer, QuizResult as QuizResultType } from "@/lib/store";

const MODES: QuizMode[] = ["beginner", "intermediate", "interview", "revision"];
const DURATIONS: QuizDuration[] = ["5m", "10m", "20m", "30m"];
const LOADING_STEP_DELAYS = [0, 800, 1600, 2400, 3200, 4000];
const TOPIC_EXAMPLES = ["Gradient Descent", "SQL Joins", "React Hooks", "Binary Search", "Neural Networks", "REST vs GraphQL", "Docker Containers", "CSS Flexbox"];

// ─── KeyModal ─────────────────────────────────────────────────────────────────

interface KeyModalProps { value: string; onChange: (v: string) => void; onSave: () => void; onClose: () => void; }

const KeyModal: React.FC<KeyModalProps> = ({ value, onChange, onSave, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }} onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md glass-panel rounded-2xl border border-white/8 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
          <Key size={16} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">OpenAI API Key</h3>
          <p className="text-[10px] text-zinc-500">Stored locally — never sent to our servers</p>
        </div>
      </div>
      <input type="password" placeholder="sk-..." value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave()} autoFocus
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all font-mono" />
      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" size="md" className="flex-1 font-bold" disabled={value.length < 10} onClick={onSave}>Save Key</Button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── ConfigPanel ──────────────────────────────────────────────────────────────

interface ConfigPanelProps { mode: QuizMode; duration: QuizDuration; onModeChange: (m: QuizMode) => void; onDurationChange: (d: QuizDuration) => void; }

const ConfigPanel: React.FC<ConfigPanelProps> = ({ mode, duration, onModeChange, onDurationChange }) => (
  <div className="space-y-6">
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Learning Mode</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {MODES.map((m) => {
          const cfg = modeConfig[m]; const active = mode === m;
          return (
            <motion.button key={m} whileTap={{ scale: 0.97 }} onClick={() => onModeChange(m)}
              className={cn("relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden",
                active ? cn(cfg.bgClass, cfg.borderClass, "shadow-lg") : "bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40")}>
              {active && <motion.div layoutId="active-mode"
                className={cn("absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br pointer-events-none", cfg.glowClass)}
                transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <span className={cn("text-[10px] font-black uppercase tracking-wider relative z-10", active ? cfg.textClass : "text-zinc-400")}>{cfg.label}</span>
              <span className="text-[9px] text-zinc-600 leading-tight relative z-10 line-clamp-2">{cfg.description}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quiz Duration</p>
      <div className="grid grid-cols-4 gap-2.5">
        {DURATIONS.map((d) => {
          const dcfg = durationConfig[d]; const active = duration === d; const mcfg = modeConfig[mode];
          return (
            <motion.button key={d} whileTap={{ scale: 0.96 }} onClick={() => onDurationChange(d)}
              className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                active ? cn(mcfg.bgClass, mcfg.borderClass) : "bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700")}>
              <span className={cn("text-sm font-black", active ? mcfg.textClass : "text-zinc-300")}>{dcfg.label}</span>
              <span className="text-[9px] text-zinc-600 font-mono">{dcfg.questionHint}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Inner page ───────────────────────────────────────────────────────────────

function QuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useQuizStore();
  const {
    quizApiKey, quizTopic, quizMode, quizDuration, isGeneratingQuiz, quizLoadingStep,
    quizData, quizError, quizResult, currentQuestionIndex, userAnswers, submittedQuestions, quizPhase,
    setQuizApiKey, setQuizTopic, setQuizMode, setQuizDuration, setGeneratingQuiz, setQuizLoadingStep,
    setQuizData, setQuizError, setQuizResult, setCurrentQuestion, selectQuizAnswer, submitQuizAnswer,
    setQuizPhase, resetQuiz,
  } = store;

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [localInput, setLocalInput] = useState(() => searchParams.get("topic") ?? quizTopic);

  React.useEffect(() => {
    const m = searchParams.get("mode") as QuizMode | null;
    if (m && MODES.includes(m)) setQuizMode(m);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateQuiz = useCallback(async () => {
    const topic = localInput.trim();
    if (!topic) return;
    // Key is optional — API falls back to .env.local automatically
    setQuizTopic(topic); setQuizError(null); setQuizData(null); setQuizResult(null);
    setCurrentQuestion(0); setGeneratingQuiz(true); setQuizLoadingStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOADING_STEP_DELAYS.forEach((delay, i) => timers.push(setTimeout(() => setQuizLoadingStep(i), delay)));
    try {
      const res = await fetch("/api/quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, mode: quizMode, duration: quizDuration, ...(quizApiKey ? { apiKey: quizApiKey } : {}) }),
      });
      timers.forEach(clearTimeout);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
      setQuizData(json.quiz);
      setQuizPhase("active");
    } catch (err: unknown) {
      timers.forEach(clearTimeout);
      setQuizError(err instanceof Error ? err.message : "Unexpected error. Please try again.");
    } finally { setGeneratingQuiz(false); setQuizLoadingStep(0); }
  }, [localInput, quizApiKey, quizMode, quizDuration, setQuizTopic, setQuizError, setQuizData,
      setQuizResult, setCurrentQuestion, setGeneratingQuiz, setQuizLoadingStep, setQuizPhase]);

  const handleSelect = useCallback((option: string) => {
    if (submittedQuestions[currentQuestionIndex]) return;
    selectQuizAnswer(currentQuestionIndex, option);
  }, [currentQuestionIndex, submittedQuestions, selectQuizAnswer]);

  const handleSubmit = useCallback(() => {
    if (!quizData) return;
    const q = quizData.questions[currentQuestionIndex];
    if (!q || !userAnswers[currentQuestionIndex]) return;
    submitQuizAnswer(currentQuestionIndex, q.correct_answer);
    if (userAnswers[currentQuestionIndex] === q.correct_answer) {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.75 },
        colors: quizMode === "beginner" ? ["#10b981","#34d399"] : quizMode === "interview" ? ["#f59e0b","#fbbf24"]
          : quizMode === "revision" ? ["#f43f5e","#fb7185"] : ["#8b5cf6","#6366f1"] });
    }
  }, [quizData, currentQuestionIndex, userAnswers, submitQuizAnswer, quizMode]);

  const handleNext = useCallback(() => {
    if (!quizData) return;
    const isLast = currentQuestionIndex === quizData.questions.length - 1;
    if (isLast) {
      const answers: QuizAnswer[] = quizData.questions.map((q, i) => ({
        questionIndex: i, selectedOption: userAnswers[i] ?? "", isCorrect: userAnswers[i] === q.correct_answer,
      }));
      const correct = answers.filter((a) => a.isCorrect).length;
      const score = Math.round((correct / quizData.questions.length) * 100);
      setQuizResult({ totalQuestions: quizData.questions.length, correctAnswers: correct, score,
        accuracy: `${score}%`, answers, xpEarned: calculateXP(score, quizMode, quizDuration),
        badge: getBadge(score, quizMode), completedAt: new Date().toISOString() } as QuizResultType);
      setQuizPhase("results");
    } else { setCurrentQuestion(currentQuestionIndex + 1); }
  }, [quizData, currentQuestionIndex, userAnswers, quizMode, quizDuration, setQuizResult, setQuizPhase, setCurrentQuestion]);

  const handleRetry = useCallback(() => {
    useQuizStore.setState({ currentQuestionIndex: 0, userAnswers: {}, submittedQuestions: {}, quizResult: null, quizPhase: "active" });
  }, []);
  const handleNewQuiz = useCallback(() => { resetQuiz(); setLocalInput(""); }, [resetQuiz]);
  const handleLearnMore = useCallback(() => router.push(`/learn?topic=${encodeURIComponent(quizTopic)}`), [router, quizTopic]);
  const handleSaveKey = () => { setQuizApiKey(tempKey); setShowKeyModal(false); setTempKey(""); };

  const activeCfg = modeConfig[quizMode];
  const currentQuestion = quizData?.questions[currentQuestionIndex] ?? null;
  const selectedOption = userAnswers[currentQuestionIndex];
  const isSubmitted = !!submittedQuestions[currentQuestionIndex];
  const isLastQuestion = quizData ? currentQuestionIndex === quizData.questions.length - 1 : false;

  return (
    <div className="flex min-h-screen bg-[#030303]">
      <Sidebar activeItem="quizzes" />
      <AnimatePresence>{showKeyModal && <KeyModal value={tempKey} onChange={setTempKey} onSave={handleSaveKey} onClose={() => { setShowKeyModal(false); setTempKey(""); }} />}</AnimatePresence>
      <main className="flex-1 min-h-screen overflow-y-auto w-full min-w-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", activeCfg.bgClass, activeCfg.borderClass)}>
                <Brain size={16} className={activeCfg.textClass} />
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-tight">AI Smart Quiz Engine</h1>
                <p className="text-[10px] text-zinc-500">Day 4 · Personalized Assessment</p>
              </div>
            </div>
            <button onClick={() => { setTempKey(quizApiKey); setShowKeyModal(true); }}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer",
                quizApiKey ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700")}>
              <Key size={11} />{quizApiKey ? "Key saved" : "Add API Key"}
            </button>
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {quizError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-950/15">
                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-bold text-red-400">Quiz Generation Failed</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{quizError}</p>
                </div>
                <button onClick={() => setQuizError(null)} className="text-zinc-600 hover:text-zinc-400 text-xs cursor-pointer">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONFIG */}
          <AnimatePresence mode="wait">
            {quizPhase === "config" && !isGeneratingQuiz && (
              <motion.div key="config" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-6">
                <GlowCard glowColor={activeCfg.glowClass} className={cn("border", activeCfg.borderClass)}>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">What do you want to be quizzed on?</p>
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                      <input type="text" placeholder="e.g. Gradient Descent, SQL Joins, React Hooks…" value={localInput}
                        onChange={(e) => setLocalInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/10 transition-all" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TOPIC_EXAMPLES.map((ex) => (
                        <button key={ex} onClick={() => setLocalInput(ex)}
                          className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer",
                            localInput === ex ? cn(activeCfg.bgClass, activeCfg.borderClass, activeCfg.textClass)
                              : "bg-zinc-900/60 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700")}>
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </GlowCard>
                <ConfigPanel mode={quizMode} duration={quizDuration} onModeChange={setQuizMode} onDurationChange={setQuizDuration} />
                <motion.div key={`${quizMode}-${quizDuration}`} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className={cn("flex items-center justify-between p-3.5 rounded-xl border", activeCfg.bgClass, activeCfg.borderClass)}>
                  <div className="flex items-center gap-2 text-xs">
                    <Zap size={13} className={activeCfg.textClass} />
                    <span className="text-zinc-400">
                      <span className={cn("font-bold", activeCfg.textClass)}>{durationConfig[quizDuration].questionHint}</span>
                      {" · "}{activeCfg.label}{" · "}{durationConfig[quizDuration].label} session
                    </span>
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-wider hidden sm:block", activeCfg.textClass)}>
                    {activeCfg.description.split(",")[0]}
                  </span>
                </motion.div>
                <Button variant={quizMode === "beginner" ? "emerald" : "gradient"} size="lg"
                  className="w-full font-black text-sm" disabled={!localInput.trim()} onClick={generateQuiz}
                  leftIcon={<Sparkles size={16} />}>
                  Generate Quiz
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOADING */}
          <AnimatePresence mode="wait">
            {isGeneratingQuiz && (
              <motion.div key="loading" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <QuizSkeleton step={quizLoadingStep} mode={quizMode} topic={localInput} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIVE */}
          <AnimatePresence mode="wait">
            {quizPhase === "active" && quizData && currentQuestion && !isGeneratingQuiz && (
              <motion.div key="active" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h2 className="text-sm font-black text-white truncate">{quizData.quiz_title}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest", activeCfg.bgClass, activeCfg.borderClass, activeCfg.textClass)}>
                          {activeCfg.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                          <Clock size={10} />{durationConfig[quizDuration].label}
                        </span>
                      </div>
                    </div>
                    <button onClick={handleNewQuiz}
                      className="self-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer font-bold">
                      <RotateCcw size={11} /> Reset
                    </button>
                  </div>
                  <QuizProgress current={currentQuestionIndex + 1} total={quizData.questions.length} mode={quizMode} />
                </div>
                <AnimatePresence mode="wait">
                  <QuizCard key={currentQuestionIndex} question={currentQuestion} questionNumber={currentQuestionIndex + 1}
                    totalQuestions={quizData.questions.length} selectedOption={selectedOption} isSubmitted={isSubmitted}
                    mode={quizMode} onSelect={handleSelect} onSubmit={handleSubmit} onNext={handleNext} isLastQuestion={isLastQuestion} />
                </AnimatePresence>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {quizData.questions.map((q, i) => (
                    <div key={i} className={cn("rounded-full transition-all duration-300",
                      i === currentQuestionIndex ? cn("w-5 h-1.5", activeCfg.bgClass.replace("/10", "/70"))
                        : submittedQuestions[i] ? userAnswers[i] === q.correct_answer ? "w-1.5 h-1.5 bg-emerald-500/50" : "w-1.5 h-1.5 bg-red-500/50"
                        : "w-1.5 h-1.5 bg-zinc-700")} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RESULTS */}
          <AnimatePresence mode="wait">
            {quizPhase === "results" && quizResult && quizData && !isGeneratingQuiz && (
              <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <QuizResult result={quizResult} quizData={quizData} mode={quizMode}
                  onRetry={handleRetry} onNewTopic={handleNewQuiz} onLearnMore={handleLearnMore} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-[#030303] items-center justify-center"><div className="text-zinc-600 text-sm animate-pulse">Loading quiz engine…</div></div>}>
      <QuizPageInner />
    </Suspense>
  );
}
