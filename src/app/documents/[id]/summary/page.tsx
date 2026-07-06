"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Sparkles,
  Clock,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Brain,
  Lightbulb,
  BookOpenCheck,
  AlertTriangle,
  Award
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Concept {
  rank: number;
  concept: string;
  description: string;
}

interface RealWorldExample {
  scenario: string;
  explanation: string;
}

interface Term {
  term: string;
  definition: string;
}

interface Mistake {
  mistake: string;
  explanation: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

interface SummaryJSON {
  title: string;
  estimated_learning_time: string;
  overview: string;
  must_know_concepts: Concept[];
  key_takeaways: string[];
  real_world_examples: RealWorldExample[];
  important_terms: Term[];
  common_mistakes: Mistake[];
  quick_revision: string[];
  self_test_questions: QuizQuestion[];
}

interface SummaryData {
  id: number;
  document_id: string;
  summary_json: SummaryJSON;
  learning_time: string;
  generated_by_model: string;
  created_at: string;
}

interface DocumentDetail {
  id: string;
  title: string;
  filename: string;
  page_count: number | null;
  word_count: number;
  character_count: number;
}

// Section timing budgets (in seconds)
const tabDurations = [
  120, // 2 mins: Big Picture
  180, // 3 mins: Concepts
  120, // 2 mins: Examples
  120, // 2 mins: Revision
  60   // 1 min: Quiz
];

const tabLabels = [
  { label: "Big Picture", duration: "2 min" },
  { label: "Must Know Concepts", duration: "3 min" },
  { label: "Real World Examples", duration: "2 min" },
  { label: "Revision Sheet", duration: "2 min" },
  { label: "Self-Test Quiz", duration: "1 min" }
];

export default function DocumentSummaryPage() {
  const params = useParams();
  const id = params.id as string;

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab index: 0=Big Picture, 1=Concepts, 2=Examples, 3=Revision, 4=Self-Test
  const [activeTab, setActiveTab] = useState<number>(0);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(tabDurations[0]);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const fetchSummaryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary
      const summaryRes = await fetch(`${API_URL}/api/document/${id}/summary`);
      if (!summaryRes.ok) {
        if (summaryRes.status === 404) {
          throw new Error("No smart summary found. Please generate it from the Document Detail page.");
        }
        throw new Error("Failed to load smart summary.");
      }
      const summaryData = await summaryRes.json();

      // Fetch doc details
      const docRes = await fetch(`${API_URL}/api/document/${id}`);
      let docDetails = null;
      if (docRes.ok) {
        docDetails = await docRes.ok ? await docRes.json() : null;
      }

      setSummary(summaryData);
      setDocDetail(docDetails);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSummaryData();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, fetchSummaryData]);

  // Sync timer when active tab changes
  useEffect(() => {
    setTimeLeft(tabDurations[activeTab]);
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [activeTab]);

  // Timer Handlers
  const toggleTimer = () => {
    if (timerRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setTimerRunning(false);
            // Flash color completion alert or ding sound if supported
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerRunning(false);
    setTimeLeft(tabDurations[activeTab]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Quiz Handlers
  const handleAnswerSelect = (questionIdx: number, optionIdx: number) => {
    if (showFeedback[questionIdx]) return; // Answer locked in
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const checkAnswer = (questionIdx: number) => {
    if (selectedAnswers[questionIdx] === undefined) return;
    setShowFeedback(prev => ({ ...prev, [questionIdx]: true }));
  };

  const checkAllQuizAnswers = () => {
    if (!summary) return;
    const questions = summary.summary_json.self_test_questions;
    
    // Check if user answered all questions
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      alert(`Please choose an answer for all ${questions.length} questions before submitting!`);
      return;
    }

    // Reveal feedback for all
    const feedbackUpdate: Record<number, boolean> = {};
    let score = 0;
    questions.forEach((q, idx) => {
      feedbackUpdate[idx] = true;
      if (selectedAnswers[idx] === q.correct_answer_index) {
        score++;
      }
    });

    setShowFeedback(feedbackUpdate);
    setQuizScore(score);

    // Scroll to results card
    setTimeout(() => {
      const el = document.getElementById("quiz-results");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowFeedback({});
    setQuizScore(null);
  };

  // Animations configuration
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const cardAnim = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <Sidebar activeItem="upload" />

      {/* MAIN LAYOUT */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen relative">
        {/* BACK TO DETAIL HEADER */}
        <div className="space-y-4">
          <Link 
            href={id ? `/documents/${id}` : "/upload"} 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Document Index
          </Link>

          {summary && (
            <div className="border-b border-white/5 pb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Sparkles className="text-violet-400 animate-pulse shrink-0" size={28} />
                Smart Learning Module
              </h1>
              <p className="text-zinc-500 text-xs mt-1">AI-assisted structured educational acceleration</p>
            </div>
          )}
        </div>

        {/* LOADING EXPERIENCE */}
        {loading && (
          <div className="space-y-8 animate-pulse">
            <div className="h-44 bg-zinc-900/60 rounded-2xl border border-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 h-80 bg-zinc-900/40 rounded-xl border border-white/5" />
              <div className="md:col-span-3 h-80 bg-zinc-900/40 rounded-xl border border-white/5" />
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <Card className="border-red-500/20 bg-red-950/10 p-6 flex flex-col items-center text-center gap-4">
            <AlertCircle size={32} className="text-red-400" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Smart Summary Error</h3>
              <p className="text-xs text-red-300 max-w-md">{error}</p>
            </div>
            <Link href={id ? `/documents/${id}` : "/upload"}>
              <Button size="sm" variant="secondary" className="border-zinc-800">
                Return to document detail
              </Button>
            </Link>
          </Card>
        )}

        {/* CONTENT */}
        {summary && !loading && !error && (
          <div className="space-y-8">
            {/* HERO CARD (Glassmorphism layout) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              {/* Pulsing neon accent border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-lg opacity-10 group-hover:opacity-15 transition duration-700 pointer-events-none" />
              
              <Card className="p-6 md:p-8 border-white/10 bg-zinc-950/60 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                {/* Visual grid background decorator */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                
                <div className="space-y-3 relative z-10 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-950/40 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                    <Brain size={10} />
                    10-Minute Learning Package
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    {summary.summary_json.title}
                  </h2>
                  <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                    This high-yield digest condenses the target document into a structured 10-minute focus program. Use the timeline countdown timer to stay active.
                  </p>
                </div>

                {/* Hero Stats */}
                <div className="flex flex-wrap md:flex-nowrap gap-4 relative z-10 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
                  {docDetail && (
                    <>
                      <div className="text-center bg-zinc-900/30 border border-white/5 rounded-xl p-3 min-w-[75px] flex-1 md:flex-none">
                        <p className="text-lg font-bold text-zinc-100 font-mono">{docDetail.page_count || "—"}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Pages</p>
                      </div>
                      <div className="text-center bg-zinc-900/30 border border-white/5 rounded-xl p-3 min-w-[75px] flex-1 md:flex-none">
                        <p className="text-lg font-bold text-zinc-100 font-mono">
                          {docDetail.word_count >= 1000 ? `${(docDetail.word_count / 1000).toFixed(1)}k` : docDetail.word_count}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Words</p>
                      </div>
                    </>
                  )}
                  <div className="text-center bg-violet-500/5 border border-violet-500/20 rounded-xl p-3 min-w-[100px] flex-1 md:flex-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-4 w-4 bg-violet-500/10 rounded-bl-lg flex items-center justify-center">
                      <Clock size={8} className="text-violet-400" />
                    </div>
                    <p className="text-lg font-bold text-violet-400 font-mono">10 MIN</p>
                    <p className="text-[9px] text-violet-400/80 font-bold uppercase tracking-wider mt-0.5">Focus Time</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* TWO-COLUMN LAYOUT: TIMELINE TIMER & MAIN TABS CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* STICKY TIMELINE & TIMER */}
              <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                
                {/* SMART TIMER PANEL */}
                <Card className="p-5 border-white/5 bg-zinc-950/60 backdrop-blur-xl relative overflow-hidden space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Section Timer</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 font-bold font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                      Active Focus
                    </span>
                  </div>

                  {/* LARGE COUNTDOWN DISPLAY */}
                  <div className="text-center space-y-1">
                    <p className="text-4xl font-extrabold text-white font-mono tracking-tight">
                      {formatTime(timeLeft)}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      {tabLabels[activeTab].label} budget
                    </p>
                  </div>

                  {/* TIMER CONTROLS */}
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={resetTimer}
                      className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Reset Section Timer"
                    >
                      <RotateCcw size={14} />
                    </button>
                    
                    <button 
                      onClick={toggleTimer}
                      className={`h-10 px-5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                        timerRunning 
                          ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(217,119,6,0.2)]" 
                          : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                      }`}
                    >
                      {timerRunning ? (
                        <>
                          <Pause size={12} fill="white" />
                          Pause Focus
                        </>
                      ) : (
                        <>
                          <Play size={12} fill="white" />
                          Start Focus
                        </>
                      )}
                    </button>
                  </div>

                  {/* SECTIONS PROGRESS BUDGET */}
                  <div className="border-t border-white/5 pt-4 space-y-2">
                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">10m Program Breakdowns</p>
                    <div className="space-y-1">
                      {tabLabels.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/[0.02] last:border-b-0">
                          <span className={`${activeTab === idx ? "text-violet-400 font-bold" : "text-zinc-500"}`}>
                            {idx + 1}. {t.label}
                          </span>
                          <span className={`font-mono ${activeTab === idx ? "text-violet-400 font-bold" : "text-zinc-500"}`}>
                            {t.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* STICKY VERTICAL NAVIGATION JUMPER */}
                <Card className="p-4 border-white/5 bg-zinc-950/40 space-y-1">
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono px-2 mb-2">Guided Learning Path</p>
                  
                  {tabLabels.map((tab, idx) => {
                    const isActive = activeTab === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between group transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? "bg-white/5 text-white border border-white/5 shadow-inner" 
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-violet-400 animate-pulse" : "bg-zinc-700 group-hover:bg-zinc-500"
                          }`} />
                          {tab.label}
                        </span>
                        <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive ? "text-violet-400 opacity-100" : "text-zinc-600"
                        }`} />
                      </button>
                    );
                  })}
                </Card>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="lg:col-span-3 min-h-[500px]">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 0: BIG PICTURE (Overview & Takeaways) */}
                  {activeTab === 0 && (
                    <motion.div
                      key="tab-big-picture"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-6"
                    >
                      <motion.div variants={cardAnim}>
                        <Card className="p-6 md:p-8 border-white/5 bg-zinc-950/40 space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                            <BookOpen className="text-violet-400" size={20} />
                            <h3 className="text-sm uppercase tracking-wider font-extrabold text-white font-mono">The Big Picture</h3>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-lg font-bold text-white">What is this about and why does it matter?</h4>
                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap selection:bg-violet-500/20">
                              {summary.summary_json.overview}
                            </p>
                          </div>
                        </Card>
                      </motion.div>

                      <motion.div variants={cardAnim}>
                        <Card className="p-6 border-white/5 bg-zinc-950/40 space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                            <TrendingUp className="text-violet-400" size={20} />
                            <h3 className="text-sm uppercase tracking-wider font-extrabold text-white font-mono">Core Takeaways</h3>
                          </div>
                          <ul className="space-y-3">
                            {summary.summary_json.key_takeaways.map((takeaway, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-zinc-300 leading-relaxed">
                                <span className="h-5 w-5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* TAB 1: MUST KNOW CONCEPTS & TERMS */}
                  {activeTab === 1 && (
                    <motion.div
                      key="tab-concepts"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-6"
                    >
                      {/* Concepts Ranked List */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono">Top {summary.summary_json.must_know_concepts.length} Concepts (Ranked by Importance)</h3>
                          <span className="text-[10px] text-violet-400 font-bold bg-violet-500/5 px-2 py-0.5 rounded border border-violet-500/10 font-mono">80/20 Knowledge</span>
                        </div>

                        {summary.summary_json.must_know_concepts.map((c, idx) => (
                          <motion.div key={idx} variants={cardAnim}>
                            <Card className="p-5 border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                              {/* Highlight vertical side bar */}
                              <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-500" />
                              
                              <div className="flex gap-4 items-start pl-2">
                                <span className="text-3xl font-black text-violet-400/20 font-mono leading-none">
                                  #0{c.rank || idx + 1}
                                </span>
                                <div className="space-y-1">
                                  <h4 className="text-sm md:text-base font-bold text-white tracking-wide">
                                    {c.concept}
                                  </h4>
                                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-medium">
                                    {c.description}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      {/* Important Terms Definitions */}
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Lightbulb className="text-violet-400" size={16} />
                          <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-400 font-mono">Key Vocabulary Definitions</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {summary.summary_json.important_terms.map((t, idx) => (
                            <motion.div key={idx} variants={cardAnim}>
                              <Card className="p-4 border-white/5 bg-zinc-900/10 hover:bg-zinc-900/20 hover:border-violet-500/10 transition-colors h-full space-y-1">
                                <h4 className="text-xs md:text-sm font-bold text-white font-mono text-violet-300">
                                  {t.term}
                                </h4>
                                <p className="text-xs text-zinc-400 leading-normal font-medium">
                                  {t.definition}
                                </p>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: REAL-WORLD EXAMPLES & PITFALLS */}
                  {activeTab === 2 && (
                    <motion.div
                      key="tab-examples"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-6"
                    >
                      {/* Real world scenarios */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <BookOpenCheck className="text-violet-400" size={18} />
                          <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono">Practical Case Studies & Scenarios</h3>
                        </div>

                        {summary.summary_json.real_world_examples.map((ex, idx) => (
                          <motion.div key={idx} variants={cardAnim}>
                            <Card className="p-5 border-white/5 bg-zinc-950/40 space-y-3 relative overflow-hidden group">
                              {/* Soft glow hover line decorator */}
                              <div className="absolute top-0 right-0 h-24 w-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-600/10 transition-colors" />
                              
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-violet-500" />
                                Scenario: {ex.scenario}
                              </h4>
                              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-medium bg-zinc-900/20 p-3 rounded-lg border border-white/[0.02]">
                                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block mb-1">Educational Application</span>
                                {ex.explanation}
                              </p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      {/* Common Mistakes */}
                      {summary.summary_json.common_mistakes && summary.summary_json.common_mistakes.length > 0 && (
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                            <AlertTriangle className="text-amber-500" size={18} />
                            <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono">Common Pitfalls & Misconceptions</h3>
                          </div>

                          <div className="space-y-3">
                            {summary.summary_json.common_mistakes.map((m, idx) => (
                              <motion.div key={idx} variants={cardAnim}>
                                <Card className="p-4 border-amber-500/10 bg-amber-950/5 flex flex-col md:flex-row gap-3 items-start">
                                  <div className="h-6 w-6 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                    !
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-xs md:text-sm font-bold text-amber-300">
                                      Misconception: &quot;{m.mistake}&quot;
                                    </h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                      <span className="font-semibold text-zinc-300">Correction: </span>
                                      {m.explanation}
                                    </p>
                                  </div>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: QUICK REVISION SHEET */}
                  {activeTab === 3 && (
                    <motion.div
                      key="tab-revision"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-6"
                    >
                      <motion.div variants={cardAnim}>
                        <Card className="p-6 md:p-8 border-violet-500/15 bg-gradient-to-br from-violet-950/5 to-zinc-950/60 backdrop-blur-xl relative overflow-hidden space-y-6">
                          {/* Top lighting board styling */}
                          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                          
                          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                            <Clock className="text-violet-400 animate-pulse" size={20} />
                            <div>
                              <h3 className="text-sm uppercase tracking-wider font-extrabold text-white font-mono">1-Minute Revision Sheet</h3>
                              <p className="text-[10px] text-zinc-500">Rapid recall bullet points representing core knowledge digests</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {summary.summary_json.quick_revision.map((bullet, idx) => (
                              <div key={idx} className="flex gap-3 items-start border-b border-white/[0.02] pb-3 last:border-0 last:pb-0">
                                <div className="h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs shrink-0 font-bold mt-0.5">
                                  ✓
                                </div>
                                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
                                  {bullet}
                                </p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* TAB 4: SELF-TEST QUIZ */}
                  {activeTab === 4 && (
                    <motion.div
                      key="tab-quiz"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      className="space-y-6"
                    >
                      {/* QUIZ HEADER */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 font-mono">Self-Evaluation Module</h3>
                        <span className="text-[10px] text-violet-400 font-bold font-mono">{summary.summary_json.self_test_questions.length} Questions</span>
                      </div>

                      {/* QUIZ QUESTIONS */}
                      <div className="space-y-6">
                        {summary.summary_json.self_test_questions.map((q, qIdx) => {
                          const userChoice = selectedAnswers[qIdx];
                          const submitted = showFeedback[qIdx];
                          
                          return (
                            <motion.div key={qIdx} variants={cardAnim}>
                              <Card className="p-5 md:p-6 border-white/5 bg-zinc-950/40 space-y-4">
                                <h4 className="text-xs md:text-sm font-extrabold text-zinc-400 font-mono uppercase tracking-wider">
                                  Question {qIdx + 1}
                                </h4>
                                <p className="text-sm md:text-base font-bold text-white">
                                  {q.question}
                                </p>

                                {/* Options grid */}
                                <div className="grid grid-cols-1 gap-2.5">
                                  {q.options.map((opt, optIdx) => {
                                    const isSelected = userChoice === optIdx;
                                    const isCorrect = q.correct_answer_index === optIdx;
                                    
                                    let optionStyle = "border-white/5 bg-zinc-900/10 text-zinc-400 hover:bg-white/[0.02] hover:border-zinc-800";
                                    
                                    if (isSelected && !submitted) {
                                      optionStyle = "border-violet-500 bg-violet-950/20 text-white font-bold";
                                    } else if (submitted) {
                                      if (isCorrect) {
                                        optionStyle = "border-emerald-500 bg-emerald-950/25 text-emerald-400 font-bold";
                                      } else if (isSelected) {
                                        optionStyle = "border-red-500 bg-red-950/25 text-red-400 font-bold";
                                      } else {
                                        optionStyle = "border-white/5 bg-zinc-950 opacity-40 text-zinc-500";
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() => handleAnswerSelect(qIdx, optIdx)}
                                        disabled={submitted}
                                        className={`w-full text-left p-3.5 rounded-lg text-xs md:text-sm border transition-all duration-200 flex items-center justify-between cursor-pointer ${optionStyle}`}
                                      >
                                        <span>{opt}</span>
                                        {submitted && isCorrect && (
                                          <CheckCircle size={14} className="text-emerald-400" />
                                        )}
                                        {submitted && isSelected && !isCorrect && (
                                          <AlertCircle size={14} className="text-red-400" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Check Answer trigger */}
                                {!submitted && userChoice !== undefined && (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => checkAnswer(qIdx)}
                                    className="border-zinc-800 h-8 text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Lock Answer
                                  </Button>
                                )}

                                {/* Slide down detailed explanation */}
                                <AnimatePresence>
                                  {submitted && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-zinc-900/40 border border-white/5 rounded-lg p-3 text-xs leading-relaxed text-zinc-400 mt-2 font-medium">
                                        <span className="font-bold text-violet-400 font-mono block mb-1">
                                          {userChoice === q.correct_answer_index ? "Correct! Explanation" : "Incorrect. Explanation"}
                                        </span>
                                        {q.explanation}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* SUBMIT ENTIRE QUIZ RESULTS */}
                      {quizScore === null ? (
                        <div className="pt-4 text-center">
                          <Button 
                            variant="primary" 
                            onClick={checkAllQuizAnswers}
                            className="bg-violet-600 hover:bg-violet-500 font-extrabold text-sm py-5 px-8 shadow-[0_0_20px_rgba(139,92,246,0.3)] cursor-pointer"
                          >
                            Submit Self-Test Evaluation
                          </Button>
                        </div>
                      ) : (
                        <motion.div
                          id="quiz-results"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="pt-6"
                        >
                          <Card className="p-6 md:p-8 border-violet-500/20 bg-gradient-to-br from-violet-950/10 to-zinc-950/80 text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                              <Award className="h-8 w-8" />
                            </div>
                            
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold text-white">Quiz Evaluation Completed</h3>
                              <p className="text-zinc-400 text-xs">Based on 5 self-evaluation multiple-choice checkpoints</p>
                            </div>

                            <div className="inline-block px-6 py-3 rounded-2xl bg-zinc-900 border border-white/5">
                              <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider font-mono">Your Score</p>
                              <p className="text-4xl font-extrabold text-white font-mono mt-1">
                                {quizScore} <span className="text-lg text-zinc-500 font-normal">/ 5</span>
                              </p>
                            </div>

                            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                              {quizScore === 5 
                                ? "Flawless score! You have successfully mastered 100% of the core concepts in this learning package." 
                                : quizScore >= 3 
                                ? "Great job! You have acquired a strong high-yield understanding. Review explanations to patch remaining gaps." 
                                : "No worries! Learning is an iterative pathway. Re-read the revision sheet and try the checkpoints again."}
                            </p>

                            <div className="pt-2">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={resetQuiz}
                                className="border-zinc-800 text-xs font-semibold"
                              >
                                Retry Quiz Checkpoints
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
