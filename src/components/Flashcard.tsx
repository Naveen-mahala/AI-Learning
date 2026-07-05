"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Sparkles, Lightbulb, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Flashcard as FlashcardType } from "@/lib/flashcardStore";

interface FlashcardProps {
  card: FlashcardType;
  isActive: boolean;
  onRate: (confidence: "easy" | "medium" | "hard") => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  card,
  isActive,
  onRate,
  onNext,
  onPrev,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Motion values for tracking swipe gesture coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamically calculate rotation and opacity overlays based on drag offset
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  
  // Opacities for direction overlays
  const rightOpacity = useTransform(x, [0, 120], [0, 1]); // Prev Card (Swipe Right)
  const leftOpacity = useTransform(x, [-120, 0], [1, 0]);  // Next Card (Swipe Left)
  const upOpacity = useTransform(y, [-120, 0], [1, 0]);    // Mark Known (Swipe Up)
  const downOpacity = useTransform(y, [0, 120], [0, 1]);    // Review Again (Swipe Down)

  const handleTap = () => {
    if (!isActive) return;
    setIsFlipped(!isFlipped);
  };

  const handleDragEnd = (event: any, info: any) => {
    if (!isActive) return;

    const threshold = 120;
    const { offset } = info;

    // Detect primary swipe direction based on magnitude
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    if (absX > absY) {
      // Horizontal swipe
      if (offset.x > threshold) {
        // Swipe Right -> Previous Card
        onPrev();
      } else if (offset.x < -threshold) {
        // Swipe Left -> Next Card
        onNext();
      }
    } else {
      // Vertical swipe
      if (offset.y < -threshold) {
        // Swipe Up -> Mark Known (confidence = easy)
        onRate("easy");
        onNext();
      } else if (offset.y > threshold) {
        // Swipe Down -> Review Again (confidence = hard)
        onRate("hard");
        onNext();
      }
    }
    
    // Reset motion values after swipe is processed
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="relative w-full max-w-[420px] h-[450px] sm:h-[480px] select-none"
      style={{ perspective: "1500px" }}
    >
      {/* GESTURE OVERLAY LABELS */}
      {isActive && (
        <>
          {/* Swipe Left -> Next */}
          <motion.div
            style={{ opacity: leftOpacity }}
            className="absolute top-8 right-8 z-30 bg-violet-600/90 text-white px-4 py-2 rounded-lg font-bold border border-violet-400/20 shadow-lg pointer-events-none uppercase text-sm tracking-wider flex items-center gap-1.5"
          >
            Next Card
          </motion.div>

          {/* Swipe Right -> Prev */}
          <motion.div
            style={{ opacity: rightOpacity }}
            className="absolute top-8 left-8 z-30 bg-zinc-800/95 text-zinc-300 px-4 py-2 rounded-lg font-bold border border-white/5 shadow-lg pointer-events-none uppercase text-sm tracking-wider flex items-center gap-1.5"
          >
            Prev Card
          </motion.div>

          {/* Swipe Up -> Easy / Known */}
          <motion.div
            style={{ opacity: upOpacity }}
            className="absolute inset-x-8 top-1/3 z-30 bg-emerald-500/95 text-zinc-950 px-5 py-3 rounded-xl font-extrabold border border-emerald-400/20 shadow-2xl pointer-events-none uppercase text-center text-base tracking-widest flex flex-col items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={24} className="text-zinc-950" />
            <span>Mark Known (+15 XP)</span>
          </motion.div>

          {/* Swipe Down -> Hard / Review Again */}
          <motion.div
            style={{ opacity: downOpacity }}
            className="absolute inset-x-8 bottom-1/3 z-30 bg-rose-600/95 text-white px-5 py-3 rounded-xl font-extrabold border border-rose-400/20 shadow-2xl pointer-events-none uppercase text-center text-base tracking-widest flex flex-col items-center justify-center gap-1.5"
          >
            <AlertCircle size={24} className="text-white" />
            <span>Review Again</span>
          </motion.div>
        </>
      )}

      {/* DRAGGABLE CARD CONTAINER */}
      <motion.div
        style={{
          x: isActive ? x : 0,
          y: isActive ? y : 0,
          rotate: isActive ? rotate : 0,
          transformStyle: "preserve-3d",
        }}
        drag={isActive}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isActive ? 1 : 0.95,
          y: isActive ? 0 : 12,
        }}
        whileDrag={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
      >
        {/* FRONT SIDE */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className={cn(
            "absolute inset-0 w-full h-full glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10 bg-zinc-950/80 transition-all duration-300",
            isActive && "border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.1)]"
          )}
        >
          {/* Decorative Backlight Glow */}
          <div className="absolute -top-[30%] -right-[30%] w-60 h-60 bg-violet-600/10 rounded-full blur-[65px] pointer-events-none" />
          
          {/* Card Header */}
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-violet-400/20 bg-violet-400/5 text-violet-400">
              {card.difficulty} Mode
            </span>
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
              <RefreshCw size={11} className="animate-spin-slow text-violet-400" />
              <span>Tap to Flip</span>
            </div>
          </div>

          {/* Card Front Content */}
          <div className="my-auto text-center space-y-4 relative z-10 px-2">
            <div className="inline-flex h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 items-center justify-center text-violet-400 mx-auto">
              <Sparkles size={16} />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
              {card.front}
            </h3>
            <p className="text-zinc-500 text-xs max-w-[280px] mx-auto leading-relaxed">
              Think about the definition or answer, then tap to check your knowledge.
            </p>
          </div>

          {/* Card Front Footer (Gesture Tip) */}
          <div className="border-t border-white/5 pt-4 text-center relative z-10">
            <span className="text-[10px] font-semibold text-zinc-500 tracking-wide uppercase">
              Swipe Left: Skip • Swipe Up: Know • Swipe Down: Review
            </span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className={cn(
            "absolute inset-0 w-full h-full glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10 bg-zinc-950/85 transition-all duration-300",
            isActive && "border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
          )}
        >
          {/* Decorative Backlight Glow */}
          <div className="absolute -bottom-[30%] -left-[30%] w-60 h-60 bg-emerald-600/10 rounded-full blur-[65px] pointer-events-none" />

          {/* Card Header */}
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-emerald-400">
              Answer Reveal
            </span>
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
              <RefreshCw size={11} className="text-emerald-400" />
              <span>Tap to Flip</span>
            </div>
          </div>

          {/* Card Back Content */}
          <div className="my-auto space-y-4 sm:space-y-5 relative z-10 overflow-y-auto max-h-[300px] pr-1">
            {/* Core Answer */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Core Answer</span>
              <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {card.back}
              </h4>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Explanation</span>
              <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                {card.explanation}
              </p>
            </div>

            {/* Memory Tip */}
            {card.memoryTip && (
              <div className="rounded-xl border border-violet-500/10 bg-gradient-to-r from-violet-950/20 to-indigo-950/20 p-3 flex gap-2.5 items-start">
                <div className="h-6 w-6 rounded-md bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                  <Lightbulb size={13} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider block mb-0.5">Memory Tip</span>
                  <p className="text-zinc-300 text-[11px] leading-normal font-medium">
                    {card.memoryTip}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card Back Footer */}
          <div className="border-t border-white/5 pt-3 flex justify-between items-center relative z-10">
            <span className="text-[9px] font-semibold text-zinc-500 uppercase">
              Did you know this?
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate("easy");
                  onNext();
                }}
                className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
              >
                Yes, easy
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate("hard");
                  onNext();
                }}
                className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-400 text-[10px] font-bold transition-colors cursor-pointer"
              >
                No, review
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
