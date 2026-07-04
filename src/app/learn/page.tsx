"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Sparkles, 
  Clock, 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Cpu,
  Edit3,
  Check,
  Plus,
  Play,
  Terminal,
  Key,
  ChevronRight,
  ChevronDown,
  Layers,
  Award,
  BookOpenCheck,
  RotateCcw,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { Sidebar } from "@/components/Sidebar";
import { Card, GlowCard } from "@/components/Card";
import { Button } from "@/components/Button";
import { useLearningStore } from "@/lib/store";

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  // Split by code blocks first
  const blocks = text.split(/(```[\s\S]*?```)/g);
  
  return (
    <>
      {blocks.map((block, blockIdx) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          // It's a code block
          const match = block.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const codeContent = match ? match[2].trim() : block.slice(3, -3).trim();
          
          return (
            <div key={blockIdx} className="my-3 rounded-lg border border-white/5 bg-zinc-950 overflow-hidden font-mono text-[11px] leading-relaxed">
              {lang && (
                <div className="flex justify-between items-center px-4 py-1.5 bg-zinc-900/60 border-b border-white/5 text-[9px] text-zinc-500 uppercase">
                  <span>{lang}</span>
                </div>
              )}
              <pre className="p-3 overflow-x-auto text-zinc-300">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }
        
        // Inline parsing for other text
        const inlineParts = block.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\n)/g);
        return (
          <React.Fragment key={blockIdx}>
            {inlineParts.map((part, inlineIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={inlineIdx} className="font-extrabold text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return (
                  <em key={inlineIdx} className="italic text-zinc-200">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={inlineIdx}
                    className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-violet-300"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              if (part === "\n") {
                return <br key={inlineIdx} />;
              }
              return <span key={inlineIdx}>{part}</span>;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function LearnTopicPage() {
  const {
    apiKey,
    topic,
    duration,
    level,
    isGenerating,
    loadingStep,
    lessonData,
    error,
    setApiKey,
    setTopic,
    setDuration,
    setLevel,
    setGenerating,
    setLoadingStep,
    setLessonData,
    setError,
    reset
  } = useLearningStore();

  // Local state for UI components
  const [inputTopic, setInputTopic] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  
  // Scratchpad state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadTab, setScratchpadTab] = useState<"notes" | "takeaways" | "playground">("notes");
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [isRunningPlayground, setIsRunningPlayground] = useState(false);
  const [expandedConceptIdx, setExpandedConceptIdx] = useState<number | null>(null);
  const [practiceRevealed, setPracticeRevealed] = useState<Record<number, boolean>>({});

  // Suggested topic examples
  const examples = [
    "Explain Gradient Descent",
    "Teach me SQL Joins",
    "Explain Neural Networks",
    "Explain React Server Components"
  ];

  // Loading timeline steps
  const loadingSteps = [
    "Analyzing Topic Semantics",
    "Building Custom Learning Path",
    "Creating Real-World Analogies",
    "Generating Comprehension Checkpoint Quiz",
    "Finalizing Visual Revision Sheet"
  ];

  // Initialize tempKey
  useEffect(() => {
    setTempKey(apiKey);
    if (lessonData) {
      setNotesText(localStorage.getItem(`ai-accelerator-notes-${topic}`) || "");
    }
  }, [apiKey, lessonData, topic]);

  // Handle setting API Key
  const handleSaveApiKey = () => {
    setApiKey(tempKey);
    setShowKeyInput(false);
  };

  // Handle saving notes to local storage
  const handleNotesChange = (val: string) => {
    setNotesText(val);
    if (lessonData) {
      setIsSavingNotes(true);
      localStorage.setItem(`ai-accelerator-notes-${topic}`, val);
      const timeout = setTimeout(() => {
        setIsSavingNotes(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  };

  // Import concept to notes
  const handleImportConcept = (c: any) => {
    const divider = notesText ? "\n\n" : "";
    const formatConcept = `### ${c.title}\n${c.content}`;
    handleNotesChange(notesText + divider + formatConcept);
  };

  // Import takeaway to notes
  const handleImportTakeaway = (takeaway: string) => {
    const divider = notesText ? "\n\n" : "";
    const formatTakeaway = `* ${takeaway}`;
    handleNotesChange(notesText + divider + formatTakeaway);
  };

  // Run the code playground simulation
  const handleRunPlayground = () => {
    if (isRunningPlayground) return;
    setIsRunningPlayground(true);
    setPlaygroundOutput("[Compiling variables and executing python script...]");
    
    setTimeout(() => {
      const topicLower = topic.toLowerCase();
      if (topicLower.includes("gradient")) {
        setPlaygroundOutput(
          `[Running script.py...]\nOld weight: 10.0\nLearning Rate: 0.01\nGradient: 2.5\nNew weight = weight - (learning_rate * gradient)\nNew weight: 9.975\n\nProcess completed successfully with exit code 0.`
        );
      } else if (topicLower.includes("sql") || topicLower.includes("join")) {
        setPlaygroundOutput(
          `[Running script.py...]\nExecuting database query...\nINNER JOIN matching Customers: 3 rows returned\n- Order 101 | Naveen | $250.00\n- Order 102 | Sarah  | $120.50\n- Order 103 | Rohan  | $45.00\n\nProcess completed successfully with exit code 0.`
        );
      } else {
        setPlaygroundOutput(
          `[Running script.py...]\nCalculating node activation...\nInputs: [0.5, -0.2]\nWeights: [0.8, 0.4]\nBias: -0.1\nWeighted Sum (z): 0.22\nActivation ReLU(z): 0.22\n\nProcess completed successfully with exit code 0.`
        );
      }
      setIsRunningPlayground(false);
    }, 1000);
  };

  // Handle generating the learning plan
  const handleGenerate = async (targetTopic: string) => {
    if (!targetTopic.trim()) return;

    reset();
    setGenerating(true);
    setLoadingStep(0);
    setQuizAnswers({});
    setQuizSubmitted({});

    // Start a simulated progress timer to increment loading step
    const interval = setInterval(() => {
      const currentStep = useLearningStore.getState().loadingStep;
      if (currentStep < loadingSteps.length - 1) {
        setLoadingStep(currentStep + 1);
      } else {
        clearInterval(interval);
      }
    }, 2000);

    try {
      const response = await fetch("/api/learn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey ? `Bearer ${apiKey}` : "",
        },
        body: JSON.stringify({
          topic: targetTopic,
          duration,
          level,
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to generate learning plan";
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          errorMsg = `Server error (${response.status}): ${response.statusText || "Internal Server Error"}`;
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();

      // Finish loading steps
      clearInterval(interval);
      setLoadingStep(4);
      
      // Small pause to let user see "Finalizing..."
      setTimeout(() => {
        setLessonData(result);
        setGenerating(false);
        setTopic(targetTopic);
      }, 500);

    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setGenerating(false);
    }
  };

  const handleQuizSelect = (questionIdx: number, option: string) => {
    if (quizSubmitted[questionIdx]) return;
    setQuizAnswers((prev) => ({ ...prev, [questionIdx]: option }));
  };

  const handleQuizSubmit = (questionIdx: number, correctAns: string) => {
    const userAns = quizAnswers[questionIdx];
    if (!userAns) return;

    setQuizSubmitted((prev) => ({ ...prev, [questionIdx]: true }));

    if (userAns === correctAns) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#8b5cf6", "#6366f1", "#10b981"]
      });
    }
  };

  const renderBeginner = (data: any) => {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Simple Overview */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card interactive={false} className="border-emerald-500/10 bg-zinc-950/20 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <BookOpen size={14} />
                Simple Overview
              </div>
              <div className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                {parseMarkdown(data.overview)}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Why This Matters */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlowCard glowColor="from-emerald-500/10 to-teal-500/10" className="border border-emerald-500/15">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <Lightbulb size={14} />
                Why This Matters
              </div>
              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                {parseMarkdown(data.why_matters)}
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Simple Explanation */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card interactive={false} className="border-white/5 bg-zinc-950/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <Sparkles size={14} />
                Simple Explanation
              </div>
              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
                {parseMarkdown(data.simple_explanation)}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Real-Life Analogy */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <div className="p-6 rounded-2xl border border-teal-500/15 bg-teal-950/5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-400">
              <Layers size={14} />
              Real-Life Analogy
            </div>
            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              {parseMarkdown(data.real_life_analogy)}
            </div>
          </div>
        </motion.div>

        {/* Example */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <Card interactive={false} className="border-white/5 bg-zinc-950/40">
            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                A Simple Example
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {parseMarkdown(data.example)}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Key Takeaways */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1">{data.key_takeaways.length} Key Takeaways</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.key_takeaways.map((takeaway: string, idx: number) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3, scale: 1.01 }}
                className="p-5 rounded-xl border border-emerald-500/10 bg-emerald-950/5 text-left relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} className="text-emerald-400" />
                    <span className="text-[10px] text-zinc-500 font-mono">RULE {idx + 1}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {takeaway}
                  </p>
                </div>
                {isScratchpadOpen && (
                  <div className="pt-3 mt-3 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => handleImportTakeaway(takeaway)}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-400 hover:text-white text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={8} /> Copy to Notes
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mini Quiz */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1 flex items-center gap-1.5">
            <BookOpenCheck size={13} className="text-emerald-400" />
            Beginner Comprehension Checkpoint Quiz
          </h3>
          <div className="space-y-6">
            {data.mini_quiz.map((quiz: any, qIdx: number) => {
              const userAns = quizAnswers[qIdx];
              const isSubmitted = quizSubmitted[qIdx];
              return (
                <GlowCard key={qIdx} glowColor="from-emerald-500/5 to-teal-500/5" className="border border-emerald-500/10">
                  <div className="space-y-5">
                    <div className="border-b border-white/5 pb-3">
                      <span className="text-[10px] text-zinc-500 font-mono">QUESTION {qIdx + 1} OF {data.mini_quiz.length}</span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {quiz.question}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {quiz.options.map((opt: string) => {
                        const isSelected = userAns === opt;
                        const isCorrect = opt === quiz.answer;
                        let optionStyle = "bg-zinc-950/80 border-white/5 hover:border-zinc-800 hover:bg-zinc-900";
                        if (isSelected && !isSubmitted) {
                          optionStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300";
                        } else if (isSubmitted) {
                          if (isCorrect) {
                            optionStyle = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                          } else if (isSelected) {
                            optionStyle = "bg-red-500/15 border-red-500/40 text-red-300";
                          } else {
                            optionStyle = "bg-zinc-950/30 border-white/5 opacity-55";
                          }
                        }
                        return (
                          <button
                            key={opt}
                            disabled={isSubmitted}
                            onClick={() => handleQuizSelect(qIdx, opt)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex justify-between items-center ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {isSubmitted && isCorrect && (
                              <CheckCircle size={15} className="text-emerald-400" />
                            )}
                            {isSubmitted && isSelected && !isCorrect && (
                              <AlertTriangle size={15} className="text-red-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1 flex flex-col gap-3">
                      {!isSubmitted ? (
                        <Button
                          variant="gradient"
                          className="w-full text-xs font-bold"
                          disabled={!userAns}
                          onClick={() => handleQuizSubmit(qIdx, quiz.answer)}
                        >
                          Submit Answer
                        </Button>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1.5 text-xs">
                          <div className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                            {userAns === quiz.answer ? (
                              <span className="text-emerald-400 flex items-center gap-1">✔ Correct Answer</span>
                            ) : (
                              <span className="text-red-400 flex items-center gap-1">✘ Incorrect</span>
                            )}
                          </div>
                          <p className="text-zinc-400 leading-relaxed font-normal">{quiz.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderIntermediate = (data: any) => {
    const themeMap = {
      intermediate: {
        borderColor: "border-violet-500/15",
        textColor: "text-violet-400",
        accentBg: "bg-violet-500/10",
        glowColor: "from-violet-500/5 to-purple-500/5",
        icon: <Cpu size={14} className="text-violet-400" />
      },
      interview: {
        borderColor: "border-amber-500/15",
        textColor: "text-amber-400",
        accentBg: "bg-amber-500/10",
        glowColor: "from-amber-500/5 to-yellow-500/5",
        icon: <Award size={14} className="text-amber-400" />
      },
      revision: {
        borderColor: "border-rose-500/15",
        textColor: "text-rose-400",
        accentBg: "bg-rose-500/10",
        glowColor: "from-rose-500/5 to-red-500/5",
        icon: <Zap size={14} className="text-rose-400" />
      },
      beginner: {
        borderColor: "border-emerald-500/15",
        textColor: "text-emerald-400",
        accentBg: "bg-emerald-500/10",
        glowColor: "from-emerald-500/5 to-teal-500/5",
        icon: <BookOpen size={14} className="text-emerald-400" />
      }
    };
    const theme = themeMap[level as keyof typeof themeMap] || themeMap.intermediate;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Overview */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card interactive={false} className={`${theme.borderColor} bg-zinc-950/20 backdrop-blur-xl p-6`}>
            <div className="space-y-3">
              <div className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${theme.textColor}`}>
                {theme.icon}
                Comprehension Overview
              </div>
              <div className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                {parseMarkdown(data.overview)}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Key Concepts */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1">Core Syllabus Concepts</h3>
          <div className="space-y-4">
            {data.key_concepts.map((concept: any, idx: number) => {
              const isExpanded = expandedConceptIdx === idx;
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden group ${
                    isExpanded
                      ? `${theme.borderColor} bg-zinc-950/20 shadow-lg`
                      : "bg-zinc-950/40 border-white/5 hover:border-zinc-800 hover:bg-zinc-900/30"
                  }`}
                  onClick={() => setExpandedConceptIdx(isExpanded ? null : idx)}
                >
                  <div className="flex justify-between items-start w-full">
                    <h4 className={`text-xs font-black group-hover:${theme.textColor} transition-colors uppercase tracking-wider`}>
                      {concept.title}
                    </h4>
                    {isExpanded ? <ChevronDown size={14} className={theme.textColor} /> : <ChevronRight size={14} className="text-zinc-600" />}
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                      className="mt-3.5 space-y-4 pt-3 border-t border-white/5"
                    >
                      <div className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {parseMarkdown(concept.content)}
                      </div>

                      {concept.sub_concepts && concept.sub_concepts.length > 0 && (
                        <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
                          <span className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500 block">Sub-Concepts</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {concept.sub_concepts.map((sub: string, sIdx: number) => (
                              <div key={sIdx} className="p-2.5 rounded-lg bg-zinc-950/80 border border-white/5 text-xs text-zinc-400 font-medium">
                                {sub}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {concept.tips && concept.tips.length > 0 && (
                        <div className={`p-4 rounded-xl ${theme.accentBg} border ${theme.borderColor} space-y-2`}>
                          <span className={`text-[9px] uppercase tracking-widest font-extrabold flex items-center gap-1.5 ${theme.textColor}`}>
                            <AlertTriangle size={11} /> Important Rule / Tip
                          </span>
                          <ul className="list-disc pl-4 text-xs text-zinc-300 space-y-1 leading-relaxed">
                            {concept.tips.map((tip: string, tIdx: number) => (
                              <li key={tIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {isScratchpadOpen && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImportConcept(concept);
                            }}
                            className={`px-2.5 py-1 rounded ${theme.accentBg} border ${theme.borderColor} ${theme.textColor} hover:text-white text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer`}
                          >
                            <Plus size={8} /> Copy to Scratchpad
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Examples Section */}
        {data.examples && data.examples.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1">Explanatory Walkthroughs & Code</h3>
            <div className="space-y-4">
              {data.examples.map((ex: any, idx: number) => (
                <GlowCard key={idx} glowColor={theme.glowColor} className={`border ${theme.borderColor}`}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                      <Terminal size={14} />
                      {ex.title}
                    </div>
                    <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
                      {parseMarkdown(ex.scenario)}
                    </div>
                    {ex.code_or_data && (
                      <div className="rounded-xl border border-white/5 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap select-text">
                        <code>{ex.code_or_data}</code>
                      </div>
                    )}
                    {ex.explanation && (
                      <p className="text-xs text-zinc-400 italic pl-2 border-l border-zinc-800 leading-relaxed">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>
        )}

        {/* Practice Section */}
        {data.practice_questions && data.practice_questions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1">Interactive Challenges & Scenarios</h3>
            <div className="space-y-4">
              {data.practice_questions.map((pr: any, idx: number) => {
                const isAnswerRevealed = practiceRevealed[idx];
                return (
                  <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-zinc-950/40 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-zinc-500 font-mono">CHALLENGE {idx + 1}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-relaxed">{pr.question}</h4>
                      </div>
                    </div>
                    
                    {pr.guidance && (
                      <div className="text-xs text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-white/5 leading-relaxed font-medium">
                        <strong>Guidance/Hint:</strong> {pr.guidance}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold h-8 border transition-all cursor-pointer ${
                          isAnswerRevealed
                            ? `bg-zinc-800 border-white/20 text-white`
                            : `${theme.accentBg} border-${level === "beginner" ? "emerald" : level === "intermediate" ? "violet" : level === "interview" ? "amber" : "rose"}-500/20 text-zinc-300`
                        }`}
                        onClick={() => setPracticeRevealed(prev => ({ ...prev, [idx]: !isAnswerRevealed }))}
                      >
                        {isAnswerRevealed ? "Hide Solution" : "Reveal Model Answer"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isAnswerRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-3 border-t border-white/5 overflow-hidden"
                        >
                          {pr.expected_answer && (
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-400 block">Ideal Model Answer</span>
                              <div className="text-xs text-zinc-300 leading-relaxed bg-emerald-950/5 border border-emerald-500/10 p-3.5 rounded-xl font-normal">
                                {parseMarkdown(pr.expected_answer)}
                              </div>
                            </div>
                          )}

                          {pr.red_flag && (
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-rose-400 block">Critical Trap / Common Mistake</span>
                              <div className="text-xs text-zinc-300 leading-relaxed bg-rose-950/5 border border-rose-500/10 p-3.5 rounded-xl font-normal">
                                {parseMarkdown(pr.red_flag)}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiz Checkpoint */}
        {data.quiz && data.quiz.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1 flex items-center gap-1.5">
              <BookOpenCheck size={13} className={theme.textColor} />
              Comprehension Checkpoint Quiz
            </h3>
            <div className="space-y-6">
              {data.quiz.map((q: any, qIdx: number) => {
                const userAns = quizAnswers[qIdx];
                const isSubmitted = quizSubmitted[qIdx];
                return (
                  <GlowCard key={qIdx} glowColor={theme.glowColor} className={`border ${theme.borderColor}`}>
                    <div className="space-y-5">
                      <div className="border-b border-white/5 pb-3">
                        <span className="text-[10px] text-zinc-500 font-mono">QUESTION {qIdx + 1} OF {data.quiz.length}</span>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {q.question}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt: string) => {
                          const isSelected = userAns === opt;
                          const isCorrect = opt === q.answer;
                          let optionStyle = "bg-zinc-950/80 border-white/5 hover:border-zinc-800 hover:bg-zinc-900";
                          if (isSelected && !isSubmitted) {
                            optionStyle = `bg-zinc-900 border-zinc-500/40 text-white`;
                          } else if (isSubmitted) {
                            if (isCorrect) {
                              optionStyle = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                            } else if (isSelected) {
                              optionStyle = "bg-red-500/15 border-red-500/40 text-red-300";
                            } else {
                              optionStyle = "bg-zinc-950/30 border-white/5 opacity-55";
                            }
                          }
                          return (
                            <button
                              key={opt}
                              disabled={isSubmitted}
                              onClick={() => handleQuizSelect(qIdx, opt)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex justify-between items-center ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              {isSubmitted && isCorrect && (
                                <CheckCircle size={15} className="text-emerald-400" />
                              )}
                              {isSubmitted && isSelected && !isCorrect && (
                                <AlertTriangle size={15} className="text-red-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-1 flex flex-col gap-3">
                        {!isSubmitted ? (
                          <Button
                            variant="gradient"
                            className="w-full text-xs font-bold"
                            disabled={!userAns}
                            onClick={() => handleQuizSubmit(qIdx, q.answer)}
                          >
                            Submit Answer
                          </Button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 leading-relaxed font-normal"
                          >
                            <strong className="text-emerald-400 block mb-1">Explanation:</strong>
                            {q.explanation}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </GlowCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 pl-1 flex items-center gap-1.5">
            <Terminal size={13} className={theme.textColor} />
            Study Recap & Summary
          </h3>
          <Card interactive={false} className={`border ${theme.borderColor} bg-zinc-950/40 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="relative space-y-4 select-text">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className={`text-xs font-black tracking-widest ${theme.textColor} uppercase`}>REVISION CHEAT SHEET</span>
                <span className="text-[10px] text-zinc-600 font-mono">ACCELERATED DIGEST</span>
              </div>
              <div className="text-xs text-zinc-300 font-normal leading-relaxed whitespace-pre-wrap">
                {parseMarkdown(data.summary)}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderAdaptiveLesson = (data: any) => {
    if (level === "beginner") {
      return renderBeginner(data);
    }
    return renderIntermediate(data);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeItem="learn" />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-screen relative">
        
        {/* API KEY SETTING FLOAT HEADER */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          <AnimatePresence>
            {showKeyInput && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="glass-panel p-3 rounded-xl border border-zinc-800 bg-zinc-950/95 flex items-center gap-2 shadow-2xl"
              >
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Enter API Key (Groq, Gemini, OpenRouter)"
                  className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-xs font-mono w-48 text-white focus:border-violet-500 outline-none"
                />
                <Button size="sm" variant="gradient" className="h-7 px-3 text-[10px] font-bold" onClick={handleSaveApiKey}>
                  Save
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
              apiKey
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
            }`}
          >
            <Key size={12} />
            {apiKey ? "API Key Configured" : "Configure API Key"}
          </button>
        </div>

        {/* SECTION 1: HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-left space-y-2 relative"
        >
          {/* Subtle background glow effect */}
          <div className="absolute -top-12 -left-6 w-72 h-72 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              Learn Any Topic
            </span>{" "}
            <span className="text-white">in Minutes</span>
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base max-w-xl">
            Turn complex subjects into highly personalized, interactive learning plans designed for speed.
          </p>
        </motion.div>

        {/* INPUT PANEL CARD (Topic + Duration + Mode) */}
        <GlowCard glowColor="from-violet-500/10 to-indigo-500/10" className="border border-white/5">
          <div className="space-y-6">
            
            {/* SECTION 2: TOPIC INPUT */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Search size={12} className="text-violet-400" />
                Learning Objective
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputTopic}
                  onChange={(e) => setInputTopic(e.target.value)}
                  placeholder="What would you like to learn today?"
                  className="w-full pl-5 pr-12 py-4 bg-zinc-950/60 border border-white/5 rounded-xl text-sm sm:text-base font-medium placeholder-zinc-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] focus:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] transition-all outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate(inputTopic);
                  }}
                />
                <button
                  onClick={() => handleGenerate(inputTopic)}
                  disabled={isGenerating || !inputTopic.trim()}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                >
                  <Sparkles size={16} />
                </button>
              </div>

              {/* suggestion pills */}
              <div className="flex flex-wrap gap-2 pt-1.5">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      setInputTopic(ex);
                      handleGenerate(ex);
                    }}
                    className="px-3 py-1 rounded-full bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* SEPARATING GRID */}
            {/* TIME SELECTOR AND MODE SELECTOR STACK */}
            <div className="space-y-6">
              
              {/* TIME SELECTOR */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Clock size={12} className="text-violet-400" />
                  Learning Timeframe
                </label>
                
                <div className="flex p-1 rounded-xl bg-zinc-950/80 border border-white/5 relative max-w-md">
                  {[
                    { id: "5m", label: "5 Min" },
                    { id: "10m", label: "10 Min" },
                    { id: "20m", label: "20 Min" },
                    { id: "30m", label: "30 Min" }
                  ].map((t) => {
                    const isActive = duration === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setDuration(t.id as "5m" | "10m" | "20m" | "30m")}
                        className="flex-1 py-2.5 rounded-lg text-xs font-bold text-center select-none cursor-pointer relative z-10 transition-colors"
                      >
                        <span className={isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}>
                          {t.label}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="activeDuration"
                            className="absolute inset-0 bg-white/10 border border-white/5 rounded-lg -z-10 shadow-inner"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODE SELECTOR */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-violet-400" />
                  Learning Mode Selector
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      id: "beginner" as const,
                      label: "Beginner",
                      icon: BookOpen,
                      desc: "Understand from scratch with simple terms & everyday analogies",
                      outcome: "Visual intuition & core principles",
                      color: "emerald",
                      glowColor: "from-emerald-500/20 to-teal-500/20",
                      activeBg: "bg-emerald-950/10 border-emerald-500/40 shadow-[0_0_20px_-3px_rgba(16,185,129,0.15)]",
                      activeText: "text-emerald-400",
                      badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    },
                    {
                      id: "intermediate" as const,
                      label: "Intermediate",
                      icon: Layers,
                      desc: "Dive into practical details, mechanics, and design systems",
                      outcome: "Practical mastery & architectural understanding",
                      color: "indigo",
                      glowColor: "from-indigo-500/20 to-violet-500/20",
                      activeBg: "bg-indigo-950/10 border-indigo-500/40 shadow-[0_0_20px_-3px_rgba(99,102,241,0.15)]",
                      activeText: "text-indigo-400",
                      badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    },
                    {
                      id: "interview" as const,
                      label: "Interview",
                      icon: Award,
                      desc: "Prepare for placements, job loops, trade-offs, and traps",
                      outcome: "Ready for placement rounds & expert technical loops",
                      color: "amber",
                      glowColor: "from-amber-500/20 to-yellow-500/20",
                      activeBg: "bg-amber-950/10 border-amber-500/40 shadow-[0_0_20px_-3px_rgba(245,158,11,0.15)]",
                      activeText: "text-amber-400",
                      badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    },
                    {
                      id: "revision" as const,
                      label: "Quick Revision",
                      icon: Zap,
                      desc: "Refresh knowledge instantly with condensed sheets and facts",
                      outcome: "Fast recall & exam preparedness in minutes",
                      color: "rose",
                      glowColor: "from-rose-500/20 to-red-500/20",
                      activeBg: "bg-rose-950/10 border-rose-500/40 shadow-[0_0_20px_-3px_rgba(244,63,94,0.15)]",
                      activeText: "text-rose-400",
                      badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }
                  ].map((m) => {
                    const isActive = level === m.id;
                    const Icon = m.icon;
                    return (
                      <motion.button
                        key={m.id}
                        type="button"
                        onClick={() => setLevel(m.id)}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`relative p-5 rounded-2xl border text-left flex flex-col justify-between h-[180px] cursor-pointer transition-all duration-300 group overflow-hidden ${
                          isActive
                            ? m.activeBg
                            : "bg-zinc-950/40 border-white/5 hover:border-zinc-800 hover:bg-zinc-900/30"
                        }`}
                      >
                        {/* Glow effect on hover or active */}
                        <div
                          className={`absolute -inset-px bg-gradient-to-r ${m.glowColor} rounded-2xl blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-40 ${
                            isActive ? "opacity-30" : ""
                          } pointer-events-none`}
                        />

                        {/* Animated Selection Border */}
                        {isActive && (
                          <motion.div
                            layoutId="activeModeBorder"
                            className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
                            style={{
                              borderColor: m.id === "beginner" ? "#10b981" : m.id === "intermediate" ? "#6366f1" : m.id === "interview" ? "#f59e0b" : "#f43f5e"
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          />
                        )}

                        <div className="flex justify-between items-center w-full relative z-10">
                          <div className={`p-2 rounded-xl ${isActive ? m.badge : "bg-white/5 text-zinc-400 group-hover:text-zinc-200 transition-colors"}`}>
                            <Icon size={18} />
                          </div>
                          {isActive && (
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${m.badge}`}>
                              Active
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 relative z-10 mt-4">
                          <h4 className="text-sm font-black text-white leading-none tracking-tight">
                            {m.label}
                          </h4>
                          <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-normal line-clamp-2">
                            {m.desc}
                          </p>
                        </div>

                        <div className="w-full border-t border-white/5 pt-2 mt-2 relative z-10 flex justify-between items-center text-[9px]">
                          <span className="text-zinc-500 font-medium">Outcome:</span>
                          <span className={`font-semibold text-right line-clamp-1 ${isActive ? m.activeText : "text-zinc-400"}`}>
                            {m.outcome}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* SECTION 5: GENERATE BUTTON */}
            <div className="pt-2">
              <Button
                variant="gradient"
                className="w-full text-sm font-semibold h-12 relative overflow-hidden group/btn"
                loading={isGenerating}
                onClick={() => handleGenerate(inputTopic)}
                rightIcon={<Sparkles size={16} className="group-hover/btn:animate-pulse" />}
              >
                Generate Accelerated Lesson
              </Button>
            </div>

          </div>
        </GlowCard>

        {/* LOADING EXPERIENCE ANIMATED TIMELINE */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 bg-zinc-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              {/* Background gradient lines */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-indigo-600/5 to-purple-600/5 animate-[pulse_3s_infinite]" />

              <div className="space-y-4 max-w-xl mx-auto text-center">
                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                  <Sparkles size={18} className="text-violet-400 animate-spin" />
                  Generating Personalized Lesson...
                </h3>
                <p className="text-zinc-500 text-xs font-mono">Synthesizing topic boundaries via AI model</p>
              </div>

              {/* Steps timeline */}
              <div className="relative max-w-md mx-auto py-4">
                {/* Visual Line */}
                <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-zinc-800" />

                <div className="space-y-6 relative">
                  {loadingSteps.map((step, idx) => {
                    const isDone = loadingStep > idx;
                    const isActive = loadingStep === idx;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4 pl-1"
                      >
                        <div className="relative z-10 flex items-center justify-center">
                          {isDone ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold">
                              <Check size={14} />
                            </div>
                          ) : isActive ? (
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/50 text-violet-400 flex items-center justify-center text-xs font-bold animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                              <RotateCcw className="animate-spin text-violet-400" size={12} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-600 flex items-center justify-center text-[10px] font-mono">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <span
                            className={`text-xs font-mono ${
                              isDone ? "text-emerald-400" :
                              isActive ? "text-violet-400 font-bold" : "text-zinc-600"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Generation Failed</h4>
              <p className="text-xs text-zinc-400 leading-normal">{error}</p>
            </div>
          </div>
        )}

        {/* AI RESPONSE UI RENDERER */}
        <AnimatePresence>
          {lessonData && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* LESSON SUMMARY HEADER BANNER */}
              <div className="p-6 sm:p-8 rounded-2xl border border-violet-500/10 bg-gradient-to-r from-violet-950/10 via-zinc-950 to-zinc-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="inline-flex gap-1.5 items-center text-[10px] text-violet-400 uppercase font-extrabold tracking-wider">
                    <Sparkles size={10} className="animate-pulse" />
                    Adaptive Lesson Generated ({duration} • {level})
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{topic}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant={isScratchpadOpen ? "gradient" : "secondary"}
                    size="sm"
                    onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                    leftIcon={<Edit3 size={13} />}
                    className="text-xs font-semibold h-8 border border-zinc-800"
                  >
                    {isScratchpadOpen ? "Hide Study Companion" : "Open Study Companion"}
                  </Button>
                  <div className="text-xs text-zinc-500 px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg flex items-center gap-1.5 h-8">
                    <Clock size={12} className="text-violet-400" />
                    Digest: {duration}
                  </div>
                </div>
              </div>

              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Interactive modules */}
                <div className={isScratchpadOpen ? "lg:col-span-7 space-y-8" : "lg:col-span-12 space-y-8"}>
                  
                  {renderAdaptiveLesson(lessonData)}

                </div>

                {/* Right Column: AI Interactive Scratchpad */}
                {isScratchpadOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="lg:col-span-5 glass-panel border border-violet-500/10 rounded-2xl p-5 bg-zinc-950/40 sticky top-6 space-y-5"
                  >
                    {/* Scratchpad Header */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Edit3 size={14} className="text-violet-400" />
                          Active Scratchpad
                        </h3>
                        <p className="text-[10px] text-zinc-500">Study notes companion</p>
                      </div>

                      {/* Saving indicator */}
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                        {isSavingNotes ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-500">Auto-saved</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tab Swapping Header */}
                    <div className="flex space-x-1 glass-panel-light p-1 rounded-lg">
                      {[
                        { id: "notes", label: "My Notes" },
                        { id: "takeaways", label: "Takeaways" },
                        { id: "playground", label: "Playground" }
                      ].map((t) => {
                        const isActive = scratchpadTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setScratchpadTab(t.id as "notes" | "takeaways" | "playground")}
                            className="flex-1 py-1.5 rounded-md text-[10px] font-semibold text-center select-none cursor-pointer relative z-10 transition-colors"
                          >
                            <span className={isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}>
                              {t.label}
                            </span>
                            {isActive && (
                              <motion.div
                                layoutId="activeScratchTab"
                                className="absolute inset-0 bg-white/10 border border-white/5 rounded-md -z-10 shadow-inner"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab contents */}
                    <div className="min-h-[300px] flex flex-col">
                      
                      {/* 1. NOTES TAB */}
                      {scratchpadTab === "notes" && (
                        <div className="flex-1 flex flex-col space-y-3">
                          <textarea
                            value={notesText}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Write notes here or copy concepts from 'Takeaways' tab..."
                            className="flex-1 w-full min-h-[320px] p-3 rounded-lg border border-white/5 bg-zinc-900/40 text-xs sm:text-sm text-zinc-300 focus:border-violet-500/20 font-normal leading-relaxed resize-y placeholder-zinc-600 outline-none"
                          />
                          <div className="text-[10px] text-zinc-500 flex justify-between">
                            <span>Markdown supported</span>
                            <span>{notesText.length} chars</span>
                          </div>
                        </div>
                      )}

                      {/* 2. TAKEAWAYS FINDER TAB */}
                      {scratchpadTab === "takeaways" && (
                        <div className="space-y-4">
                          <div className="text-[11px] text-zinc-500 leading-normal bg-zinc-900/20 border border-white/5 p-3 rounded-lg flex items-start gap-2">
                            <Sparkles size={12} className="text-violet-400 shrink-0 mt-0.5" />
                            <span>Copy concepts directly into your active Scratchpad notes.</span>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {lessonData.key_concepts.map((concept: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-xl border border-white/5 bg-zinc-900/30 hover:border-violet-500/10 transition-colors space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{concept.title}</h4>
                                  <button
                                    onClick={() => handleImportConcept(concept)}
                                    className="px-2 py-0.5 rounded bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-white text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Plus size={8} /> Copy to Notes
                                  </button>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">{concept.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. CODE PLAYGROUND */}
                      {scratchpadTab === "playground" && (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3 flex-1 flex flex-col">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pl-1">
                              <span className="flex items-center gap-1">
                                <Terminal size={11} className="text-violet-400" />
                                simulator_script.py
                              </span>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-zinc-950 overflow-hidden font-mono text-[11px] leading-relaxed p-4 text-zinc-300 flex-1 min-h-[160px] whitespace-pre-wrap select-text">
                              <code>
                                {topic.toLowerCase().includes("gradient") ? (
                                  `# Gradient Descent optimization simulator\nimport numpy as np\n\nweights = 10.0\nlearning_rate = 0.01\ngradient = 2.5\n\nprint("Updating weights...")\nweights = weights - (learning_rate * gradient)\nprint(f"Final weights: {weights}")`
                                ) : topic.toLowerCase().includes("sql") || topic.toLowerCase().includes("join") ? (
                                  `# SQL Join execution simulation\nimport sqlite3\n\nconn = sqlite3.connect(':memory:')\n# Executing query:\n# SELECT o.id, c.name FROM orders o INNER JOIN customers c ON o.cust_id = c.id`
                                ) : (
                                  `# Activation Function execution\nimport numpy as np\n\ninputs = np.array([0.5, -0.2])\nweights = np.array([0.8, 0.4])\nbias = -0.1\n\nz = np.dot(inputs, weights) + bias\nactivation = max(0, z)\nprint(f"ReLU activation: {activation}")`
                                )}
                              </code>
                            </div>

                            <Button
                              variant="gradient"
                              size="sm"
                              loading={isRunningPlayground}
                              onClick={handleRunPlayground}
                              className="w-full text-xs font-bold h-9 mt-1"
                              rightIcon={<Play size={10} fill="currentColor" />}
                            >
                              {isRunningPlayground ? "Running script..." : "Execute Python Script"}
                            </Button>
                          </div>

                          {playgroundOutput && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg border border-white/5 bg-zinc-950 p-3 font-mono text-[10px] text-emerald-400 leading-relaxed whitespace-pre-wrap"
                            >
                              {playgroundOutput}
                            </motion.div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
