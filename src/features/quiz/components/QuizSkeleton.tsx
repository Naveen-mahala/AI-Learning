"use client";

import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";
import type { QuizMode } from "@/stores/learning-store";
import { modeConfig } from "@/features/quiz/constants/quizPrompts";

const LOADING_STEPS = [
  { label: "Analyzing topic",               sub: "Building concept map…" },
  { label: "Selecting question types",      sub: "Matching to your learning mode…" },
  { label: "Crafting questions",            sub: "Ensuring reasoning over memorization…" },
  { label: "Generating distractors",        sub: "Making wrong answers plausibly wrong…" },
  { label: "Writing explanations",          sub: "Adding educational insights…" },
  { label: "Generating performance insights", sub: "Personalizing your assessment…" },
];

interface QuizSkeletonProps { step?: number; mode?: QuizMode; topic?: string; }

export const QuizSkeleton: React.FC<QuizSkeletonProps> = ({
  step = 0, mode = "intermediate", topic = "",
}) => {
  const cfg = modeConfig[mode];
  const currentStep = LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)];

  return (
    <div className="space-y-6 sm:space-y-8 w-full">

      {/* Status header */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn("h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center border", cfg.bgClass, cfg.borderClass)}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className={cn("h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-transparent border-t-current", cfg.textClass)}
            />
          </motion.div>
        </div>

        <div className="text-center space-y-1 px-4">
          <motion.p key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={cn("text-sm font-bold", cfg.textClass)}>
            {currentStep.label}
          </motion.p>
          <motion.p key={`${step}-sub`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-xs text-zinc-500">
            {currentStep.sub}
          </motion.p>
          {topic && (
            <p className="text-[10px] text-zinc-600 font-mono pt-1">
              Topic: <span className="text-zinc-400">{topic}</span>
            </p>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5">
          {LOADING_STEPS.map((_, i) => (
            <motion.div key={i}
              className={cn("rounded-full transition-all duration-500",
                i <= step ? cn("w-5 h-1.5", cfg.bgClass.replace("/10", "/60")) : "w-1.5 h-1.5 bg-zinc-800")}
              animate={i === step ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* Fake card skeleton */}
      <div className="glass-panel rounded-2xl border border-white/5 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-4/5 rounded-lg" />
          </div>
          <Skeleton className="shrink-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full" />
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-4 sm:p-3.5 rounded-xl border border-zinc-800/50 bg-zinc-950/40 min-h-[52px]">
              <Skeleton className="shrink-0 h-7 w-7 sm:h-6 sm:w-6 rounded-md" />
              <Skeleton className={cn("h-3.5 rounded", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
            </motion.div>
          ))}
        </div>

        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Progress placeholder */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r",
              mode === "beginner" ? "from-emerald-500/40 to-teal-400/40"
              : mode === "intermediate" ? "from-violet-500/40 to-indigo-400/40"
              : mode === "interview" ? "from-amber-500/40 to-orange-400/40"
              : "from-rose-500/40 to-pink-400/40")}
            animate={{ width: ["0%", "45%", "20%", "55%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

    </div>
  );
};
