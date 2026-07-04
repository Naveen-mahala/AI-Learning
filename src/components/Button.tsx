"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  variant?: "primary" | "secondary" | "gradient" | "ghost" | "emerald";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs rounded-md h-8",
      md: "px-4 py-2 text-sm rounded-lg h-10",
      lg: "px-6 py-3 text-base rounded-xl h-12",
    };

    const variantClasses = {
      primary: "bg-white text-black hover:bg-zinc-200 shadow-sm border border-zinc-200/10",
      secondary: "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 shadow-inner",
      gradient:
        "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 text-white hover:brightness-110 shadow-[0_0_20px_-3px_rgba(139,92,246,0.4)] border border-violet-500/20",
      emerald:
        "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] border border-emerald-500/20",
      ghost: "text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
        <span className="relative z-10">{children}</span>
        {!loading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
