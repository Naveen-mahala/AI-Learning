"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertTriangle, Lightbulb, GitFork, Loader2 } from "lucide-react";
import { useMindMapStore } from "@/lib/mindMapStore";
import { Button } from "@/components/Button";

export const KnowledgePanel: React.FC = () => {
  const { 
    nodes, 
    selectedNodeId, 
    setSelectedNodeId, 
    expandConcept, 
    isExpanding 
  } = useMindMapStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) return null;

  const { 
    label, 
    type, 
    definition, 
    whyItMatters, 
    realExample, 
    commonMistakes, 
    interviewTip 
  } = selectedNode.data as {
    label: string;
    type: string;
    definition: string;
    whyItMatters: string;
    realExample: string;
    commonMistakes: string;
    interviewTip: string;
  };

  const handleExpand = async () => {
    if (selectedNodeId) {
      await expandConcept(selectedNodeId);
    }
  };

  // Label color based on node type
  const getTypeBadge = () => {
    const badges = {
      root: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
      concept: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
      sub_concept: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      example: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      application: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    };
    return (
      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${badges[type as keyof typeof badges] || badges.concept}`}>
        {type.replace("_", " ")}
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full md:w-[400px] h-[calc(100vh-64px)] md:h-screen bg-zinc-950/95 border-l border-white/5 shadow-2xl flex flex-col z-30 fixed right-0 top-[64px] md:top-0"
      >
        {/* PANEL HEADER */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getTypeBadge()}
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">{label}</h3>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1.5 rounded-lg border border-white/5 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* PANEL CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* DEFINITION SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Definition</h4>
            <p className="text-zinc-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
              {definition}
            </p>
          </div>

          {/* WHY IT MATTERS SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Why It Matters</h4>
            <div className="relative overflow-hidden rounded-xl border border-violet-500/20 p-4 bg-gradient-to-r from-violet-950/10 to-indigo-950/10">
              <div className="absolute top-0 right-0 p-3 text-violet-500/20 pointer-events-none">
                <Sparkles size={40} />
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed relative z-10">
                {whyItMatters}
              </p>
            </div>
          </div>

          {/* REAL EXAMPLE SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Real-World Case / Analogy</h4>
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5 text-emerald-400">
                <Lightbulb size={18} className="flex-shrink-0" />
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {realExample}
              </p>
            </div>
          </div>

          {/* COMMON MISTAKES SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold text-rose-400">Common Pitfalls</h4>
            <div className="bg-rose-950/10 border border-rose-500/20 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5 text-rose-400">
                <AlertTriangle size={18} className="flex-shrink-0" />
              </div>
              <p className="text-rose-200/90 text-sm leading-relaxed">
                {commonMistakes}
              </p>
            </div>
          </div>

          {/* INTERVIEW TIP SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold text-amber-400">Placement Prep / Pro-Tip</h4>
            <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
              <div className="mt-0.5 text-amber-400 animate-pulse">
                <Sparkles size={18} className="flex-shrink-0" />
              </div>
              <p className="text-amber-200/90 text-sm leading-relaxed">
                {interviewTip}
              </p>
            </div>
          </div>
        </div>

        {/* EXPANSION PANEL ACTIONS (STICKY FOOTER) */}
        {type !== "example" && type !== "application" && (
          <div className="p-6 border-t border-white/5 bg-zinc-950/90 backdrop-blur-sm">
            <Button
              onClick={handleExpand}
              disabled={isExpanding}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none relative overflow-hidden group shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            >
              {isExpanding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Expanding concept...</span>
                </>
              ) : (
                <>
                  <GitFork className="h-4 w-4 text-white group-hover:rotate-12 transition-transform" />
                  <span>Expand Concept with AI</span>
                </>
              )}
            </Button>
            <p className="text-[10px] text-zinc-500 text-center mt-2.5">
              Generates sub-concepts, examples, and applications branching from this node.
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
