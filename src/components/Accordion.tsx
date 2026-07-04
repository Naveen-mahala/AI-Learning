"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  headerClassName?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  isOpen: propsIsOpen,
  onToggle,
  className,
  headerClassName,
}) => {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = onToggle ? propsIsOpen : localIsOpen;
  const handleToggle = onToggle || (() => setLocalIsOpen(!localIsOpen));

  return (
    <div className={cn("border-b border-zinc-800 last:border-0 overflow-hidden", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between py-4 text-left font-medium text-zinc-200 hover:text-white transition-colors duration-200 cursor-pointer focus:outline-none select-none",
          headerClassName
        )}
      >
        <span className="text-sm md:text-base font-semibold">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-zinc-500"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="pb-4 pt-1 text-sm md:text-base text-zinc-400 leading-relaxed font-normal">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, className }) => {
  return <div className={cn("glass-panel rounded-xl px-6 divide-y divide-zinc-800", className)}>{children}</div>;
};
