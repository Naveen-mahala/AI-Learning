"use client";

import React from "react";
import { Flashcard } from "./Flashcard";
import { Flashcard as FlashcardType } from "@/lib/flashcardStore";
import { AnimatePresence, motion } from "framer-motion";

interface CardStackProps {
  cards: FlashcardType[];
  currentIndex: number;
  onRate: (index: number, confidence: "easy" | "medium" | "hard") => void;
  onNext: () => void;
  onPrev: () => void;
}

export const CardStack: React.FC<CardStackProps> = ({
  cards,
  currentIndex,
  onRate,
  onNext,
  onPrev,
}) => {
  // Only render the current card and the next 2 cards in the stack to optimize DOM elements
  const visibleCards = cards
    .map((card, index) => ({ card, index }))
    .filter(({ index }) => index >= currentIndex && index < currentIndex + 3);

  if (cards.length === 0) return null;

  return (
    <div className="relative w-full flex justify-center items-center h-[460px] sm:h-[490px]">
      <AnimatePresence mode="popLayout">
        {visibleCards.map(({ card, index }) => {
          const isActive = index === currentIndex;
          const position = index - currentIndex; // 0 for active, 1 for next, 2 for second-next

          // Compute custom styles for card stack layer depth
          const stackStyles = {
            zIndex: 30 - position * 10,
            scale: 1 - position * 0.05,
            y: position * 12,
            opacity: position === 0 ? 1 : position === 1 ? 0.6 : 0.25,
            filter: position > 0 ? "blur(1px)" : "none",
          };

          return (
            <motion.div
              key={index} // Using index is safe here as card list is static during viewer phase
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={stackStyles}
              exit={{ 
                x: -300, 
                opacity: 0,
                scale: 0.8,
                rotate: -15,
                transition: { duration: 0.3, ease: "easeInOut" } 
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 24,
              }}
              className="absolute w-full flex justify-center"
              style={{ pointerEvents: isActive ? "auto" : "none" }}
            >
              <Flashcard
                card={card}
                isActive={isActive}
                onRate={(confidence) => onRate(index, confidence)}
                onNext={onNext}
                onPrev={onPrev}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* EMPTY STATE BACKUP DECK */}
      {visibleCards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-8 border border-white/5 bg-zinc-950/40 rounded-2xl max-w-sm w-full glass-panel flex flex-col items-center justify-center space-y-3"
        >
          <div className="h-10 w-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600">
            📭
          </div>
          <h4 className="text-sm font-bold text-white">No cards remaining</h4>
          <p className="text-zinc-500 text-xs">All cards have been completed in this round.</p>
        </motion.div>
      )}
    </div>
  );
};
