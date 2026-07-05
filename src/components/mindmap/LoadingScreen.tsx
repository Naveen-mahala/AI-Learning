"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

interface LoadingScreenProps {
  currentStep: number; // 0 to 4
  topic: string;
}

const LOADING_STEPS = [
  "Analyzing Topic",
  "Building Knowledge Structure",
  "Creating Relationships",
  "Generating Visual Map",
  "Rendering Knowledge Graph",
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ currentStep, topic }) => {
  return (
    <div className="fixed inset-0 bg-[#030303]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Background ambient glowing mesh */}
      <div className="absolute top-[20%] left-[30%] w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-[20%] right-[30%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow" />

      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col items-center text-center space-y-8 relative overflow-hidden">
        {/* Floating particles inside the loader */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Central glowing animated spinner */}
        <div className="relative">
          <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-20 h-20 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-indigo-500 border-l-transparent flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          >
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          </motion.div>
        </div>

        {/* Header Text */}
        <div className="space-y-2 relative z-10">
          <h2 className="text-xl font-bold text-white tracking-tight">AI Knowledge Engine</h2>
          <p className="text-zinc-400 text-sm">
            Mapping out <span className="text-violet-400 font-semibold">&quot;{topic}&quot;</span> into a visual learning graph...
          </p>
        </div>

        {/* Staggered progress steps list */}
        <div className="w-full space-y-4 text-left relative z-10 border-t border-white/5 pt-6">
          {LOADING_STEPS.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isActive = currentStep === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-violet-500 animate-spin flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-700 flex-shrink-0" />
                  )}
                  <span
                    className={
                      isCompleted
                        ? "text-zinc-400 line-through decoration-zinc-800"
                        : isActive
                        ? "text-white font-medium shadow-sm"
                        : "text-zinc-600"
                    }
                  >
                    {step}
                  </span>
                </div>

                {/* Animated status text */}
                {isActive && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs text-violet-400 uppercase font-semibold tracking-wider"
                  >
                    Processing
                  </motion.span>
                )}
                {isCompleted && (
                  <span className="text-xs text-emerald-500/80 font-medium">Done</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min((currentStep / 4) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};
