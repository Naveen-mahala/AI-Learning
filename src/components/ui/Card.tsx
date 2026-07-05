"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  children: React.ReactNode;
  hoverGlow?: "indigo" | "violet" | "emerald" | "none";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverGlow = "none", interactive = true, ...props }, ref) => {
    const glowClasses = {
      indigo: "hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] hover:border-indigo-500/30",
      violet: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] hover:border-violet-500/30",
      emerald: "hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] hover:border-emerald-500/30",
      none: "",
    };

    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "glass-panel rounded-xl p-6 transition-all duration-300 relative overflow-hidden group",
          interactive && "cursor-pointer",
          hoverGlow !== "none" && glowClasses[hoverGlow],
          className
        )}
        {...props}
      >
        {/* Border glow shine on hover */}
        {interactive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
        )}
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className,
  glowColor = "from-violet-500/20 to-indigo-500/20",
  ...props
}) => {
  return (
    <div className={cn("relative group rounded-xl p-[1px] overflow-hidden", className)} {...props}>
      <div
        className={cn(
          "absolute -inset-px bg-gradient-to-r rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500 group-hover:duration-200",
          glowColor
        )}
      />
      <div className="relative glass-panel rounded-xl p-6 bg-zinc-950/90 h-full w-full">
        {children}
      </div>
    </div>
  );
};
