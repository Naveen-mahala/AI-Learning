"use client";

import React, { useState, useCallback } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, 
  Sparkles, 
  Settings, 
  Eye, 
  EyeOff, 
  Download, 
  Share2, 
  RefreshCw, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  ArrowRight,
  Plus
} from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/Button";
import { useMindMapStore, LearningMode } from "@/lib/mindMapStore";
import { CustomNode } from "@/components/mindmap/CustomNode";
import { AnimatedEdge } from "@/components/mindmap/AnimatedEdge";
import { LoadingScreen } from "@/components/mindmap/LoadingScreen";
import { KnowledgePanel } from "@/components/mindmap/KnowledgePanel";
import { LayoutType } from "@/lib/layoutEngine";

// Register custom React Flow components
const nodeTypes = {
  mindmapNode: CustomNode,
};

const edgeTypes = {
  animatedEdge: AnimatedEdge,
};

export default function MindMapPage() {
  const {
    topic,
    learningMode,
    layoutType,
    nodes,
    edges,
    isGenerating,
    loadingStep,
    error,
    mindMapApiKey,
    setMindMapApiKey,
    setLayoutType,
    generateMindMap,
    resetMindMap,
    setSelectedNodeId
  } = useMindMapStore();

  const [inputTopic, setInputTopic] = useState("");
  const [selectedMode, setSelectedMode] = useState<LearningMode>("intermediate");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(mindMapApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger Toast Notification
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Node Dragging Handlers
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    const currentNodes = useMindMapStore.getState().nodes;
    const updatedNodes = applyNodeChanges(changes, currentNodes);
    useMindMapStore.setState({ nodes: updatedNodes });
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    const currentEdges = useMindMapStore.getState().edges;
    const updatedEdges = applyEdgeChanges(changes, currentEdges);
    useMindMapStore.setState({ edges: updatedEdges });
  }, []);

  // Save custom key
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setMindMapApiKey(apiKeyInput);
    triggerToast("API Key updated successfully!");
    setShowSettings(false);
  };

  // Run Generate Action
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetTopic = inputTopic.trim() || "Gradient Descent";
    await generateMindMap(targetTopic, selectedMode, apiKeyInput);
  };

  // 1-Click quick topic testing
  const handleQuickSelect = (topicName: string) => {
    setInputTopic(topicName);
  };

  // Mock export triggers
  const handleExportPNG = () => {
    triggerToast("Exporting canvas as PNG image... [Mock]");
  };

  const handleExportPDF = () => {
    triggerToast("Formatting knowledge graph report as PDF... [Mock]");
  };

  const handleShare = () => {
    triggerToast("Link copied to clipboard! Share the mind map with your peers. [Mock]");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const hasGraph = nodes.length > 0;

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeItem="mindmaps" />

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        
        {/* TOP FLOATING NOTIFICATION TOAST */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-6 left-1/2 z-50 px-4 py-2.5 rounded-xl border border-violet-500/20 bg-zinc-950/90 text-violet-200 text-xs sm:text-sm font-medium shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-md"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOADING EXPERIENCE */}
        {isGenerating && (
          <LoadingScreen currentStep={loadingStep} topic={inputTopic.trim() || "Gradient Descent"} />
        )}

        {/* TOP HEADER MENU */}
        <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-zinc-950/70 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
              <Network className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">AI Mind Map Generator</h1>
              {hasGraph && (
                <p className="text-[10px] text-zinc-500 font-medium hidden sm:block">
                  Currently viewing: <span className="text-violet-400 font-semibold">&quot;{topic}&quot;</span> in {learningMode} mode
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings toggler */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg border border-white/5 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="API Key Configuration"
            >
              <Settings size={16} />
            </button>
            {hasGraph && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={resetMindMap}
                className="cursor-pointer text-xs h-9"
              >
                Reset Map
              </Button>
            )}
          </div>
        </header>

        {/* SETTINGS OVERLAY PANEL */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-6 top-18 z-40 max-w-sm w-full glass-panel rounded-xl border border-white/10 p-5 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-bold">API Key Override</h4>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-500 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Provide a custom Gemini/Groq key. Unset keys automatically trigger fallback to server environment files or mock demo states.
              </p>
              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="gsk_... or sk-or-... or AQ...."
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <Button type="submit" variant="primary" className="w-full text-xs py-2 h-9 cursor-pointer">
                  Save Changes
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENT VIEWPORT */}
        <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-dot-pattern bg-size-[30px_30px]">
          
          {/* CONFIGURATION / ENTRY SCREEN */}
          {!hasGraph ? (
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 sm:p-12 relative">
              
              <div className="max-w-2xl w-full space-y-8 relative z-10">
                {/* Visual Intro */}
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-semibold"
                  >
                    <Sparkles size={12} className="animate-pulse" />
                    Interactive Knowledge Graph
                  </motion.div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    AI Mind Map Generator
                  </h2>
                  <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
                    Instantly compile any complex learning syllabus into an interactive, animated, high-fidelity knowledge network graph.
                  </p>
                </div>

                {/* Form Input */}
                <motion.form 
                  onSubmit={handleGenerate}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Enter Topic
                    </label>
                    <input
                      type="text"
                      value={inputTopic}
                      onChange={(e) => setInputTopic(e.target.value)}
                      placeholder="e.g. Gradient Descent, REST API, React Lifecycle..."
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all"
                      required
                    />

                    {/* Quick Select Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Demo Topics:</span>
                      {["Gradient Descent", "Neural Networks", "React Lifecycle"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleQuickSelect(t)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            inputTopic === t 
                              ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                              : "border-white/5 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Learning Modes Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Select Learning Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Beginner Mode */}
                      <div
                        onClick={() => setSelectedMode("beginner")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          selectedMode === "beginner"
                            ? "bg-violet-500/5 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${selectedMode === "beginner" ? "bg-violet-500/20 text-violet-400" : "bg-zinc-800 text-zinc-500"}`}>
                          <BookOpen size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-white">Beginner</h4>
                          <p className="text-xs text-zinc-500 leading-normal">
                            Intuitive terms, simple analogies, fewer branches. Great for visual basics.
                          </p>
                        </div>
                      </div>

                      {/* Intermediate Mode */}
                      <div
                        onClick={() => setSelectedMode("intermediate")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          selectedMode === "intermediate"
                            ? "bg-violet-500/5 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${selectedMode === "intermediate" ? "bg-violet-500/20 text-violet-400" : "bg-zinc-800 text-zinc-500"}`}>
                          <Layers size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-white">Intermediate</h4>
                          <p className="text-xs text-zinc-500 leading-normal">
                            Core algorithms, schemas, practical use cases, and modular relationships.
                          </p>
                        </div>
                      </div>

                      {/* Interview Mode */}
                      <div
                        onClick={() => setSelectedMode("interview")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          selectedMode === "interview"
                            ? "bg-violet-500/5 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${selectedMode === "interview" ? "bg-violet-500/20 text-violet-400" : "bg-zinc-800 text-zinc-500"}`}>
                          <HelpCircle size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-white">Interview Prep</h4>
                          <p className="text-xs text-zinc-500 leading-normal">
                            High-frequency Q&A angles, tradeoffs, complexity bounds, and system tips.
                          </p>
                        </div>
                      </div>

                      {/* Revision Mode */}
                      <div
                        onClick={() => setSelectedMode("revision")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          selectedMode === "revision"
                            ? "bg-violet-500/5 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${selectedMode === "revision" ? "bg-violet-500/20 text-violet-400" : "bg-zinc-800 text-zinc-500"}`}>
                          <Sparkles size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-white">Quick Revision</h4>
                          <p className="text-xs text-zinc-500 leading-normal">
                            High-yield summaries, formulas, rules of thumb, and must-remember formulas.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Submission Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    rightIcon={<ArrowRight size={16} />}
                    className="w-full py-4 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(139,92,246,0.25)] border-none h-12 cursor-pointer"
                  >
                    Generate Mind Map
                  </Button>
                </motion.form>

                {/* Error Banner */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm text-center leading-normal"
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            
            // RENDERING VIEWPORT FOR REACT FLOW GRAPH
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              
              {/* CANVAS CONTROLLER FLOATING HEAD BAR */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
                {/* Layout Switcher */}
                <div className="glass-panel border-white/5 rounded-xl p-1 flex items-center bg-zinc-950/80 shadow-md">
                  {[
                    { id: "radial", label: "Radial" },
                    { id: "tree", label: "Tree" },
                    { id: "graph", label: "Mesh Graph" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLayoutType(l.id as LayoutType)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        layoutType === l.id
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                {/* Canvas Action Triggers */}
                <div className="glass-panel border-white/5 rounded-xl p-1 flex items-center bg-zinc-950/80 shadow-md gap-1">
                  <button
                    onClick={handleExportPNG}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Export Image"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Export PDF"
                  >
                    <Plus size={14} className="rotate-45" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Share Link"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>

              {/* REACT FLOW GRAPH INTERACTIVE LAYOUT */}
              <div className="flex-1 h-full w-full bg-zinc-950">
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.1}
                    maxZoom={2}
                  >
                    <Controls showInteractive={false} className="bg-zinc-900 border border-white/5 text-zinc-400 fill-zinc-400 rounded-lg p-0.5 overflow-hidden" />
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255, 255, 255, 0.05)" />
                    <MiniMap 
                      style={{ 
                        background: "rgba(9, 9, 11, 0.9)", 
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: "12px",
                        overflow: "hidden"
                      }}
                      nodeColor={(node) => {
                        const type = node.data.type as string;
                        if (type === "root") return "#a855f7";
                        if (type === "concept") return "#6366f1";
                        if (type === "sub_concept") return "#3b82f6";
                        if (type === "example") return "#10b981";
                        if (type === "application") return "#f43f5e";
                        return "#27272a";
                      }}
                      maskColor="rgba(3, 3, 3, 0.85)"
                    />
                  </ReactFlow>
                </ReactFlowProvider>
              </div>

              {/* DYNAMIC SIDE PANEL DETAIL */}
              <KnowledgePanel />

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
