"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Sparkles, HelpCircle, Layers, Code, Play } from "lucide-react";
import { cn } from "@/utils/cn";
import { useMindMapStore } from "@/stores/mindmap-store";

export const CustomNode = memo(({ id, data, selected }: NodeProps) => {
  const type = data.type as "root" | "concept" | "sub_concept" | "example" | "application";
  const label = data.label as string;
  const isExpanding = useMindMapStore((state) => state.isExpanding);
  const selectedNodeId = useMindMapStore((state) => state.selectedNodeId);
  const isTargetOfExpansion = isExpanding && selectedNodeId === id;

  // Icon mapping based on node type
  const getIcon = () => {
    switch (type) {
      case "root":
        return <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />;
      case "concept":
        return <Layers className="h-4 w-4 text-violet-400" />;
      case "sub_concept":
        return <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />;
      case "example":
        return <Code className="h-3.5 w-3.5 text-emerald-400" />;
      case "application":
        return <Play className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return null;
    }
  };

  // Border and glow colors based on type
  const styleClasses = {
    root: cn(
      "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white font-extrabold text-lg px-6 py-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] border border-violet-400/30",
      selected && "ring-4 ring-white/60 ring-offset-4 ring-offset-black"
    ),
    concept: cn(
      "bg-zinc-950/90 border border-violet-500/30 hover:border-violet-400/60 shadow-[0_0_15px_rgba(139,92,246,0.05)] text-zinc-100 font-semibold px-5 py-3 border-l-4 border-l-violet-500",
      selected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-black shadow-[0_0_25px_rgba(139,92,246,0.25)]"
    ),
    sub_concept: cn(
      "bg-zinc-950/90 border border-indigo-500/20 hover:border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.05)] text-zinc-200 font-medium px-4 py-2.5 border-l-4 border-l-indigo-400",
      selected && "ring-2 ring-indigo-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(99,102,241,0.2)]"
    ),
    example: cn(
      "bg-zinc-950/95 border border-emerald-500/20 hover:border-emerald-400/50 text-zinc-300 italic px-4 py-2.5 border-l-4 border-l-emerald-400 text-xs sm:text-sm",
      selected && "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(16,185,129,0.2)]"
    ),
    application: cn(
      "bg-zinc-950/95 border border-rose-500/20 hover:border-rose-400/50 text-zinc-300 px-4 py-2.5 border-l-4 border-l-rose-400 text-xs sm:text-sm",
      selected && "ring-2 ring-rose-400 ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(244,63,94,0.2)]"
    ),
  };

  return (
    <div className="relative group cursor-pointer">
      {/* Target concept pulsating expansion indicator */}
      {isTargetOfExpansion && (
        <span className="absolute -inset-2.5 rounded-xl bg-violet-500/20 animate-ping pointer-events-none" />
      )}

      {/* Handles at cardinal directions to enable natural edge routing */}
      <Handle type="target" position={Position.Top} className="opacity-0 w-1 h-1 pointer-events-none" />
      <Handle type="source" position={Position.Top} className="opacity-0 w-1 h-1 pointer-events-none" />
      
      <Handle type="target" position={Position.Bottom} className="opacity-0 w-1 h-1 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-1 h-1 pointer-events-none" />
      
      <Handle type="target" position={Position.Left} className="opacity-0 w-1 h-1 pointer-events-none" />
      <Handle type="source" position={Position.Left} className="opacity-0 w-1 h-1 pointer-events-none" />
      
      <Handle type="target" position={Position.Right} className="opacity-0 w-1 h-1 pointer-events-none" />
      <Handle type="source" position={Position.Right} className="opacity-0 w-1 h-1 pointer-events-none" />

      {/* Actual interactive card element */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.04, y: -2 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cn(
          "rounded-xl backdrop-blur-md transition-all duration-300 flex items-center gap-2.5 select-none relative overflow-hidden",
          styleClasses[type]
        )}
      >
        {/* Shimmer effect for root node or selected nodes */}
        {(type === "root" || selected) && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
        )}

        {/* Pulsating background ambient glow for root node */}
        {type === "root" && (
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-md -z-10 animate-pulse-slow" />
        )}

        {/* Icon */}
        <div className="flex-shrink-0 flex items-center justify-center">
          {getIcon()}
        </div>

        {/* Title Label */}
        <div className="text-left leading-tight whitespace-nowrap">
          {label}
        </div>
      </motion.div>
    </div>
  );
});

CustomNode.displayName = "CustomNode";
