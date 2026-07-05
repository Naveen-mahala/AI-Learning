"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface TabOption {
  id: string;
  label: string;
}

interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  activeClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  activeTab,
  onChange,
  className,
  activeClassName,
}) => {
  return (
    <div className={cn("flex space-x-1 glass-panel-light p-1 rounded-lg", className)}>
      {options.map((option) => {
        const isActive = option.id === activeTab;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none text-zinc-400 hover:text-zinc-200 cursor-pointer",
              isActive && "text-white hover:text-white",
              activeClassName
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-pill"
                className="absolute inset-0 bg-white/10 rounded-md border border-white/5 shadow-inner"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
