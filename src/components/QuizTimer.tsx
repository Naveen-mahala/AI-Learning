"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizMode, QuizDuration } from "@/lib/store";

// ─── Duration → seconds map ───────────────────────────────────────────────────

const DURATION_SECONDS: Record<QuizDuration, number> = {
  "5m":  5  * 60,
  "10m": 10 * 60,
  "20m": 20 * 60,
  "30m": 30 * 60,
};

// ─── Mode colour tokens ────────────────────────────────────────────────────────

const MODE_COLORS: Record<QuizMode, { ring: string; text: string; bg: string; border: string }> = {
  beginner:     { ring: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  intermediate: { ring: "#8b5cf6", text: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
  interview:    { ring: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  revision:     { ring: "#f43f5e", text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"    },
};

// ─── SVG ring timer ───────────────────────────────────────────────────────────

interface RingProps {
  pct: number;       // 0–1, how much of the ring is still filled
  color: string;     // hex stroke colour
  size: number;
  urgent: boolean;   // < 60 s
  warning: boolean;  // < 25 %
}

const TimerRing: React.FC<RingProps> = ({ pct, color, size, urgent, warning }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = urgent ? "#ef4444" : warning ? "#f59e0b" : color;

  return (
    <svg width={size} height={size} className="rotate-[-90deg] shrink-0">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      {/* Progress */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        transition={{ duration: 0.8, ease: "linear" }}
        style={{ filter: `drop-shadow(0 0 4px ${strokeColor}66)` }}
      />
    </svg>
  );
};

// ─── Format mm:ss ─────────────────────────────────────────────────────────────

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuizTimerProps {
  duration: QuizDuration;
  mode: QuizMode;
  isRunning: boolean;       // true when quiz is in "active" phase
  onTimeUp: () => void;     // called when countdown hits 0
}

// ─── Component ────────────────────────────────────────────────────────────────

export const QuizTimer: React.FC<QuizTimerProps> = ({ duration, mode, isRunning, onTimeUp }) => {
  const total = DURATION_SECONDS[duration];
  const [remaining, setRemaining] = useState(total);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledTimeUp = useRef(false);
  const colors = MODE_COLORS[mode];

  // Reset whenever a new quiz starts (duration/mode changes)
  useEffect(() => {
    setRemaining(total);
    calledTimeUp.current = false;
  }, [total, duration, mode]);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        if (!calledTimeUp.current) {
          calledTimeUp.current = true;
          // defer the callback so it doesn't fire mid-render
          setTimeout(onTimeUp, 0);
        }
        return 0;
      }
      return prev - 1;
    });
  }, [onTimeUp]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, remaining, tick]);

  const pct = remaining / total;
  const warning = pct < 0.25;
  const urgent = remaining <= 60 && remaining > 0;
  const done = remaining === 0;

  const textColor = done ? "text-zinc-600"
    : urgent ? "text-red-400"
    : warning ? "text-amber-400"
    : colors.text;

  const borderColor = done ? "border-zinc-800/60"
    : urgent ? "border-red-500/30"
    : warning ? "border-amber-500/30"
    : colors.border;

  const bgColor = done ? "bg-zinc-900/40"
    : urgent ? "bg-red-500/8"
    : warning ? "bg-amber-500/8"
    : colors.bg;

  const ringColor = done ? "#3f3f46"
    : urgent ? "#ef4444"
    : warning ? "#f59e0b"
    : MODE_COLORS[mode].ring;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors duration-700",
        bgColor, borderColor,
        urgent && !done && "animate-pulse"
      )}
    >
      {/* Ring */}
      <TimerRing pct={pct} color={ringColor} size={28} urgent={urgent && !done} warning={warning && !urgent} />

      {/* Time text */}
      <div className="flex flex-col leading-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={remaining}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={cn("text-sm font-black tabular-nums tracking-tight", textColor)}
          >
            {done ? "0:00" : fmt(remaining)}
          </motion.span>
        </AnimatePresence>
        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest mt-0.5">
          {done ? "Time's up" : urgent ? "Hurry!" : warning ? "Running low" : "Remaining"}
        </span>
      </div>

      {/* Icon */}
      <Timer size={13} className={cn("shrink-0 ml-0.5", textColor)} />
    </motion.div>
  );
};
