"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ChevronRight,
  Lightbulb,
  MessageSquareQuote,
  Layers,
  RotateCcw,
  Brain,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import type { SmartQuizQuestion, QuizMode } from "@/stores/learning-store";
import { modeConfig } from "@/features/quiz/constants/quizPrompts";

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; colorClass: string }> = {
  mcq:       { label: "Multiple Choice", icon: <Layers size={10} />,          colorClass: "text-zinc-400 bg-zinc-800/60 border-zinc-700/40" },
  true_false:{ label: "True / False",    icon: <RotateCcw size={10} />,       colorClass: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  scenario:  { label: "Scenario",        icon: <Brain size={10} />,            colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  interview: { label: "Interview",       icon: <MessageSquareQuote size={10} />, colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  revision:  { label: "Revision",        icon: <Lightbulb size={10} />,        colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

interface QuizProgressProps { current: number; total: number; mode: QuizMode; }

export const QuizProgress: React.FC<QuizProgressProps> = ({ current, total, mode }) => {
  const pct = ((current - 1) / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>QUESTION <span className="text-white font-bold">{current}</span> / {total}</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r",
            mode === "beginner" ? "from-emerald-500 to-teal-400"
            : mode === "intermediate" ? "from-violet-500 to-indigo-400"
            : mode === "interview" ? "from-amber-500 to-orange-400"
            : "from-rose-500 to-pink-400")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Option button ─────────────────────────────────────────────────────────────

interface OptionButtonProps {
  label: string; text: string; isSelected: boolean; isSubmitted: boolean;
  isCorrect: boolean; onClick: () => void; mode: QuizMode; index: number;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  label, text, isSelected, isSubmitted, isCorrect, onClick, mode, index,
}) => {
  const cfg = modeConfig[mode];
  let containerClass = "";
  let labelClass = "";
  let icon: React.ReactNode = null;

  if (!isSubmitted) {
    if (isSelected) {
      containerClass = cn("border-2 bg-zinc-900/80",
        mode === "beginner"    ? "border-emerald-500/60 shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]"
        : mode === "intermediate" ? "border-violet-500/60 shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]"
        : mode === "interview" ? "border-amber-500/60 shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]"
        : "border-rose-500/60 shadow-[0_0_16px_-4px_rgba(244,63,94,0.25)]");
      labelClass = cn("font-black text-white", cfg.textClass);
    } else {
      containerClass = "border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-600 hover:bg-zinc-900/60";
      labelClass = "text-zinc-500";
    }
  } else {
    if (isCorrect) {
      containerClass = "border-2 border-emerald-500/50 bg-emerald-500/8 shadow-[0_0_20px_-6px_rgba(16,185,129,0.3)]";
      labelClass = "font-black text-emerald-400";
      icon = <CheckCircle size={16} className="text-emerald-400 shrink-0" />;
    } else if (isSelected && !isCorrect) {
      containerClass = "border-2 border-red-500/50 bg-red-500/8";
      labelClass = "font-black text-red-400";
      icon = <XCircle size={16} className="text-red-400 shrink-0" />;
    } else {
      containerClass = "border border-zinc-800/40 bg-zinc-950/30 opacity-45";
      labelClass = "text-zinc-600";
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25, ease: "easeOut" }}
      whileHover={!isSubmitted ? { x: 3 } : undefined}
      whileTap={!isSubmitted ? { scale: 0.985 } : undefined}
      disabled={isSubmitted}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 sm:p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer group min-h-[52px]",
        containerClass,
        isSubmitted && "cursor-default"
      )}
    >
      <span className={cn(
        "shrink-0 w-7 h-7 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] font-black border transition-colors duration-200",
        isSelected && !isSubmitted ? cn(cfg.bgClass, cfg.borderClass, cfg.textClass)
          : isSubmitted && isCorrect ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
          : isSubmitted && isSelected && !isCorrect ? "bg-red-500/20 border-red-500/30 text-red-400"
          : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:border-zinc-700"
      )}>
        {label}
      </span>
      <span className={cn("text-xs sm:text-sm font-semibold leading-relaxed flex-1", labelClass)}>
        {text}
      </span>
      {icon}
    </motion.button>
  );
};

// ─── Feedback panel ────────────────────────────────────────────────────────────

interface FeedbackPanelProps { isCorrect: boolean; explanation: string; followUp?: string; mode: QuizMode; }

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ isCorrect, explanation, followUp }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={cn("rounded-xl border p-4 space-y-3",
      isCorrect ? "bg-emerald-950/20 border-emerald-500/20" : "bg-red-950/15 border-red-500/15")}
  >
    <div className="flex items-center gap-2">
      {isCorrect ? (
        <><CheckCircle size={15} className="text-emerald-400 shrink-0" /><span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Correct!</span></>
      ) : (
        <><XCircle size={15} className="text-red-400 shrink-0" /><span className="text-[11px] font-black uppercase tracking-wider text-red-400">Incorrect</span></>
      )}
    </div>
    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">{explanation}</p>
    {followUp && (
      <div className="pt-2 border-t border-white/5 space-y-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
          <MessageSquareQuote size={10} /> Strong Interview Answer
        </span>
        <p className="text-xs text-zinc-400 leading-relaxed italic">{followUp}</p>
      </div>
    )}
  </motion.div>
);

// ─── Main QuizCard ─────────────────────────────────────────────────────────────

export interface QuizCardProps {
  question: SmartQuizQuestion; questionNumber: number; totalQuestions: number;
  selectedOption: string | undefined; isSubmitted: boolean; mode: QuizMode;
  onSelect: (option: string) => void; onSubmit: () => void; onNext: () => void; isLastQuestion: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question, questionNumber, selectedOption, isSubmitted,
  mode, onSelect, onSubmit, onNext, isLastQuestion,
}) => {
  const cfg = modeConfig[mode];
  const typeMeta = TYPE_META[question.type] ?? TYPE_META.mcq;
  const isCorrect = isSubmitted && selectedOption === question.correct_answer;

  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className={cn(
        "relative rounded-2xl border overflow-hidden glass-panel",
        isSubmitted
          ? isCorrect
            ? "border-emerald-500/15 shadow-[0_0_40px_-12px_rgba(16,185,129,0.15)]"
            : "border-red-500/15 shadow-[0_0_40px_-12px_rgba(239,68,68,0.12)]"
          : cn(cfg.borderClass, "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]")
      )}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="relative p-4 sm:p-6 space-y-4 sm:space-y-5">

          {/* Header — type badge + question + counter */}
          <div className="flex items-start gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest shrink-0",
                  typeMeta.colorClass
                )}>
                  {typeMeta.icon}{typeMeta.label}
                </span>
                {/* Counter bubble — shown at all sizes, just smaller on mobile */}
                <div className={cn(
                  "shrink-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border",
                  cfg.bgClass, cfg.borderClass, cfg.textClass
                )}>
                  {questionNumber}
                </div>
              </div>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base font-bold text-white leading-snug"
              >
                {question.question}
              </motion.h3>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 sm:space-y-2.5">
            {question.options.map((opt, idx) => (
              <OptionButton
                key={opt}
                label={OPTION_LABELS[idx] ?? String(idx + 1)}
                text={opt}
                isSelected={selectedOption === opt}
                isSubmitted={isSubmitted}
                isCorrect={opt === question.correct_answer}
                onClick={() => onSelect(opt)}
                mode={mode}
                index={idx}
              />
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {isSubmitted && (
              <FeedbackPanel
                isCorrect={isCorrect}
                explanation={question.explanation}
                followUp={question.follow_up}
                mode={mode}
              />
            )}
          </AnimatePresence>

          {/* Action button */}
          <div className="pt-1">
            {!isSubmitted ? (
              <Button
                variant={mode === "beginner" ? "emerald" : mode === "interview" ? "primary" : "gradient"}
                size="lg"
                className="w-full font-bold text-sm"
                disabled={!selectedOption}
                onClick={onSubmit}
              >
                Submit Answer
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Button
                  variant={mode === "beginner" ? "emerald" : mode === "interview" ? "primary" : "gradient"}
                  size="lg"
                  className="w-full font-bold text-sm"
                  onClick={onNext}
                  rightIcon={<ChevronRight size={16} />}
                >
                  {isLastQuestion ? "See Results" : "Next Question"}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
