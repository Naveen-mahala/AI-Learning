"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Target, CheckCircle, XCircle, Zap, ArrowRight,
  RotateCcw, BookOpen, TrendingUp, AlertTriangle,
  ChevronRight, Star, Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { GlowCard } from "@/components/Card";
import type { QuizResult as QuizResultData, SmartQuizData, QuizMode } from "@/lib/store";
import { modeConfig } from "@/lib/quizPrompts";

// ─── Score ring — responsive size ─────────────────────────────────────────────

interface ScoreRingProps { score: number; mode: QuizMode; size: number; }

const ScoreRing: React.FC<ScoreRingProps> = ({ score, mode, size }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const strokeColor =
    mode === "beginner" ? "#10b981" : mode === "intermediate" ? "#8b5cf6"
    : mode === "interview" ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={strokeColor} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
          className="text-xl sm:text-2xl font-black text-white leading-none"
        >
          {score}%
        </motion.span>
        <span className="text-[9px] text-zinc-500 font-mono mt-0.5">SCORE</span>
      </div>
    </div>
  );
};

// ─── Responsive score ring wrapper ────────────────────────────────────────────

const ResponsiveScoreRing: React.FC<{ score: number; mode: QuizMode }> = ({ score, mode }) => {
  const [size, setSize] = React.useState(100);
  React.useEffect(() => {
    const update = () => setSize(window.innerWidth < 400 ? 88 : window.innerWidth < 640 ? 96 : 116);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return <ScoreRing score={score} mode={mode} size={size} />;
};

// ─── Stat pill ─────────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ReactNode; label: string; value: string | number;
  colorClass: string; bgClass: string; borderClass: string; delay?: number;
}

const StatPill: React.FC<StatPillProps> = ({ icon, label, value, colorClass, bgClass, borderClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={cn("flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border text-center", bgClass, borderClass)}
  >
    <span className={cn("mb-0.5", colorClass)}>{icon}</span>
    <span className={cn("text-base sm:text-xl font-black", colorClass)}>{value}</span>
    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest leading-tight">{label}</span>
  </motion.div>
);

// ─── Answer review row ─────────────────────────────────────────────────────────

interface AnswerRowProps {
  index: number; question: string; selected: string;
  correct: string; isCorrect: boolean; explanation: string;
}

const AnswerRow: React.FC<AnswerRowProps> = ({ index, question, selected, correct, isCorrect, explanation }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("rounded-xl border overflow-hidden transition-colors duration-200",
        isCorrect ? "border-emerald-500/15 bg-emerald-950/10" : "border-red-500/15 bg-red-950/8")}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left cursor-pointer group"
      >
        <span className="shrink-0 mt-0.5">
          {isCorrect
            ? <CheckCircle size={15} className="text-emerald-400" />
            : <XCircle size={15} className="text-red-400" />}
        </span>
        <div className="flex-1 space-y-0.5 min-w-0">
          <p className="text-xs font-semibold text-zinc-200 leading-snug line-clamp-2">{index + 1}. {question}</p>
          {!isCorrect && (
            <p className="text-[10px] text-zinc-500">
              Your answer: <span className="text-red-400 font-semibold">{selected}</span>
            </p>
          )}
        </div>
        <ChevronRight size={13} className={cn("shrink-0 mt-0.5 text-zinc-600 transition-transform duration-200", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3"
        >
          {!isCorrect && (
            <p className="text-[10px] text-zinc-400">
              Correct answer: <span className="text-emerald-400 font-semibold">{correct}</span>
            </p>
          )}
          <p className="text-xs text-zinc-400 leading-relaxed">{explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── Performance label ─────────────────────────────────────────────────────────

function getPerformanceLabel(score: number) {
  if (score === 100) return { label: "Perfect",     sub: "Flawless execution",            color: "text-yellow-400" };
  if (score >= 90)  return { label: "Expert",       sub: "Outstanding performance",       color: "text-emerald-400" };
  if (score >= 75)  return { label: "Strong",       sub: "Above average understanding",   color: "text-violet-400" };
  if (score >= 60)  return { label: "Progressing",  sub: "Good foundation, keep going",   color: "text-sky-400" };
  if (score >= 40)  return { label: "Developing",   sub: "Review the weak areas below",   color: "text-amber-400" };
  return              { label: "Needs Work",   sub: "Don't give up — retry the quiz", color: "text-rose-400" };
}

// ─── Main QuizResult ───────────────────────────────────────────────────────────

export interface QuizResultProps {
  result: QuizResultData; quizData: SmartQuizData; mode: QuizMode;
  onRetry: () => void; onNewTopic: () => void; onLearnMore: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  result, quizData, mode, onRetry, onNewTopic, onLearnMore,
}) => {
  const cfg = modeConfig[mode];
  const perf = getPerformanceLabel(result.score);
  const hasConfettiFired = useRef(false);
  const insights = quizData.performance_insights_template;

  useEffect(() => {
    if (!hasConfettiFired.current && result.score >= 75) {
      hasConfettiFired.current = true;
      const colors = mode === "beginner" ? ["#10b981","#34d399","#6ee7b7"]
        : mode === "intermediate" ? ["#8b5cf6","#6366f1","#a78bfa"]
        : mode === "interview" ? ["#f59e0b","#fbbf24","#fcd34d"]
        : ["#f43f5e","#fb7185","#fda4af"];
      setTimeout(() => confetti({ particleCount: result.score === 100 ? 200 : 120, spread: 80, origin: { y: 0.6 }, colors }), 400);
    }
  }, [result.score, mode]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 sm:space-y-8">

      {/* Hero banner */}
      <GlowCard glowColor={cfg.glowClass} className={cn("border", cfg.borderClass)}>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="shrink-0">
            <ResponsiveScoreRing score={result.score} mode={mode} />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest mb-2", cfg.bgClass, cfg.borderClass, cfg.textClass)}>
                {cfg.label} Quiz Complete
              </span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={cn("text-xl sm:text-3xl font-black break-words", perf.color)}>
              {result.badge}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-xs sm:text-sm text-zinc-400">
              {perf.sub} — {result.correctAnswers} of {result.totalQuestions} correct
            </motion.p>
          </div>
        </div>
      </GlowCard>

      {/* Stats grid — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatPill icon={<Target size={15} />}      label="Accuracy" value={result.accuracy}        colorClass={cfg.textClass}         bgClass={cfg.bgClass}            borderClass={cfg.borderClass}             delay={0.1}  />
        <StatPill icon={<CheckCircle size={15} />} label="Correct"  value={result.correctAnswers}  colorClass="text-emerald-400"      bgClass="bg-emerald-500/8"       borderClass="border-emerald-500/20"       delay={0.15} />
        <StatPill icon={<Zap size={15} />}         label="XP Earned" value={`+${result.xpEarned}`} colorClass="text-yellow-400"       bgClass="bg-yellow-500/8"        borderClass="border-yellow-500/20"        delay={0.2}  />
        <StatPill icon={<Flame size={15} />}       label="Streak"   value="🔥 3"                   colorClass="text-orange-400"       bgClass="bg-orange-500/8"        borderClass="border-orange-500/20"        delay={0.25} />
      </div>

      {/* AI Insights */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3 sm:space-y-4">
        <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
          <TrendingUp size={12} className={cfg.textClass} />
          AI Performance Insights
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-950/10 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
              <Star size={11} /> Your Strengths
            </div>
            <ul className="space-y-2">
              {insights.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                  <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-950/8 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <AlertTriangle size={11} /> Areas to Review
            </div>
            <ul className="space-y-2">
              {insights.weak_areas.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />{w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={cn("p-4 rounded-xl border space-y-1.5", cfg.bgClass, cfg.borderClass)}>
          <div className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", cfg.textClass)}>
            <ArrowRight size={11} /> Recommended Next Step
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{insights.recommended_next_step}</p>
        </div>
      </motion.div>

      {/* Question review */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="space-y-3">
        <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
          <BookOpen size={12} className={cfg.textClass} /> Question Review
        </h3>
        <div className="space-y-2">
          {result.answers.map((ans, i) => {
            const q = quizData.questions[i];
            if (!q) return null;
            return (
              <AnswerRow key={i} index={i} question={q.question} selected={ans.selectedOption}
                correct={q.correct_answer} isCorrect={ans.isCorrect} explanation={q.explanation} />
            );
          })}
        </div>
      </motion.div>

      {/* Action buttons — stack on mobile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <Button variant="secondary" size="lg" className="w-full font-bold" leftIcon={<RotateCcw size={15} />} onClick={onRetry}>
          Retry Quiz
        </Button>
        <Button variant="secondary" size="lg" className="w-full font-bold" leftIcon={<BookOpen size={15} />} onClick={onLearnMore}>
          Learn More
        </Button>
        <Button variant={mode === "beginner" ? "emerald" : "gradient"} size="lg" className="w-full font-bold"
          rightIcon={<ChevronRight size={15} />} onClick={onNewTopic}>
          New Quiz
        </Button>
      </motion.div>

    </motion.div>
  );
};
